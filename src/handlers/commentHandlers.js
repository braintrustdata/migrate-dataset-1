import fs from 'fs/promises';
import crypto from 'crypto';
import { join } from 'path';
import { COMMENTS_DIR, VIDEOS_DIR } from '../config.js';
import { readJSON, writeJSON, withLock } from '../lib/jsonStore.js';
import { paginate } from '../lib/paginate.js';
import { sendJSON, sendError, parseBody } from '../router.js';

async function getCommentsFile(videoId) {
  return join(COMMENTS_DIR, `${videoId}.json`);
}

export async function listComments(req, res, params) {
  const { videoId } = params;
  const url = new URL(req.url, 'http://localhost');
  const page  = url.searchParams.get('page') || 1;
  const limit = url.searchParams.get('limit') || 20;
  const sort  = url.searchParams.get('sort') || 'newest';

  await fs.mkdir(COMMENTS_DIR, { recursive: true });
  const commentsFile = await getCommentsFile(videoId);
  let comments = await readJSON(commentsFile, []);

  if (sort === 'oldest') {
    comments = [...comments].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else {
    comments = [...comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const result = paginate(comments, page, limit);
  sendJSON(res, {
    comments: result.items,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  });
}

export async function createComment(req, res, params) {
  const { videoId } = params;

  // Verify video exists
  const meta = await readJSON(join(VIDEOS_DIR, videoId, 'meta.json'));
  if (!meta) return sendError(res, 'Video not found', 404);

  let body;
  try { body = await parseBody(req); }
  catch { return sendError(res, 'Invalid JSON', 400); }

  const text = (body.body || '').trim();
  const authorName = (body.authorName || '').trim();
  if (!text) return sendError(res, 'Comment body is required', 400);
  if (!authorName) return sendError(res, 'Author name is required', 400);

  const comment = {
    commentId: crypto.randomUUID(),
    videoId,
    authorName,
    body: text,
    likes: 0,
    createdAt: new Date().toISOString(),
  };

  await fs.mkdir(COMMENTS_DIR, { recursive: true });
  const commentsFile = await getCommentsFile(videoId);

  await withLock(`comments:${videoId}`, async () => {
    const comments = await readJSON(commentsFile, []);
    comments.push(comment);
    await writeJSON(commentsFile, comments);
  });

  sendJSON(res, comment, 201);
}

export async function deleteComment(req, res, params) {
  const { videoId, commentId } = params;
  const username = req.headers['x-channel-username'];

  await fs.mkdir(COMMENTS_DIR, { recursive: true });
  const commentsFile = await getCommentsFile(videoId);

  let deleted = null;
  await withLock(`comments:${videoId}`, async () => {
    const comments = await readJSON(commentsFile, []);
    const idx = comments.findIndex(c => c.commentId === commentId);
    if (idx === -1) return;
    const comment = comments[idx];
    if (comment.authorName !== username) return;
    deleted = comment;
    comments.splice(idx, 1);
    await writeJSON(commentsFile, comments);
  });

  if (!deleted) return sendError(res, 'Comment not found or unauthorized', 404);
  sendJSON(res, { success: true });
}
