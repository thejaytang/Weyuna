// Run with WEYUNA_AGENT_TOKEN set. This example handles the next explicit mention.
const token = process.env.WEYUNA_AGENT_TOKEN;
if (!token) throw new Error('Set WEYUNA_AGENT_TOKEN to the token from My agents');
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
const base = `http://127.0.0.1:${port}/api/agent/v1`;

async function request(path, body) {
  const res = await fetch(base + path, { method: body ? 'POST' : 'GET', redirect: 'error',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body && JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${data.error}`);
  return data;
}

const initial = await request('/sync');
console.log(`Listening as ${initial.self.uid} in ${initial.conversations.length} conversation(s)`);
let cursor = initial.nextCursor;
for (;;) {
  const batch = await request(`/sync?wait=25&cursor=${encodeURIComponent(cursor)}`);
  const event = batch.events.find((e) => e.type === 'message.created' && e.delivery === 'mentioned');
  if (event) {
    const { message, conversationId } = event;
    const chat = batch.conversations.find((c) => c.id === conversationId);
    const result = await request(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
      replyToId: message.id, clientMessageId: `mention:${message.id}`,
      text: `${message.sender.displayName}, I received your ${chat.type} message at ${message.sentAt}.`,
    });
    console.log(`Replied as ${result.message.sender.uid} to ${message.sender.uid} in ${conversationId}`);
    break;
  }
  cursor = batch.nextCursor;
}
