import { listJobs, approveJob, rejectJob } from './api.js';
import { renderNav, renderJobCard, renderEmptyState, renderLoadingSpinner, showToast } from './components.js';

const app = document.getElementById('app');

function renderStats(jobs) {
  const counts = {};
  for (const job of jobs) {
    counts[job.status] = (counts[job.status] || 0) + 1;
  }

  const row = document.createElement('div');
  row.className = 'stats-row';

  const totalCard = document.createElement('div');
  totalCard.className = 'card stat-card';
  totalCard.innerHTML = `<div class="stat-value">${jobs.length}</div><div class="stat-label">Total Jobs</div>`;
  row.appendChild(totalCard);

  const statuses = ['complete', 'processing', 'pending', 'review', 'failed', 'rejected'];
  for (const status of statuses) {
    if (counts[status]) {
      const card = document.createElement('div');
      card.className = 'card stat-card';
      card.innerHTML = `<div class="stat-value">${counts[status]}</div><div class="stat-label">${status}</div>`;
      row.appendChild(card);
    }
  }

  return row;
}

async function handleApprove(id) {
  try {
    await approveJob(id);
    showToast('Job approved');
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleReject(id) {
  try {
    await rejectJob(id);
    showToast('Job rejected');
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadDashboard() {
  const content = document.getElementById('content');

  try {
    const data = await listJobs();
    const jobs = data.jobs;
    content.innerHTML = '';

    content.appendChild(renderStats(jobs));

    const quickActions = document.createElement('div');
    quickActions.className = 'quick-actions';
    quickActions.innerHTML = `
      <a href="/submit.html" class="btn btn-primary">Submit Job</a>
      <a href="/batch.html" class="btn btn-secondary">Batch Submit</a>
    `;
    content.appendChild(quickActions);

    const section = document.createElement('div');
    section.className = 'section';
    const h2 = document.createElement('h2');
    h2.textContent = 'Recent Jobs';
    section.appendChild(h2);

    if (jobs.length === 0) {
      section.appendChild(renderEmptyState('No jobs yet. Submit your first job!'));
    } else {
      const sorted = [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
      const list = document.createElement('div');
      list.className = 'job-list';
      for (const job of sorted) {
        list.appendChild(renderJobCard(job, {
          showReviewActions: true,
          onApprove: handleApprove,
          onReject: handleReject,
        }));
      }
      section.appendChild(list);
    }

    content.appendChild(section);
  } catch (err) {
    content.innerHTML = '';
    showToast(err.message, 'error');
  }
}

function init() {
  document.body.prepend(renderNav('/'));

  const content = document.createElement('div');
  content.id = 'content';
  content.appendChild(renderLoadingSpinner());
  app.appendChild(content);

  loadDashboard();
  setInterval(loadDashboard, 3000);
}

init();
