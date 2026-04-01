// Test seeding helpers — directly write fixture data to the test data directory
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const TEST_DATA_DIR = path.resolve('./test-data');

export async function resetData() {
  await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
  await fs.mkdir(path.join(TEST_DATA_DIR, 'videos'), { recursive: true });
  await fs.mkdir(path.join(TEST_DATA_DIR, 'comments'), { recursive: true });
  await fs.mkdir(path.join(TEST_DATA_DIR, 'channels'), { recursive: true });
  await fs.writeFile(path.join(TEST_DATA_DIR, 'index.json'), '[]', 'utf8');
}

export async function seedVideo(overrides = {}) {
  const videoId = overrides.videoId || crypto.randomUUID();
  const title = overrides.title || 'Test Video';
  const uploaderName = overrides.uploaderName || 'testuser';
  const now = overrides.createdAt || new Date().toISOString();

  const videoDir = path.join(TEST_DATA_DIR, 'videos', videoId);
  await fs.mkdir(videoDir, { recursive: true });

  // Minimal MP4 ftyp box (32 bytes) — enough for the stream handler to serve
  const stubVideo = Buffer.from([
    0x00,0x00,0x00,0x20, // box size = 32
    0x66,0x74,0x79,0x70, // ftyp
    0x69,0x73,0x6f,0x6d, // isom
    0x00,0x00,0x02,0x00,
    0x69,0x73,0x6f,0x6d,
    0x69,0x73,0x6f,0x32,
    0x61,0x76,0x63,0x31,
    0x6d,0x70,0x34,0x31,
  ]);
  await fs.writeFile(path.join(videoDir, 'original.mp4'), stubVideo);

  // SVG thumbnail placeholder
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#333"/><text x="160" y="100" text-anchor="middle" fill="white" font-size="14">${title}</text></svg>`;
  await fs.writeFile(path.join(videoDir, 'thumbnail.svg'), svg, 'utf8');

  const meta = {
    videoId,
    title,
    description: overrides.description || '',
    tags: overrides.tags || [],
    uploaderName,
    originalExt: '.mp4',
    mimeType: 'video/mp4',
    fileSize: stubVideo.length,
    duration: null,
    views: overrides.views || 0,
    likes: 0,
    thumbnailExt: '.svg',
    createdAt: now,
    updatedAt: now,
    status: 'ready',
  };

  await fs.writeFile(path.join(videoDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');

  // Update global index
  const indexFile = path.join(TEST_DATA_DIR, 'index.json');
  let index = [];
  try { index = JSON.parse(await fs.readFile(indexFile, 'utf8')); } catch {}
  index.unshift({
    videoId,
    title,
    uploaderName,
    thumbnailExt: '.svg',
    views: meta.views,
    likes: 0,
    duration: null,
    tags: meta.tags,
    description: meta.description,
    createdAt: now,
  });
  await fs.writeFile(indexFile, JSON.stringify(index, null, 2), 'utf8');

  // Update channel stats (so videoCount is accurate on channel page)
  await updateChannelStats(uploaderName, 1, 0, now);

  return meta;
}

async function updateChannelStats(username, videoCountDelta, viewsDelta, now) {
  const channelFile = path.join(TEST_DATA_DIR, 'channels', `${username}.json`);
  let channel = null;
  try { channel = JSON.parse(await fs.readFile(channelFile, 'utf8')); } catch {}

  const hash = crypto.createHash('sha256').update(username).digest('hex');
  const avatarColor = '#' + hash.slice(0, 6);

  if (!channel) {
    channel = {
      username,
      bio: '',
      avatarColor,
      videoCount: Math.max(0, videoCountDelta),
      totalViews: Math.max(0, viewsDelta),
      createdAt: now,
      updatedAt: now,
    };
  } else {
    channel.videoCount = Math.max(0, (channel.videoCount || 0) + videoCountDelta);
    channel.totalViews = Math.max(0, (channel.totalViews || 0) + viewsDelta);
    channel.updatedAt = now;
  }
  await fs.writeFile(channelFile, JSON.stringify(channel, null, 2), 'utf8');
}

export async function seedManyVideos(count, baseOverrides = {}) {
  const now = Date.now();
  const stubVideo = Buffer.from([
    0x00,0x00,0x00,0x20, 0x66,0x74,0x79,0x70,
    0x69,0x73,0x6f,0x6d, 0x00,0x00,0x02,0x00,
    0x69,0x73,0x6f,0x6d, 0x69,0x73,0x6f,0x32,
    0x61,0x76,0x63,0x31, 0x6d,0x70,0x34,0x31,
  ]);

  // Build all metadata first
  const metas = Array.from({ length: count }, (_, i) => {
    const videoId = crypto.randomUUID();
    const title = `Video ${i + 1}`;
    const uploaderName = baseOverrides.uploaderName || 'testuser';
    const createdAt = new Date(now - i * 60000).toISOString();
    return {
      videoId, title,
      description: baseOverrides.description || '',
      tags: baseOverrides.tags || [],
      uploaderName,
      originalExt: '.mp4', mimeType: 'video/mp4',
      fileSize: stubVideo.length, duration: null,
      views: baseOverrides.views || 0, likes: 0,
      thumbnailExt: '.svg', createdAt, updatedAt: createdAt, status: 'ready',
    };
  });

  // Write all video dirs/files in parallel
  await Promise.all(metas.map(async meta => {
    const videoDir = path.join(TEST_DATA_DIR, 'videos', meta.videoId);
    await fs.mkdir(videoDir, { recursive: true });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#333"/><text x="160" y="100" text-anchor="middle" fill="white" font-size="14">${meta.title}</text></svg>`;
    await Promise.all([
      fs.writeFile(path.join(videoDir, 'original.mp4'), stubVideo),
      fs.writeFile(path.join(videoDir, 'thumbnail.svg'), svg, 'utf8'),
      fs.writeFile(path.join(videoDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8'),
    ]);
  }));

  // Update index once
  const indexFile = path.join(TEST_DATA_DIR, 'index.json');
  let index = [];
  try { index = JSON.parse(await fs.readFile(indexFile, 'utf8')); } catch {}
  for (const meta of metas) {
    index.unshift({ videoId: meta.videoId, title: meta.title, uploaderName: meta.uploaderName, thumbnailExt: '.svg', views: meta.views, likes: 0, duration: null, tags: meta.tags, description: meta.description, createdAt: meta.createdAt });
  }
  await fs.writeFile(indexFile, JSON.stringify(index, null, 2), 'utf8');

  // Update channel stats once per unique uploader
  const uploaderCounts = {};
  for (const meta of metas) uploaderCounts[meta.uploaderName] = (uploaderCounts[meta.uploaderName] || 0) + 1;
  await Promise.all(Object.entries(uploaderCounts).map(([u, c]) => updateChannelStats(u, c, 0, new Date(now).toISOString())));

  return metas;
}
