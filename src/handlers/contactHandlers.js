const uuid = require('../lib/uuid');
const parseBody = require('../lib/parseBody');

function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function listContacts(req, res, store, params, query) {
  let contacts = store.getContacts();
  if (query.q) {
    const q = query.q.toLowerCase();
    contacts = contacts.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q)
    );
  }
  sendJSON(res, 200, { contacts });
}

async function createContact(req, res, store) {
  const { json } = await parseBody(req);
  if (!json.address) return sendJSON(res, 400, { error: 'address required' });
  const contact = {
    id: json.id || uuid(),
    name: json.name || '',
    address: json.address,
  };
  await store.addContact(contact);
  sendJSON(res, 201, { contact });
}

async function deleteContact(req, res, store, params) {
  await store.deleteContact(params.id);
  sendJSON(res, 200, { success: true });
}

module.exports = { listContacts, createContact, deleteContact };
