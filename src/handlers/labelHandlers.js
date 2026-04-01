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

async function listLabels(req, res, store) {
  sendJSON(res, 200, { labels: store.getLabels() });
}

async function createLabel(req, res, store) {
  const { json } = await parseBody(req);
  if (!json.name) return sendJSON(res, 400, { error: 'name required' });
  const label = {
    id: json.id || uuid(),
    name: json.name,
    color: json.color || '#999999',
  };
  await store.addLabel(label);
  sendJSON(res, 201, { label });
}

async function updateLabel(req, res, store, params) {
  const { json } = await parseBody(req);
  const updates = {};
  if (json.name !== undefined) updates.name = json.name;
  if (json.color !== undefined) updates.color = json.color;
  const label = await store.updateLabel(params.id, updates);
  if (!label) return sendJSON(res, 404, { error: 'Label not found' });
  sendJSON(res, 200, { label });
}

async function deleteLabel(req, res, store, params) {
  await store.deleteLabel(params.id);
  sendJSON(res, 200, { success: true });
}

module.exports = { listLabels, createLabel, updateLabel, deleteLabel };
