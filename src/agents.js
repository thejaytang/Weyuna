import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { HttpError } from './store.js';

const digest = (s) => createHash('sha256').update(s).digest('hex');
export const secret = () => randomBytes(32).toString('base64url');
const JOURNAL_LIMIT = 1024;
const pageSize = (params) => integer(params.get('limit') ?? '50', 1, 100, 'limit');

function integer(value, min, max, field) {
  const n = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(n) || n < min || n > max) {
    throw new HttpError(400, `Invalid ${field}`);
  }
  return n;
}

export function upgrade(state, seedDemo = false) {
  if (state.agentJournal) return;
  state.agents = (seedDemo ? ['dots', 'duvet'] : []).map((name) => ({
    uid: `mia/${name}`, ownerUid: 'mia', name, demo: true, revoked: false,
  }));
  state.delegates = seedDemo ? { mia: 'mia/dots' } : {};
  state.agentJournal = [];
  state.agentCursor = 0;
  for (const c of state.conversations) {
    c.openAgents = seedDemo && ['chat-mia', 'chat-studio'].includes(c.id) ? ['mia/dots', 'mia/duvet'] : [];
    if (c.type === 'group') {
      c.ownerUid = c.memberIds[0];
      c.allowDelegatedReplies = false;
    }
    let seq = 0;
    for (const m of state.messages.filter((m) => m.conversationId === c.id)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))) m.seq = ++seq;
    c.lastSeq = seq;
  }
}

export function actor(state, uid) {
  const a = state.agents.find((v) => v.uid === uid);
  if (a) return { uid, type: 'agent', ownerUid: a.ownerUid, displayName: a.name };
  return { uid, type: 'human', displayName: state.users.find((u) => u.id === uid)?.name || uid };
}

export function accessible(c, a) {
  return c && c.type !== 'channel' && !a.revoked && c.memberIds.includes(a.ownerUid) && c.openAgents?.includes(a.uid);
}

export function authenticate(store, authorization) {
  const match = /^Bearer ([\w-]{43})$/.exec(authorization || '');
  const hash = match && digest(match[1]);
  const a = hash && store.state.agents.find((v) => !v.revoked && v.hash === hash);
  if (!a) throw new HttpError(401, 'Valid agent token required');
  return a;
}

export async function manageAgent(store, owner, body) {
  if (body.action === 'create') {
    if (typeof body.name !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,31}$/.test(body.name)) {
      throw new HttpError(400, 'Use 1-32 lowercase letters, digits, hyphens or underscores');
    }
    const uid = `${owner}/${body.name}`;
    if (store.state.agents.some((a) => a.uid === uid)) throw new HttpError(409, 'Agent UID already exists');
    const token = secret();
    await store.commit('agent.changed', (s) => {
      s.agents.push({ uid, name: body.name, ownerUid: owner, hash: digest(token), revoked: false });
      return { uid };
    });
    return { uid, token };
  }
  const a = store.state.agents.find((v) => v.uid === body.uid && v.ownerUid === owner);
  if (!a || a.revoked) throw new HttpError(404, 'Active owned agent not found');
  if (!['rotate', 'revoke', 'delegate', 'undelegate'].includes(body.action)) throw new HttpError(400, 'Unknown agent action');
  const token = body.action === 'rotate' ? secret() : null;
  await store.commit('agent.changed', (s) => {
    if (token) { a.hash = digest(token); a.demo = false; }
    if (body.action === 'delegate') s.delegates[owner] = a.uid;
    if (body.action === 'revoke') {
      a.revoked = true;
      delete a.hash;
      for (const c of s.conversations) c.openAgents = c.openAgents?.filter((v) => v !== a.uid) || [];
    }
    if (['undelegate', 'revoke'].includes(body.action) && s.delegates[owner] === a.uid) delete s.delegates[owner];
    return { uid: a.uid };
  });
  return token ? { uid: a.uid, token } : { uid: a.uid };
}

export function validateMentions(store, c, input) {
  if (input === undefined) return [];
  if (!Array.isArray(input) || input.length > 32) throw new HttpError(400, 'Invalid mentions list');
  for (const uid of input) {
    const a = store.state.agents.find((v) => v.uid === uid);
    if (!(a ? accessible(c, a) : c.memberIds.includes(uid) && store.isOnline(uid))) {
      throw new HttpError(400, 'Mention target is unavailable in this conversation');
    }
  }
  return [...new Set(input)];
}

