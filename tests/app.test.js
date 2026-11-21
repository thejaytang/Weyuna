import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');

// Exercise the shipped handlers with controlled network/DOM boundaries.
function handler(start, end, name, context) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from);
  assert.ok(from >= 0 && to > from);
  return runInNewContext(`${source.slice(from, to)}\n${name};`, context);
}

function composer(api) {
  const app = { data: { settings: { demoReplies: false } }, mentions: new Set(), attachment: null,
    editingMessageId: null, replyToId: null, recording: null };
  const elements = { messageInput: { value: 'One message', style: {}, scrollHeight: 40, focus() {} },
    sendButton: { disabled: false }, fileInput: { value: '' } };
  const context = { app, elements, api, encodeURIComponent, activeConversation: () => ({ id: 'chat-mia' }),
    pruneMentions() {}, hideMentionPicker() {}, requestAnimationFrame() {}, scrollToLatest() {},
    safely: async (action) => { try { return await action(); } catch { return null; } } };
  context.renderComposerBanner = handler('function resizeComposer()', '\nfunction renderAgentStrip(', 'resizeComposer', context);
  const submit = handler('async function submitMessage()', '\nasync function toggleSaved(', 'submitMessage', context);
  return { app, elements, submit, resize: context.renderComposerBanner };
}

test('repeated submissions during a pending send create only one request', async () => {
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const requests = [];
  const c = composer(async (path, options) => { requests.push({ path, options }); await pending; return {}; });
  const first = c.submit();
  const second = c.submit();
  c.resize();
  assert.equal(requests.length, 1);
  assert.equal(c.elements.sendButton.disabled, true);
  release();
  await Promise.all([first, second]);
  assert.equal(c.elements.messageInput.value, '');
  c.elements.messageInput.value = 'Next message';
  await c.submit();
  assert.equal(requests.length, 2);
});

test('a failed send preserves the draft and allows a retry', async () => {
  let calls = 0;
  const c = composer(async () => { if (++calls === 1) throw new Error('offline'); return {}; });
  await c.submit();
  assert.equal(c.elements.messageInput.value, 'One message');
  assert.equal(c.elements.sendButton.disabled, false);
  await c.submit();
  assert.equal(calls, 2);
  assert.equal(c.elements.messageInput.value, '');
});

test('pending edits also reject duplicate submissions', async () => {
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const requests = [];
  const c = composer(async (path, options) => { requests.push({ path, options }); await pending; return {}; });
  c.app.editingMessageId = 'message-1';
  const first = c.submit();
  const second = c.submit();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.method, 'PATCH');
  release();
  await Promise.all([first, second]);
  assert.equal(c.app.editingMessageId, null);
});

test('incoming muted messages stay silent while still being acknowledged', () => {
  let listener;
  let tones = 0;
  let acknowledgements = 0;
  const app = { activeConversationId: 'chat-mia', data: { currentUserId: 'ava' } };
  const context = { app, elements: { typing: { hidden: false }, details: {} },
    EventSource: class { addEventListener(type, fn) { if (type === 'state') listener = fn; } },
    conversationMessages: () => [], activeConversation: () => app.data.conversations.find((c) => c.id === app.activeConversationId),
    applyPreferences() {}, renderConversationList() {}, onContactsPage: () => false,
    renderHeader() {}, renderMentionPicker() {}, renderMessages() {}, renderDetails() {},
    element: () => ({ hidden: true }), document: { querySelector: () => ({}) }, t: (value) => value,
    playTone: () => { tones++; }, api: () => { acknowledgements++; return Promise.resolve(); }, console };
  handler('function connectEvents()', '\nfunction playTone(', 'connectEvents', context)();
  function incoming({ muted = false, sound = true, senderId = 'mia', conversationId = 'chat-mia' } = {}) {
    listener({ data: JSON.stringify({ type: 'message.created', payload: { conversationId, senderId },
      state: { currentUserId: 'ava', settings: { sound }, conversations: [{ id: 'chat-mia', muted }] } }) });
  }
  incoming({ muted: true });
  assert.equal(tones, 0);
  assert.equal(acknowledgements, 1);
  incoming();
  assert.equal(tones, 1);
  incoming({ sound: false });
  incoming({ senderId: 'ava' });
  incoming({ conversationId: 'other' });
  assert.equal(tones, 1);
  assert.equal(acknowledgements, 3);
});
