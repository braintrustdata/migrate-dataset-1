import { apiFetch, renderVideoCard, renderPagination, escapeHtml } from './api.js';

const grid = document.getElementById('videoGrid');
const pagination = document.getElementById('pagination');
const chips = document.querySelectorAll('.chip');

let currentPage = 1;
let currentSort = 'newest';

async function loadVideos(page = 1, sort = 'newest') {
  grid.innerHTML = renderSkeletons(12);
  try {
    const data = await apiFetch(`/api/videos?page=${page}&limit=12&sort=${sort}`);
    renderGrid(data);
    renderNav(data.page, data.totalPages);
    currentPage = data.page;
  } catch (err) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <h2>Could not load videos</h2>
        <p>${escapeHtml(err.message)}</p>
      </div>`;
    pagination.innerHTML = '';
  }
}

function renderGrid(data) {
  if (!data.videos || data.videos.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <h2>No videos yet</h2>
        <p><a href="/upload" style="color:#3ea6ff">Upload the first video!</a></p>
      </div>`;
    return;
  }
  grid.innerHTML = data.videos.map(renderVideoCard).join('');
}

function renderNav(page, totalPages) {
  pagination.innerHTML = renderPagination(page, totalPages);
  pagination.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.page);
      currentPage = p;
      loadVideos(p, currentSort);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function renderSkeletons(n) {
  return Array.from({ length: n }, () => `
    <div class="video-card skeleton-card" aria-hidden="true">
      <div class="card-thumbnail skeleton" style="padding-top:56.25%;border-radius:8px;"></div>
      <div class="card-info" style="margin-top:10px">
        <div class="skeleton" style="width:36px;height:36px;border-radius:50%;flex-shrink:0;"></div>
        <div style="flex:1;margin-left:10px">
          <div class="skeleton" style="height:14px;margin-bottom:6px;border-radius:4px;"></div>
          <div class="skeleton" style="height:12px;width:60%;border-radius:4px;"></div>
        </div>
      </div>
    </div>
  `).join('');
}

// Filter chips
chips.forEach(chip => {
  chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentSort = chip.dataset.sort;
    loadVideos(1, currentSort);
  });
});

// Initial load
loadVideos(1, currentSort);
