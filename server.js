import http from 'http';
import fs from 'fs/promises';
import { URL } from 'url';
import { PORT, DATA_DIR, VIDEOS_DIR, COMMENTS_DIR, CHANNELS_DIR, INDEX_FILE } from './src/config.js';
import { Router, sendJSON, sendError } from './src/router.js';
import { logger } from './src/middleware/logger.js';
import { cors } from './src/middleware/cors.js';
import { staticFiles } from './src/middleware/staticFiles.js';
import { handleUpload } from './src/handlers/uploadHandler.js';
import { handleStream } from './src/handlers/streamHandler.js';
import { listVideos, getVideo, updateVideo, deleteVideo } from './src/handlers/videoHandlers.js';
import { listComments, createComment, deleteComment } from './src/handlers/commentHandlers.js';
import { getChannel, getChannelVideos } from './src/handlers/channelHandlers.js';
import { searchVideos } from './src/handlers/searchHandlers.js';
import { handleThumbnail } from './src/handlers/thumbnailHandler.js';

const router = new Router();

// Upload
router.post('/api/upload', handleUpload);

// Videos
router.get('/api/videos', listVideos);
router.get('/api/videos/:videoId', getVideo);
router.patch('/api/videos/:videoId', updateVideo);
router.delete('/api/videos/:videoId', deleteVideo);

// Streaming
router.get('/stream/:videoId', handleStream);

// Comments
router.get('/api/videos/:videoId/comments', listComments);
router.post('/api/videos/:videoId/comments', createComment);
router.delete('/api/videos/:videoId/comments/:commentId', deleteComment);

// Channels
router.get('/api/channels/:username', getChannel);
router.get('/api/channels/:username/videos', getChannelVideos);

// Search
router.get('/api/search', searchVideos);

// Thumbnails
router.get('/thumbnails/:videoId', handleThumbnail);

async function ensureDataDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(VIDEOS_DIR, { recursive: true });
  await fs.mkdir(COMMENTS_DIR, { recursive: true });
  await fs.mkdir(CHANNELS_DIR, { recursive: true });
  // Clean up any stale .tmp files from crashed writes
  for (const dir of [DATA_DIR]) {
    try {
      const files = await fs.readdir(dir);
      for (const f of files) {
        if (f.endsWith('.tmp')) {
          await fs.unlink(`${dir}/${f}`).catch(() => {});
        }
      }
    } catch {}
  }
}

const server = http.createServer(async (req, res) => {
  // Run middleware chain manually
  const chain = [logger, cors, staticFiles];
  let idx = 0;

  const next = (err) => {
    if (err) {
      console.error('Middleware error:', err);
      if (!res.headersSent) {
        sendError(res, 'Internal server error', 500);
      }
      return;
    }
    const fn = chain[idx++];
    if (fn) {
      try { fn(req, res, next); }
      catch (e) { next(e); }
    } else {
      // All middleware passed — try router
      routeRequest(req, res);
    }
  };

  next();
});

function routeRequest(req, res) {
  const url = new URL(req.url, `http://localhost`);
  const pathname = url.pathname;
  const method = req.method;

  // Handle OPTIONS globally for CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const match = router.match(method, pathname);
  if (match) {
    Promise.resolve(match.handler(req, res, match.params)).catch(err => {
      console.error(`Handler error for ${method} ${pathname}:`, err);
      if (!res.headersSent) sendError(res, 'Internal server error', 500);
    });
  } else {
    sendError(res, 'Not found', 404);
  }
}

ensureDataDirs().then(() => {
  server.listen(PORT, () => {
    console.log(`VidLocal running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});

export { server };
