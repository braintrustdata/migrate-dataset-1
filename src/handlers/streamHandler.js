import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { join } from 'path';
import { VIDEOS_DIR } from '../config.js';
import { readJSON } from '../lib/jsonStore.js';

const MIME_TYPES = {
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.ogg':  'video/ogg',
  '.mov':  'video/quicktime',
  '.avi':  'video/x-msvideo',
  '.mkv':  'video/x-matroska',
  '.mpeg': 'video/mpeg',
  '.mpg':  'video/mpeg',
};

export async function handleStream(req, res, params) {
  const { videoId } = params;
  const videoDir = join(VIDEOS_DIR, videoId);

  const meta = await readJSON(join(videoDir, 'meta.json'));
  if (!meta) {
    res.writeHead(404);
    res.end('Video not found');
    return;
  }

  const videoPath = join(videoDir, `original${meta.originalExt}`);
  let stat;
  try {
    stat = await fs.stat(videoPath);
  } catch {
    res.writeHead(404);
    res.end('Video file not found');
    return;
  }

  const fileSize = stat.size;
  const mimeType = MIME_TYPES[meta.originalExt] || meta.mimeType || 'video/mp4';
  const rangeHeader = req.headers['range'];

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      res.writeHead(416, { 'Content-Range': `bytes */${fileSize}` });
      res.end();
      return;
    }

    const chunkSize = end - start + 1;
    res.writeHead(206, {
      'Content-Range':  `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges':  'bytes',
      'Content-Length': chunkSize,
      'Content-Type':   mimeType,
    });
    createReadStream(videoPath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type':   mimeType,
      'Accept-Ranges':  'bytes',
    });
    createReadStream(videoPath).pipe(res);
  }
}
