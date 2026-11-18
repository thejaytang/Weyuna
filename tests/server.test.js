import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { createApp } from '../server.js';
import { Store } from '../src/store.js';

let directory;
let server;
let baseUrl;
let cookie;

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (cookie && !headers.has('cookie')) headers.set('cookie', cookie);
  if (options.body && typeof options.body !== 'string') {
    headers.set('content-type', 'application/json');
    options.body = JSON.stringify(options.body);
  }
  return fetch(`${baseUrl}${path}`, { ...options, headers });
}

before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'weyuna-test-'));
  server = await createApp({
    dataFile: join(directory, 'state.json'),
    demoReplies: false,
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
  const login = await request('/api/login', { method: 'POST', body: { key: server.loginKeys.ava } });
  assert.equal(login.status, 200);
  cookie = login.headers.get('set-cookie').split(';')[0];
});

after(async () => {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await rm(directory, { recursive: true, force: true });
});

test('serves the app shell and complete demo bootstrap data', async () => {
  const page = await request('/');
  assert.equal(page.status, 200);
  assert.match(await page.text(), /id="app-shell"/);

  const response = await request('/api/bootstrap');
  assert.equal(response.status, 200);
  const state = await response.json();
  assert.equal(state.currentUserId, 'ava');
  assert.ok(state.users.length >= 5);
  assert.ok(state.conversations.some((conversation) => conversation.type === 'channel'));
  assert.ok(state.messages.length >= 15);
});

test('creates, edits, reacts to, saves, and deletes an owned message', async () => {
  const createdResponse = await request('/api/conversations/chat-mia/messages', {
    method: 'POST',
    body: {
      text: 'A test message',
      attachments: [
        {
          name: 'pixel.png',
          type: 'image/png',
          size: 5,
          url: 'data:image/png;base64,aGVsbG8=',
        },
      ],
    },
  });
  assert.equal(createdResponse.status, 201);
  const created = (await createdResponse.json()).message;
  assert.equal(created.attachments[0].name, 'pixel.png');

  const editResponse = await request(`/api/messages/${created.id}`, {
    method: 'PATCH',
    body: { text: 'An edited test message' },
  });
  assert.equal(editResponse.status, 200);
  assert.equal((await editResponse.json()).message.text, 'An edited test message');

  const reactionResponse = await request(`/api/messages/${created.id}/reactions`, {
    method: 'POST',
    body: { emoji: '👍' },
  });
  assert.equal(reactionResponse.status, 200);
  assert.deepEqual((await reactionResponse.json()).message.reactions[0].userIds, ['ava']);

  const saveResponse = await request(`/api/messages/${created.id}/save`, { method: 'POST' });
  assert.equal(saveResponse.status, 200);
  assert.deepEqual((await saveResponse.json()).message.savedBy, ['ava']);

  const deleteResponse = await request(`/api/messages/${created.id}`, { method: 'DELETE' });
  assert.equal(deleteResponse.status, 200);
  const snapshot = await request('/api/bootstrap').then((response) => response.json());
  assert.equal(snapshot.messages.find((message) => message.id === created.id).deleted, true);
});

test('validates message input and ownership rules', async () => {
  const blank = await request('/api/conversations/chat-mia/messages', {
    method: 'POST',
    body: { text: '   ' },
  });
  assert.equal(blank.status, 400);
  assert.equal((await blank.json()).error, 'Message text or an attachment is required');

  const foreign = await request('/api/messages/m-mia-1', {
    method: 'PATCH',
    body: { text: 'Not allowed' },
  });
  assert.equal(foreign.status, 403);
});

test('forwards live messages while rejecting deleted sources', async () => {
  const forwardResponse = await request('/api/messages/m-mia-1/forward', {
    method: 'POST',
    body: { conversationId: 'chat-noah' },
  });
  assert.equal(forwardResponse.status, 201);
  const forwarded = (await forwardResponse.json()).message;
  assert.equal(forwarded.text, 'Morning! I finished the new onboarding flow.');
  assert.equal(forwarded.conversationId, 'chat-noah');
  assert.equal(forwarded.senderId, 'ava');
  assert.equal(forwarded.forwardedFrom.messageId, 'm-mia-1');

  const deleted = await request('/api/conversations/chat-mia/messages', {
    method: 'POST',
    body: { text: 'Forward source deletion test' },
  }).then((response) => response.json());
  await request(`/api/messages/${deleted.message.id}`, { method: 'DELETE' });
  const rejected = await request(`/api/messages/${deleted.message.id}/forward`, {
    method: 'POST',
    body: { conversationId: 'chat-noah' },
  });
  assert.equal(rejected.status, 409);
});

