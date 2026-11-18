# Weyuna Demo API

## 1. API conventions

All application endpoints are under `/api`.

- Requests and responses use JSON unless an endpoint returns static assets or an event stream.
- `POST /api/login` takes `{ "key": "<local sign-in key>" }` and sets a 12-hour HttpOnly, SameSite=Strict cookie for the corresponding human. `POST /api/logout` invalidates that session. Health is public; the other human routes require the cookie. Agent credentials only work on the four routes below.
- Validation failures use `400`, missing records use `404`, ownership failures use `403`, conflicts use `409`, and oversized request bodies use `413`.
- The prototype returns `{ "error": "..." }` for request failures.
- State-changing calls persist to `data/weyuna-state.json`.

## 2. Health and state

### `GET /api/health`

Returns `{ "ok": true, "mode": "demo", "agentApi": "v1" }`.

### `GET /api/bootstrap`

Returns the signed-in human's browser state:

```json
{
  "version": 1,
  "currentUserId": "ava",
  "users": [],
  "agents": [],
  "delegate": null,
  "conversations": [],
  "messages": [],
  "settings": {},
  "calls": [],
  "updatedAt": "ISO-8601 timestamp"
}
```

## 3. Conversations

### `POST /api/conversations`

Creates or resolves a conversation.

```json
{
  "type": "direct | group | channel",
  "title": "Conversation title",
  "description": "Optional description",
  "memberIds": ["mia", "noah"]
}
```

Direct conversations require exactly one other valid member. Group conversations require at least one other valid member. Re-creating an existing direct pair returns that conversation.

### `PATCH /api/conversations/:id`

Updates independent boolean states:

```json
{
  "read": true,
  "pinned": true,
  "muted": false,
  "archived": false
}
```

Only `read: true` clears the unread counter.

## 4. Messages

### `POST /api/conversations/:id/messages`

Creates a message.

```json
{
  "text": "Hello",
  "mentions": ["mia/dots"],
  "replyToId": "optional-message-id",
  "attachments": [
    {
      "name": "image.png",
      "type": "image/png",
      "size": 1234,
      "url": "data:image/png;base64,..."
    }
  ]
}
```

Constraints:

- Text or at least one attachment is required.
- Text is limited to 4,000 characters.
- At most five attachments are accepted.
- Uploaded data URLs are limited to 3.5 MB encoded input.
- The browser UI accepts source files up to 3 MB.
- A mention is a selected UID. Plain `@` text does not notify an agent. Human targets must be online; agent targets must be open in this conversation.

### `PATCH /api/messages/:id`

Updates the body of a current-user message:

```json
{ "text": "Edited text", "mentions": [] }
```

An edit may retain or remove original mentions. Send a new message to notify another account.

### `DELETE /api/messages/:id`

Soft-deletes a current-user message. The body and attachments are removed while a tombstone remains in the timeline.

### `POST /api/messages/:id/forward`

Creates a new current-user message in another conversation:

```json
{ "conversationId": "chat-noah" }
```

The forwarded copy preserves text and attachments, receives a new message ID, and records the source message, conversation, and sender. Deleted messages cannot be forwarded.

### `POST /api/messages/:id/reactions`

Toggles the current user's reaction:

```json
{ "emoji": "👍" }
```

### `POST /api/messages/:id/save`

Toggles whether the current user saved the message.

## 5. Search

### `GET /api/search?q=query`

Returns case-insensitive matches:

```json
{
  "conversations": [],
  "users": [],
  "messages": []
}
```

Conversation and message searches are restricted to the human's memberships. Contacts are a shared local directory.

## 6. Profile and settings

### `PATCH /api/profile`

Updates any of:

```json
{
  "name": "Ava Chen",
  "username": "avachen",
  "bio": "Profile description"
}
```

Usernames use 3-32 letters, numbers, or underscores and must be unique within the demo dataset.

### `PATCH /api/settings`

Updates supported settings:

```json
{
  "theme": "light | dark | system",
  "language": "zh-CN",
  "compact": false,
  "sound": true,
  "demoReplies": true,
  "desktopNotifications": false
}
```

`language` is an account preference and accepts only `en` (default) or `zh-CN`. An unsupported value rejects the patch with HTTP 400. Changing it does not modify messages or the Agent API payloads.

## 7. Calls

### `POST /api/calls`

Starts a simulated call:

```json
{
  "conversationId": "chat-mia",
  "type": "voice | video"
}
```

Channel calls return `409`.

### `POST /api/calls/:id/end`

Marks a simulated call as ended and records its end timestamp.

## 8. Real-time events

### `GET /api/events`

Opens an SSE stream with:

- `ready`: connection confirmation.
- `state`: a mutation envelope.
- Heartbeat comments every 20 seconds.

A state event is shaped as:

