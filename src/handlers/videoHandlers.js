import fs from 'fs/promises';
import { join } from 'path';
import { VIDEOS_DIR, INDEX_FILE } from '../config.js';
import { readJSON, writeJSON, withLock } from '../lib/jsonStore.js';
import { paginate } from '../lib/paginate.js';
import { sendJSON, sendError, parseBody } from '../router.js';
import { updateChannelStats } from './uploadHandler.js';

export async function listVideos(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const page  = url.searchParams.get('page') || 1;
  const limit = url.searchParams.get('limit') || 12;
  const sort  = url.searchParams.get('sort') || 'newest';

  let index = await readJSON(INDEX_FILE, []);

  if (sort === 'views') {
    index = [...index].sort((a, b) => b.views - a.views);
  } else if (sort === 'oldest') {
    index = [...index].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  // default: newest (already sorted newest-first in index)

  const result = paginate(index, page, limit);
  sendJSON(res, {
    videos: result.items,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    limit: result.limit,
  });
}

export async function getVideo(req, res, params) {
  const { videoId } = params;
  const metaPath = join(VIDEOS_DIR, videoId, 'meta.json');
  const meta = await readJSON(metaPath);
  if (!meta) return sendError(res, 'Video not found', 404);

  // Increment view count atomically
  await withLock(`views:${videoId}`, async () => {
    const fresh = await readJSON(metaPath);
    if (!fresh) return;
    fresh.views = (fresh.views || 0) + 1;
    fresh.updatedAt = new Date().toISOString();
    await writeJSON(metaPath, fresh);

    // Also update index entry
    await withLock('index', async () => {
      const index = await readJSON(INDEX_FILE, []);
      const entry = index.find(v => v.videoId === videoId);
      if (entry) entry.views = fresh.views;
      await writeJSON(INDEX_FILE, index);
    });
  });

  const updated = await readJSON(metaPath);
  sendJSON(res, updated);
}

export async function updateVideo(req, res, params) {
  const { videoId } = params;
  const username = req.headers['x-channel-username'];
  const metaPath = join(VIDEOS_DIR, videoId, 'meta.json');
  const meta = await readJSON(metaPath);
  if (!meta) return sendError(res, 'Video not found', 404);
  if (meta.uploaderName !== username) return sendError(res, 'Unauthorized', 403);

  let body;
  try { body = await parseBody(req); }
  catch { return sendError(res, 'Invalid JSON', 400); }

  const allowed = ['title', 'description', 'tags'];
  for (const key of allowed) {
    if (body[key] !== undefined) meta[key] = body[key];
  }
  meta.updatedAt = new Date().toISOString();

  await writeJSON(metaPath, meta);

  // Update index entry title/tags if changed
  if (body.title || body.tags) {
    await withLock('index', async () => {
      const index = await readJSON(INDEX_FILE, []);
      const entry = index.find(v => v.videoId === videoId);
      if (entry) {
        if (body.title) entry.title = meta.title;
        if (body.tags)  entry.tags  = meta.tags;
      }
      await writeJSON(INDEX_FILE, index);
    });
  }

  sendJSON(res, meta);
}

export async function deleteVideo(req, res, params) {
  const { videoId } = params;
  const username = req.headers['x-channel-username'];
  const metaPath = join(VIDEOS_DIR, videoId, 'meta.json');
  const meta = await readJSON(metaPath);
  if (!meta) return sendError(res, 'Video not found', 404);
  if (meta.uploaderName !== username) return sendError(res, 'Unauthorized', 403);

  const videoDir = join(VIDEOS_DIR, videoId);
  await fs.rm(videoDir, { recursive: true, force: true });

  await withLock('index', async () => {
    const index = await readJSON(INDEX_FILE, []);
    const filtered = index.filter(v => v.videoId !== videoId);
    await writeJSON(INDEX_FILE, filtered);
  });

  await updateChannelStats(meta.uploaderName, -1, -meta.views);

  sendJSON(res, { success: true });
}
