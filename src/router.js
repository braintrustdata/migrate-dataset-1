export class Router {
  constructor() {
    this.routes = [];
  }

  add(method, pattern, handler) {
    // Convert :param segments to named capture groups
    // Step 1: mark param placeholders, Step 2: escape regex specials, Step 3: restore named groups
    const marked = pattern.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '\x00$1\x00');
    const escaped = marked.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexStr = escaped.replace(/\x00([a-zA-Z_][a-zA-Z0-9_]*)\x00/g, '(?<$1>[^/]+)');
    const regex = new RegExp(`^${regexStr}$`);
    this.routes.push({ method: method.toUpperCase(), regex, handler, pattern });
  }

  get(pattern, handler) { this.add('GET', pattern, handler); }
  post(pattern, handler) { this.add('POST', pattern, handler); }
  patch(pattern, handler) { this.add('PATCH', pattern, handler); }
  delete(pattern, handler) { this.add('DELETE', pattern, handler); }
  options(pattern, handler) { this.add('OPTIONS', pattern, handler); }

  match(method, pathname) {
    for (const route of this.routes) {
      if (route.method !== method.toUpperCase()) continue;
      const m = pathname.match(route.regex);
      if (m) return { handler: route.handler, params: m.groups || {} };
    }
    return null;
  }
}

export function sendJSON(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

export function sendError(res, message, status = 400) {
  sendJSON(res, { error: message }, status);
}

export async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}
