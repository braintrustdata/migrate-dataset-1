import { apiFetch, escapeHtml, avatarColor, formatViews, formatRelativeTime, renderPagination } from './api.js';

const params = new URLSearchParams(window.location.search);
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const resultCount = document.getElementById('resultCount');
const searchResults = document.getElementById('searchResults');
const paginationEl = document.getElementById('searchPagination');

let currentQuery = params.get('q') || '';
let currentSort = 'relevance';
let currentPage = 1;
let debounceTimer = null;

// Pre-fill search input
if (searchInput) searchInput.value = currentQuery;

async function doSearch(q, sort = 'relevance', page = 1) {
  currentQuery = q;
  currentSort = sort;
  currentPage = page;

  // Update URL without reload
  const url = new URL(window.location.href);
  url.searchParams.set('q', q);
  url.searchParams.set('sort', sort);
  if (page > 1) url.searchParams.set('page', page);
  else url.searchParams.delete('page');
  window.history.replaceState({}, '', url.toString());

  searchResults.innerHTML = '<p style="color:#aaa;padding:24px 0">Searching…</p>';
  paginationEl.innerHTML = '';
  resultCount.textContent = '';

  try {
    const data = await apiFetch(`/api/search?q=${encodeURIComponent(q)}&sort=${sort}&page=${page}&limit=12`);
    renderResults(data);
  } catch (err) {
    searchResults.innerHTML = `<div class="empty-state"><h2>Search failed</h2><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function renderResults(data) {
  resultCount.textContent = data.total
    ? `${data.total} result${data.total !== 1 ? 's' : ''} for "${escapeHtml(currentQuery)}"`
    : '';

  if (!data.videos || data.videos.length === 0) {
    searchResults.innerHTML = `
      <div class="empty-state">
        <h2>No videos found</h2>
        <p>Try different keywords or <a href="/upload" style="color:#3ea6ff">upload a video</a>.</p>
      </div>`;
    paginationEl.innerHTML = '';
    return;
  }

  searchResults.innerHTML = data.videos.map(renderSearchCard).join('');

  paginationEl.innerHTML = renderPagination(data.page, data.totalPages);
  paginationEl.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => doSearch(currentQuery, currentSort, parseInt(btn.dataset.page)));
  });
}

function renderSearchCard(v) {
  const color = avatarColor(v.uploaderName);
  const views = formatViews(v.views || 0);
  const time = formatRelativeTime(v.createdAt);
  return `
    <a href="/watch?v=${v.videoId}" class="search-card">
      <div class="card-thumbnail" style="width:240px;min-width:240px;height:135px;padding-top:0;">
        <img src="/thumbnails/${v.videoId}" alt="${escapeHtml(v.title)}" loading="lazy"
          style="width:100%;height:100%;object-fit:cover;border-radius:8px;"
          onerror="this.style.display='none'" />
      </div>
      <div class="search-card-info">
        <div class="search-card-title">${escapeHtml(v.title)}</div>
        <div class="search-card-meta">
          <span style="color:${color}">${escapeHtml(v.uploaderName)}</span> ·
          ${views} views · ${time}
        </div>
        ${v.description ? `<div class="search-card-description">${escapeHtml(v.description)}</div>` : ''}
        ${v.tags && v.tags.length ? `<div style="margin-top:6px">${v.tags.map(t => `<span style="color:#3ea6ff;font-size:12px;margin-right:6px">#${escapeHtml(t)}</span>`).join('')}</div>` : ''}
      </div>
    </a>
  `;
}

// Sort select
sortSelect?.addEventListener('change', () => {
  doSearch(currentQuery, sortSelect.value, 1);
});

// Search input debounce (for typing in the header search bar on this page)
searchInput?.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    doSearch(searchInput.value.trim(), currentSort, 1);
  }, 400);
});

// Initial search
doSearch(currentQuery, currentSort, parseInt(params.get('page') || '1'));
