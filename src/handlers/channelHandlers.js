import fs from 'fs/promises';
import crypto from 'crypto';
import { join } from 'path';
import { CHANNELS_DIR, INDEX_FILE } from '../config.js';
import { readJSON, writeJSON } from '../lib/jsonStore.js';
import { paginate } from '../lib/paginate.js';
import { sendJSON, sendError } from '../router.js';

function avatarColorFor(username) {
  const hash = crypto.createHash('sha256').update(username).digest('hex');
  return '#' + hash.slice(0, 6);
}

async function getOrCreateChannel(username) {
  await fs.mkdir(CHANNELS_DIR, { recursive: true });
  const channelFile = join(CHANNELS_DIR, `${username}.json`);
  let channel = await readJSON(channelFile);
  if (!channel) {
    const now = new Date().toISOString();
    channel = {
      username,
      bio: '',
      avatarColor: avatarColorFor(username),
      videoCount: 0,
      totalViews: 0,
      createdAt: now,
      updatedAt: now,
    };
    await writeJSON(channelFile, channel);
  }
  return channel;
}

export async function getChannel(req, res, params) {
  const { username } = params;
  if (!username) return sendError(res, 'Username required', 400);
  const channel = await getOrCreateChannel(username);
  sendJSON(res, channel);
}

export async function getChannelVideos(req, res, params) {
  const { username } = params;
  const url = new URL(req.url, 'http://localhost');
  const page  = url.searchParams.get('page') || 1;
  const limit = url.searchParams.get('limit') || 12;

  const index = await readJSON(INDEX_FILE, []);
  const channelVideos = index.filter(v => v.uploaderName === username);

  const result = paginate(channelVideos, page, limit);
  sendJSON(res, {
    videos: result.items,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  });
}
