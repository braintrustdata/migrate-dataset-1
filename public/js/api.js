// Shared API utilities — imported by all page scripts

export async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const d = await res.json(); msg = d.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export function formatViews(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

export function formatRelativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

export function avatarColor(str) {
  // Simple deterministic color from string (mirrors server-side logic)
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 45%)`;
}

export function thumbnailUrl(video) {
  return `/thumbnails/${video.videoId}`;
}

export function renderThumbnail(video, classExtra = '') {
  return `<img
    src="${thumbnailUrl(video)}"
    alt="${escapeHtml(video.title)}"
    class="${classExtra}"
    loading="lazy"
    onerror="this.style.display='none'"
  />`;
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderVideoCard(video) {
  const color = avatarColor(video.uploaderName || '?');
  const initial = (video.uploaderName || '?').charAt(0).toUpperCase();
  const views = formatViews(video.views || 0);
  const time = formatRelativeTime(video.createdAt);
  const channelUrl = `/channel?u=${encodeURIComponent(video.uploaderName)}`;
  const watchUrl = `/watch?v=${video.videoId}`;

  // Use <div> wrapper to avoid invalid nested <a> tags (which cause browser re-parsing)
  return `
    <div class="video-card" data-video-id="${video.videoId}" data-href="${watchUrl}" role="link" tabindex="0">
      <a href="${watchUrl}" class="card-thumbnail-link" tabindex="-1">
        <div class="card-thumbnail">
          <img
            src="/thumbnails/${video.videoId}"
            alt="${escapeHtml(video.title)}"
            loading="lazy"
            onerror="this.style.display='none'"
          />
        </div>
      </a>
      <div class="card-info">
        <a href="${channelUrl}"
           class="card-avatar"
           style="background:${color}"
           title="${escapeHtml(video.uploaderName)}"
        >${escapeHtml(initial)}</a>
        <div class="card-meta">
          <div class="card-title">${escapeHtml(video.title)}</div>
          <div class="card-channel">
            <a href="${channelUrl}">${escapeHtml(video.uploaderName)}</a>
          </div>
          <div class="card-stats">${views} views · ${time}</div>
        </div>
      </div>
    </div>
  `;
}

// Add click handler for video cards (needed since outer element is <div> not <a>)
document.addEventListener('click', (e) => {
  const card = e.target.closest('.video-card[data-href]');
  if (!card) return;
  // Don't navigate if clicking a link inside the card
  if (e.target.closest('a')) return;
  window.location.href = card.dataset.href;
});

export function renderPagination(page, totalPages, onPage) {
  if (totalPages <= 1) return '';
  const prev = page > 1 ? `<button data-page="${page - 1}">← Prev</button>` : `<button disabled>← Prev</button>`;
  const next = page < totalPages ? `<button data-page="${page + 1}">Next →</button>` : `<button disabled>Next →</button>`;
  return `${prev}<span class="page-info">Page ${page} of ${totalPages}</span>${next}`;
}

// Expose globally for non-module script contexts (legacy compatibility)
window.__api = { apiFetch, formatViews, formatRelativeTime, avatarColor, escapeHtml, renderVideoCard };
