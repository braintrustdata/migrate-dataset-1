import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { Store } from './lib/store.js';
import { generateAIResponse } from './lib/ai.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = parseInt(process.env.PORT || '3003', 10);
const DATA_DIR = process.env.DATA_DIR || './data';
const PUBLIC_DIR = join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const store = new Store(DATA_DIR);
await store.init();

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const { pathname } = url;
  const method = req.method;

  if (pathname.startsWith('/api/')) {
    try {
      const body = await readBody(req);
      const result = await handleAPI(pathname, method, body);
      sendJSON(res, result.status, result.data);
    } catch (err) {
      sendJSON(res, 500, { error: err.message });
    }
    return;
  }

  serveStatic(res, pathname);
});

// ---------------------------------------------------------------------------
// WebSocket (uses 'ws' for the handshake, streaming logic is ours)
// ---------------------------------------------------------------------------

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (pathname !== '/ws') {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    onWSConnection(ws);
  });
});

function onWSConnection(ws) {
  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'message') {
        await handleStreamMessage(ws, msg);
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', error: err.message }));
    }
  });
}

async function handleStreamMessage(ws, { conversationId, content }) {
  if (!content?.trim()) {
    ws.send(JSON.stringify({ type: 'error', error: 'Content is required' }));
    return;
  }

  const conv = await store.getConversation(conversationId);
  if (!conv) {
    ws.send(
      JSON.stringify({ type: 'error', error: 'Conversation not found' }),
    );
    return;
  }

  // Save user message and confirm
  const userMsg = await store.addMessage(conversationId, 'user', content);
  ws.send(JSON.stringify({ type: 'user_message', message: userMsg }));

  // Generate full AI response, then stream it token-by-token
  const messages = await store.listMessages(conversationId);
  const aiContent = generateAIResponse(messages, conv.system_prompt);
  const chunks = aiContent.match(/\S+|\s+/g) || [aiContent];

  for (const chunk of chunks) {
    if (ws.readyState !== 1) return; // 1 = OPEN
    ws.send(JSON.stringify({ type: 'token', content: chunk }));
    await new Promise((r) => setTimeout(r, 20));
  }

  // Persist the complete assistant message
  const assistantMsg = await store.addMessage(
    conversationId,
    'assistant',
    aiContent,
  );

  // Auto-title from first user message
  const userMessages = messages.filter((m) => m.role === 'user');
  if (userMessages.length <= 1 && conv.title === 'New Conversation') {
    const autoTitle =
      content.substring(0, 50) + (content.length > 50 ? '...' : '');
    await store.updateConversation(conversationId, { title: autoTitle });
  }

  ws.send(JSON.stringify({ type: 'message_end', message: assistantMsg }));
}

// ---------------------------------------------------------------------------

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// ---------------------------------------------------------------------------
// Static file serving
// ---------------------------------------------------------------------------

async function serveStatic(res, pathname) {
  let filePath = join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = join(filePath, 'index.html');
    const data = await readFile(filePath);
    const ext = extname(filePath);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}

// ---------------------------------------------------------------------------
// JSON helpers
// ---------------------------------------------------------------------------

function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.method === 'GET' || req.method === 'DELETE') {
      resolve(null);
      return;
    }
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : null);
      } catch {
        resolve(null);
      }
    });
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// API router
// ---------------------------------------------------------------------------

async function handleAPI(pathname, method, body) {
  // Test helpers
  if (pathname === '/api/__reset' && method === 'POST') {
    await store.reset();
    return { status: 200, data: { success: true } };
  }
  if (pathname === '/api/__seed/conversation' && method === 'POST') {
    const result = await store.seedConversation(body || {});
    return { status: 201, data: result };
  }

  // Preferences
  if (pathname === '/api/preferences' && method === 'GET') {
    return { status: 200, data: await store.getPreferences() };
  }
  if (pathname === '/api/preferences' && method === 'PUT') {
    return { status: 200, data: await store.updatePreferences(body) };
  }

  // Conversations list / create
  if (pathname === '/api/conversations' && method === 'GET') {
    return { status: 200, data: await store.listConversations() };
  }
  if (pathname === '/api/conversations' && method === 'POST') {
    const conv = await store.createConversation(body || {});
    return { status: 201, data: conv };
  }

  // Single conversation
  const convMatch = pathname.match(/^\/api\/conversations\/([^/]+)$/);
  if (convMatch) {
    const id = convMatch[1];
    if (method === 'GET') {
      const conv = await store.getConversation(id);
      if (!conv)
        return { status: 404, data: { error: 'Conversation not found' } };
      return { status: 200, data: conv };
    }
    if (method === 'PUT') {
      const conv = await store.updateConversation(id, body);
      if (!conv)
        return { status: 404, data: { error: 'Conversation not found' } };
      return { status: 200, data: conv };
    }
    if (method === 'DELETE') {
      await store.deleteConversation(id);
      return { status: 200, data: { success: true } };
    }
  }

  // Messages list / send
  const msgMatch = pathname.match(/^\/api\/conversations\/([^/]+)\/messages$/);
  if (msgMatch) {
    const conversationId = msgMatch[1];
    if (method === 'GET') {
      return { status: 200, data: await store.listMessages(conversationId) };
    }
    if (method === 'POST') {
      return handleSendMessage(conversationId, body);
    }
  }

  // Single message delete
  const msgDel = pathname.match(
    /^\/api\/conversations\/([^/]+)\/messages\/([^/]+)$/,
  );
  if (msgDel && method === 'DELETE') {
    await store.deleteMessage(msgDel[1], msgDel[2]);
    return { status: 200, data: { success: true } };
  }

  return { status: 404, data: { error: 'Not found' } };
}

// ---------------------------------------------------------------------------
// Send message + AI response (HTTP fallback, non-streaming)
// ---------------------------------------------------------------------------

async function handleSendMessage(conversationId, body) {
  if (!body?.content?.trim()) {
    return { status: 400, data: { error: 'Content is required' } };
  }

  const conv = await store.getConversation(conversationId);
  if (!conv) {
    return { status: 404, data: { error: 'Conversation not found' } };
  }

  // Save user message
  const userMsg = await store.addMessage(conversationId, 'user', body.content);

  // Build history and generate AI reply
  const messages = await store.listMessages(conversationId);
  const aiContent = generateAIResponse(messages, conv.system_prompt);
  const assistantMsg = await store.addMessage(
    conversationId,
    'assistant',
    aiContent,
  );

  // Auto-title from first user message
  const userMessages = messages.filter((m) => m.role === 'user');
  if (userMessages.length <= 1) {
    const autoTitle =
      body.content.substring(0, 50) + (body.content.length > 50 ? '...' : '');
    if (conv.title === 'New Conversation') {
      await store.updateConversation(conversationId, { title: autoTitle });
    }
  }

  return {
    status: 201,
    data: { userMessage: userMsg, assistantMessage: assistantMsg },
  };
}