function delivery(store, c, m, a) {
  if (m.deleted || !c.memberIds.includes(m.senderId)) return 'context';
  if (m.mentions?.includes(a.uid)) return 'mentioned';
  if (!m.mentions?.length && m.senderId !== a.ownerUid && store.state.delegates[a.ownerUid] === a.uid &&
      !store.isOnline(a.ownerUid) && (c.type === 'direct' || c.allowDelegatedReplies)) return 'delegation_candidate';
  return 'context';
}

function messageView(state, m) {
  const attachments = (m.attachments || []).map(({ id, type, name, size }) => ({ id, type, name, size }));
  return {
    id: m.id, seq: m.seq, sentAt: m.createdAt, sender: actor(state, m.senderId),
    content: m.deleted ? null : { type: attachments.length ? 'media' : 'text', text: m.text, ...(attachments.length ? { attachments } : {}) },
    mentions: (m.mentions || []).map((uid) => actor(state, uid)), replyToId: m.replyToId ?? null,
    ...(m.editedAt ? { editedAt: m.editedAt } : {}), ...(m.deleted ? { deletedAt: m.deletedAt } : {}),
  };
}

function summary(state, c, a) {
  return c.type === 'direct'
    ? { id: c.id, type: c.type, peer: actor(state, c.memberIds.find((id) => id !== a.ownerUid)) }
    : { id: c.id, type: c.type, title: c.title, ownerUid: c.ownerUid, allowDelegatedReplies: !!c.allowDelegatedReplies };
}

export function recordChange(store, type, result) {
  const s = store.state;
  let event;
  if (['message.created', 'message.forwarded', 'message.updated', 'message.deleted'].includes(type)) {
    const m = s.messages.find((v) => v.id === result.id);
    const c = s.conversations.find((v) => v.id === m.conversationId);
    if (!m.seq) m.seq = c.lastSeq = (c.lastSeq || 0) + 1;
    const audience = s.agents.filter((a) => accessible(c, a)).map((a) => a.uid);
    if (type === 'message.created' || type === 'message.forwarded') {
      m.delivery = Object.fromEntries(audience.map((uid) => [uid, delivery(store, c, m, s.agents.find((a) => a.uid === uid))]));
    }
    if (m.deleted) {
      for (const e of s.agentJournal) if (e.messageId === m.id) delete e.message;
    }
    event = { type: type === 'message.forwarded' ? 'message.created' : type, conversationId: c.id,
      message: messageView(s, m), messageId: m.id, audience };
  } else if (type === 'access.changed') {
    event = { type, ...result };
  }
  if (event) {
    s.agentJournal.push({ ...event, n: ++s.agentCursor });
    if (s.agentJournal.length > JOURNAL_LIMIT) s.agentJournal.shift();
  }
}

function delta(store, a, cursor) {
  const s = store.state;
  if (cursor < (s.agentJournal[0]?.n ?? 1) - 1) throw new HttpError(410, 'Cursor expired; sync again without a cursor and refresh history');
  const events = [], summaries = new Map();
  let end = cursor;
  for (const e of s.agentJournal) {
    if (e.n <= cursor) continue;
    end = e.n;
    if (!e.audience.includes(a.uid)) continue;
    const c = s.conversations.find((v) => v.id === e.conversationId);
    const allowed = accessible(c, a);
    if (e.type === 'access.changed') {
      events.push({ type: e.type, conversationId: c.id, accessible: !!allowed });
    } else if (allowed) {
      const m = s.messages.find((v) => v.id === e.messageId);
      if (m.deleted && e.type !== 'message.deleted') continue;
      const current = delivery(store, c, m, a);
      events.push({ type: e.type, conversationId: c.id, message: e.message ?? messageView(s, m),
        delivery: e.type === 'message.created' && current === m.delivery?.[a.uid] ? current : 'context' });
    }
    if (allowed) summaries.set(c.id, summary(s, c, a));
    if (events.length === 100) break;
  }
  return { conversations: [...summaries.values()], events, nextCursor: `u${end}`, hasMore: end < s.agentCursor };
}

