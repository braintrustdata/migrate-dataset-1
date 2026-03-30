import fs from 'fs/promises';
import { join, extname } from 'path';
import crypto from 'crypto';
import { parseMultipart } from '../lib/multipartParser.js';
import { writeJSON, readJSON, withLock } from '../lib/jsonStore.js';
import { generateThumbnail } from '../lib/thumbnailGen.js';
import { VIDEOS_DIR, INDEX_FILE, CHANNELS_DIR, MAX_UPLOAD_SIZE } from '../config.js';
import { sendJSON, sendError } from '../router.js';

const VIDEO_MIMES = new Set([
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
  'video/x-msvideo', 'video/x-matroska', 'video/mpeg',
]);

export async function handleUpload(req, res) {
  // Check content length before buffering
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > MAX_UPLOAD_SIZE) {
    return sendError(res, 'File too large (max 4GB)', 413);
  }

  let parsed;
  try {
    parsed = await parseMultipart(req);
  } catch (err) {
    return sendError(res, `Upload parse error: ${err.message}`, 400);
  }

  const { fields, file } = parsed;

  if (!file) return sendError(res, 'No video file provided', 400);
  if (!VIDEO_MIMES.has(file.mimetype) && !file.filename.match(/\.(mp4|webm|ogg|mov|avi|mkv|mpeg|mpg)$/i)) {
    return sendError(res, 'File must be a video', 400);
  }

  const title = (fields.title || '').trim();
  const uploaderName = (fields.uploaderName || '').trim();
  if (!title) return sendError(res, 'Title is required', 400);
  if (!uploaderName) return sendError(res, 'Channel name is required', 400);

  const videoId = crypto.randomUUID();
  const ext = extname(file.filename).toLowerCase() || '.mp4';
  const videoDir = join(VIDEOS_DIR, videoId);

  try {
    await fs.mkdir(videoDir, { recursive: true });

    const videoPath = join(videoDir, `original${ext}`);
    await fs.writeFile(videoPath, file.data);

    const description = (fields.description || '').trim();
    const tagsRaw = (fields.tags || '').trim();
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    const thumbnailExt = await generateThumbnail(videoPath, videoDir, title, videoId);

    const now = new Date().toISOString();
    const meta = {
      videoId,
      title,
      description,
      tags,
      uploaderName,
      originalExt: ext,
      mimeType: file.mimetype || `video/${ext.slice(1)}`,
      fileSize: file.data.length,
      duration: null,
      views: 0,
      likes: 0,
      thumbnailExt,
      createdAt: now,
      updatedAt: now,
      status: 'ready',
    };

    await writeJSON(join(videoDir, 'meta.json'), meta);

    // Update global index atomically
    await withLock('index', async () => {
      const index = await readJSON(INDEX_FILE, []);
      index.unshift({
        videoId,
        title,
        uploaderName,
        thumbnailExt,
        views: 0,
        likes: 0,
        duration: null,
        tags,
        createdAt: now,
      });
      await writeJSON(INDEX_FILE, index);
    });

    // Update channel stats
    await updateChannelStats(uploaderName, 1, 0);

    sendJSON(res, { videoId, watchUrl: `/watch?v=${videoId}` }, 201);
  } catch (err) {
    console.error('Upload error:', err);
    // Cleanup on failure
    try { await fs.rm(videoDir, { recursive: true, force: true }); } catch {}
    sendError(res, 'Upload failed', 500);
  }
}

async function updateChannelStats(username, videoCountDelta, viewsDelta) {
  await fs.mkdir(CHANNELS_DIR, { recursive: true });
  const channelFile = join(CHANNELS_DIR, `${username}.json`);
  await withLock(`channel:${username}`, async () => {
    const channel = await readJSON(channelFile, null);
    const now = new Date().toISOString();
    if (!channel) {
      const hash = crypto.createHash('sha256').update(username).digest('hex');
      const avatarColor = '#' + hash.slice(0, 6);
      await writeJSON(channelFile, {
        username,
        bio: '',
        avatarColor,
        videoCount: Math.max(0, videoCountDelta),
        totalViews: Math.max(0, viewsDelta),
        createdAt: now,
        updatedAt: now,
      });
    } else {
      channel.videoCount = Math.max(0, (channel.videoCount || 0) + videoCountDelta);
      channel.totalViews = Math.max(0, (channel.totalViews || 0) + viewsDelta);
      channel.updatedAt = now;
      await writeJSON(channelFile, channel);
    }
  });
}

export { updateChannelStats };
