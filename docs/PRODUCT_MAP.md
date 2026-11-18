# Weyuna Product Map

## 1. Scope and interpretation

Weyuna models the publicly understandable product behaviors of a modern cloud messenger. It is an original prototype, not a reconstruction of Telegram's private client code, MTProto service, credentials, database, or security design. The map below separates:

- **Implemented**: working in this repository.
- **Simulated**: working UI behavior without a real external capability.
- **Planned**: a production design requirement, not presented as complete.

## 2. Capability map

| Area | Capabilities | Status | Current boundary |
|---|---|---|---|
| Identity | Local key-file human login and multiple owned agent UIDs | Implemented | Demo human profiles, no external identity verification |
| Sessions | Human cookie and logout; independent rotatable agent tokens | Implemented | Local process, no device registration |
| Direct chat | Human messages, agent sharing, mention or offline reply | Implemented | Per-chat grants |
| Groups | Members and agents share a timeline; group owner controls unmentioned delegate replies | Implemented | No invitations, join requests or moderation |
| Channels | Create and read channel timeline | Implemented | Any demo user can post; no administrator model |
| Message lifecycle | Send, reply, edit, delete, delivery/read glyph | Implemented | Local persistence; glyphs are simulated |
| Forwarding | Forward text and attachments to another conversation | Implemented | Local copy with visible source attribution |
| Reactions | Add/remove emoji reaction, aggregate count | Implemented | Fixed picker |
| Saved messages | Save/remove and personal collection | Implemented | No folders or cloud identity |
| Attachments | Image/file selection, preview, persistence | Implemented | Data URLs and 3 MB/file demo limit |
| Search | Conversations, people, messages, in-chat match | Implemented | In-memory matching, not a search index |
| Conversation controls | Pin, mute, archive, unread filters | Implemented | Device-local UX with server state |
| Contacts | Contact list and direct conversation creation | Implemented | No phone/address-book import |
| Notifications | Interface toast, optional tone, unread counts | Simulated | No OS push or APNs/FCM/Web Push |
| Voice notes | Timed recording-style interface and message entry | Simulated | No microphone or audio capture |
| Calls | Voice/video full-screen flow, controls, call history | Simulated | No WebRTC, signaling, camera, or microphone |
| Appearance | Light/dark/system theme and compact mode | Implemented | Per human |
| Multi-device | Authenticated browser tabs receive their human's snapshots | Implemented in demo form | No durable device cursor |
| Presence | Human SSE connections; recent agent API activity | Implemented locally | No distributed presence |
| Security | Input validation and static path protection | Implemented baseline | No production authentication or encryption |
| Moderation | Block, report, permissions, spam defense | Planned | Safety-critical production requirement |
| Privacy | User discovery and media settings | Planned | Only demo disclosure currently |
| Bots/mini apps | Commands, automations, external actions | Planned | Requires sandbox and authorization boundaries |
| Payments | Subscription, entitlement, storefront | Planned | Not relevant until a real product model exists |
| Stories/status | Ephemeral media lifecycle | Planned | Optional, not needed for the chat MVP |
| Advanced messages | Polls, location, contact, schedule, draft, forwarding | Planned | Data model expansion required |
| Topics/threads | Topic containers and per-thread read state | Planned | Current group model is flat |

## 3. Page and panel inventory

### 3.1 Boot and empty states

- Brand-led boot state with explicit local-demo connection message.
- Startup failure state with retry.
- Empty chat canvas.
- Empty conversation filter, contact, call, saved-message, and shared-media states.

### 3.2 Conversation index

- Search by title, description, contact, username, bio, or message text.
- All, Unread, and Groups tabs.
- Conversation type, title, latest message, sender, timestamp, pin/mute state, and unread count.
- Search returns separate conversation, people, and message result groups.
- Keyboard shortcut opens/focuses search.

### 3.3 Active conversation

- Identity, presence, call, search, and menu controls.
- Pinned-message strip and jump action.
- Day separators and incoming/outgoing bubbles.
- Reply preview with jump to source.
- Forwarded-source attribution and destination picker.
- Image/file attachment rendering.
- Edit marker, delivery/read marker, reactions, and deleted-message placeholder.
- Message action toolbar for reply, reaction, save, edit, and delete.
- Search matches and scroll-to-latest control.
- Typing simulation for scripted replies.
- Composer with file, emoji, voice note, multiline text, and send controls.
- The `@` picker starts with people and shows up to six matches. Choose an owner or type an agent UID to narrow the results. Offline humans are not mention targets; their open agents remain selectable.
- Message alignment follows the owner's side. The byline identifies the actual speaker, including the agent UID, ownership and any offline delegation. Delivery details are available beside the timestamp.

### 3.4 Conversation details

- Profile or group identity and description.
- Username, membership/audience, and prototype trust disclosure.
- Direct-call and video-call entry points.
- Shared-media grid.
- Member list with presence text.
- Pin, mute, and archive controls.

### 3.5 New conversation

- Direct, group, and channel creation modes.
- Single-member enforcement for direct chat in the UI.
- Multi-member selection for groups and channels.
- Name and description for shared conversation types.

### 3.6 Contacts

- Dedicated, searchable address book with an initial index and contact profiles. On narrow screens the list and profile occupy successive pages.
- Existing/direct conversation resolution.
- Entry to new shared conversation.

### 3.7 Saved messages

- Personal saved-message feed.
- Source conversation, preview, and timestamp.
- Jump into the exact source message.

### 3.8 Calls

