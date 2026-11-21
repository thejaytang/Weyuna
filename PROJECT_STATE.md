# Project State

## 2026-11-21: Review fixes for message and profile state

Forwarding now increments every recipient's unread count and preserves their archive preference. Profile updates validate all supplied fields before changing the stored user. Repeated submissions are blocked while a send or edit is pending; failures preserve the draft and allow a retry. Incoming messages respect the active conversation's mute setting while retaining read acknowledgements.

All 26 tests and syntax checks passed. The regression tests reproduce the original failures before the fixes, then check recipient unread counts, rejected profile changes in live and persisted state, duplicate send/edit requests, retry behavior and notification sounds. Browser handlers are exercised with controlled DOM and network boundaries in Node's VM.

The next integration check remains a user-provided agent runtime.

## 2026-11-18 11:24 CET: Contacts, mentions, speaker labels and interface language

Contacts has its own searchable page. The mention picker shows at most six results and lets users narrow by owner or Agent UID. Message alignment follows the owner; the byline identifies the actual sender. Settings offers English and Simplified Chinese, saved separately for each human account.

All 20 tests and the syntax checks passed, including a 100-member group with 300 open agents and language persistence after a store restart. Browser checks covered mobile contact navigation, a group mention answered by `mia/duvet`, `ava/relay` labeled as the viewer's agent, and switching languages in both directions without changing the draft or message bodies. The preview account stayed in Chinese after reload.

The next integration check remains a user-provided agent runtime. Large-room picker behavior was checked with fixtures, not a live load test.

## 2026-11-18 11:01 CET: Human and agent conversations (historical)

The local Web and Node app supports two human logins, multiple agents per owner, conversation grants, structured mentions, agent-authored replies and offline delegation. The [four-route agent API](./docs/API.md#agent-api-v1) and [standalone example](./examples/reply-once.js) are available for client integration.

Syntax checks and the 14 HTTP/domain tests passed. In the browser, Ava mentioned `mia/dots` in the direct chat; both readers were shown and only `mia/dots` replied. Ava bound `ava/relay`, opened it only in Product Studio and changed the group delegation policy. A separate Node process authenticated as `ava/relay`, received Mia's group mention, returned the conversation type and timestamp, and could not read the direct chat. The preview used a separate data directory.

The next integration check is to connect a user-provided agent runtime. The example runs locally and replies once. Verified identity, production storage and delivery infrastructure remain outside this milestone.

## Earlier on 2026-11-18: Original single-identity simulation (historical)

### Phase

Initial implementation complete. The previously empty repository now contains an original, dependency-free Web/Node.js messaging prototype.

### Confirmed results

- Responsive desktop and mobile conversation interface.
- Direct messages, groups, channels, search, reactions, replies, forwarding, saved messages, attachments, profile/settings, and conversation state controls.
- Local REST backend with serialized JSON persistence.
- SSE updates between browser tabs and scripted demonstration replies.
- Simulated voice notes and calls with explicit device-access boundaries.
- Comprehensive product map and API contract in `docs/`.

### Verification

- `npm run check`: passed.
- `npm test`: integration suite passed, including forwarding and persistence.
- Desktop browser: app loaded, sent a message, received a scripted reply, and opened the new-conversation flow.
- Mobile browser at 390 x 844: no horizontal overflow; list, chat, send, and Back navigation passed.
- Browser console: no runtime errors during the tested flows.

### Current limitations

- One local demo identity.
- Single-process JSON persistence, no production concurrency guarantee.
- SSE sends full state snapshots.
- No real authentication, phone verification, Telegram integration, encryption, WebRTC, push notification, or media service.
- Attachment payloads are stored as local data URLs.
- Call and voice-note flows are UI simulations.

### Recommended next step

Choose a production milestone. The lowest-risk next milestone is **real account foundation**: authentication, authorization, durable relational storage, migration scripts, and per-user state. The next visual-only milestone should add invitations, role permissions, message forwarding, and topic/poll flows before real-time infrastructure.
