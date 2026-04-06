/* global fetch, confirm, navigator, WebSocket */

let currentConversationId = null;
let conversations = [];
let ws = null;
let streamingEl = null;

// DOM references
const conversationList = document.getElementById('conversation-list');
const chatTitle = document.getElementById('chat-title');
const titleEditInput = document.getElementById('title-edit-input');
const messagesContainer = document.getElementById('messages');
const inputArea = document.getElementById('input-area');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const settingsBtn = document.getElementById('settings-btn');
const deleteChatBtn = document.getElementById('delete-chat-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const saveSettingsBtn = document.getElementById('save-settings');
const modalOverlay = document.getElementById('modal-overlay');
const systemPromptInput = document.getElementById('system-prompt');
const modelSelect = document.getElementById('model-select');
const themeToggle = document.getElementById('theme-toggle');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', init);

async function init() {
  connectWS();
  await loadPreferences();
  await loadConversations();
  setupEvents();
}

function setupEvents() {
  newChatBtn.addEventListener('click', createNewConversation);
  sendBtn.addEventListener('click', sendMessage);

  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
  });

  chatTitle.addEventListener('click', startEditTitle);
  titleEditInput.addEventListener('blur', finishEditTitle);
  titleEditInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); titleEditInput.blur(); }
    if (e.key === 'Escape') { titleEditInput.value = chatTitle.textContent; titleEditInput.blur(); }
  });

  settingsBtn.addEventListener('click', openSettings);
  closeSettingsBtn.addEventListener('click', closeSettings);
  saveSettingsBtn.addEventListener('click', saveConversationSettings);
  modalOverlay.addEventListener('click', closeSettings);

  deleteChatBtn.addEventListener('click', deleteCurrentConversation);
  themeToggle.addEventListener('click', toggleTheme);

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
}

// ---------------------------------------------------------------------------
// WebSocket
// ---------------------------------------------------------------------------

function connectWS() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(proto + '//' + location.host + '/ws');

  ws.onopen = () => {
    document.body.setAttribute('data-ws', 'open');
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWSMessage(data);
  };

  ws.onclose = () => {
    document.body.removeAttribute('data-ws');
    ws = null;
    setTimeout(connectWS, 2000);
  };

  ws.onerror = () => {
    document.body.removeAttribute('data-ws');
  };
}

