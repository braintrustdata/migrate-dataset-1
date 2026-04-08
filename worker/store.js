// In-memory data store — replaces file-based jsonStore + filesystem storage.
// Data lives only in memory; it survives across requests in wrangler dev
// (single process) but is intentionally non-durable for production use.
// Each eval task should migrate parts of this to D1, R2, KV, etc.

const db = {
  index: [],          // Video index entries (lightweight listing data)
  videos: new Map(),  // videoId → { meta, videoData (Buffer), thumbnailData (Buffer|string) }
  comments: new Map(), // videoId → [comment, ...]
  channels: new Map(), // username → channel object
};

// Lock implementation (same semantics as the original withLock)
const locks = new Map();

export function withLock(key, fn) {
  const prev = locks.get(key) || Promise.resolve();
  let resolve;
  const next = new Promise((r) => { resolve = r; });
  locks.set(key, next);
  return prev.then(() => fn()).finally(() => {
    resolve();
    if (locks.get(key) === next) locks.delete(key);
  });
}

// --- Index ---

export function getIndex() {
  return db.index;
}

export function setIndex(newIndex) {
  db.index = newIndex;
}

// --- Videos ---

export function getVideoMeta(videoId) {
  const entry = db.videos.get(videoId);
  return entry ? entry.meta : null;
}

export function setVideoMeta(videoId, meta) {
  const entry = db.videos.get(videoId) || { meta: null, videoData: null, thumbnailData: null };
  entry.meta = meta;
  db.videos.set(videoId, entry);
}

export function getVideoData(videoId) {
  const entry = db.videos.get(videoId);
  return entry ? entry.videoData : null;
}

export function setVideoData(videoId, data) {
  const entry = db.videos.get(videoId) || { meta: null, videoData: null, thumbnailData: null };
  entry.videoData = data;
  db.videos.set(videoId, entry);
}

export function getThumbnailData(videoId) {
  const entry = db.videos.get(videoId);
  return entry ? entry.thumbnailData : null;
}

export function setThumbnailData(videoId, data) {
  const entry = db.videos.get(videoId) || { meta: null, videoData: null, thumbnailData: null };
  entry.thumbnailData = data;
  db.videos.set(videoId, entry);
}

export function deleteVideoEntry(videoId) {
  db.videos.delete(videoId);
}

// --- Comments ---

export function getComments(videoId) {
  return db.comments.get(videoId) || [];
}

export function setComments(videoId, comments) {
  db.comments.set(videoId, comments);
}

// --- Channels ---

export function getChannel(username) {
  return db.channels.get(username) || null;
}

export function setChannel(username, channel) {
  db.channels.set(username, channel);
}

// --- Reset (for testing) ---

export function resetAll() {
  db.index = [];
  db.videos.clear();
  db.comments.clear();
  db.channels.clear();
}
