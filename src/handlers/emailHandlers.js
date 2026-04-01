const uuid = require('../lib/uuid');
const parseBody = require('../lib/parseBody');
const search = require('../lib/search');
const config = require('../config');

function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function paginate(items, page, limit) {
  const total = items.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    total,
    page,
    totalPages,
  };
}

async function listEmails(req, res, store, params, query) {
  let emails = store.getEmails().slice();
  const folder = query.folder;
  const labelId = query.label;
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 50;

  if (folder === 'starred') {
    emails = emails.filter(e => e.starred && e.folder !== 'trash' && e.folder !== 'spam');
  } else if (folder === 'all') {
    emails = emails.filter(e => e.folder !== 'trash' && e.folder !== 'spam');
  } else if (folder) {
    emails = emails.filter(e => e.folder === folder);
  }

  if (labelId) {
    emails = emails.filter(e => (e.labels || []).includes(labelId));
  }

  emails.sort((a, b) => new Date(b.date) - new Date(a.date));

  const result = paginate(emails, page, limit);
  sendJSON(res, 200, {
    emails: result.items,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  });
}

async function getEmail(req, res, store, params) {
  const email = store.getEmails().find(e => e.id === params.id);
  if (!email) return sendJSON(res, 404, { error: 'Email not found' });

  // Get thread emails
  const thread = store.getEmails()
    .filter(e => e.threadId === email.threadId && e.id !== email.id)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  sendJSON(res, 200, { email, thread });
}

async function createEmail(req, res, store) {
  const { json } = await parseBody(req);
  const now = new Date().toISOString();
  const folder = json.folder || 'sent';

  const email = {
    id: json.id || uuid(),
    from: json.from || { name: config.userName, address: config.userEmail },
    to: json.to || [],
    cc: json.cc || [],
    bcc: json.bcc || [],
    subject: json.subject || '(no subject)',
    body: json.body || '',
    bodyText: json.bodyText || '',
    date: json.date || now,
    read: json.read !== undefined ? json.read : (folder === 'sent' || folder === 'drafts'),
    starred: json.starred || false,
    folder: folder,
    labels: json.labels || [],
    attachments: json.attachments || [],
    threadId: json.threadId || uuid(),
    inReplyTo: json.inReplyTo || null,
  };

  await store.addEmail(email);

  // Auto-add contacts from recipients when sending
  if (folder === 'sent') {
    const existing = new Set(store.getContacts().map(c => c.address));
    for (const r of [...(email.to || []), ...(email.cc || [])]) {
      if (r.address && !existing.has(r.address)) {
        await store.addContact({ id: uuid(), name: r.name || '', address: r.address });
        existing.add(r.address);
      }
    }
  }

  sendJSON(res, 201, { email });
}

async function updateEmail(req, res, store, params) {
  const { json } = await parseBody(req);
  const allowed = ['read', 'starred', 'folder', 'labels', 'subject', 'body', 'bodyText', 'to', 'cc', 'bcc', 'attachments'];
  const updates = {};
  for (const key of allowed) {
    if (json[key] !== undefined) updates[key] = json[key];
  }

  const email = await store.updateEmail(params.id, updates);
  if (!email) return sendJSON(res, 404, { error: 'Email not found' });
  sendJSON(res, 200, { email });
}

async function deleteEmail(req, res, store, params, query) {
  const email = store.getEmails().find(e => e.id === params.id);
  if (!email) return sendJSON(res, 404, { error: 'Email not found' });

  if (query.permanent === 'true' || email.folder === 'trash') {
    await store.deleteEmail(params.id);
  } else {
    await store.updateEmail(params.id, { folder: 'trash' });
  }
  sendJSON(res, 200, { success: true });
}