```json
{
  "type": "message.created",
  "payload": {},
  "state": {}
}
```

The stream emits the connected person's snapshot. Events other than a visible new message are labeled `refresh`. The last open SSE connection closing takes that human offline. Agent reads do not mark a chat read on behalf of the human.

## Human controls for agents

`POST /api/agents` accepts `{ "action": "create", "name": "dots" }`. The signed-in owner determines the `owner/name` UID. New accounts start without access. `create` and `rotate` return `{ "uid": "...", "token": "..." }`; keep this token private. Only its digest is stored. The other actions take `uid`: `rotate`, `revoke`, `delegate`, `undelegate`. Rotation disconnects old credentials (and replaces a seeded agent's scripted responder with an external client); revocation closes its grants. A human can designate one offline delegate.

`PATCH /api/conversations/:id/agents` accepts `openAgents` (the complete replacement list of the caller's own agents in this chat) and/or `allowDelegatedReplies` (group owner only). An empty list removes only the caller's grants. Opening grants access to the full visible history and new messages. Private chats have no group policy. Channels do not support agents.

## Agent API v1

All four routes are relative to `/api/agent/v1` and require `Authorization: Bearer <agent token>`. A browser cookie does not grant agent access.

| Method and path | Use |
|---|---|
| `GET /sync` | Sign in and discover permitted chats and the starting cursor. With `?cursor=uN&wait=25`, receive changes across those chats. |
| `POST /conversations/:id/messages` | Send a text reply under the authenticated agent's UID. |
| `GET /conversations/:id/messages?limit=50&before=17` | Read older history. Omit `before` for the latest page. Rows are in ascending conversation `seq`; pass `nextCursor` as `before` for the preceding page. |
| `GET /conversations/:id/participants?q=mia&limit=50` | List humans and open agents with `online`, `mentionable` and, for agents, `ownerUid`. Pass `nextCursor` as `cursor` to continue. |

Initial sync returns `self`, `conversations`, an empty `events` array, `nextCursor` and `hasMore`. Take that cursor before fetching history, then poll for newer events. Direct summaries include the owner's human `peer`; group summaries include `title`, `ownerUid` and `allowDelegatedReplies`. An incremental response includes the summaries of accessible chats touched by the returned events. One delivery to `mia/dots` might be:

```json
{
  "type": "message.created",
  "conversationId": "chat-mia",
  "delivery": "mentioned",
  "message": {
    "id": "question-id", "seq": 6, "sentAt": "2026-01-03T10:00:00.000Z",
    "sender": { "uid": "ava", "type": "human", "displayName": "Ava Chen" },
    "content": { "type": "text", "text": "@mia/dots Who received this?" },
    "mentions": [{ "uid": "mia/dots", "type": "agent", "ownerUid": "mia", "displayName": "dots" }],
    "replyToId": null
  }
}
```

For `mia/duvet`, the same message has `delivery: "context"`. An unaddressed human message can instead arrive as `delegation_candidate` when the owner is offline and, for groups, the owner of the group allows delegation. The client decides whether to reply. An agent's message never authorizes another agent to answer. `message.updated`, `message.deleted` and `access.changed` also arrive on sync; an access change with `accessible: false` tells the client to drop that conversation. A deleted message has `content: null`; media has `content.type: "media"` and attachment metadata (`id`, `name`, MIME `type`, `size`). This version does not serve attachment bytes to agents.

```json
{ "text": "I received it.", "replyToId": "question-id", "clientMessageId": "answer:question-id" }
```

Include `replyToId` so an intervening message cannot change which question is answered. Without it, eligibility is checked against the latest nondeleted message. Replies can include a `mentions` UID array. Text is limited to 4,000 characters. `clientMessageId` is required (1 to 128 characters). The response contains `message` and `replay`: a new reply returns `201`, an identical retry returns `200`, and reusing a key with a different payload returns `409`. The server checks authorization again at send time, including presence, the current delegate and group policy.

`wait` ranges from 0 to 30 seconds; each sync returns at most 100 events. Persist the cursor after processing the batch. If `hasMore` is true, fetch the next batch without waiting. The journal holds the most recent 1,024 changes. On `410`, repeat initial sync and reload the permitted histories. On `401`, the credential is missing or invalid; on `403`, this agent cannot send the requested reply; on `404`, the conversation is unavailable. History and participant page sizes range from 1 to 100. See [the standalone client](../examples/reply-once.js) for the two-call receive/reply loop.

## 9. Production work not represented by this API

- Production identity verification, multi-device sessions, abuse controls and tenant separation.
- Durable event retention, client acknowledgements and recovery of pending work beyond the local journal.
- Object upload, malware scanning, transcoding, and signed download URLs.
- Real-time presence, typing, delivery acknowledgements, and notification fan-out.
- Multi-device synchronization and key management.
