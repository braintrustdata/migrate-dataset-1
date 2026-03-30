import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { join } from 'path';
import { VIDEOS_DIR } from '../config.js';
import { readJSON } from '../lib/jsonStore.js';

export async function handleThumbnail(req, res, params) {
  const { videoId } = params;
  const meta = await readJSON(join(VIDEOS_DIR, videoId, 'meta.json'));
  if (!meta) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = meta.thumbnailExt || '.svg';
  const thumbPath = join(VIDEOS_DIR, videoId, `thumbnail${ext}`);

  let stat;
  try {
    stat = await fs.stat(thumbPath);
  } catch {
    res.writeHead(404);
    res.end('Thumbnail not found');
    return;
  }

  const mimeType = ext === '.jpg' ? 'image/jpeg' : 'image/svg+xml';
  res.writeHead(200, {
    'Content-Type': mimeType,
    'Content-Length': stat.size,
    'Cache-Control': 'public, max-age=3600',
  });
  createReadStream(thumbPath).pipe(res);
}