async function bulkAction(req, res, store) {
  const { json } = await parseBody(req);
  const { ids, action, labelId } = json;

  if (!ids || !Array.isArray(ids) || !action) {
    return sendJSON(res, 400, { error: 'ids and action required' });
  }

  const idSet = new Set(ids);
  const emails = store.getEmails();

  if (action === 'delete') {
    store.cache.emails = emails.filter(e => !idSet.has(e.id));
  } else {
    for (const email of emails) {
      if (!idSet.has(email.id)) continue;
      switch (action) {
        case 'read': email.read = true; break;
        case 'unread': email.read = false; break;
        case 'star': email.starred = true; break;
        case 'unstar': email.starred = false; break;
        case 'trash': email.folder = 'trash'; break;
        case 'spam': email.folder = 'spam'; break;
        case 'archive': email.folder = 'archive'; break;
        case 'inbox': email.folder = 'inbox'; break;
        case 'label':
          if (labelId && !(email.labels || []).includes(labelId)) {
            email.labels = [...(email.labels || []), labelId];
          }
          break;
        case 'unlabel':
          email.labels = (email.labels || []).filter(l => l !== labelId);
          break;
      }
    }
  }

  await store.persist();
  sendJSON(res, 200, { success: true });
}

async function replyEmail(req, res, store, params) {
  const original = store.getEmails().find(e => e.id === params.id);
  if (!original) return sendJSON(res, 404, { error: 'Email not found' });

  const { json } = await parseBody(req);
  const now = new Date().toISOString();

  let to;
  if (json.replyAll) {
    const seen = new Set([config.userEmail]);
    to = [];
    if (original.from && original.from.address && !seen.has(original.from.address)) {
      to.push(original.from);
      seen.add(original.from.address);
    }
    for (const r of [...(original.to || []), ...(original.cc || [])]) {
      if (r.address && !seen.has(r.address)) {
        to.push(r);
        seen.add(r.address);
      }
    }
  } else {
    to = original.from ? [original.from] : [];
  }

  const reply = {
    id: uuid(),
    from: { name: config.userName, address: config.userEmail },
    to,
    cc: [],
    bcc: [],
    subject: (original.subject || '').startsWith('Re:') ? original.subject : 'Re: ' + (original.subject || ''),
    body: json.body || '',
    bodyText: json.bodyText || '',
    date: now,
    read: true,
    starred: false,
    folder: 'sent',
    labels: [],
    attachments: json.attachments || [],
    threadId: original.threadId,
    inReplyTo: original.id,
  };

  await store.addEmail(reply);
  sendJSON(res, 201, { email: reply });
}

async function forwardEmail(req, res, store, params) {
  const original = store.getEmails().find(e => e.id === params.id);
  if (!original) return sendJSON(res, 404, { error: 'Email not found' });

  const { json } = await parseBody(req);
  const now = new Date().toISOString();

  const fwd = {
    id: uuid(),
    from: { name: config.userName, address: config.userEmail },
    to: json.to || [],
    cc: json.cc || [],
    bcc: [],
    subject: (original.subject || '').startsWith('Fwd:') ? original.subject : 'Fwd: ' + (original.subject || ''),
    body: json.body || '',
    bodyText: json.bodyText || '',
    date: now,
    read: true,
    starred: false,
    folder: 'sent',
    labels: [],
    attachments: original.attachments || [],
    threadId: uuid(),
    inReplyTo: null,
  };

  await store.addEmail(fwd);
  sendJSON(res, 201, { email: fwd });
}

async function searchEmails(req, res, store, params, query) {
  const q = query.q || '';
  let emails = store.getEmails().slice();
  emails = search(emails, q);
  emails.sort((a, b) => new Date(b.date) - new Date(a.date));
  sendJSON(res, 200, { emails });
}

async function getFolderCounts(req, res, store) {
  const emails = store.getEmails();
  const counts = { inbox: 0, starred: 0, sent: 0, drafts: 0, trash: 0, spam: 0, archive: 0 };

  for (const email of emails) {
    if (email.folder === 'inbox' && !email.read) counts.inbox++;
    if (email.folder === 'sent') counts.sent++;
    if (email.folder === 'drafts') counts.drafts++;
    if (email.folder === 'trash') counts.trash++;
    if (email.folder === 'spam') counts.spam++;
    if (email.folder === 'archive') counts.archive++;
    if (email.starred && email.folder !== 'trash' && email.folder !== 'spam') counts.starred++;
  }

  sendJSON(res, 200, counts);
}

module.exports = {
  listEmails,
  getEmail,
  createEmail,
  updateEmail,
  deleteEmail,
  bulkAction,
  replyEmail,
  forwardEmail,
  searchEmails,
  getFolderCounts,
};
