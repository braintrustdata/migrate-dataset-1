export class Store {
  constructor() {
    this.db = { conversations: [], messages: [], preferences: {} };
  }

  async init() {}

  // -- Conversations --

  async listConversations() {
    return [...this.db.conversations].sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
    );
  }

  async createConversation({ title, system_prompt, model } = {}) {
    const conv = {
      id: crypto.randomUUID(),
      title: title || 'New Conversation',
      system_prompt: system_prompt || 'You are a helpful assistant.',
      model: model || 'mock',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.db.conversations.push(conv);
    return conv;
  }

  async getConversation(id) {
    const conv = this.db.conversations.find((c) => c.id === id);
    if (!conv) return null;
    const messages = this.db.messages
      .filter((m) => m.conversation_id === id)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return { ...conv, messages };
  }

  async updateConversation(id, updates) {
    const conv = this.db.conversations.find((c) => c.id === id);
    if (!conv) return null;
    if (updates.title !== undefined) conv.title = updates.title;
    if (updates.system_prompt !== undefined)
      conv.system_prompt = updates.system_prompt;
    if (updates.model !== undefined) conv.model = updates.model;
    conv.updated_at = new Date().toISOString();
    return { ...conv };
  }

  async deleteConversation(id) {
    this.db.conversations = this.db.conversations.filter((c) => c.id !== id);
    this.db.messages = this.db.messages.filter(
      (m) => m.conversation_id !== id,
    );
  }

  // -- Messages --

  async listMessages(conversationId) {
    return this.db.messages
      .filter((m) => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  async addMessage(conversationId, role, content) {
    const msg = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      role,
      content,
      created_at: new Date().toISOString(),
    };
    this.db.messages.push(msg);

    const conv = this.db.conversations.find(
      (c) => c.id === conversationId,
    );
    if (conv) conv.updated_at = new Date().toISOString();

    return msg;
  }

  async deleteMessage(conversationId, messageId) {
    this.db.messages = this.db.messages.filter(
      (m) => !(m.id === messageId && m.conversation_id === conversationId),
    );
  }

  // -- Preferences --

  async getPreferences() {
    return (
      this.db.preferences || {
        theme: 'light',
        default_system_prompt: 'You are a helpful assistant.',
      }
    );
  }

  async updatePreferences(updates) {
    this.db.preferences = { ...this.db.preferences, ...updates };
    return this.db.preferences;
  }

  // -- Test helpers --

  async reset() {
    this.db = { conversations: [], messages: [], preferences: {} };
  }

  async seedConversation(data = {}) {
    const id = data.id || crypto.randomUUID();
    const conv = {
      id,
      title: data.title || 'Test Conversation',
      system_prompt: data.system_prompt || 'You are a helpful assistant.',
      model: data.model || 'mock',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.db.conversations.push(conv);

    for (const msg of data.messages || []) {
      this.db.messages.push({
        id: msg.id || crypto.randomUUID(),
        conversation_id: id,
        role: msg.role,
        content: msg.content,
        created_at: new Date().toISOString(),
      });
    }

    return { id, title: conv.title };
  }
}
