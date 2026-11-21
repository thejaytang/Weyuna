import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { accessible, actor, agentSend, recordChange, upgrade, validateMentions } from './agents.js';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function at(hoursAgo, minutesAgo = 0) {
  return new Date(Date.now() - hoursAgo * HOUR - minutesAgo * MINUTE).toISOString();
}

function makeSeed() {
  return {
    version: 1,
    currentUserId: 'ava',
    updatedAt: new Date().toISOString(),
    users: [
      {
        id: 'ava',
        name: 'Ava Chen',
        username: 'avachen',
        bio: 'Designing useful things. Oslo, CET.',
        avatar: 'AC',
        color: '#5f76e8',
        online: true,
        lastSeen: 'online',
      },
      {
        id: 'mia',
        name: 'Mia Laurent',
        username: 'mialaurent',
        bio: 'Product, coffee, and cities.',
        avatar: 'ML',
        color: '#e36a8d',
        online: true,
        lastSeen: 'online',
      },
      {
        id: 'noah',
        name: 'Noah Williams',
        username: 'noahw',
        bio: 'Building quiet software.',
        avatar: 'NW',
        color: '#52a77e',
        online: false,
        lastSeen: 'last seen 12 min ago',
      },
      {
        id: 'sora',
        name: 'Sora Kim',
        username: 'sorakim',
        bio: 'Research, music, tiny notebooks.',
        avatar: 'SK',
        color: '#9b6cc1',
        online: false,
        lastSeen: 'last seen yesterday',
      },
      {
        id: 'leo',
        name: 'Leo Martin',
        username: 'leomartin',
        bio: 'Always taking the scenic route.',
        avatar: 'LM',
        color: '#d88b48',
        online: true,
        lastSeen: 'online',
      },
      {
        id: 'nina',
        name: 'Nina Petrov',
        username: 'ninap',
        bio: 'Frontend engineer.',
        avatar: 'NP',
        color: '#4e93b8',
        online: false,
        lastSeen: 'last seen 1 hour ago',
      },
    ],
    conversations: [
      {
        id: 'chat-mia',
        type: 'direct',
        title: 'Mia Laurent',
        memberIds: ['ava', 'mia'],
        pinned: true,
        muted: false,
        archived: false,
        unread: 2,
      },
      {
        id: 'chat-studio',
        type: 'group',
        title: 'Product Studio',
        description: 'Weekly product critique, notes, and release coordination.',
        memberIds: ['ava', 'mia', 'noah', 'nina', 'leo'],
        avatar: 'PS',
        color: '#7665d8',
        pinned: true,
        muted: false,
        archived: false,
        unread: 4,
      },
      {
        id: 'channel-design',
        type: 'channel',
        title: 'Design Dispatch',
        description: 'Curated notes on product craft and interface design.',
        memberIds: ['ava', 'mia', 'sora', 'nina'],
        avatar: 'DD',
        color: '#e1a74b',
        pinned: false,
        muted: false,
        archived: false,
        unread: 1,
        subscribers: 2840,
      },
      {
        id: 'chat-noah',
        type: 'direct',
        title: 'Noah Williams',
        memberIds: ['ava', 'noah'],
        pinned: false,
        muted: false,
        archived: false,
        unread: 0,
      },
      {
        id: 'chat-trip',
        type: 'group',
        title: 'Alpine Weekend',
        description: 'Train times, cabins, and the all-important packing list.',
        memberIds: ['ava', 'leo', 'sora', 'mia'],
        avatar: 'AW',
        color: '#439b8b',
        pinned: false,
        muted: true,
        archived: false,
        unread: 0,
      },
      {
        id: 'chat-sora',
        type: 'direct',
        title: 'Sora Kim',
        memberIds: ['ava', 'sora'],
        pinned: false,
        muted: false,
        archived: false,
        unread: 0,
      },
      {
        id: 'channel-updates',
        type: 'channel',
        title: 'Weyuna Updates',
        description: 'A simulated product update channel.',
        memberIds: ['ava', 'noah', 'nina'],
        avatar: 'WU',
        color: '#4e7fd5',
        pinned: false,
        muted: true,
        archived: false,
        unread: 0,
        subscribers: 12400,
      },
    ],
    messages: [
      {
        id: 'm-mia-1',
        conversationId: 'chat-mia',
        senderId: 'mia',
        text: 'Morning! I finished the new onboarding flow.',
        createdAt: at(1, 28),
        status: 'read',
      },
      {
        id: 'm-mia-2',
        conversationId: 'chat-mia',
        senderId: 'mia',
        text: 'It now has a much calmer first screen. Sending you a preview.',
        createdAt: at(1, 27),
        status: 'read',
        attachments: [
          {
            id: 'a-preview',
            name: 'onboarding-preview.svg',
            type: 'image/svg+xml',
            size: 2460,
            kind: 'generated',
            url: '/assets/onboarding-preview.svg',
          },
        ],
      },
      {
        id: 'm-mia-3',
        conversationId: 'chat-mia',
        senderId: 'ava',
        text: 'Love this direction. The hierarchy feels clearer already.',
        createdAt: at(1, 16),
        status: 'read',
        reactions: [{ emoji: '👏', userIds: ['mia'] }],
      },
      {
        id: 'm-mia-4',
        conversationId: 'chat-mia',
        senderId: 'mia',
        text: 'Want to review the final interaction at 14:30?',
        createdAt: at(0, 19),
        status: 'delivered',
      },
      {
        id: 'm-mia-5',
        conversationId: 'chat-mia',
        senderId: 'mia',
        text: 'I added notes directly to the prototype as well.',
        createdAt: at(0, 17),
        status: 'delivered',
      },
      {
        id: 'm-studio-1',
        conversationId: 'chat-studio',
        senderId: 'noah',
        text: 'Ship room is open. Drop your release blockers here.',
        createdAt: at(3, 42),
        status: 'read',
      },
      {
        id: 'm-studio-2',
        conversationId: 'chat-studio',
        senderId: 'nina',
        text: 'The responsive shell is merged. Keyboard navigation needs one more pass.',
        createdAt: at(3, 14),
        status: 'read',
        reactions: [{ emoji: '🚀', userIds: ['ava', 'leo'] }],
      },
      {
        id: 'm-studio-3',
        conversationId: 'chat-studio',
        senderId: 'ava',
        text: 'I can take the navigation pass after lunch.',
        createdAt: at(2, 55),
        status: 'read',
        savedBy: ['ava'],
      },
      {
        id: 'm-studio-4',
        conversationId: 'chat-studio',
        senderId: 'leo',
        text: 'Preview build is live. The compact mode is especially nice.',
        createdAt: at(0, 38),
        status: 'delivered',
        replyToId: 'm-studio-2',
      },
      {
        id: 'm-design-1',
        conversationId: 'channel-design',
        senderId: 'sora',
        text: 'THE QUIET INTERFACE',
        createdAt: at(5),
        status: 'read',
      },
      {
        id: 'm-design-2',
        conversationId: 'channel-design',
        senderId: 'sora',
        text: 'Good interfaces do not compete with the work. They keep the next step obvious, preserve context, and get out of the way.',
        createdAt: at(5),
        status: 'read',
        reactions: [
          { emoji: '❤', userIds: ['ava', 'mia', 'nina'] },
          { emoji: '🔥', userIds: ['leo'] },
        ],
        savedBy: ['ava'],
      },
      {
        id: 'm-noah-1',
        conversationId: 'chat-noah',
        senderId: 'noah',
        text: 'I pushed a small performance fix. The timeline loads much faster now.',
        createdAt: at(24),
        status: 'read',
      },
      {
        id: 'm-noah-2',
        conversationId: 'chat-noah',
        senderId: 'ava',
        text: 'Excellent. I will test it against the large account fixture.',
        createdAt: at(23),
        status: 'read',
      },
      {
        id: 'm-trip-1',
        conversationId: 'chat-trip',
        senderId: 'leo',
        text: 'Cabin is booked! Train leaves Central at 08:42.',
        createdAt: at(28),
        status: 'read',
        reactions: [{ emoji: '🎉', userIds: ['ava', 'sora', 'mia'] }],
      },
      {
        id: 'm-trip-2',
        conversationId: 'chat-trip',
        senderId: 'sora',
        text: 'I can bring a thermos and the folding map.',
        createdAt: at(27),
        status: 'read',
      },
      {
        id: 'm-sora-1',
        conversationId: 'chat-sora',
        senderId: 'sora',
        text: 'Sending you the interview synthesis when I get back.',
        createdAt: at(49),
        status: 'read',
      },
      {
        id: 'm-sora-2',
        conversationId: 'chat-sora',
        senderId: 'ava',
        text: 'Perfect, no rush. Thank you!',
        createdAt: at(48),
        status: 'read',
      },
      {
        id: 'm-updates-1',
        conversationId: 'channel-updates',
        senderId: 'noah',
        text: 'Weyuna 0.1 ships with conversations, search, groups, channels, reactions, attachments, settings, and simulated calls.',
        createdAt: at(72),
        status: 'read',
      },
    ],
    settings: {
      theme: 'light',
      compact: false,
      sound: true,
      demoReplies: true,
      desktopNotifications: false,
    },
    calls: [
      {
        id: 'call-1',
        conversationId: 'chat-noah',
        type: 'voice',
        startedAt: at(30),
        endedAt: at(30, -8),
        status: 'ended',
      },
    ],
  };
}

