import { createServer } from 'node:http';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Store, HttpError } from './src/store.js';
import { agentConversation, agentSend, authenticate, history, manageAgent, participants, secret, sync } from './src/agents.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const publicDirectory = join(root, 'public');
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function sendJson(response, status, data) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify(data));
}

async function readJson(request, maxBytes = 5_000_000) {
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > maxBytes) throw new HttpError(413, 'Request body is too large');
    chunks.push(chunk);
  }
  if (!length) return {};
  let value;
  try {
    value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON');
  }
  if (!value || Array.isArray(value) || typeof value !== 'object') throw new HttpError(400, 'Expected a JSON object');
  return value;
}

async function serveStatic(response, pathname) {
  let requestedPath;
  try {
    requestedPath = pathname === '/' ? 'index.html' : decodeURIComponent(pathname.slice(1));
  } catch {
    throw new HttpError(400, 'Invalid URL encoding');
  }
  const filePath = resolve(publicDirectory, requestedPath);
  const relativePath = relative(resolve(publicDirectory), filePath);
  if (relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
    throw new HttpError(403, 'Invalid path');
  }
  let fileStat;
  try {
    fileStat = await stat(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') throw new HttpError(404, 'Not found');
    throw error;
  }
  if (!fileStat.isFile()) throw new HttpError(404, 'Not found');
  const body = await readFile(filePath);
  response.writeHead(200, {
    'content-type': contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
    'content-length': body.length,
    'cache-control': ['.html', '.js', '.css'].includes(extname(filePath)) ? 'no-cache' : 'public, max-age=3600',
    'x-content-type-options': 'nosniff',
  });
  response.end(body);
}

function createEventStream(request, response, store) {
  const uid = store.viewer;
  store.connections.set(uid, (store.connections.get(uid) || 0) + 1);
  response.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
  });
  response.write(`event: ready\ndata: ${JSON.stringify({ connectedAt: new Date().toISOString() })}\n\n`);
  const unsubscribe = store.subscribe((event) => {
    const state = store.snapshot(uid);
    const m = event.type === 'message.created' && state.messages.find((v) => v.id === event.payload?.id);
    response.write(`event: state\ndata: ${JSON.stringify({ type: m ? event.type : 'refresh', state,
      payload: m ? { id: m.id, conversationId: m.conversationId, senderId: m.senderId } : null })}\n\n`);
  });
  store.emit('presence');
  const heartbeat = setInterval(() => response.write(': heartbeat\n\n'), 20_000);
  heartbeat.unref?.();
  request.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    store.connections.set(uid, store.connections.get(uid) - 1);
    store.emit('presence');
  });
}

async function handleAgent(request, response, url, store) {
  const path = url.pathname.slice('/api/agent/v1'.length);
  const auth = request.headers.authorization;
  const a = authenticate(store, auth);
  store.lastAgentSeen.set(a.uid, Date.now());
  if (path === '/sync' && request.method === 'GET') {
    const controller = new AbortController();
    response.once('close', () => controller.abort());
    const batch = await sync(store, auth, url.searchParams, controller.signal);
    if (!response.destroyed) sendJson(response, 200, batch);
    return;
  }
  const match = /^\/conversations\/([^/]+)\/(messages|participants)$/.exec(path);
  if (!match) throw new HttpError(404, 'Unknown agent endpoint');
  const id = match[1];
  if (request.method === 'GET') {
    const c = agentConversation(store, a, id);
    return sendJson(response, 200, match[2] === 'messages' ? history(store, a, c, url.searchParams) : participants(store, c, url.searchParams));
  }
  if (request.method === 'POST' && match[2] === 'messages') {
    const input = await readJson(request, 32_000);
    authenticate(store, auth);
    const result = await agentSend(store, a, agentConversation(store, a, id), input);
    return sendJson(response, result.replay ? 200 : 201, result);
  }
  throw new HttpError(405, 'Method not supported');
}

