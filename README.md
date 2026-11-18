# Weyuna

Weyuna is a runnable, Telegram-inspired messaging product simulation. It provides an original web interface and a dependency-free Node.js backend for exploring messenger workflows without connecting to Telegram or reproducing Telegram's private client/server implementation.

## 1. What works

- Responsive desktop and mobile conversation shell.
- Direct conversations, groups, and channels.
- Sending, replying, forwarding, editing, deleting, saving, and reacting to messages.
- Image/file attachment upload as local data URLs up to 3 MB per file.
- Global and in-conversation search.
- Unread, pinned, muted, and archived conversation states.
- Contacts, call history, profile editing, appearance settings, and message filters.
- In **Settings > Language**, choose English or Simplified Chinese. The choice is saved per account and takes effect immediately, including dates and agent labels. Names, message bodies, and drafts keep their original text.
- Simulated voice notes, voice calls, and video calls.
- Local persistence and Server-Sent Events (SSE) updates between browser tabs.
- Scripted direct/group replies for demonstrations.
- Multiple agent accounts per human, per-chat sharing, structured mentions and an offline delegate. Agents connect with their own credentials and appear as the authors of their replies.

The backend is intentionally a local single-process demo. It does not authenticate real people, perform phone verification, access a microphone/camera, provide end-to-end encryption, or call Telegram.

## 2. Run

Requirements:

- Node.js 20 or newer.
- No package installation is required.

```bash
npm start
```

Open `http://127.0.0.1:3000`. Choose the `ava-3000.key` or `mia-3000.key` file in the directory printed by the server. These local keys are private and change when the server restarts. For an unattended local preview, set `$env:WEYUNA_DEMO_AUTO_LOGIN='ava'` before `npm start`, then open `http://127.0.0.1:3000/api/demo-login`; the shortcut is accepted only from a loopback browser. Turn it off when sharing the server with anyone else. To keep both people online at once, use two independent browser profiles. Sign out in Settings or close all of a person's connected tabs to take them offline.

For development with automatic server restart:

```bash
npm run dev
```

Use a different port when needed:

```bash
PORT=3091 npm start
```

On PowerShell:

```powershell
$env:PORT='3091'
$env:WEYUNA_DATA_DIR='data\agent-preview'
npm start
```

### Try a conversation with agents

1. With fresh demo data, sign in as Ava and open **Mia Laurent**. Select **Try a mention**, then send. `mia/dots` signs the reply. The information button beside the question's timestamp shows that `mia/dots` was mentioned and `mia/duvet` had context. Both seeded accounts use the same local script.
2. With Mia offline, send a new question ending in `?` without a mention. Her chosen delegate `mia/dots` answers in the direct chat. In **Product Studio**, Ava controls the separate **Allow offline delegates** switch under **Agents**. Explicit mentions work with the switch off.
3. To connect your own client, use **Settings > My agents** to create an account. Copy its token when shown. In the desired chat, open **Agents**, select your account and save. Newly bound accounts start with no chat access.
4. Start the [example client](./examples/reply-once.js) in another terminal. In PowerShell, run ` $env:WEYUNA_AGENT_TOKEN = [System.Net.NetworkCredential]::new('', (Read-Host 'Agent token' -AsSecureString)).Password `, then `node examples/reply-once.js`. Set `PORT` to the server's port if it is not 3000. Once the client prints `Listening`, select its account with the composer's `@` button and send a message. The client replies once with the conversation type and timestamp, then exits. Clear the variable with `Remove-Item Env:\WEYUNA_AGENT_TOKEN`.

The [agent API](./docs/API.md#agent-api-v1) also supports clients that decide for themselves when an offline delegation warrants a reply. Weyuna does not assign tasks based on an agent's name.

## 3. Verify

```bash
npm run check
npm test
```

The integration tests use isolated servers for the human API and separate Bearer clients. They check per-agent delivery, permissions, history, retries, token rotation, revocation and offline delegation alongside the chat workflows.

## 4. Useful interactions

- `Enter`: send the current message.
- `Shift + Enter`: add a line break.
- `Ctrl/Cmd + K`: focus conversation search.
- Contacts opens a separate address book. Search by name or username, jump to an initial, then select a profile and choose Send message. Back returns to the previous page.
- In the composer, type `@` to find a person. Choose their name to see their open agents, or type the agent name or full UID directly. The picker shows at most six matches; use the arrow keys and Enter to choose, or Escape to dismiss.
- Messages from your agents appear on your side with the actual UID and **Your agent** label. Replies made under offline delegation also carry **Offline delegate**.
- Hover a message: reply, react, save, edit, or delete it.
- Use Forward: choose a direct conversation, group, or channel as the destination.
- Click the conversation title: open details, members, shared media, and notification controls.
- Use the paperclip: attach a local file.
- Use the microphone: create a simulated voice note.
- Use Calls: inspect history or resume a minimized simulated call.

## 5. Project structure

```text
.
├── public/
│   ├── assets/        # Original demo assets
│   ├── app.js         # Browser state, rendering, and interactions
│   ├── index.html     # Application shell and accessible controls
│   └── styles.css     # Desktop, mobile, light, and dark presentation
├── src/
│   ├── agents.js      # Agent identities, grants, journal, cursors and reply rules
│   └── store.js       # Domain rules, validation, seeding, and persistence
├── examples/reply-once.js # Standalone agent client using sync and send
├── tests/
│   ├── agents.test.js # Human/agent HTTP integration cases
│   └── server.test.js # HTTP/domain integration coverage
├── docs/
│   ├── API.md
│   └── PRODUCT_MAP.md
├── server.js          # Static server, REST endpoints, and SSE
├── PROJECT_STATE.md   # Current delivery state and next steps
└── package.json
```

## 6. Persistence

The first run creates `data/weyuna-state.json`. Set `WEYUNA_DATA_DIR` to a separate private, empty directory to try the seeded scenario without changing existing conversations. Existing histories acquire message sequence numbers on upgrade; no agent gains access to them automatically. Keep the data directory and sign-in files outside `public/` and out of Git.

The JSON store is serialized through one process-level write queue. It is suitable for a single-user prototype, not for concurrent production traffic, multi-instance deployment, or authoritative data.

## 7. Product scope

[`docs/PRODUCT_MAP.md`](./docs/PRODUCT_MAP.md) records:

- The complete feature model and implementation status.
- Page inventory and interaction states.
- Frontend domain and backend entities.
- Production architecture boundaries.
- A staged path from prototype to a real messaging service.

[`docs/API.md`](./docs/API.md) documents the implemented endpoints and event contract.

## 8. Production boundaries

Before using this with real users, replace the demo identity and JSON file with verified authentication, authorization, a durable database, a real media service, moderation/reporting, observability, rate limits, and a reviewed threat model. WebRTC, push notifications, multi-device synchronization, and any encryption claims require their own implementation and security validation.

This project is not affiliated with or endorsed by Telegram. It does not inspect Telegram traffic, bypass protections, use private assets, or reproduce Telegram credentials and protocols.
