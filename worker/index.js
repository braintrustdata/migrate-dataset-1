const Router = require('../src/router');
const Store = require('../src/store');
const emailHandlers = require('../src/handlers/emailHandlers');
const labelHandlers = require('../src/handlers/labelHandlers');
const contactHandlers = require('../src/handlers/contactHandlers');
const attachmentHandlers = require('../src/handlers/attachmentHandlers');
const parseBody = require('../src/lib/parseBody');
const uuid = require('../src/lib/uuid');

// Module-level singleton — persists across requests within the same isolate
const store = new Store();

// --- Node.js req/res shims for handler compatibility ---

class NodeRequest {
  constructor(headers, body) {
    this.headers = headers;
    this._body = body;
  }

  on(event, cb) {
    if (event === 'data') {
      if (this._body && this._body.length > 0) cb(this._body);
    } else if (event === 'end') {
      cb();
    }
    // 'error' — ignored; body is already fully buffered
  }
}

class NodeResponse {
  constructor() {
    this.statusCode = 200;
    this._headers = {};
    this.headersSent = false;
    this._body = null;
    this._resolve = null;
    this.promise = new Promise(resolve => { this._resolve = resolve; });
  }

  setHeader(name, value) {
    this._headers[name] = String(value);
  }

  writeHead(status, headers) {
    this.statusCode = status;
    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        this._headers[key] = String(value);
      }
    }
    this.headersSent = true;
  }

  end(body) {
    this._body = body != null ? body : null;
    this._resolve();
  }

  on() {} // no-op for 'finish' etc.

  toResponse(extraHeaders) {
    const headers = { ...extraHeaders, ...this._headers };
    return new Response(this._body, {
      status: this.statusCode,
      headers,
    });
  }
}

// --- CORS ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// --- Router setup ---
const router = new Router();

// Email routes (specific before parameterized)
router.get('/api/emails', (req, res, params, query) =>
  emailHandlers.listEmails(req, res, store, params, query));
router.post('/api/emails/bulk', (req, res) =>
  emailHandlers.bulkAction(req, res, store));
router.post('/api/emails', (req, res) =>
  emailHandlers.createEmail(req, res, store));
router.post('/api/emails/:id/reply', (req, res, params) =>
  emailHandlers.replyEmail(req, res, store, params));
router.post('/api/emails/:id/forward', (req, res, params) =>
  emailHandlers.forwardEmail(req, res, store, params));
router.get('/api/emails/:id', (req, res, params) =>
  emailHandlers.getEmail(req, res, store, params));
router.put('/api/emails/:id', (req, res, params) =>
  emailHandlers.updateEmail(req, res, store, params));
router.delete('/api/emails/:id', (req, res, params, query) =>
  emailHandlers.deleteEmail(req, res, store, params, query));

// Search
router.get('/api/search', (req, res, params, query) =>
  emailHandlers.searchEmails(req, res, store, params, query));

// Folder counts
router.get('/api/folders/counts', (req, res) =>
  emailHandlers.getFolderCounts(req, res, store));

// Labels
router.get('/api/labels', (req, res) =>
  labelHandlers.listLabels(req, res, store));
router.post('/api/labels', (req, res) =>
  labelHandlers.createLabel(req, res, store));
router.put('/api/labels/:id', (req, res, params) =>
  labelHandlers.updateLabel(req, res, store, params));
router.delete('/api/labels/:id', (req, res, params) =>
  labelHandlers.deleteLabel(req, res, store, params));

// Contacts
router.get('/api/contacts', (req, res, params, query) =>
  contactHandlers.listContacts(req, res, store, params, query));
router.post('/api/contacts', (req, res) =>
  contactHandlers.createContact(req, res, store));
router.delete('/api/contacts/:id', (req, res, params) =>
  contactHandlers.deleteContact(req, res, store, params));

// Attachments
router.post('/api/attachments', (req, res) =>
  attachmentHandlers.uploadAttachment(req, res, store));
router.get('/api/attachments/:id', (req, res, params) =>
  attachmentHandlers.downloadAttachment(req, res, store, params));

// Seed & Reset (for testing)
router.post('/api/seed', async (req, res) => {
  const { json } = await parseBody(req);
  const now = new Date().toISOString();
  const seedEmails = (json.emails || []).map(e => ({
    id: e.id || uuid(),
    from: e.from || { name: 'Unknown', address: 'unknown@example.com' },
    to: e.to || [],
    cc: e.cc || [],
    bcc: e.bcc || [],
    subject: e.subject || '(no subject)',
    body: e.body || '',
    bodyText: e.bodyText || '',
    date: e.date || now,
    read: e.read !== undefined ? e.read : false,
    starred: e.starred !== undefined ? e.starred : false,
    folder: e.folder || 'inbox',
    labels: e.labels || [],
    attachments: e.attachments || [],
    threadId: e.threadId || uuid(),
    inReplyTo: e.inReplyTo || null,
  }));
  await store.seedData({
    emails: seedEmails,
    labels: json.labels || [],
    contacts: json.contacts || [],
  });
  const body = JSON.stringify({ success: true });
  res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(body)) });
  res.end(body);
});

router.post('/api/reset', async (req, res) => {
  await store.reset();
  const body = JSON.stringify({ success: true });
  res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(body)) });
  res.end(body);
});

// --- Worker entry point ---
export default {
  async fetch(request, env) {
    try {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      const url = new URL(request.url);
      const pathname = url.pathname;
      const query = Object.fromEntries(url.searchParams.entries());

      // API routes
      const match = router.resolve(request.method, pathname);
      if (match) {
        const headers = {};
        for (const [key, value] of request.headers.entries()) {
          headers[key] = value;
        }
        const bodyBuf = Buffer.from(await request.arrayBuffer());
        const req = new NodeRequest(headers, bodyBuf);
        const res = new NodeResponse();

        await match.handler(req, res, match.params, query);
        await res.promise;

        return res.toResponse(corsHeaders);
      }

      // Static files — fall through to Workers Assets
      if (request.method === 'GET') {
        return env.ASSETS.fetch(request);
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Request error:', err);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
