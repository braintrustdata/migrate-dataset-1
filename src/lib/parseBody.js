module.exports = function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buf = Buffer.concat(chunks);
      const ct = req.headers['content-type'] || '';

      if (ct.includes('application/json')) {
        try {
          resolve({ json: JSON.parse(buf.toString('utf8')) });
        } catch {
          reject(new Error('Invalid JSON'));
        }
      } else if (ct.includes('multipart/form-data')) {
        let boundary = ct.split('boundary=')[1];
        if (!boundary) return reject(new Error('No boundary in multipart'));
        boundary = boundary.replace(/"/g, '').split(';')[0].trim();
        resolve({ parts: parseMultipart(buf, boundary) });
      } else if (buf.length > 0) {
        try {
          resolve({ json: JSON.parse(buf.toString('utf8')) });
        } catch {
          resolve({ raw: buf });
        }
      } else {
        resolve({ json: {} });
      }
    });
    req.on('error', reject);
  });
};

function parseMultipart(buf, boundary) {
  const delim = Buffer.from('--' + boundary);
  const parts = [];

  let pos = buf.indexOf(delim);
  if (pos === -1) return parts;
  pos += delim.length;
  if (buf[pos] === 0x0d && buf[pos + 1] === 0x0a) pos += 2;

  while (true) {
    const nextDelim = buf.indexOf(delim, pos);
    if (nextDelim === -1) break;

    const partData = buf.slice(pos, nextDelim - 2);
    const sep = Buffer.from('\r\n\r\n');
    const sepIdx = partData.indexOf(sep);
    if (sepIdx === -1) break;

    const headerStr = partData.slice(0, sepIdx).toString('utf8');
    const body = partData.slice(sepIdx + 4);

    const headers = {};
    for (const line of headerStr.split('\r\n')) {
      const c = line.indexOf(':');
      if (c !== -1) {
        headers[line.substring(0, c).toLowerCase().trim()] = line.substring(c + 1).trim();
      }
    }

    const cd = headers['content-disposition'] || '';
    const nm = cd.match(/name="([^"]+)"/);
    const fn = cd.match(/filename="([^"]+)"/);

    parts.push({
      name: nm ? nm[1] : '',
      filename: fn ? fn[1] : null,
      type: headers['content-type'] || 'application/octet-stream',
      data: body,
    });

    pos = nextDelim + delim.length;
    if (pos < buf.length && buf[pos] === 0x2d && buf[pos + 1] === 0x2d) break;
    if (buf[pos] === 0x0d && buf[pos + 1] === 0x0a) pos += 2;
  }

  return parts;
}