async function handleApi(request, response, url, store, session) {
  const pathname = url.pathname;
  const method = request.method || 'GET';
  if (pathname === '/api/agents' && method === 'POST') {
    return sendJson(response, 200, await manageAgent(store, store.viewer, await readJson(request, 4096)));
  }
  const access = pathname.match(/^\/api\/conversations\/([^/]+)\/agents$/);
  if (access && method === 'PATCH') {
    await store.setAccess(access[1], await readJson(request, 16_384));
    return sendJson(response, 200, { ok: true });
  }

  if (pathname === '/api/bootstrap' && method === 'GET') {
    return sendJson(response, 200, store.snapshot());
  }
  if (pathname === '/api/events' && method === 'GET') {
    session.streams.add(response);
    response.once('close', () => session.streams.delete(response));
    return createEventStream(request, response, store);
  }
  if (pathname === '/api/search' && method === 'GET') {
    return sendJson(response, 200, store.search(url.searchParams.get('q')));
  }

  const messageCollection = pathname.match(/^\/api\/conversations\/([^/]+)\/messages$/);
  if (messageCollection && method === 'POST') {
    const body = await readJson(request);
    const message = await store.sendMessage(decodeURIComponent(messageCollection[1]), body);
    return sendJson(response, 201, { message: store.humanMessage(message) });
  }

  const conversationRoute = pathname.match(/^\/api\/conversations\/([^/]+)$/);
  if (conversationRoute && method === 'PATCH') {
    const body = await readJson(request);
    const conversation = await store.updateConversation(
      decodeURIComponent(conversationRoute[1]),
      body,
    );
    return sendJson(response, 200, { conversation });
  }

  if (pathname === '/api/conversations' && method === 'POST') {
    const conversation = await store.createConversation(await readJson(request));
    return sendJson(response, 201, { conversation });
  }

  const messageRoute = pathname.match(/^\/api\/messages\/([^/]+)$/);
  if (messageRoute && method === 'PATCH') {
    const body = await readJson(request);
    const message = await store.editMessage(decodeURIComponent(messageRoute[1]), body.text, body.mentions);
    return sendJson(response, 200, { message: store.humanMessage(message) });
  }
  if (messageRoute && method === 'DELETE') {
    const result = await store.deleteMessage(decodeURIComponent(messageRoute[1]));
    return sendJson(response, 200, result);
  }

  const forwardRoute = pathname.match(/^\/api\/messages\/([^/]+)\/forward$/);
  if (forwardRoute && method === 'POST') {
    const body = await readJson(request);
    const message = await store.forwardMessage(
      decodeURIComponent(forwardRoute[1]),
      body.conversationId,
    );
    return sendJson(response, 201, { message: store.humanMessage(message) });
  }

  const reactionRoute = pathname.match(/^\/api\/messages\/([^/]+)\/reactions$/);
  if (reactionRoute && method === 'POST') {
    const body = await readJson(request);
    const message = await store.toggleReaction(decodeURIComponent(reactionRoute[1]), body.emoji);
    return sendJson(response, 200, { message: store.humanMessage(message) });
  }
  const savedRoute = pathname.match(/^\/api\/messages\/([^/]+)\/save$/);
  if (savedRoute && method === 'POST') {
    const message = await store.toggleSaved(decodeURIComponent(savedRoute[1]));
    return sendJson(response, 200, { message: store.humanMessage(message) });
  }

  if (pathname === '/api/profile' && method === 'PATCH') {
    const user = await store.updateProfile(await readJson(request));
    return sendJson(response, 200, { user });
  }
  if (pathname === '/api/settings' && method === 'PATCH') {
    const settings = await store.updateSettings(await readJson(request));
    return sendJson(response, 200, { settings });
  }
  if (pathname === '/api/calls' && method === 'POST') {
    const body = await readJson(request);
    const call = await store.startCall(body.conversationId, body.type);
    return sendJson(response, 201, { call });
  }

  const callRoute = pathname.match(/^\/api\/calls\/([^/]+)\/end$/);
  if (callRoute && method === 'POST') {
    const call = await store.endCall(decodeURIComponent(callRoute[1]));
    return sendJson(response, 200, { call });
  }

  throw new HttpError(404, 'API route not found');
}

