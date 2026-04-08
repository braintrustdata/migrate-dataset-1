// Test seeding helpers — use HTTP API to populate the in-memory store
import crypto from 'crypto';

const BASE = process.env.BASE_URL || 'http://localhost:3001';

export async function resetData() {
  const res = await fetch(`${BASE}/api/__reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset data');
}

export async function seedVideo(overrides = {}) {
  const videoId = overrides.videoId || crypto.randomUUID();
  const title = overrides.title || 'Test Video';
  const uploaderName = overrides.uploaderName || 'testuser';
  const now = overrides.createdAt || new Date().toISOString();

  const video = {
    videoId,
    title,
    uploaderName,
    description: overrides.description || '',
    tags: overrides.tags || [],
    views: overrides.views || 0,
    createdAt: now,
  };

  const res = await fetch(`${BASE}/api/__seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videos: [video] }),
  });
  if (!res.ok) throw new Error('Failed to seed video');

  return {
    videoId, title, uploaderName,
    description: video.description,
    tags: video.tags,
    originalExt: '.mp4', mimeType: 'video/mp4',
    fileSize: 32, duration: null,
    views: video.views, likes: 0,
    thumbnailExt: '.svg',
    createdAt: now, updatedAt: now, status: 'ready',
  };
}

export async function seedManyVideos(count, baseOverrides = {}) {
  const now = Date.now();
  const videos = Array.from({ length: count }, (_, i) => ({
    videoId: crypto.randomUUID(),
    title: `Video ${i + 1}`,
    uploaderName: baseOverrides.uploaderName || 'testuser',
    description: baseOverrides.description || '',
    tags: baseOverrides.tags || [],
    views: baseOverrides.views || 0,
    createdAt: new Date(now - i * 60000).toISOString(),
  }));

  const res = await fetch(`${BASE}/api/__seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videos }),
  });
  if (!res.ok) throw new Error('Failed to seed videos');

  return videos.map(v => ({
    ...v,
    originalExt: '.mp4', mimeType: 'video/mp4',
    fileSize: 32, duration: null,
    likes: 0, thumbnailExt: '.svg',
    updatedAt: v.createdAt, status: 'ready',
  }));
}
