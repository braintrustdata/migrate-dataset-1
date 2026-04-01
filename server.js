const http = require('http');
const path = require('path');
const config = require('./src/config');
const Store = require('./src/store');
const Router = require('./src/router');
const serveStatic = require('./src/middleware/static');
const emailHandlers = require('./src/handlers/emailHandlers');
const labelHandlers = require('./src/handlers/labelHandlers');
const contactHandlers = require('./src/handlers/contactHandlers');
const attachmentHandlers = require('./src/handlers/attachmentHandlers');
const parseBody = require('./src/lib/parseBody');
const uuid = require('./src/lib/uuid');

function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function main() {
  const store = new Store(config.dataFile);
  await store.init();

  const router = new Router();
  const staticHandler = serveStatic(path.join(__dirname, 'public'));

  // --- Email routes (specific before parameterized) ---
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

  // --- Search ---
  router.get('/api/search', (req, res, params, query) =>
    emailHandlers.searchEmails(req, res, store, params, query));

  // --- Folder counts ---
  router.get('/api/folders/counts', (req, res) =>
    emailHandlers.getFolderCounts(req, res, store));

  // --- Labels ---
  router.get('/api/labels', (req, res) =>
    labelHandlers.listLabels(req, res, store));
  router.post('/api/labels', (req, res) =>
    labelHandlers.createLabel(req, res, store));
  router.put('/api/labels/:id', (req, res, params) =>
    labelHandlers.updateLabel(req, res, store, params));
  router.delete('/api/labels/:id', (req, res, params) =>
    labelHandlers.deleteLabel(req, res, store, params));

  // --- Contacts ---
  router.get('/api/contacts', (req, res, params, query) =>
    contactHandlers.listContacts(req, res, store, params, query));
  router.post('/api/contacts', (req, res) =>
    contactHandlers.createContact(req, res, store));
  router.delete('/api/contacts/:id', (req, res, params) =>
    contactHandlers.deleteContact(req, res, store, params));

  // --- Attachments ---
  router.post('/api/attachments', (req, res) =>
    attachmentHandlers.uploadAttachment(req, res, store));
  router.get('/api/attachments/:id', (req, res, params) =>
    attachmentHandlers.downloadAttachment(req, res, store, params));

  // --- Seed & Reset (for testing) ---
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
    sendJSON(res, 200, { success: true });
  });

  router.post('/api/reset', async (req, res) => {
    await store.reset();
    sendJSON(res, 200, { success: true });
  });

  // --- HTTP Server ---
  const server = http.createServer(async (req, res) => {
    try {
      // CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
      }

      // Logging
      const start = Date.now();
      res.on('finish', () => {
        console.log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`);
      });

      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = parsedUrl.pathname;
      const query = Object.fromEntries(parsedUrl.searchParams.entries());

      // API routes
      const match = router.resolve(req.method, pathname);
      if (match) {
        return await match.handler(req, res, match.params, query);
      }

      // Static files
      if (req.method === 'GET') {
        const served = await staticHandler(pathname, res);
        if (served) return;
      }

      // 404
      sendJSON(res, 404, { error: 'Not found' });
    } catch (err) {
      console.error('Request error:', err);
      if (!res.headersSent) {
        sendJSON(res, 500, { error: 'Internal server error' });
      }
    }
  });

  server.listen(config.port, () => {
    console.log(`Gmail Clone running on http://localhost:${config.port}`);
  });

  const shutdown = async () => {
    await store.close();
    server.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
