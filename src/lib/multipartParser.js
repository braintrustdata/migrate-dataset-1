// Binary-safe multipart/form-data parser — no external dependencies
// Buffers entire request body then splits on boundary bytes

export async function parseMultipart(req) {
  const contentType = req.headers['content-type'] || '';
  const boundaryMatch = contentType.match(/boundary=(.+)$/i);
  if (!boundaryMatch) throw new Error('No boundary in Content-Type');

  const boundary = boundaryMatch[1].trim();
  const body = await bufferBody(req);

  return parseParts(body, boundary);
}

function bufferBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseParts(body, boundary) {
  const fields = {};
  let file = null;

  // Delimiter bytes
  const delim = Buffer.from(`--${boundary}`);
  const CRLF = Buffer.from('\r\n');
  const CRLFCRLF = Buffer.from('\r\n\r\n');

  let pos = 0;

  while (pos < body.length) {
    // Find next boundary
    const delimIdx = indexOf(body, delim, pos);
    if (delimIdx === -1) break;

    pos = delimIdx + delim.length;

    // Check for final boundary (--)
    if (body[pos] === 0x2d && body[pos + 1] === 0x2d) break;

    // Skip CRLF after boundary
    if (body[pos] === 0x0d && body[pos + 1] === 0x0a) pos += 2;

    // Find end of headers (double CRLF)
    const headerEnd = indexOf(body, CRLFCRLF, pos);
    if (headerEnd === -1) break;

    const headerBuf = body.slice(pos, headerEnd);
    const headers = parsePartHeaders(headerBuf.toString('utf8'));
    pos = headerEnd + 4; // skip \r\n\r\n

    // Find next boundary to determine end of this part's data
    const nextDelim = indexOf(body, Buffer.from(`\r\n--${boundary}`), pos);
    const dataEnd = nextDelim === -1 ? body.length : nextDelim;
    const data = body.slice(pos, dataEnd);

    const disposition = headers['content-disposition'] || '';
    const nameMatch = disposition.match(/name="([^"]+)"/);
    const filenameMatch = disposition.match(/filename="([^"]+)"/);

    if (!nameMatch) { pos = dataEnd; continue; }

    const name = nameMatch[1];

    if (filenameMatch) {
      // File part
      file = {
        fieldName: name,
        filename: filenameMatch[1],
        mimetype: headers['content-type'] || 'application/octet-stream',
        data,
      };
    } else {
      // Text field
      fields[name] = data.toString('utf8');
    }

    pos = dataEnd;
  }

  return { fields, file };
}

function parsePartHeaders(headerStr) {
  const headers = {};
  for (const line of headerStr.split('\r\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const val = line.slice(colon + 1).trim();
    headers[key] = val;
  }
  return headers;
}

// Binary-safe indexOf for Buffers
function indexOf(haystack, needle, start = 0) {
  if (needle.length === 0) return start;
  outer: for (let i = start; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}