export async function sync(store, authorization, params, signal) {
  const a = authenticate(store, authorization);
  const wait = integer(params.get('wait') ?? '0', 0, 30, 'wait');
  const s = store.state;
  if (!params.has('cursor')) {
    return { self: actor(s, a.uid), conversations: s.conversations.filter((c) => accessible(c, a)).map((c) => summary(s, c, a)),
      events: [], nextCursor: `u${s.agentCursor}`, hasMore: false };
  }
  const raw = /^u(\d+)$/.exec(params.get('cursor'));
  if (!raw) throw new HttpError(400, 'Invalid sync cursor');
  let cursor = integer(raw[1], 0, s.agentCursor, 'cursor');
  const deadline = Date.now() + wait * 1000;
  for (;;) {
    authenticate(store, authorization);
    const batch = delta(store, a, cursor);
    if (batch.events.length || Date.now() >= deadline || signal.aborted) return batch;
    cursor = Number(batch.nextCursor.slice(1));
    await new Promise((resolve) => {
      const finish = () => { unsubscribe(); clearTimeout(timer); signal.removeEventListener('abort', finish); resolve(); };
      const unsubscribe = store.subscribe(finish);
      const timer = setTimeout(finish, deadline - Date.now());
      signal.addEventListener('abort', finish, { once: true });
    });
  }
}

export function agentConversation(store, a, id) {
  const c = store.state.conversations.find((v) => v.id === id);
  if (!accessible(c, a)) throw new HttpError(404, 'Conversation unavailable');
  return c;
}

export function history(store, a, c, params) {
  const size = pageSize(params);
  const before = integer(params.get('before') ?? String(Number.MAX_SAFE_INTEGER), 1, Number.MAX_SAFE_INTEGER, 'before');
  const rows = store.state.messages.filter((m) => m.conversationId === c.id && m.seq < before)
    .sort((x, y) => x.seq - y.seq);
  const page = rows.slice(-size);
  return { conversation: summary(store.state, c, a), messages: page.map((m) => messageView(store.state, m)),
    nextCursor: rows.length > size ? String(page[0].seq) : null, hasMore: rows.length > size };
}

export function participants(store, c, params) {
  const offset = integer(params.get('cursor') ?? '0', 0, Number.MAX_SAFE_INTEGER, 'cursor'), limit = pageSize(params);
  const q = (params.get('q') || '').toLowerCase();
  const rows = [...c.memberIds, ...store.state.agents.filter((a) => accessible(c, a)).map((a) => a.uid)]
    .map((uid) => actor(store.state, uid)).filter((v) => `${v.uid} ${v.displayName}`.toLowerCase().includes(q));
  return { participants: rows.slice(offset, offset + limit).map((v) => ({ ...v, online: store.isOnline(v.uid),
    mentionable: v.type === 'agent' || store.isOnline(v.uid) })), nextCursor: offset + limit < rows.length ? String(offset + limit) : null };
}

export async function agentSend(store, a, c, input) {
  if (!accessible(c, a)) throw new HttpError(404, 'Conversation unavailable');
  const { text, clientMessageId, replyToId } = input;
  if (typeof text !== 'string' || !text.trim() || text.length > 4000 ||
      typeof clientMessageId !== 'string' || !clientMessageId.trim() || clientMessageId.length > 128) {
    throw new HttpError(400, 'Text (1-4000) and clientMessageId (1-128) are required');
  }
  const signature = digest(JSON.stringify([text.trim(), replyToId, input.mentions ?? []]));
  const existing = store.state.messages.find((m) => m.senderId === a.uid && m.conversationId === c.id && m.clientMessageId === clientMessageId);
  if (existing) {
    if (existing.signature !== signature) throw new HttpError(409, 'clientMessageId already used for a different message');
    return { message: messageView(store.state, existing), replay: true };
  }
  const source = replyToId == null
    ? store.state.messages.findLast((m) => m.conversationId === c.id && !m.deleted)
    : store.state.messages.find((m) => m.id === replyToId && m.conversationId === c.id && !m.deleted);
  const reason = source && delivery(store, c, source, a);
  if (!reason || reason === 'context' || source.delivery?.[a.uid] !== reason) {
    throw new HttpError(403, 'Reply to a current mention or eligible offline delegation');
  }
  const mentions = validateMentions(store, c, input.mentions);
  const message = await store.commit('message.created', (s) => {
    const m = { id: randomUUID(), conversationId: c.id, senderId: a.uid, text: text.trim(), replyToId: source.id,
      ...(a.demo ? { scripted: true } : {}),
      mentions, clientMessageId, signature, createdAt: new Date().toISOString(), status: 'delivered' };
    s.messages.push(m);
    for (const member of c.memberIds) store.chatPrefs(c, member).unread++;
    return m;
  });
  return { message: messageView(store.state, message), replay: false };
}