function clone(value) {
  return structuredClone(value);
}

function assertText(value, field, maxLength) {
  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} must be a string`);
  }
  const text = value.trim();
  if (!text) {
    throw new HttpError(400, `${field} is required`);
  }
  if (text.length > maxLength) {
    throw new HttpError(400, `${field} must be ${maxLength} characters or fewer`);
  }
  return text;
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export class Store {
  constructor({ dataFile, demoReplies = true, replyDelay = 900 } = {}) {
    this.dataFile = dataFile;
    this.demoReplies = demoReplies;
    this.replyDelay = replyDelay;
    this.state = makeSeed();
    upgrade(this.state, true);
    this.humanAccounts = new Set(['ava', 'mia']);
    this.requestUser = new AsyncLocalStorage();
    this.connections = new Map();
    this.lastAgentSeen = new Map();
    this.listeners = new Set();
    this.writeQueue = Promise.resolve();
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    if (!this.dataFile) return;

    let raw;
    try {
      raw = await readFile(this.dataFile, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.persist();
        return;
      }
      throw error;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(`Could not parse Weyuna state file ${this.dataFile}: ${error.message}`);
    }

    if (
      !parsed ||
      parsed.version !== 1 ||
      !Array.isArray(parsed.users) ||
      !Array.isArray(parsed.conversations) ||
      !Array.isArray(parsed.messages)
    ) {
      throw new Error(`Weyuna state file ${this.dataFile} has an unsupported format`);
    }
    this.state = parsed;
    upgrade(this.state);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(type, payload = null) {
    const event = {
      type,
      payload,
      at: new Date().toISOString(),
    };
    for (const listener of this.listeners) listener(event);
  }

  get viewer() { return this.requestUser.getStore() ?? this.state.currentUserId; }

  isOnline(uid) {
    const a = this.state.agents.find((v) => v.uid === uid);
    return a ? !a.revoked && (a.demo || Date.now() - (this.lastAgentSeen.get(uid) || 0) < 60_000)
      : (this.connections.get(uid) || 0) > 0;
  }

  chatPrefs(c, uid = this.viewer) {
    if (uid === this.state.currentUserId) return c;
    c.preferences ||= {};
    return c.preferences[uid] ||= { pinned: false, muted: false, archived: false, unread: 0 };
  }

  preferences(uid = this.viewer) {
    this.state.preferences ||= {};
    const settings = uid === this.state.currentUserId ? this.state.settings :
      (this.state.preferences[uid] ||= { theme: 'light', compact: false, sound: true, demoReplies: true });
    settings.language ??= 'en';
    return settings;
  }

  humanMessage({ signature, clientMessageId, ...m }, uid = this.viewer) {
    return { ...m, savedBy: (m.savedBy || []).filter((id) => id === uid) };
  }

  humanConversation(c, uid = this.viewer) {
    const { preferences, ...shared } = c;
    const { pinned, muted, archived, unread } = this.chatPrefs(c, uid);
    return { ...shared, pinned, muted, archived, unread };
  }

  snapshot(uid = this.viewer) {
    const s = this.state;
    const conversations = s.conversations.filter((c) => c.memberIds.includes(uid));
    const ids = new Set(conversations.map((c) => c.id));
    const messages = s.messages.filter((m) => ids.has(m.conversationId));
    const used = new Set([...messages.map((m) => m.senderId), ...conversations.flatMap((c) => c.openAgents || [])]);
    return clone({ version: s.version, currentUserId: uid, updatedAt: s.updatedAt,
      users: s.users.map((u) => ({ ...u, simulated: !this.humanAccounts.has(u.id), online: this.isOnline(u.id), lastSeen: this.isOnline(u.id) ? 'online' : 'offline' })),
      agents: s.agents.filter((a) => a.ownerUid === uid || used.has(a.uid)).map((a) => ({
        ...actor(s, a.uid), demo: !!a.demo, revoked: a.revoked, online: this.isOnline(a.uid),
      })),
      delegate: s.delegates[uid] || null,
      conversations: conversations.map((c) => this.humanConversation(c, uid)),
      messages: messages.map((m) => this.humanMessage(m, uid)),
      calls: s.calls.filter((v) => ids.has(v.conversationId)), settings: this.preferences(uid) });
  }

  async persist() {
    if (!this.dataFile) return;
    const file = this.dataFile;
    const payload = `${JSON.stringify(this.state, null, 2)}\n`;
    this.writeQueue = this.writeQueue.then(async () => {
      await mkdir(dirname(file), { recursive: true, mode: 0o700 });
      await writeFile(file, payload, { encoding: 'utf8', mode: 0o600 });
    });
    return this.writeQueue;
  }

  async commit(type, mutate) {
    const result = mutate(this.state);
    recordChange(this, type, result);
    this.state.updatedAt = new Date().toISOString();
    await this.persist();
    this.emit(type, result);
    return clone(result);
  }

  getConversation(id) {
    const conversation = this.state.conversations.find((item) => item.id === id && item.memberIds.includes(this.viewer));
    if (!conversation) throw new HttpError(404, 'Conversation not found');
    return conversation;
  }

  getMessage(id) {
    const message = this.state.messages.find((item) => item.id === id);
    if (!message) throw new HttpError(404, 'Message not found');
    this.getConversation(message.conversationId);
    return message;
  }

  async sendMessage(conversationId, input) {
    const conversation = this.getConversation(conversationId);
    const text = typeof input.text === 'string' ? input.text.trim() : '';
    const attachments = Array.isArray(input.attachments) ? input.attachments : [];

    if (!text && !attachments.length) {
      throw new HttpError(400, 'Message text or an attachment is required');
    }
    if (text.length > 4000) {
      throw new HttpError(400, 'Message must be 4000 characters or fewer');
    }
    if (attachments.length > 5) {
      throw new HttpError(400, 'A message can contain at most 5 attachments');
    }

    if (input.replyToId && this.getMessage(input.replyToId).conversationId !== conversationId) {
      throw new HttpError(400, 'Reply target must belong to this conversation');
    }
    const mentions = validateMentions(this, conversation, input.mentions);
    const cleanAttachments = attachments.map((attachment, index) => {
      const name = assertText(attachment.name, `attachment ${index + 1} name`, 255);
      if (typeof attachment.url !== 'string' || !attachment.url) {
        throw new HttpError(400, `attachment ${index + 1} URL is required`);
      }
      if (
        !/^data:(image|audio|video|application)\//i.test(attachment.url) ||
        Number(attachment.size) > 3_500_000
      ) {
        throw new HttpError(400, 'Attachment must be a supported data URL no larger than 3.5 MB');
      }
      return {
        id: randomUUID(),
        name,
        type: String(attachment.type || 'application/octet-stream').slice(0, 100),
        size: Number(attachment.size) || 0,
        kind: 'upload',
        url: attachment.url,
      };
    });

    const message = await this.commit('message.created', (state) => {
      const created = {
        id: randomUUID(),
        conversationId,
        senderId: this.viewer,
        mentions,
        text,
        attachments: cleanAttachments,
        replyToId: input.replyToId || null,
        reactions: [],
        createdAt: new Date().toISOString(),
        status: 'delivered',
      };
      state.messages.push(created);
      for (const id of conversation.memberIds) {
        const prefs = this.chatPrefs(conversation, id);
        if (id === this.viewer) { prefs.unread = 0; prefs.archived = false; }
        else prefs.unread++;
      }
      return created;
    });

    if (this.demoReplies && this.preferences().demoReplies && conversation.openAgents?.length) {
      for (const a of this.state.agents.filter((v) => v.demo && accessible(conversation, v))) {
        const reason = message.delivery?.[a.uid];
        if (reason !== 'mentioned' && !(reason === 'delegation_candidate' && message.text.includes('?'))) continue;
        const timer = setTimeout(() => {
          if (!a.demo || a.revoked) return;
          const readers = Object.entries(message.delivery).filter(([, mode]) => mode === 'context').map(([uid]) => `@${uid}`);
          agentSend(this, a, conversation, { text: reason === 'mentioned'
            ? `You mentioned @${a.uid}.${readers.length ? ` Shared as context with ${readers.join(', ')}.` : ''}`
            : `@${a.uid} here. My human is offline; I picked up your question.`,
          clientMessageId: `demo:${message.id}`, replyToId: message.id }).catch((e) => {
            if (e.status !== 403 && e.status !== 404) console.error('Demo agent:', e);
          });
        }, this.replyDelay);
        timer.unref();
      }
    } else if (this.demoReplies && this.preferences().demoReplies && !mentions.length) {
      this.scheduleDemoReply(conversation, message);
    }
    return message;
  }

  scheduleDemoReply(conversation, previousMessage) {
    if (!['direct', 'group'].includes(conversation.type)) return;
    const otherId = conversation.memberIds.find((id) => id !== this.viewer && !this.humanAccounts.has(id));
    if (!otherId) return;
    const timer = setTimeout(async () => {
      const candidate = this.state.conversations.find((item) => item.id === conversation.id);
      if (!candidate) return;
      const outgoing = this.state.messages.find((item) => item.id === previousMessage.id);
      if (outgoing) outgoing.status = 'read';

      const replies = [
        'Got it. I will take a closer look.',
        'That works for me. Thanks for the update!',
        'Nice. Let us keep the next step small and clear.',
        'I am on it. I will send you a note shortly.',
      ];
      const response = replies[previousMessage.text.length % replies.length];
      try {
        await this.commit('message.created', (state) => {
          const reply = {
            id: randomUUID(),
            conversationId: conversation.id,
            senderId: otherId,
            scripted: true,
            text: response,
            attachments: [],
            reactions: [],
            createdAt: new Date().toISOString(),
            status: 'delivered',
          };
          state.messages.push(reply);
          this.chatPrefs(candidate).unread += 1;
          return reply;
        });
      } catch (error) {
        console.error('Could not persist simulated reply:', error);
      }
    }, this.replyDelay);
    timer.unref?.();
  }

  async editMessage(messageId, textInput, mentions) {
    const text = assertText(textInput, 'Message', 4000);
    const message = this.getMessage(messageId);
    if (message.senderId !== this.viewer) {
      throw new HttpError(403, 'You can only edit your own messages');
    }
    if (message.deleted) throw new HttpError(409, 'Deleted messages cannot be edited');
    if (mentions !== undefined && (!Array.isArray(mentions) || mentions.some((id) => !message.mentions?.includes(id)))) {
      throw new HttpError(400, 'Send a new message to mention another participant');
    }
    return this.commit('message.updated', () => {
      message.text = text;
      if (mentions) message.mentions = [...new Set(mentions)];
      message.editedAt = new Date().toISOString();
      return message;
    });
  }

  async deleteMessage(messageId) {
    const message = this.getMessage(messageId);
    if (message.senderId !== this.viewer) {
      throw new HttpError(403, 'You can only delete your own messages');
    }
    return this.commit('message.deleted', () => {
      message.text = '';
      message.attachments = [];
      message.deleted = true;
      message.deletedAt = new Date().toISOString();
      return { id: message.id };
    });
  }

  async toggleReaction(messageId, emojiInput) {
    const emoji = assertText(emojiInput, 'Emoji', 16);
    const message = this.getMessage(messageId);
    if (message.deleted) throw new HttpError(409, 'Deleted messages cannot receive reactions');
    return this.commit('reaction.updated', () => {
      message.reactions ||= [];
      let reaction = message.reactions.find((item) => item.emoji === emoji);
      if (!reaction) {
        reaction = { emoji, userIds: [] };
        message.reactions.push(reaction);
      }
      const currentIndex = reaction.userIds.indexOf(this.viewer);
      if (currentIndex >= 0) reaction.userIds.splice(currentIndex, 1);
      else reaction.userIds.push(this.viewer);
      message.reactions = message.reactions.filter((item) => item.userIds.length);
      return message;
    });
  }

  async toggleSaved(messageId) {
    const message = this.getMessage(messageId);
    if (message.deleted) throw new HttpError(409, 'Deleted messages cannot be saved');
    return this.commit('message.saved', () => {
      message.savedBy ||= [];
      const currentIndex = message.savedBy.indexOf(this.viewer);
      if (currentIndex >= 0) message.savedBy.splice(currentIndex, 1);
      else message.savedBy.push(this.viewer);
      return message;
    });
  }

  async forwardMessage(messageId, conversationId) {
    const original = this.getMessage(messageId);
    const conversation = this.getConversation(conversationId);
    if (original.deleted) throw new HttpError(409, 'Deleted messages cannot be forwarded');

    return this.commit('message.forwarded', (state) => {
      const forwarded = {
        id: randomUUID(),
        conversationId,
        senderId: this.viewer,
        text: original.text,
        attachments: (original.attachments || []).map((attachment) => ({
          ...attachment,
          id: randomUUID(),
        })),
        replyToId: null,
        reactions: [],
        forwardedFrom: {
          messageId: original.id,
          conversationId: original.conversationId,
          senderId: original.senderId,
        },
        createdAt: new Date().toISOString(),
        status: 'delivered',
      };
      state.messages.push(forwarded);
      for (const id of conversation.memberIds) {
        const prefs = this.chatPrefs(conversation, id);
        if (id === this.viewer) { prefs.unread = 0; prefs.archived = false; }
        else prefs.unread++;
      }
      return forwarded;
    });
  }

  async updateConversation(conversationId, input) {
    const conversation = this.getConversation(conversationId);
    const prefs = this.chatPrefs(conversation);
    return this.commit('conversation.updated', () => {
      if (typeof input.read === 'boolean' && input.read) prefs.unread = 0;
      for (const key of ['pinned', 'muted', 'archived']) {
        if (typeof input[key] === 'boolean') prefs[key] = input[key];
      }
      return this.humanConversation(conversation);
    });
  }

  async setAccess(id, input) {
    const c = this.getConversation(id);
    if (c.type === 'channel') throw new HttpError(400, 'Agents are supported in direct chats and groups');
    const before = c.openAgents || [];
    let after = before;
    if (Object.hasOwn(input, 'allowDelegatedReplies')) {
      if (c.type !== 'group' || c.ownerUid !== this.viewer) throw new HttpError(403, 'Only the group owner can set delegation policy');
      if (typeof input.allowDelegatedReplies !== 'boolean') throw new HttpError(400, 'Boolean policy required');
    }
    if (Object.hasOwn(input, 'openAgents')) {
      const own = this.state.agents.filter((a) => a.ownerUid === this.viewer && !a.revoked);
      if (!Array.isArray(input.openAgents) || input.openAgents.some((uid) => !own.some((a) => a.uid === uid))) {
        throw new HttpError(403, 'Choose only your own active agents');
      }
      after = [...new Set([...before.filter((id) => !own.some((a) => a.uid === id)), ...input.openAgents])];
    }
    return this.commit('access.changed', () => {
      c.openAgents = after;
      if (Object.hasOwn(input, 'allowDelegatedReplies')) c.allowDelegatedReplies = input.allowDelegatedReplies;
      return { conversationId: id, audience: [...new Set([...before, ...after])] };
    });
  }

  async createConversation(input) {
    const type = ['direct', 'group', 'channel'].includes(input.type) ? input.type : 'group';
    const title = assertText(input.title, 'Title', 120);
    const members = Array.isArray(input.memberIds)
      ? input.memberIds.filter((id) => this.state.users.some((user) => user.id === id))
      : [];
    const uniqueMembers = [...new Set([this.viewer, ...members])];
    if (type !== 'channel' && uniqueMembers.length < 2) {
      throw new HttpError(400, 'Choose at least one member');
    }
    if (type === 'direct' && uniqueMembers.length !== 2) {
      throw new HttpError(400, 'Direct conversations require exactly one other member');
    }
    if (type === 'direct') {
      const existing = this.state.conversations.find(
        (conversation) =>
          conversation.type === 'direct' &&
          conversation.memberIds.length === 2 &&
          uniqueMembers.every((id) => conversation.memberIds.includes(id)),
      );
      if (existing) return clone(this.humanConversation(existing));
    }

    return this.commit('conversation.created', (state) => {
      const conversation = {
        id: randomUUID(),
        type,
        title,
        memberIds: uniqueMembers,
        openAgents: [],
        ...(type === 'group' ? { ownerUid: this.viewer, allowDelegatedReplies: false } : {}),
        description:
          typeof input.description === 'string' ? input.description.trim().slice(0, 280) : '',
        avatar: title
          .split(/\s+/)
          .map((word) => word[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        color: type === 'channel' ? '#dca24a' : '#6b79d8',
        pinned: false,
        muted: false,
        archived: false,
        unread: 0,
        subscribers: type === 'channel' ? 1 : undefined,
      };
      state.conversations.unshift(conversation);
      return conversation;
    });
  }

  search(queryInput) {
    const query = String(queryInput || '').trim().toLowerCase();
    if (!query) return { conversations: [], users: [], messages: [] };
    const snapshot = this.snapshot();
    const conversations = snapshot.conversations.filter(
      (conversation) =>
        !conversation.archived &&
        `${conversation.title} ${conversation.description || ''}`.toLowerCase().includes(query),
    );
    const users = this.state.users.filter((user) =>
      `${user.name} @${user.username} ${user.bio || ''}`.toLowerCase().includes(query),
    );
    const messages = snapshot.messages.filter(
      (message) => !message.deleted && message.text.toLowerCase().includes(query),
    );
    return { conversations: clone(conversations), users: clone(users), messages: clone(messages) };
  }

  async updateProfile(input) {
    const user = this.state.users.find((item) => item.id === this.viewer);
    const changes = {};
    if (input.name !== undefined) changes.name = assertText(input.name, 'Name', 80);
    if (input.username !== undefined) {
      const username = assertText(input.username, 'Username', 32)
        .replace(/^@/, '')
        .toLowerCase();
      if (!/^[a-z0-9_]{3,32}$/.test(username)) {
        throw new HttpError(400, 'Username must use 3-32 letters, numbers, or underscores');
      }
      const inUse = this.state.users.some(
        (item) => item.id !== user.id && item.username.toLowerCase() === username,
      );
      if (inUse) throw new HttpError(409, 'That username is already in use');
      changes.username = username;
    }
    if (input.bio !== undefined) {
      if (typeof input.bio !== 'string' || input.bio.length > 140) {
        throw new HttpError(400, 'Bio must be a string of 140 characters or fewer');
      }
      changes.bio = input.bio.trim();
    }
    return this.commit('profile.updated', () => Object.assign(user, changes));
  }

  async updateSettings(input) {
    if (input.language !== undefined && !['en', 'zh-CN'].includes(input.language)) {
      throw new HttpError(400, 'Language must be en or zh-CN');
    }
    const allowedThemes = ['light', 'dark', 'system'];
    const settings = this.preferences();
    return this.commit('settings.updated', () => {
      if (allowedThemes.includes(input.theme)) settings.theme = input.theme;
      if (input.language !== undefined) settings.language = input.language;
      for (const key of ['compact', 'sound', 'demoReplies', 'desktopNotifications']) {
        if (typeof input[key] === 'boolean') settings[key] = input[key];
      }
      return settings;
    });
  }

  async startCall(conversationId, type) {
    const conversation = this.getConversation(conversationId);
    const callType = type === 'video' ? 'video' : 'voice';
    if (conversation.type === 'channel') {
      throw new HttpError(409, 'Calls are available in direct and group conversations');
    }
    return this.commit('call.started', (state) => {
      const call = {
        id: randomUUID(),
        conversationId,
        type: callType,
        startedAt: new Date().toISOString(),
        endedAt: null,
        status: 'active',
      };
      state.calls.unshift(call);
      return call;
    });
  }

  async endCall(callId) {
    const call = this.state.calls.find((item) => item.id === callId);
    if (!call) throw new HttpError(404, 'Call not found');
    this.getConversation(call.conversationId);
    return this.commit('call.ended', () => {
      call.endedAt = new Date().toISOString();
      call.status = 'ended';
      return call;
    });
  }
}
