import { apiFetch, renderVideoCard, renderPagination, avatarColor, escapeHtml, formatViews, formatRelativeTime } from './api.js';

const params = new URLSearchParams(window.location.search);
const username = params.get('u');

let currentPage = 1;

async function loadChannel() {
  if (!username) {
    document.getElementById('channelNameHeading').textContent = 'Channel not found';
    return;
  }

  try {
    const channel = await apiFetch(`/api/channels/${encodeURIComponent(username)}`);
    renderChannelHeader(channel);
  } catch (err) {
    document.getElementById('channelNameHeading').textContent = username;
  }

  loadChannelVideos(1);
}

function renderChannelHeader(ch) {
  document.title = `${ch.username} — VidLocal`;

  const color = avatarColor(ch.username);
  const banner = document.getElementById('channelBanner');
  banner.style.background = `linear-gradient(135deg, ${color}, #1a1a1a)`;

  const avatarLarge = document.getElementById('channelAvatarLarge');
  avatarLarge.style.background = color;
  avatarLarge.textContent = ch.username.charAt(0).toUpperCase();

  document.getElementById('channelNameHeading').textContent = ch.username;
  document.getElementById('channelMeta').textContent =
    `${ch.videoCount || 0} video${ch.videoCount !== 1 ? 's' : ''} · ${formatViews(ch.totalViews || 0)} total views`;

  document.getElementById('channelBio').textContent = ch.bio || 'No description provided.';
}

async function loadChannelVideos(page) {
  const grid = document.getElementById('channelVideoGrid');
  grid.innerHTML = '<p style="color:#aaa;padding:24px">Loading…</p>';

  try {
    const data = await apiFetch(`/api/channels/${encodeURIComponent(username)}/videos?page=${page}&limit=12`);
    currentPage = data.page;

    if (!data.videos || data.videos.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <h2>No videos yet</h2>
          <p><a href="/upload" style="color:#3ea6ff">Upload a video</a></p>
        </div>`;
      document.getElementById('channelPagination').innerHTML = '';
      return;
    }

    grid.innerHTML = data.videos.map(renderVideoCard).join('');
    renderPaginationNav(data.page, data.totalPages);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><h2>Failed to load</h2><p>${escapeHtml(err.message)}</p></div>`;
  }
}

function renderPaginationNav(page, totalPages) {
  const pag = document.getElementById('channelPagination');
  pag.innerHTML = renderPagination(page, totalPages);
  pag.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => loadChannelVideos(parseInt(btn.dataset.page)));
  });
}

// Tab switching
document.querySelectorAll('.channel-tabs a').forEach(tab => {
  tab.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.channel-tabs a').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const name = tab.dataset.tab;
    document.getElementById('videosTab').style.display = name === 'videos' ? '' : 'none';
    document.getElementById('aboutTab').style.display = name === 'about' ? '' : 'none';
  });
});

loadChannel();