export async function createApp(options = {}) {
  const store =
    options.store ||
    new Store({
      dataFile: options.dataFile || join(root, 'data', 'weyuna-state.json'),
      demoReplies: options.demoReplies,
      replyDelay: options.replyDelay,
    });
  await store.init();
  const loginKeys = options.loginKeys || { ava: secret(), mia: secret() };
  store.humanAccounts = new Set(Object.keys(loginKeys));
  const cookieName = `weyuna_${secret().slice(0, 10)}`;
  const sessions = new Map();
  const demoAutoLogin = options.demoAutoLogin || null;
  if (demoAutoLogin && !Object.hasOwn(loginKeys, demoAutoLogin)) throw new Error('Demo auto-login must name a configured local human');
  const endSession = (id) => {
    const session = sessions.get(id);
    if (!session) return;
    clearTimeout(session.timer);
    sessions.delete(id);
    for (const stream of session.streams) stream.end();
  };

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || '/', 'http://localhost');
      if (url.pathname.startsWith('/api/')) {
        if (url.pathname === '/api/health' && request.method === 'GET') return sendJson(response, 200, { ok: true, mode: 'demo', agentApi: 'v1' });
        if (url.pathname.startsWith('/api/agent/v1/')) return await handleAgent(request, response, url, store);
        if (request.headers.authorization) throw new HttpError(403, 'Use the agent API with agent credentials');
        if (request.method !== 'GET' && request.headers.origin && request.headers.origin !== `http://${request.headers.host}`) {
          throw new HttpError(403, 'Cross-origin write denied');
        }
        const cookie = (request.headers.cookie || '').split(';').map((v) => v.trim()).find((v) => v.startsWith(`${cookieName}=`));
        const id = cookie?.slice(cookieName.length + 1);
        if (url.pathname === '/api/demo-login' && request.method === 'GET') {
          const host = new URL(`http://${request.headers.host}`).hostname;
          if (!demoAutoLogin || !['127.0.0.1', 'localhost', '::1'].includes(host) ||
              !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress)) {
            throw new HttpError(404, 'Not found');
          }
          const existing = sessions.get(id);
          if (existing?.uid !== demoAutoLogin) {
            endSession(id);
            const token = secret();
            const timer = setTimeout(() => endSession(token), 43_200_000).unref();
            sessions.set(token, { uid: demoAutoLogin, streams: new Set(), timer });
            response.setHeader('Set-Cookie', `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=43200`);
          }
          response.writeHead(302, { location: '/', 'cache-control': 'no-store' });
          return response.end();
        }
        if (url.pathname === '/api/login' && request.method === 'POST') {
          const { key } = await readJson(request, 512);
          const entry = Object.entries(loginKeys).find(([, v]) => v === key);
          if (!entry) throw new HttpError(401, 'Invalid local sign-in key');
          endSession(id);
          const token = secret();
          const timer = setTimeout(() => endSession(token), 43_200_000).unref();
          sessions.set(token, { uid: entry[0], streams: new Set(), timer });
          response.setHeader('Set-Cookie', `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=43200`);
          return sendJson(response, 200, { uid: entry[0] });
        }
        const session = sessions.get(id);
        if (!session) throw new HttpError(401, 'Human sign-in required');
        if (url.pathname === '/api/logout' && request.method === 'POST') {
          endSession(id);
          response.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0`);
          return sendJson(response, 200, { ok: true });
        }
        await store.requestUser.run(session.uid, () => handleApi(request, response, url, store, session));
        return;
      }
      await serveStatic(response, url.pathname);
    } catch (error) {
      if (response.headersSent) {
        response.end();
        return;
      }
      const status = error instanceof HttpError ? error.status : 500;
      if (status >= 500) console.error(error);
      sendJson(response, status, {
        error: status >= 500 ? 'Internal server error' : error.message,
      });
    }
  });

  server.store = store;
  server.loginKeys = loginKeys;
  return server;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  const directory = resolve(process.env.WEYUNA_DATA_DIR || join(root, 'data'));
  const server = await createApp({ dataFile: join(directory, 'weyuna-state.json'),
    demoAutoLogin: process.env.WEYUNA_DEMO_AUTO_LOGIN });
  server.listen(port, host, async () => {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    for (const [uid, key] of Object.entries(server.loginKeys)) {
      await writeFile(join(directory, `${uid}-${server.address().port}.key`), key, { mode: 0o600 });
    }
    console.log(`Weyuna is available at http://${host}:${port}`);
    console.log(`Choose your local sign-in file in ${directory} (ava-${server.address().port}.key or mia-${server.address().port}.key).`);
  });
}
