import test from 'node:test';
import assert from 'node:assert/strict';
import { mentionChoices, mentionAt, speakerView } from '../public/chat-view.js';
import { setLanguage } from '../public/i18n.js';

test('Chinese localizes agent roles without translating names or UIDs matching interface labels', () => {
  setLanguage('zh-CN');
  try {
    const owner = { id: 'you', name: 'Settings', username: 'settings', online: true };
    const agent = { id: 'you/dots', name: 'you/dots', ownerUid: 'you', type: 'agent' };
    const view = speakerView(agent, 'me', owner);
    assert.equal(view.name, 'you/dots');
    assert.equal(view.role, 'Settings 的 Agent');
    const rows = mentionChoices({ memberIds: ['you'], openAgents: ['you/dots'] }, [owner], 'me', 'you/').rows;
    assert.deepEqual(rows.map(({ label, note }) => [label, note]), [['Settings', '本人'], ['you/dots', 'Settings 的 Agent']]);
  } finally { setLanguage('en'); }
});

test('100 people with 300 open accounts: bounded suggestions, owner drill-down and exact UID', () => {
  const users = Array.from({ length: 101 }, (_, i) => ({ id: `u${i}`, name: `Member ${i}`, username: `member${i}`, online: i % 2 === 0 }));
  const memberIds = users.slice(0, 100).map((u) => u.id);
  const chat = { memberIds, openAgents: memberIds.flatMap((id) => ['dots', 'duvet', 'relay'].map((a) => `${id}/${a}`)) };
  const search = (q) => mentionChoices(chat, users, 'u0', q);
  assert.equal(search('').total, 100);
  assert.equal(search('').rows.length, 6);
  assert.ok(search('').rows.every((r) => r.branch));
  assert.equal(search('dots').total, 100);
  assert.equal(search('dots').rows.length, 6);
  assert.equal(search('u99').rows[0].uid, 'u99');
  const inside = search('u99/').rows;
  assert.deepEqual(inside.filter((r) => !r.disabled).map((r) => r.uid), ['u99/dots','u99/duvet','u99/relay']);
  assert.ok(inside.find((r) => r.uid === 'u99').disabled);
  assert.equal(search('u99/duv').rows[0].uid, 'u99/duvet');
  assert.equal(search('u0/').rows.some((r) => r.uid === 'u0'), false);
  assert.equal(search('u100').total, 0);
  assert.equal(search('u99/private').total, 0);
});

test('mention replacement covers one token at the caret and leaves adjacent text intact', () => {
  const text = 'ask @mia/duvet about @ava/relay';
  const at = mentionAt(text, 9);
  assert.deepEqual(at, { start: 4, end: 14, query: 'mia/' });
  assert.equal(text.slice(0, at.start) + '@mia/dots' + text.slice(at.end), 'ask @mia/dots about @ava/relay');
  assert.equal(mentionAt('mail@example', 12), null);
  assert.equal(mentionAt('请@mia', 5).query, 'mia');
  assert.equal(mentionAt('请@mia', 1), null);
  assert.equal(mentionAt('hello @明', 8).query, '明');
});

test('my side, actual author and editing rights are independent', () => {
  const ava = { id: 'ava', name: 'Ava' }, dots = { id: 'ava/dots', name: 'ava/dots', type: 'agent', ownerUid: 'ava' };
  assert.deepEqual(speakerView(dots, 'ava', ava, 'delegation_candidate'),
    { name: 'ava/dots', role: 'Your agent', mine: true, delegated: true, canEdit: false });
  assert.deepEqual(speakerView(dots, 'mia', ava, 'mentioned'),
    { name: 'ava/dots', role: "Ava's agent", mine: false, delegated: false, canEdit: false });
  assert.equal(speakerView(ava, 'ava').canEdit, true);
  assert.equal(speakerView(ava, 'ava').name, 'You');
  assert.equal(speakerView(ava, 'mia').mine, false);
});
