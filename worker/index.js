import {
  withLock, getIndex, setIndex,
  getVideoMeta, setVideoMeta, getVideoData, setVideoData,
  getThumbnailData, setThumbnailData, deleteVideoEntry,
  getComments, setComments,
  getChannel, setChannel,
  resetAll,
} from './store.js';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Channel-Username',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      const res = await route(method, path, url, request);
      // Add CORS headers to every API response
      if (path.startsWith('/api/') || path.startsWith('/stream/') || path.startsWith('/thumbnails/')) {
        for (const [k, v] of Object.entries(corsHeaders)) {
          res.headers.set(k, v);
        }
      }
      return res;
    } catch (err) {
      console.error('Handler error:', err);
      return json({ error: 'Internal server error' }, 500, corsHeaders);
    }
  },
};

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

async function route(method, path, url, request) {
  // Test helpers
  if (method === 'POST' && path === '/api/__reset') return handleReset();
  if (method === 'POST' && path === '/api/__seed') return handleSeed(request);

  // Upload
  if (method === 'POST' && path === '/api/upload') return handleUpload(request);

  // Videos list
  if (method === 'GET' && path === '/api/videos') return listVideos(url);

  // Single video
  const videoMatch = path.match(/^\/api\/videos\/([^/]+)$/);
  if (videoMatch) {
    const videoId = decodeURIComponent(videoMatch[1]);
    if (method === 'GET') return getVideo(videoId);
    if (method === 'PATCH') return updateVideo(videoId, request);
    if (method === 'DELETE') return deleteVideo(videoId, request);
  }

  // Stream
  const streamMatch = path.match(/^\/stream\/([^/]+)$/);
  if (streamMatch && method === 'GET') {
    return handleStream(decodeURIComponent(streamMatch[1]), request);
  }

  // Comments
  const commentsMatch = path.match(/^\/api\/videos\/([^/]+)\/comments$/);
  if (commentsMatch) {
    const videoId = decodeURIComponent(commentsMatch[1]);
    if (method === 'GET') return listComments(videoId, url);
    if (method === 'POST') return createComment(videoId, request);
  }

  const commentDelMatch = path.match(/^\/api\/videos\/([^/]+)\/comments\/([^/]+)$/);
  if (commentDelMatch && method === 'DELETE') {
    return deleteComment(
      decodeURIComponent(commentDelMatch[1]),
      decodeURIComponent(commentDelMatch[2]),
      request,
    );
  }

  // Channels
  const channelVideosMatch = path.match(/^\/api\/channels\/([^/]+)\/videos$/);
  if (channelVideosMatch && method === 'GET') {
    return getChannelVideos(decodeURIComponent(channelVideosMatch[1]), url);
  }

  const channelMatch = path.match(/^\/api\/channels\/([^/]+)$/);
  if (channelMatch && method === 'GET') {
    return getChannelProfile(decodeURIComponent(channelMatch[1]));
  }

  // Search
  if (method === 'GET' && path === '/api/search') return searchVideos(url);

  // Thumbnails
  const thumbMatch = path.match(/^\/thumbnails\/([^/]+)$/);
  if (thumbMatch && method === 'GET') {
    return handleThumbnail(decodeURIComponent(thumbMatch[1]));
  }

  // Not an API route — let assets binding handle it (returns 404 for unknown)
  return new Response('Not found', { status: 404 });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function paginate(array, page = 1, limit = 12) {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.max(1, Math.min(100, parseInt(limit) || 12));
  const total = array.length;
  const totalPages = Math.max(1, Math.ceil(total / l));
  const currentPage = Math.min(p, totalPages);
  const start = (currentPage - 1) * l;
  const items = array.slice(start, start + l);
  return { items, total, page: currentPage, totalPages, limit: l };
}

function avatarColorFor(username) {
  // Simple hash-to-hex color (same as original crypto.createHash('sha256'))
  let h = 0;
  for (let i = 0; i < username.length; i++) {
    h = ((h << 5) - h + username.charCodeAt(i)) | 0;
  }
  // Use the same SHA-256 approach via Web Crypto would be async; instead
  // replicate the deterministic color with a simpler hash for consistency.
  // For test compatibility, we use the exact same algorithm.
  return null; // computed below via async helper
}

async function sha256Color(username) {
  const data = new TextEncoder().encode(username);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const hex = [...new Uint8Array(hashBuf)].map(b => b.toString(16).padStart(2, '0')).join('');
  return '#' + hex.slice(0, 6);
}

function svgPlaceholder(title, videoId, color) {
  const letter = (title || 'V').trim().charAt(0).toUpperCase();
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  const textColor = brightness > 128 ? '#111111' : '#ffffff';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
  <rect width="320" height="180" fill="${color}"/>
  <circle cx="160" cy="90" r="36" fill="rgba(0,0,0,0.35)"/>
  <polygon points="150,74 150,106 182,90" fill="${textColor}" opacity="0.9"/>
  <text x="160" y="155" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" fill="${textColor}" opacity="0.8">${escapeXml(letter)}</text>
</svg>`;
}

function escapeXml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Multipart parser (adapted for Request body as ArrayBuffer)
async function parseMultipart(request) {
  const contentType = request.headers.get('content-type') || '';
  const boundaryMatch = contentType.match(/boundary=(.+)$/i);
  if (!boundaryMatch) throw new Error('No boundary in Content-Type');

  const boundary = boundaryMatch[1].trim();
  const body = new Uint8Array(await request.arrayBuffer());

  return parseParts(body, boundary);
}

function parseParts(body, boundary) {
  const fields = {};
  let file = null;

  const encoder = new TextEncoder();
  const delim = encoder.encode('--' + boundary);
  const CRLFCRLF = encoder.encode('\r\n\r\n');

  let pos = 0;

  while (pos < body.length) {
    const delimIdx = indexOfBytes(body, delim, pos);
    if (delimIdx === -1) break;

    pos = delimIdx + delim.length;
    if (body[pos] === 0x2d && body[pos + 1] === 0x2d) break;
    if (body[pos] === 0x0d && body[pos + 1] === 0x0a) pos += 2;

    const headerEnd = indexOfBytes(body, CRLFCRLF, pos);
    if (headerEnd === -1) break;

    const headerStr = new TextDecoder().decode(body.slice(pos, headerEnd));
    const headers = {};
    for (const line of headerStr.split('\r\n')) {
      const colon = line.indexOf(':');
      if (colon === -1) continue;
      headers[line.slice(0, colon).trim().toLowerCase()] = line.slice(colon + 1).trim();
    }
    pos = headerEnd + 4;

    const nextDelimBytes = encoder.encode('\r\n--' + boundary);
    const nextDelim = indexOfBytes(body, nextDelimBytes, pos);
    const dataEnd = nextDelim === -1 ? body.length : nextDelim;
    const data = body.slice(pos, dataEnd);

    const disposition = headers['content-disposition'] || '';
    const nameMatch = disposition.match(/name="([^"]+)"/);
    const filenameMatch = disposition.match(/filename="([^"]+)"/);

    if (!nameMatch) { pos = dataEnd; continue; }

    if (filenameMatch) {
      file = {
        fieldName: nameMatch[1],
        filename: filenameMatch[1],
        mimetype: headers['content-type'] || 'application/octet-stream',
        data,
      };
    } else {
      fields[nameMatch[1]] = new TextDecoder().decode(data);
    }

    pos = dataEnd;
  }

  return { fields, file };
}

function indexOfBytes(haystack, needle, start = 0) {
  if (needle.length === 0) return start;
  outer: for (let i = start; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Upload handler
// ---------------------------------------------------------------------------

const VIDEO_MIMES = new Set([
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
  'video/x-msvideo', 'video/x-matroska', 'video/mpeg',
]);

async function handleUpload(request) {
  let parsed;
  try {
    parsed = await parseMultipart(request);
  } catch (err) {
    return json({ error: 'Upload parse error: ' + err.message }, 400);
  }

  const { fields, file } = parsed;
  if (!file) return json({ error: 'No video file provided' }, 400);
  if (!VIDEO_MIMES.has(file.mimetype) && !/\.(mp4|webm|ogg|mov|avi|mkv|mpeg|mpg)$/i.test(file.filename)) {
    return json({ error: 'File must be a video' }, 400);
  }

  const title = (fields.title || '').trim();
  const uploaderName = (fields.uploaderName || '').trim();
  if (!title) return json({ error: 'Title is required' }, 400);
  if (!uploaderName) return json({ error: 'Channel name is required' }, 400);

  const videoId = crypto.randomUUID();
  const ext = (file.filename.match(/\.[^.]+$/) || ['.mp4'])[0].toLowerCase();

  const description = (fields.description || '').trim();
  const tagsRaw = (fields.tags || '').trim();
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

  const color = await sha256Color(videoId);
  const thumbnailSvg = svgPlaceholder(title, videoId, color);

  const now = new Date().toISOString();
  const meta = {
    videoId, title, description, tags, uploaderName,
    originalExt: ext,
    mimeType: file.mimetype || 'video/' + ext.slice(1),
    fileSize: file.data.length,
    duration: null,
    views: 0, likes: 0,
    thumbnailExt: '.svg',
    createdAt: now, updatedAt: now,
    status: 'ready',
  };

  // Store in memory
  setVideoMeta(videoId, meta);
  setVideoData(videoId, file.data);
  setThumbnailData(videoId, thumbnailSvg);

  // Update index
  await withLock('index', async () => {
    const index = getIndex();
    index.unshift({
      videoId, title, uploaderName, thumbnailExt: '.svg',
      views: 0, likes: 0, duration: null, tags, createdAt: now,
    });
    setIndex(index);
  });

  // Update channel stats
  await updateChannelStats(uploaderName, 1, 0);

  return json({ videoId, watchUrl: '/watch?v=' + videoId }, 201);
}

async function updateChannelStats(username, videoCountDelta, viewsDelta) {
  await withLock('channel:' + username, async () => {
    let channel = getChannel(username);
    const now = new Date().toISOString();
    if (!channel) {
      const avatarColor = await sha256Color(username);
      channel = {
        username, bio: '', avatarColor,
        videoCount: Math.max(0, videoCountDelta),
        totalViews: Math.max(0, viewsDelta),
        createdAt: now, updatedAt: now,
      };
    } else {
      channel.videoCount = Math.max(0, (channel.videoCount || 0) + videoCountDelta);
      channel.totalViews = Math.max(0, (channel.totalViews || 0) + viewsDelta);
      channel.updatedAt = now;
    }
    setChannel(username, channel);
  });
}

// ---------------------------------------------------------------------------
// Video handlers
// ---------------------------------------------------------------------------

function listVideos(url) {
  const page = url.searchParams.get('page') || 1;
  const limit = url.searchParams.get('limit') || 12;
  const sort = url.searchParams.get('sort') || 'newest';

  let index = [...getIndex()];
  if (sort === 'views') index.sort((a, b) => b.views - a.views);
  else if (sort === 'oldest') index.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const result = paginate(index, page, limit);
  return json({
    videos: result.items, total: result.total,
    page: result.page, totalPages: result.totalPages, limit: result.limit,
  });
}

async function getVideo(videoId) {
  const meta = getVideoMeta(videoId);
  if (!meta) return json({ error: 'Video not found' }, 404);

  await withLock('views:' + videoId, async () => {
    const fresh = getVideoMeta(videoId);
    if (!fresh) return;
    fresh.views = (fresh.views || 0) + 1;
    fresh.updatedAt = new Date().toISOString();
    setVideoMeta(videoId, fresh);

    await withLock('index', async () => {
      const index = getIndex();
      const entry = index.find(v => v.videoId === videoId);
      if (entry) entry.views = fresh.views;
      setIndex(index);
    });
  });

  const updated = getVideoMeta(videoId);
  return json(updated);
}

async function updateVideo(videoId, request) {
  const username = request.headers.get('x-channel-username');
  const meta = getVideoMeta(videoId);
  if (!meta) return json({ error: 'Video not found' }, 404);
  if (meta.uploaderName !== username) return json({ error: 'Unauthorized' }, 403);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const allowed = ['title', 'description', 'tags'];
  for (const key of allowed) {
    if (body[key] !== undefined) meta[key] = body[key];
  }
  meta.updatedAt = new Date().toISOString();
  setVideoMeta(videoId, meta);

  if (body.title || body.tags) {
    await withLock('index', async () => {
      const index = getIndex();
      const entry = index.find(v => v.videoId === videoId);
      if (entry) {
        if (body.title) entry.title = meta.title;
        if (body.tags) entry.tags = meta.tags;
      }
      setIndex(index);
    });
  }

  return json(meta);
}

async function deleteVideo(videoId, request) {
  const username = request.headers.get('x-channel-username');
  const meta = getVideoMeta(videoId);
  if (!meta) return json({ error: 'Video not found' }, 404);
  if (meta.uploaderName !== username) return json({ error: 'Unauthorized' }, 403);

  deleteVideoEntry(videoId);

  await withLock('index', async () => {
    const index = getIndex().filter(v => v.videoId !== videoId);
    setIndex(index);
  });

  await updateChannelStats(meta.uploaderName, -1, -meta.views);

  return json({ success: true });
}

// ---------------------------------------------------------------------------
// Stream handler
// ---------------------------------------------------------------------------

const STREAM_MIMES = {
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogg': 'video/ogg',
  '.mov': 'video/quicktime', '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska', '.mpeg': 'video/mpeg', '.mpg': 'video/mpeg',
};

function handleStream(videoId, request) {
  const meta = getVideoMeta(videoId);
  if (!meta) return new Response('Video not found', { status: 404 });

  const videoData = getVideoData(videoId);
  if (!videoData) return new Response('Video file not found', { status: 404 });

  const fileSize = videoData.length;
  const mimeType = STREAM_MIMES[meta.originalExt] || meta.mimeType || 'video/mp4';
  const rangeHeader = request.headers.get('range');

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      return new Response(null, {
        status: 416,
        headers: { 'Content-Range': 'bytes */' + fileSize },
      });
    }

    const chunk = videoData.slice(start, end + 1);
    return new Response(chunk, {
      status: 206,
      headers: {
        'Content-Range': 'bytes ' + start + '-' + end + '/' + fileSize,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunk.length),
        'Content-Type': mimeType,
      },
    });
  }

  return new Response(videoData, {
    status: 200,
    headers: {
      'Content-Length': String(fileSize),
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
    },
  });
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

function listComments(videoId, url) {
  const page = url.searchParams.get('page') || 1;
  const limit = url.searchParams.get('limit') || 20;
  const sort = url.searchParams.get('sort') || 'newest';

  let comments = [...getComments(videoId)];
  if (sort === 'oldest') {
    comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else {
    comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const result = paginate(comments, page, limit);
  return json({
    comments: result.items, total: result.total,
    page: result.page, totalPages: result.totalPages,
  });
}

async function createComment(videoId, request) {
  const meta = getVideoMeta(videoId);
  if (!meta) return json({ error: 'Video not found' }, 404);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const text = (body.body || '').trim();
  const authorName = (body.authorName || '').trim();
  if (!text) return json({ error: 'Comment body is required' }, 400);
  if (!authorName) return json({ error: 'Author name is required' }, 400);

  const comment = {
    commentId: crypto.randomUUID(),
    videoId, authorName, body: text,
    likes: 0, createdAt: new Date().toISOString(),
  };

  await withLock('comments:' + videoId, async () => {
    const comments = getComments(videoId);
    comments.push(comment);
    setComments(videoId, comments);
  });

  return json(comment, 201);
}

async function deleteComment(videoId, commentId, request) {
  const username = request.headers.get('x-channel-username');
  let deleted = null;

  await withLock('comments:' + videoId, async () => {
    const comments = getComments(videoId);
    const idx = comments.findIndex(c => c.commentId === commentId);
    if (idx === -1) return;
    if (comments[idx].authorName !== username) return;
    deleted = comments[idx];
    comments.splice(idx, 1);
    setComments(videoId, comments);
  });

  if (!deleted) return json({ error: 'Comment not found or unauthorized' }, 404);
  return json({ success: true });
}

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------

async function getOrCreateChannel(username) {
  let channel = getChannel(username);
  if (!channel) {
    const now = new Date().toISOString();
    const avatarColor = await sha256Color(username);
    channel = {
      username, bio: '', avatarColor,
      videoCount: 0, totalViews: 0,
      createdAt: now, updatedAt: now,
    };
    setChannel(username, channel);
  }
  return channel;
}

async function getChannelProfile(username) {
  if (!username) return json({ error: 'Username required' }, 400);
  const channel = await getOrCreateChannel(username);
  return json(channel);
}

function getChannelVideos(username, url) {
  const page = url.searchParams.get('page') || 1;
  const limit = url.searchParams.get('limit') || 12;

  const index = getIndex();
  const channelVideos = index.filter(v => v.uploaderName === username);
  const result = paginate(channelVideos, page, limit);
  return json({
    videos: result.items, total: result.total,
    page: result.page, totalPages: result.totalPages,
  });
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

function scoreVideo(video, q) {
  const query = q.toLowerCase();
  let pts = 0;
  if (video.title && video.title.toLowerCase().includes(query)) pts += 3;
  if (video.tags && video.tags.some(t => t.toLowerCase().includes(query))) pts += 2;
  if (video.description && video.description.toLowerCase().includes(query)) pts += 1;
  return pts;
}

function searchVideos(url) {
  const q = (url.searchParams.get('q') || '').trim();
  const page = url.searchParams.get('page') || 1;
  const limit = url.searchParams.get('limit') || 12;
  const sort = url.searchParams.get('sort') || 'relevance';

  const index = getIndex();

  if (!q) {
    const result = paginate(index, page, limit);
    return json({ videos: result.items, total: result.total, page: result.page, totalPages: result.totalPages, query: q });
  }

  const scored = index
    .map(v => ({ video: v, score: scoreVideo(v, q) }))
    .filter(s => s.score > 0);

  if (sort === 'relevance') {
    scored.sort((a, b) => b.score - a.score || new Date(b.video.createdAt) - new Date(a.video.createdAt));
  } else if (sort === 'views') {
    scored.sort((a, b) => b.video.views - a.video.views);
  } else {
    scored.sort((a, b) => new Date(b.video.createdAt) - new Date(a.video.createdAt));
  }

  const results = scored.map(s => s.video);
  const result = paginate(results, page, limit);
  return json({ videos: result.items, total: result.total, page: result.page, totalPages: result.totalPages, query: q });
}

// ---------------------------------------------------------------------------
// Thumbnails
// ---------------------------------------------------------------------------

function handleThumbnail(videoId) {
  const meta = getVideoMeta(videoId);
  if (!meta) return new Response('Not found', { status: 404 });

  const thumbData = getThumbnailData(videoId);
  if (!thumbData) return new Response('Thumbnail not found', { status: 404 });

  const ext = meta.thumbnailExt || '.svg';
  const mimeType = ext === '.jpg' ? 'image/jpeg' : 'image/svg+xml';

  // thumbData may be a string (SVG) or Uint8Array (binary)
  return new Response(thumbData, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function handleReset() {
  resetAll();
  return json({ success: true });
}

async function handleSeed(request) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const videos = body.videos || [];
  for (const v of videos) {
    const videoId = v.videoId || crypto.randomUUID();
    const title = v.title || 'Seeded Video';
    const uploaderName = v.uploaderName || 'testuser';
    const now = v.createdAt || new Date().toISOString();
    const description = v.description || '';
    const tags = v.tags || [];
    const views = v.views || 0;

    const meta = {
      videoId, title, description, tags, uploaderName,
      originalExt: '.mp4', mimeType: 'video/mp4',
      fileSize: 32, duration: null,
      views, likes: 0, thumbnailExt: '.svg',
      createdAt: now, updatedAt: now, status: 'ready',
    };

    setVideoMeta(videoId, meta);

    // Minimal MP4 stub
    const stubVideo = new Uint8Array([
      0x00,0x00,0x00,0x20, 0x66,0x74,0x79,0x70,
      0x69,0x73,0x6f,0x6d, 0x00,0x00,0x02,0x00,
      0x69,0x73,0x6f,0x6d, 0x69,0x73,0x6f,0x32,
      0x61,0x76,0x63,0x31, 0x6d,0x70,0x34,0x31,
    ]);
    setVideoData(videoId, stubVideo);

    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#333"/><text x="160" y="100" text-anchor="middle" fill="white" font-size="14">' + escapeXml(title) + '</text></svg>';
    setThumbnailData(videoId, svg);

    const index = getIndex();
    index.unshift({
      videoId, title, uploaderName, thumbnailExt: '.svg',
      views, likes: 0, duration: null, tags, description, createdAt: now,
    });
    setIndex(index);

    // Update channel stats
    await updateChannelStats(uploaderName, 1, 0);
  }

  return json({ success: true, count: videos.length }, 201);
}
