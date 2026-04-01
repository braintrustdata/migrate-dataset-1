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

async function uploadAttachment(req, res, store) {
  const { parts } = await parseBody(req);
  if (!parts || parts.length === 0) {
    return sendJSON(res, 400, { error: 'No file uploaded' });
  }

  const file = parts[0];
  const id = uuid();
  await store.saveAttachment(id, file.data.toString('base64'));

  sendJSON(res, 201, {
    attachment: {
      id,
      name: file.filename || 'file',
      type: file.type,
      size: file.data.length,
    },
  });
}

async function downloadAttachment(req, res, store, params) {
  const data = store.getAttachment(params.id);
  if (!data) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Attachment not found' }));
  }
  const buf = Buffer.from(data, 'base64');
  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Content-Length': buf.length,
  });
  res.end(buf);
}

module.exports = { uploadAttachment, downloadAttachment };
