import { Store } from '../lib/store.js';
import { generateAIResponse } from '../lib/ai.js';

const store = new Store();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // WebSocket upgrade
    if (pathname === '/ws') {
      const upgrade = request.headers.get('Upgrade');
      if (!upgrade || upgrade.toLowerCase() !== 'websocket') {
        return new Response('Expected Upgrade: websocket', { status: 426 });
      }

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();
      handleWSConnection(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    // API routes
    if (pathname.startsWith('/api/')) {
      try {
        let body = null;
        if (method !== 'GET' && method !== 'DELETE') {
          try {
            body = await request.json();
          } catch {
            body = null;
          }
        }
        const result = await handleAPI(pathname, method, body);
        return new Response(JSON.stringify(result.data), {
          status: result.status,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Static assets
    return env.ASSETS.fetch(request);
  },
};

// ---------------------------------------------------------------------------
// WebSocket
// ---------------------------------------------------------------------------

function handleWSConnection(server) {
  server.addEventListener('message', async (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'message') {
        await handleStreamMessage(server, msg);
      }
    } catch (err) {
      server.send(JSON.stringify({ type: 'error', error: err.message }));
    }
  });
}

async function handleStreamMessage(server, { conversationId, content }) {
  if (!content?.trim()) {
    server.send(
      JSON.stringify({ type: 'error', error: 'Content is required' }),
    );
    return;
  }

  const conv = await store.getConversation(conversationId);
  if (!conv) {
    server.send(
      JSON.stringify({ type: 'error', error: 'Conversation not found' }),
    );
    return;
  }

  // Save user message and confirm
  const userMsg = await store.addMessage(conversationId, 'user', content);
  server.send(JSON.stringify({ type: 'user_message', message: userMsg }));

  // Generate full AI response, then stream it token-by-token
  const messages = await store.listMessages(conversationId);
  const aiContent = generateAIResponse(messages, conv.system_prompt);
  const chunks = aiContent.match(/\S+|\s+/g) || [aiContent];

  for (const chunk of chunks) {
    if (server.readyState !== 1) return;
    server.send(JSON.stringify({ type: 'token', content: chunk }));
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

  server.send(JSON.stringify({ type: 'message_end', message: assistantMsg }));
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
