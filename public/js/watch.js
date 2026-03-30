import {
  apiFetch, formatViews, formatRelativeTime,
  avatarColor, escapeHtml, renderVideoCard
} from './api.js';

const params = new URLSearchParams(window.location.search);
const videoId = params.get('v');

if (!videoId) {
  document.title = 'Not found — VidLocal';
  document.querySelector('.watch-layout').innerHTML =
    '<div class="empty-state" style="margin:60px auto;text-align:center"><h2>No video specified</h2><p><a href="/" style="color:#3ea6ff">Go home</a></p></div>';
}

// State
let commentPage = 1;
let totalCommentPages = 1;
let totalComments = 0;
let likedState = false;
const storedUsername = () => localStorage.getItem('vidlocal_username') || '';

async function loadVideo() {
  try {
    const video = await apiFetch(`/api/videos/${videoId}`);
    renderVideo(video);
    loadRelated(video.videoId);
    loadComments(1);
  } catch (err) {
    document.getElementById('videoTitle').textContent = 'Video not found';
    console.error(err);
  }
}

function renderVideo(v) {
  document.title = `${v.title} — VidLocal`;

  const player = document.getElementById('mainPlayer');
  player.src = `/stream/${v.videoId}`;

  document.getElementById('videoTitle').textContent = v.title;
  document.getElementById('viewCount').textContent = `${formatViews(v.views)} views`;
  document.getElementById('uploadDate').textContent = formatRelativeTime(v.createdAt);
  document.getElementById('likeCount').textContent = v.likes || 0;

  const color = avatarColor(v.uploaderName);
  const initial = v.uploaderName.charAt(0).toUpperCase();
  const channelUrl = `/channel?u=${encodeURIComponent(v.uploaderName)}`;

  const avatarEl = document.getElementById('channelAvatar');
  avatarEl.style.background = color;
  avatarEl.textContent = initial;

  const channelLink = document.getElementById('channelLink');
  channelLink.href = channelUrl;

  const channelNameLink = document.getElementById('channelNameLink');
  channelNameLink.textContent = v.uploaderName;
  channelNameLink.href = channelUrl;

  // Load channel video count
  apiFetch(`/api/channels/${encodeURIComponent(v.uploaderName)}`).then(ch => {
    document.getElementById('channelVideoCount').textContent =
      `${ch.videoCount || 0} video${ch.videoCount !== 1 ? 's' : ''}`;
  }).catch(() => {});

  const descEl = document.getElementById('videoDescription');
  descEl.textContent = v.description || '';
  descEl.addEventListener('click', () => descEl.classList.toggle('expanded'));

  const tagsEl = document.getElementById('videoTags');
  if (v.tags && v.tags.length) {
    tagsEl.innerHTML = v.tags.map(t =>
      `<a href="/search?q=${encodeURIComponent(t)}" class="tag">#${escapeHtml(t)}</a>`
    ).join('');
  }

  // Restore author name from localStorage
  const authorInput = document.getElementById('commentAuthor');
  if (authorInput && storedUsername()) authorInput.value = storedUsername();
}

async function loadRelated(currentId) {
  try {
    const data = await apiFetch('/api/videos?limit=10&sort=newest');
    const others = data.videos.filter(v => v.videoId !== currentId).slice(0, 10);
    const el = document.getElementById('relatedVideos');
    if (!others.length) {
      el.innerHTML = '<p style="color:#aaa;font-size:14px">No other videos yet.</p>';
      return;
    }
    el.innerHTML = others.map(v => {
      const color = avatarColor(v.uploaderName);
      const views = formatViews(v.views || 0);
      const time = formatRelativeTime(v.createdAt);
      return `
        <a href="/watch?v=${v.videoId}" class="related-card">
          <div class="related-thumbnail">
            <img src="/thumbnails/${v.videoId}" alt="${escapeHtml(v.title)}" loading="lazy" onerror="this.style.display='none'" />
          </div>
          <div class="related-info">
            <div class="related-title-text">${escapeHtml(v.title)}</div>
            <div class="related-channel" style="color:${color}">${escapeHtml(v.uploaderName)}</div>
            <div class="related-views">${views} views · ${time}</div>
          </div>
        </a>
      `;
    }).join('');
  } catch {}
}

