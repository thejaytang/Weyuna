import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { upgrade } from '../src/agents.js';
import { Store } from '../src/store.js';
import { createApp } from '../server.js';

async function fixture(t) {
  const server = await createApp({ store: new Store({ demoReplies: false }) });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); return new Promise((resolve) => server.close(resolve)); });
  const url = `http://127.0.0.1:${server.address().port}/api`;
  const call = (path, method = 'GET', body, headers = {}) => fetch(url + path, { method,
    headers: { 'content-type': 'application/json', ...headers }, body: body && JSON.stringify(body) });
  async function human(uid) {
    const login = await call('/login', 'POST', { key: server.loginKeys[uid] });
    const cookie = login.headers.get('set-cookie').split(';')[0];
    return (p, method, body) => call(p, method, body, { cookie });
  }
  const ava = await human('ava'), mia = await human('mia');
  const agent = (token) => (path, method, body) => call(`/agent/v1${path}`, method, body, { authorization: `Bearer ${token}` });
  async function credential(uid) {
    const response = await mia('/agents', 'POST', { action: 'rotate', uid });
    assert.equal(response.status, 200);
    return (await response.json()).token;
  }
  return { ava, mia, call, agent, credential };
}

test('interface language belongs to one human, supports switching back, and rejects other languages atomically', async (t) => {
  const { ava, mia } = await fixture(t);
  const settings = async (client) => (await (await client('/bootstrap')).json()).settings;
  assert.equal((await settings(ava)).language, 'en');
  assert.equal((await (await ava('/settings', 'PATCH', { language: 'zh-CN' })).json()).settings.language, 'zh-CN');
  assert.equal((await settings(mia)).language, 'en');
  const before = await settings(ava);
  for (const language of ['zh-TW', 'fr', null]) {
    assert.equal((await ava('/settings', 'PATCH', { language, sound: !before.sound })).status, 400);
  }
  assert.deepEqual(await settings(ava), before);
  await ava('/settings', 'PATCH', { language: 'en' });
  assert.equal((await settings(ava)).language, 'en');
});

test('one mention, two independent deliveries, scoped full history and idempotent agent reply', async (t) => {
  const { ava, mia, agent, credential, call } = await fixture(t);
  const token = await credential('mia/dots');
  const dots = agent(token), duvet = agent(await credential('mia/duvet'));
  const init = await (await dots('/sync')).json();
  assert.equal(init.self.uid, 'mia/dots');
  assert.deepEqual(init.conversations.find((c) => c.type === 'direct').peer,
    { uid: 'ava', type: 'human', displayName: 'Ava Chen' });
  assert.equal(init.conversations.find((c) => c.type === 'group').ownerUid, 'ava');
  const path = '/conversations/chat-mia/messages';
  const { messages: latest, nextCursor } = await (await dots(`${path}?limit=2`)).json();
  const older = await (await dots(`${path}?limit=4&before=${nextCursor}`)).json();
  assert.equal(older.messages.length, 3);
  assert.ok(older.messages.every((m) => m.seq < latest[0].seq));
  assert.equal(older.messages[1].content.attachments[0].name, 'onboarding-preview.svg');
  assert.equal((await dots('/conversations/chat-sora/messages')).status, 404);
  assert.equal((await call('/bootstrap')).status, 401);
  assert.equal((await call('/events', 'GET', undefined, { authorization: `Bearer ${token}` })).status, 403);
  assert.equal((await mia('/conversations/chat-sora/messages', 'POST', { text: 'wrong chat' })).status, 404);
  const syncPath = `/sync?wait=1&cursor=${init.nextCursor}`;
  const waiting = dots(syncPath);
  const { message: question } = await (await ava(path, 'POST', { text: '@mia/dots Hello?', mentions: ['mia/dots'] })).json();
  const [{ events: [first] }, { events: [second] }] = await Promise.all([waiting, duvet(syncPath)].map(async (r) => (await r).json()));
  assert.equal(first.message.sender.type, 'human');
  assert.equal(first.delivery, 'mentioned');
  assert.equal(second.delivery, 'context');
  assert.deepEqual(first.message, second.message);
  assert.equal(first.message.mentions[0].ownerUid, 'mia');
  assert.ok(Number.isFinite(Date.parse(first.message.sentAt)));
  const body = { replyToId: question.id, text: 'Hello Ava', clientMessageId: 'reply-1', senderId: 'ava' };
  assert.equal((await duvet(path, 'POST', body)).status, 403);
  const sent = await dots(path, 'POST', body);
  assert.equal(sent.status, 201);
  const { message } = await sent.json();
  assert.equal(message.sender.uid, 'mia/dots');
  assert.equal(message.sender.type, 'agent');
  assert.equal((await dots(path, 'POST', { ...body, replyToId: message.id, clientMessageId: 'loop' })).status, 403);
  assert.equal((await (await dots(path, 'POST', body)).json()).message.id, message.id);
  assert.equal((await dots(path, 'POST', { ...body, text: 'different' })).status, 409);
  await ava(`/messages/${message.id}/save`, 'POST');
  const saved = await (await mia(`/messages/${message.id}/save`, 'POST')).json();
  assert.deepEqual(saved.message.savedBy, ['mia']);
  assert.ok(!('signature' in saved.message || 'clientMessageId' in saved.message));
  const humanView = await (await ava('/bootstrap')).json();
  assert.equal(humanView.messages.filter((m) => m.id === message.id).length, 1);
  assert.ok(!JSON.stringify(humanView).includes('"hash"'));
  const since = (await (await dots('/sync')).json()).nextCursor;
  await ava(`/messages/${question.id}`, 'PATCH', { text: '@mia/dots Updated?' });
  assert.equal((await (await dots(`/sync?cursor=${since}`)).json()).events[0].type, 'message.updated');
  await ava(`/messages/${question.id}`, 'DELETE');
  const removed = (await (await dots(`/sync?cursor=${since}`)).json()).events;
  assert.equal(removed.length, 1);
  assert.equal(removed[0].type, 'message.deleted');
  assert.equal(removed[0].message.content, null);
});