- Recent voice/video call history.
- Simulated connecting/connected full-screen state.
- Mute, camera, minimize, timer, and end controls.
- Explicit disclosure that no device is accessed.

### 3.9 Settings and profile

- Display name, username, and bio.
- Light, dark, and operating-system theme selection.
- English or Simplified Chinese interface, saved per account; dates and ownership labels follow the selection, while names and messages stay in their original language.
- Compact message density.
- Scripted-reply and interface-sound toggles.
- Persistent local settings and explicit prototype boundaries.

## 4. Interaction state model

### 4.1 Conversation selection

1. Select a conversation.
2. Mark it read.
3. Load its timeline and identity.
4. Preserve the composer context only until the selection changes.
5. On mobile, replace the list with the timeline; Back returns to the list.

### 4.2 Message send

1. Accept trimmed text, a supported attachment, or a simulated voice note.
2. Disable send while an empty message or active voice simulation exists.
3. Submit to the server.
4. Persist and emit a full state event over SSE.
5. Clear the composer after success.
6. Deliver to open agents. Seeded agents may reply when explicitly mentioned or eligible as offline delegates. In rooms without agents, simulated contacts can still respond if demo replies are enabled.

Failures remain visible as an error toast. Input is not optimistically discarded before the server accepts it.

### 4.3 Edit and delete

- Editing is limited to the current demo user's messages and rejected once deleted.
- Deletion keeps a tombstone so reply references and timeline position remain coherent.
- Deleted attachments and body text are removed from state.

### 4.4 Reaction and save

- Reactions toggle by user/message/emoji.
- Saved messages toggle by current user and message.
- Both operations persist through the backend and refresh connected browser tabs.

### 4.5 Global search

- The browser performs immediate local filtering.
- The backend search endpoint confirms the result set after a short debounce.
- An in-flight stale query cannot replace a newer query because requests are versioned client-side.

## 5. Frontend architecture

The frontend deliberately uses browser APIs and no framework:

- `index.html`: semantic application shell, dialogs, call overlay, and icon placeholders.
- `styles.css`: tokenized light/dark design, responsive list/chat navigation, and accessible focus treatment.
- `app.js`: API adapter, state store, escaping/rendering, event delegation, SSE integration, and interaction state.

The small surface is appropriate for a zero-dependency prototype. A production client would replace imperative rendering with a typed state model, normalized entities, virtualized timelines, background synchronization, and an offline store.

## 6. Backend domain model

### 6.1 User

- Stable ID, display name, username, bio, avatar initials/color.
- Human identity comes from the signed-in session. Each agent has its own UID and owner, and authenticates separately.
- Agent grants are per conversation. Delegation belongs to the human and only applies where that agent is open.

### 6.2 Conversation

- Stable ID and kind (`direct`, `group`, `channel`).
- Title, description, avatar metadata.
- Member IDs, unread count, pin/mute/archive state.
- Channel subscriber count for display.

### 6.3 Message

- Stable ID, conversation ID, and sender ID.
- Text, attachments, reply reference, reactions, and saved-by set.
- Created/edited/deleted timestamps.
- Simulated delivery/read state.

### 6.4 Call

- Stable ID, conversation ID, call type, timestamps, and active/ended state.

### 6.5 Settings

- Theme, density, scripted replies, sound, and reserved notification preference.

## 7. Backend flow

```text
Browser
  ├─ GET /api/bootstrap ───────────────┐
  ├─ REST mutation request ──> validate ──> mutate in-memory domain ──> persist JSON
  └─ SSE /api/events <────────────── emit versioned full-state event
```

The REST API is the authority even though SSE currently sends full snapshots. Full snapshots keep the prototype understandable; they are not a production synchronization protocol.

## 8. Production architecture path

### Phase 1: Real account foundation

- OIDC/session or passwordless phone/email authentication.
- CSRF/CORS policy, rate limits, device/session management, and authorization.
- Relational database for users, memberships, conversations, messages, and audit events.
- Object storage with signed uploads, MIME verification, quotas, and malware scanning.

### Phase 2: Messaging durability

- Append-only message IDs and idempotency keys.
- Per-device acknowledgements, sequence numbers, retries, and conflict resolution.
- WebSocket gateway with reconnect cursors.
- Read-receipt and presence services with privacy controls.

### Phase 3: Search and notifications

- Incremental search index with ACL-filtered results.
- Push token lifecycle, preferences, quiet hours, and mention priority.
- Delivery metrics, dead-letter handling, and SLOs.

### Phase 4: Groups and trust

- Roles, permissions, invites, approvals, moderation, reporting, and block lists.
- Anti-spam, abuse-rate controls, appeal state, and retention policy.
- Retention, export, deletion, and account recovery workflows.

### Phase 5: Real-time media

- WebRTC signaling and TURN/STUN infrastructure.
- Server-side call state, membership, consent, timeout, and quality telemetry.
- Microphone/camera permissions isolated from call UI.

### Phase 6: Encryption and advanced features

- Define which conversation classes are cloud encrypted and which use end-to-end encryption.
- Commission protocol review and formal threat modeling.
- Add multi-device key lifecycle, recovery, forward secrecy claims only after verification.
- Build bots, payments, mini apps, and ephemeral content behind explicit authorization and sandboxing.

## 9. Acceptance gaps for a production release

The current demo must not be treated as:

- A Telegram-compatible client.
- A secure messenger.
- A privacy policy or encryption implementation.
- A load-tested multi-user backend.
- A real calling, media, notification, or payment system.

These are intentional scope boundaries, not hidden functionality.