function handleWSMessage(data) {
  switch (data.type) {
    case 'user_message': {
      // Replace temp user + loading with real user message
      const tempEl = messagesContainer.querySelector('[data-id="temp-user"]');
      if (tempEl) tempEl.remove();
      const loading = messagesContainer.querySelector('.message.loading');
      if (loading) loading.remove();

      appendMessage(data.message);

      // Create streaming assistant placeholder
      streamingEl = document.createElement('div');
      streamingEl.className = 'message assistant streaming';
      streamingEl.dataset.id = 'streaming';

      const role = document.createElement('div');
      role.className = 'message-role';
      role.textContent = 'Assistant';

      const content = document.createElement('div');
      content.className = 'message-content';

      streamingEl.appendChild(role);
      streamingEl.appendChild(content);
      messagesContainer.appendChild(streamingEl);
      scrollToBottom();
      break;
    }

    case 'token': {
      if (streamingEl) {
        const contentEl = streamingEl.querySelector('.message-content');
        contentEl.textContent += data.content;
        scrollToBottom();
      }
      break;
    }

    case 'message_end': {
      if (streamingEl) {
        // Finalize: set real id, remove streaming class, add actions
        streamingEl.dataset.id = data.message.id;
        streamingEl.classList.remove('streaming');
        const contentEl = streamingEl.querySelector('.message-content');
        contentEl.textContent = data.message.content;
        addMessageActions(streamingEl, data.message);
        streamingEl = null;
      }
      sendBtn.disabled = false;
      messageInput.focus();
      loadConversations();
      break;
    }

    case 'error': {
      const loading = messagesContainer.querySelector('.message.loading');
      if (loading) loading.remove();
      showError(data.error);
      sendBtn.disabled = false;
      messageInput.focus();
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

async function api(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || 'Request failed');
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

async function loadConversations() {
  conversations = await api('/api/conversations');
  renderConversationList();
}

function renderConversationList() {
  conversationList.innerHTML = '';
  if (conversations.length === 0) {
    conversationList.innerHTML = '<p class="no-conversations">No conversations yet</p>';
    return;
  }
  for (const conv of conversations) {
    const item = document.createElement('div');
    item.className = 'conversation-item' + (conv.id === currentConversationId ? ' active' : '');
    item.dataset.id = conv.id;
    item.textContent = conv.title;
    item.addEventListener('click', () => {
      sidebar.classList.remove('open');
      selectConversation(conv.id);
    });
    conversationList.appendChild(item);
  }
}

async function createNewConversation() {
  const conv = await api('/api/conversations', {
    method: 'POST',
    body: JSON.stringify({ title: 'New Conversation' }),
  });
  await loadConversations();
  await selectConversation(conv.id);
}

async function selectConversation(id) {
  currentConversationId = id;
  const data = await api('/api/conversations/' + id);

  chatTitle.textContent = data.title;
  inputArea.style.display = 'flex';
  settingsBtn.style.display = 'block';
  deleteChatBtn.style.display = 'block';

  renderMessages(data.messages || []);
  renderConversationList();
  messageInput.focus();
}

async function deleteCurrentConversation() {
  if (!currentConversationId) return;
  if (!confirm('Delete this conversation?')) return;

  await api('/api/conversations/' + currentConversationId, { method: 'DELETE' });
  currentConversationId = null;
  chatTitle.textContent = 'Select a conversation';
  inputArea.style.display = 'none';
  settingsBtn.style.display = 'none';
  deleteChatBtn.style.display = 'none';
  messagesContainer.innerHTML = '<div class="empty-state"><p>Start a new conversation or select one from the sidebar.</p></div>';
  await loadConversations();
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

function renderMessages(messages) {
  messagesContainer.innerHTML = '';
  if (messages.length === 0) {
    messagesContainer.innerHTML = '<div class="empty-state"><p>Send a message to start the conversation.</p></div>';
    return;
  }
  for (const msg of messages) {
    appendMessage(msg);
  }
  scrollToBottom();
}

function appendMessage(msg) {
  const div = document.createElement('div');
  div.className = 'message ' + msg.role;
  div.dataset.id = msg.id;

  const role = document.createElement('div');
  role.className = 'message-role';
  role.textContent = msg.role === 'user' ? 'You' : 'Assistant';

  const content = document.createElement('div');
  content.className = 'message-content';
  content.textContent = msg.content;

  div.appendChild(role);
  div.appendChild(content);
  addMessageActions(div, msg);
  messagesContainer.appendChild(div);
}

function addMessageActions(el, msg) {
  const actions = document.createElement('div');
  actions.className = 'message-actions';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn-icon btn-small';
  copyBtn.textContent = 'Copy';
  copyBtn.title = 'Copy message';
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(msg.content);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-icon btn-small btn-danger';
  deleteBtn.textContent = 'Delete';
  deleteBtn.title = 'Delete message';
  deleteBtn.addEventListener('click', () => deleteMsg(msg.id));

  actions.appendChild(copyBtn);
  actions.appendChild(deleteBtn);
  el.appendChild(actions);
}

async function sendMessage() {
  const content = messageInput.value.trim();
  if (!content || !currentConversationId) return;

  messageInput.value = '';
  messageInput.style.height = 'auto';
  sendBtn.disabled = true;

  // Remove empty state
  const empty = messagesContainer.querySelector('.empty-state');
  if (empty) empty.remove();

  // Optimistic user message
  appendMessage({ id: 'temp-user', role: 'user', content });
  scrollToBottom();

  // Loading indicator
  const loading = document.createElement('div');
  loading.className = 'message assistant loading';
  loading.innerHTML = '<div class="message-role">Assistant</div><div class="message-content typing">Thinking...</div>';
  messagesContainer.appendChild(loading);
  scrollToBottom();

  if (ws && ws.readyState === WebSocket.OPEN) {
    // Stream via WebSocket
    ws.send(JSON.stringify({
      type: 'message',
      conversationId: currentConversationId,
      content,
    }));
  } else {
    // HTTP fallback (no streaming)
    try {
      const result = await api('/api/conversations/' + currentConversationId + '/messages', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      const tempEl = messagesContainer.querySelector('[data-id="temp-user"]');
      if (tempEl) tempEl.remove();
      loading.remove();
      appendMessage(result.userMessage);
      appendMessage(result.assistantMessage);
      scrollToBottom();
      await loadConversations();
    } catch (err) {
      loading.remove();
      showError('Failed to send message: ' + err.message);
    } finally {
      sendBtn.disabled = false;
      messageInput.focus();
    }
  }
}

async function deleteMsg(messageId) {
  if (!currentConversationId) return;

  await api('/api/conversations/' + currentConversationId + '/messages/' + messageId, {
    method: 'DELETE',
  });

  const el = messagesContainer.querySelector('[data-id="' + messageId + '"]');
  if (el) el.remove();

  if (messagesContainer.children.length === 0) {
    messagesContainer.innerHTML = '<div class="empty-state"><p>Send a message to start the conversation.</p></div>';
  }
}

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showError(msg) {
  const div = document.createElement('div');
  div.className = 'message assistant';
  div.innerHTML = '<div class="message-role">System</div><div class="message-content" style="color:var(--danger)">' + escapeHtml(msg) + '</div>';
  messagesContainer.appendChild(div);
  scrollToBottom();
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ---------------------------------------------------------------------------
// Title editing
// ---------------------------------------------------------------------------

function startEditTitle() {
  if (!currentConversationId) return;
  titleEditInput.value = chatTitle.textContent;
  chatTitle.style.display = 'none';
  titleEditInput.style.display = 'block';
  titleEditInput.focus();
  titleEditInput.select();
}

async function finishEditTitle() {
  const newTitle = titleEditInput.value.trim() || chatTitle.textContent;
  titleEditInput.style.display = 'none';
  chatTitle.style.display = 'block';

  if (newTitle !== chatTitle.textContent) {
    chatTitle.textContent = newTitle;
    await api('/api/conversations/' + currentConversationId, {
      method: 'PUT',
      body: JSON.stringify({ title: newTitle }),
    });
    await loadConversations();
  }
}

// ---------------------------------------------------------------------------
// Settings modal
// ---------------------------------------------------------------------------

function openSettings() {
  if (!currentConversationId) return;
  const conv = conversations.find((c) => c.id === currentConversationId);
  if (!conv) return;

  systemPromptInput.value = conv.system_prompt;
  modelSelect.value = conv.model || 'mock';
  settingsModal.style.display = 'flex';
}

function closeSettings() {
  settingsModal.style.display = 'none';
}

async function saveConversationSettings() {
  if (!currentConversationId) return;

  await api('/api/conversations/' + currentConversationId, {
    method: 'PUT',
    body: JSON.stringify({
      system_prompt: systemPromptInput.value,
      model: modelSelect.value,
    }),
  });

  closeSettings();
  await loadConversations();
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

async function loadPreferences() {
  try {
    const prefs = await api('/api/preferences');
    if (prefs.theme === 'dark') {
      document.body.classList.add('dark');
    }
  } catch {
    // Preferences endpoint may not be available; ignore
  }
}

async function toggleTheme() {
  document.body.classList.toggle('dark');
  const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
  try {
    await api('/api/preferences', {
      method: 'PUT',
      body: JSON.stringify({ theme }),
    });
  } catch {
    // Ignore save failure
  }
}