test('binding, per-chat grants, access changes, rotation and revocation also cover pending polls', async (t) => {
  const { ava, mia, agent } = await fixture(t);
  const account = await (await mia('/agents', 'POST', { action: 'create', name: 'my-client' })).json();
  assert.equal(account.uid, 'mia/my-client');
  const client = agent(account.token);
  const first = await (await client('/sync')).json();
  assert.equal(first.conversations.length, 0);
  const path = '/conversations/chat-mia/agents';
  assert.equal((await ava(path, 'PATCH', { openAgents: [account.uid] })).status, 403);
  assert.equal((await mia(path, 'PATCH', { openAgents: [account.uid] })).status, 200);
  const change = await (await client(`/sync?cursor=${first.nextCursor}`)).json();
  assert.equal(change.events[0].accessible, true);
  assert.equal((await (await client('/conversations/chat-mia/messages')).json()).messages.length, 5);
  const roster = await (await client('/conversations/chat-mia/participants?q=my-client')).json();
  assert.equal(roster.participants[0].uid, account.uid);
  const humans = await (await client('/conversations/chat-mia/participants?q=Ava')).json();
  assert.equal(humans.participants[0].mentionable, false);
  await mia(path, 'PATCH', { openAgents: [] });
  const lost = await (await client(`/sync?cursor=${change.nextCursor}`)).json();
  assert.equal(lost.events[0].accessible, false);
  assert.equal((await client('/conversations/chat-mia/messages')).status, 404);
  const pending = client(`/sync?cursor=${lost.nextCursor}&wait=3`);
  const rotated = await (await mia('/agents', 'POST', { action: 'rotate', uid: account.uid })).json();
  assert.equal((await pending).status, 401);
  assert.equal((await agent(rotated.token)('/sync')).status, 200);
  await mia('/agents', 'POST', { action: 'revoke', uid: account.uid });
  assert.equal((await agent(rotated.token)('/sync')).status, 401);
});

