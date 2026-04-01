const fs = require('fs');
const path = require('path');
const mime = require('../lib/mime');

module.exports = function serveStatic(publicDir) {
  return async function (pathname, res) {
    const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(publicDir, safePath === '/' ? 'index.html' : safePath);

    if (!filePath.startsWith(publicDir)) {
      return false;
    }

    try {
      const stat = await fs.promises.stat(filePath);
      if (!stat.isFile()) return false;

      const ext = path.extname(filePath);
      res.writeHead(200, {
        'Content-Type': mime(ext),
        'Content-Length': stat.size,
        'Cache-Control': 'no-cache',
      });
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      return true;
    } catch {
      return false;
    }
  };
};
