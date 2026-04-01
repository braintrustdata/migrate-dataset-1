/**
 * API client module for Gmail Clone
 */
const API = (() => {
  const BASE = '/api';

  async function request(method, path, body, isFormData) {
    const opts = {
      method,
      headers: {},
    };
    if (body && !isFormData) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    } else if (body && isFormData) {
      opts.body = body;
    }
    const res = await fetch(`${BASE}${path}`, opts);
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const j = await res.json(); msg = j.error || msg; } catch(e) {}
      throw new Error(msg);
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return res.json();
    }
    return res;
  }

  return {
    // Emails
    getEmails(params = {}) {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') qs.set(k, v);
      });
      return request('GET', `/emails?${qs}`);
    },

    getEmail(id) {
      return request('GET', `/emails/${encodeURIComponent(id)}`);
    },

    createEmail(data) {
      return request('POST', '/emails', data);
    },

    updateEmail(id, data) {
      return request('PUT', `/emails/${encodeURIComponent(id)}`, data);
    },

    deleteEmail(id, permanent = false) {
      const qs = permanent ? '?permanent=true' : '';
      return request('DELETE', `/emails/${encodeURIComponent(id)}${qs}`);
    },

    bulkAction(ids, action, labelId) {
      const body = { ids, action };
      if (labelId) body.labelId = labelId;
      return request('POST', '/emails/bulk', body);
    },

    replyToEmail(id, data) {
      return request('POST', `/emails/${encodeURIComponent(id)}/reply`, data);
    },

    forwardEmail(id, data) {
      return request('POST', `/emails/${encodeURIComponent(id)}/forward`, data);
    },

    // Search
    search(q) {
      return request('GET', `/search?q=${encodeURIComponent(q)}`);
    },

    // Folders
    getFolderCounts() {
      return request('GET', '/folders/counts');
    },

    // Labels
    getLabels() {
      return request('GET', '/labels');
    },

    createLabel(data) {
      return request('POST', '/labels', data);
    },

    updateLabel(id, data) {
      return request('PUT', `/labels/${encodeURIComponent(id)}`, data);
    },

    deleteLabel(id) {
      return request('DELETE', `/labels/${encodeURIComponent(id)}`);
    },

    // Contacts
    getContacts(q = '') {
      const qs = q ? `?q=${encodeURIComponent(q)}` : '';
      return request('GET', `/contacts${qs}`);
    },

    createContact(data) {
      return request('POST', '/contacts', data);
    },

    deleteContact(id) {
      return request('DELETE', `/contacts/${encodeURIComponent(id)}`);
    },

    // Attachments
    uploadAttachment(file) {
      const fd = new FormData();
      fd.append('file', file);
      return request('POST', '/attachments', fd, true);
    },

    getAttachmentUrl(id) {
      return `${BASE}/attachments/${encodeURIComponent(id)}`;
    },

    // Reset
    reset() {
      return request('POST', '/reset');
    },
  };
})();
