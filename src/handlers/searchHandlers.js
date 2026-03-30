import { INDEX_FILE } from '../config.js';
import { readJSON } from '../lib/jsonStore.js';
import { paginate } from '../lib/paginate.js';
import { sendJSON } from '../router.js';

function score(video, q) {
  const query = q.toLowerCase();
  let pts = 0;
  if (video.title && video.title.toLowerCase().includes(query)) pts += 3;
  if (video.tags && video.tags.some(t => t.toLowerCase().includes(query))) pts += 2;
  if (video.description && video.description.toLowerCase().includes(query)) pts += 1;
  return pts;
}

export async function searchVideos(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const q     = (url.searchParams.get('q') || '').trim();
  const page  = url.searchParams.get('page') || 1;
  const limit = url.searchParams.get('limit') || 12;
  const sort  = url.searchParams.get('sort') || 'relevance';

  const index = await readJSON(INDEX_FILE, []);

  if (!q) {
    const result = paginate(index, page, limit);
    return sendJSON(res, { videos: result.items, total: result.total, page: result.page, totalPages: result.totalPages, query: q });
  }

  // Filter and score
  const scored = index
    .map(v => ({ video: v, score: score(v, q) }))
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
  sendJSON(res, {
    videos: result.items,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    query: q,
  });
}