test('creates group and channel conversations and supports global search', async () => {
  const groupResponse = await request('/api/conversations', {
    method: 'POST',
    body: {
      type: 'group',
      title: 'API Test Group',
      description: 'Created by the integration suite',
      memberIds: ['mia', 'noah'],
    },
  });
  assert.equal(groupResponse.status, 201);
  const group = (await groupResponse.json()).conversation;
  assert.deepEqual(group.memberIds, ['ava', 'mia', 'noah']);

  const channelResponse = await request('/api/conversations', {
    method: 'POST',
    body: { type: 'channel', title: 'API Test Channel', memberIds: [] },
  });
  assert.equal(channelResponse.status, 201);

  const searchResponse = await request('/api/search?q=API%20Test');
  assert.equal(searchResponse.status, 200);
  const results = await searchResponse.json();
  assert.equal(results.conversations.length, 2);
});

test('updates profile, settings, and conversation state', async () => {
  const profileResponse = await request('/api/profile', {
    method: 'PATCH',
    body: { name: 'Ava Test', username: 'ava_test', bio: 'Integration test profile' },
  });
  assert.equal(profileResponse.status, 200);
  assert.equal((await profileResponse.json()).user.username, 'ava_test');

  const settingsResponse = await request('/api/settings', {
    method: 'PATCH',
    body: { theme: 'dark', compact: true, demoReplies: false },
  });
  assert.equal(settingsResponse.status, 200);
  assert.equal((await settingsResponse.json()).settings.theme, 'dark');

  const conversationResponse = await request('/api/conversations/chat-studio', {
    method: 'PATCH',
    body: { read: true, pinned: false, muted: true },
  });
  assert.equal(conversationResponse.status, 200);
  const conversation = (await conversationResponse.json()).conversation;
  assert.equal(conversation.unread, 0);
  assert.equal(conversation.muted, true);
});

test('rejects invalid usernames, JSON, and channel calls', async () => {
  const duplicate = await request('/api/profile', {
    method: 'PATCH',
    body: { username: 'mialaurent' },
  });
  assert.equal(duplicate.status, 409);

  const invalidJson = await request('/api/profile', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: '{"name":',
  });
  assert.equal(invalidJson.status, 400);

  const call = await request('/api/calls', {
    method: 'POST',
    body: { conversationId: 'channel-design', type: 'voice' },
  });
  assert.equal(call.status, 409);
});

test('starts and ends simulated direct calls', async () => {
  const startResponse = await request('/api/calls', {
    method: 'POST',
    body: { conversationId: 'chat-mia', type: 'video' },
  });
  assert.equal(startResponse.status, 201);
  const call = (await startResponse.json()).call;
  assert.equal(call.status, 'active');
  assert.equal(call.type, 'video');

  const endResponse = await request(`/api/calls/${call.id}/end`, { method: 'POST' });
  assert.equal(endResponse.status, 200);
  assert.equal((await endResponse.json()).call.status, 'ended');
});

test('persists domain state and reloads it after process restart simulation', async () => {
  const dataFile = join(directory, 'reload-state.json');
  const first = new Store({ dataFile, demoReplies: false });
  await first.init();
  const sent = await first.sendMessage('chat-sora', { text: 'Persistent demo message' });
  await first.updateSettings({ language: 'zh-CN' });

  const reloaded = new Store({ dataFile, demoReplies: false });
  await reloaded.init();
  const restored = reloaded
    .snapshot()
    .messages.find((message) => message.id === sent.id);
  assert.equal(restored.text, 'Persistent demo message');
  assert.equal(reloaded.snapshot().settings.language, 'zh-CN');
});