test('direct delegation needs no room switch; only group owner can enable it; recheck presence and policy on send', async (t) => {
  const { mia, ava, agent, credential } = await fixture(t);
  const dots = agent(await credential('mia/dots'));
  const dm = '/conversations/chat-mia/messages', group = '/conversations/chat-studio/messages';
  const send = async (path, mentions = []) => (await (await ava(path, 'POST', { text: 'What time?', mentions })).json()).message;
  const reply = (path, m) => dots(path, 'POST', { replyToId: m.id, clientMessageId: m.id, text: 'Can help' });
  assert.equal((await reply(dm, await send(dm))).status, 201);
  assert.equal((await reply(group, await send(group))).status, 403);
  assert.equal((await reply(group, await send(group, ['mia/dots']))).status, 201);
  const policy = '/conversations/chat-studio/agents';
  assert.equal((await mia(policy, 'PATCH', { allowDelegatedReplies: true })).status, 403);
  await ava(policy, 'PATCH', { allowDelegatedReplies: true });
  assert.equal((await reply(group, await send(group))).status, 201);
  const late = await send(group);
  await ava(policy, 'PATCH', { allowDelegatedReplies: false });
  assert.equal((await reply(group, late)).status, 403);
  assert.equal((await ava(dm, 'POST', { text: '@mia', mentions: ['mia'] })).status, 400);
  const beforeOnline = await send(dm);
  const stream = await mia('/events');
  try {
    const roster = await (await dots('/conversations/chat-mia/participants?q=mia')).json();
    assert.equal(roster.participants.find((v) => v.uid === 'mia').online, true);
    assert.equal((await reply(dm, beforeOnline)).status, 403);
    assert.equal((await reply(dm, await send(dm))).status, 403);
    assert.equal((await reply(dm, await send(dm, ['mia/dots']))).status, 201);
  } finally { await stream.body.cancel(); }
});

test('upgrading an existing history never grants an agent access implicitly', () => {
  const old = { conversations: [{ id: 'chat-mia', type: 'direct', memberIds: ['ava','mia'] }],
    messages: [{ id: 'existing', conversationId: 'chat-mia', createdAt: '2025-01-03T00:00:00Z', text: 'Keep this' }] };
  upgrade(old);
  upgrade(old);
  assert.deepEqual(old.conversations[0].openAgents, []);
  assert.deepEqual(old.agents, []);
  assert.deepEqual(old.messages.map((m) => [m.seq, m.text]), [[1, 'Keep this']]);
});

test('revoking a mention by editing prevents a delayed reply and logout ends the human session', async (t) => {
  const { ava, agent, credential } = await fixture(t);
  const dots = agent(await credential('mia/dots'));
  const path = '/conversations/chat-mia/messages';
  const question = await (await ava(path, 'POST', { text: '@mia/dots One moment', mentions: ['mia/dots'] })).json();
  await ava(`/messages/${question.message.id}`, 'PATCH', { text: 'Never mind', mentions: [] });
  assert.equal((await dots(path, 'POST', { text: 'Late answer', clientMessageId: 'late', replyToId: question.message.id })).status, 403);
  const q2 = await (await ava(path, 'POST', { text: '@mia/dots Ready?', mentions: ['mia/dots'] })).json();
  const implicit = await (await dots(path, 'POST', { text: 'Ready', clientMessageId: 'latest' })).json();
  assert.equal(implicit.message.replyToId, q2.message.id);
  await ava('/logout', 'POST');
  assert.equal((await ava('/bootstrap')).status, 401);
});

test('one-click demo login is opt-in and only accepts a loopback browser', async (t) => {
  const { call } = await fixture(t);
  assert.equal((await call('/demo-login')).status, 404);
  const app = await createApp({ store: new Store({ demoReplies: false }), demoAutoLogin: 'ava' });
  app.listen(0, '127.0.0.1');
  await once(app, 'listening');
  t.after(() => { app.closeAllConnections(); return new Promise((resolve) => app.close(resolve)); });
  const base = `http://127.0.0.1:${app.address().port}/api`;
  const login = await fetch(`${base}/demo-login`, { redirect: 'manual' });
  assert.equal(login.status, 302);
  assert.equal(login.headers.get('location'), '/');
  const cookie = login.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetch(`${base}/bootstrap`, { headers: { cookie } })).status, 200);
});
