import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { join, extname } from 'path';
import { PUBLIC_DIR } from '../config.js';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.ogg':  'video/ogg',
  '.mov':  'video/quicktime',
  '.txt':  'text/plain',
};

export function staticFiles(req, res, next) {
  // Only handle GET/HEAD for static files
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();

  const url = new URL(req.url, 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);

  // Route SPA pages to their HTML files
  const spaRoutes = {
    '/': '/index.html',
    '/watch': '/watch.html',
    '/upload': '/upload.html',
    '/channel': '/channel.html',
    '/search': '/search.html',
  };

  if (spaRoutes[pathname]) pathname = spaRoutes[pathname];

  // Only serve files under /public/ prefix or root HTML pages
  let filePath;
  if (pathname.startsWith('/public/')) {
    filePath = join(PUBLIC_DIR, pathname.slice('/public/'.length));
  } else if (pathname.startsWith('/css/') || pathname.startsWith('/js/')) {
    filePath = join(PUBLIC_DIR, pathname);
  } else if (pathname.endsWith('.html') || pathname.endsWith('.ico')) {
    filePath = join(PUBLIC_DIR, pathname);
  } else {
    return next();
  }

  // Prevent path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  serveFile(filePath, req, res, next);
}

export async function serveFile(filePath, req, res, next) {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return next();

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'no-cache');

    if (req.method === 'HEAD') {
      res.writeHead(200);
      res.end();
      return;
    }

    res.writeHead(200);
    createReadStream(filePath).pipe(res);
  } catch (err) {
    if (err.code === 'ENOENT') return next();
    next(err);
  }
}