async function loadComments(page = 1) {
  try {
    const data = await apiFetch(`/api/videos/${videoId}/comments?page=${page}&limit=20`);
    totalComments = data.total;
    totalCommentPages = data.totalPages;
    commentPage = data.page;

    document.getElementById('commentCount').textContent = totalComments;

    const list = document.getElementById('commentsList');
    if (page === 1) list.innerHTML = '';

    if (data.comments.length === 0 && page === 1) {
      list.innerHTML = '<p style="color:#aaa;font-size:14px;padding:8px 0">No comments yet. Be the first!</p>';
    } else {
      list.innerHTML += data.comments.map(renderComment).join('');
    }

    const loadMoreBtn = document.getElementById('loadMoreComments');
    loadMoreBtn.style.display = commentPage < totalCommentPages ? 'block' : 'none';
  } catch (err) {
    console.error('Failed to load comments:', err);
  }
}

function renderComment(c) {
  const color = avatarColor(c.authorName);
  const initial = c.authorName.charAt(0).toUpperCase();
  const isOwn = storedUsername() && c.authorName === storedUsername();
  const deleteBtn = isOwn
    ? `<button class="comment-delete-btn" data-comment-id="${c.commentId}" title="Delete comment">Delete</button>`
    : '';
  return `
    <div class="comment-item" data-comment-id="${c.commentId}">
      <div class="comment-avatar" style="background:${color}">${escapeHtml(initial)}</div>
      <div class="comment-body">
        <div class="comment-author">
          ${escapeHtml(c.authorName)}
          <span class="comment-time">${formatRelativeTime(c.createdAt)}</span>
        </div>
        <div class="comment-text">${escapeHtml(c.body)}</div>
        <div class="comment-footer">${deleteBtn}</div>
      </div>
    </div>
  `;
}

// Comment form
document.getElementById('commentForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const authorName = document.getElementById('commentAuthor').value.trim();
  const body = document.getElementById('commentBody').value.trim();
  if (!authorName || !body) return;

  try {
    const comment = await apiFetch(`/api/videos/${videoId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ authorName, body }),
    });

    // Save username for future use
    localStorage.setItem('vidlocal_username', authorName);
    document.getElementById('commentBody').value = '';

    // Prepend new comment
    totalComments++;
    document.getElementById('commentCount').textContent = totalComments;
    const list = document.getElementById('commentsList');
    if (list.querySelector('p')) list.innerHTML = '';
    list.insertAdjacentHTML('afterbegin', renderComment(comment));
  } catch (err) {
    alert(`Failed to post comment: ${err.message}`);
  }
});

document.getElementById('cancelComment')?.addEventListener('click', () => {
  document.getElementById('commentBody').value = '';
});

// Delete comment (event delegation)
document.getElementById('commentsList')?.addEventListener('click', async (e) => {
  const btn = e.target.closest('.comment-delete-btn');
  if (!btn) return;
  const commentId = btn.dataset.commentId;
  const username = storedUsername();
  if (!username) return alert('Set your name first by posting a comment.');

  if (!confirm('Delete this comment?')) return;

  try {
    await apiFetch(`/api/videos/${videoId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'X-Channel-Username': username },
    });
    const item = document.querySelector(`.comment-item[data-comment-id="${commentId}"]`);
    if (item) item.remove();
    totalComments = Math.max(0, totalComments - 1);
    document.getElementById('commentCount').textContent = totalComments;
  } catch (err) {
    alert(`Failed to delete comment: ${err.message}`);
  }
});

// Load more comments
document.getElementById('loadMoreComments')?.addEventListener('click', () => {
  loadComments(commentPage + 1);
});

// Like button (client-side only — no auth to validate ownership)
document.getElementById('likeBtn')?.addEventListener('click', () => {
  if (likedState) return;
  likedState = true;
  document.getElementById('likeBtn').classList.add('liked');
  const count = parseInt(document.getElementById('likeCount').textContent) + 1;
  document.getElementById('likeCount').textContent = count;
});

// Init
if (videoId) loadVideo();
