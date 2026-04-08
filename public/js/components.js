const pages = [
  { href: '/', label: 'Dashboard' },
  { href: '/submit.html', label: 'Submit Job' },
  { href: '/batch.html', label: 'Batch Submit' },
];

export function renderNav(currentPage) {
  const nav = document.createElement('nav');
  const brand = document.createElement('a');
  brand.className = 'nav-brand';
  brand.href = '/';
  brand.textContent = 'Job Processor';
  nav.appendChild(brand);

  const links = document.createElement('div');
  links.className = 'nav-links';
  for (const page of pages) {
    const a = document.createElement('a');
    a.href = page.href;
    a.textContent = page.label;
    if (page.href === currentPage) a.className = 'active';
    links.appendChild(a);
  }
  nav.appendChild(links);
  return nav;
}

export function renderStatusBadge(status) {
  const span = document.createElement('span');
  span.className = `badge badge-${status}`;
  span.textContent = status;
  return span;
}

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function renderJobCard(job, options = {}) {
  const card = document.createElement('div');
  card.className = 'card job-card';

  const typeSpan = document.createElement('span');
  typeSpan.className = 'job-type';
  typeSpan.textContent = job.type;
  card.appendChild(typeSpan);

  card.appendChild(renderStatusBadge(job.status));

  const idSpan = document.createElement('span');
  idSpan.className = 'job-id';
  idSpan.textContent = job.id.slice(0, 8);
  card.appendChild(idSpan);

  const timeSpan = document.createElement('span');
  timeSpan.className = 'job-time';
  timeSpan.textContent = timeAgo(job.createdAt);
  card.appendChild(timeSpan);

  const actions = document.createElement('span');
  actions.className = 'job-actions';

  if (job.status === 'review' && options.showReviewActions) {
    const approveBtn = document.createElement('button');
    approveBtn.className = 'btn btn-success btn-sm';
    approveBtn.textContent = 'Approve';
    approveBtn.onclick = (e) => {
      e.stopPropagation();
      if (options.onApprove) options.onApprove(job.id);
    };
    actions.appendChild(approveBtn);

    const rejectBtn = document.createElement('button');
    rejectBtn.className = 'btn btn-danger btn-sm';
    rejectBtn.textContent = 'Reject';
    rejectBtn.onclick = (e) => {
      e.stopPropagation();
      if (options.onReject) options.onReject(job.id);
    };
    actions.appendChild(rejectBtn);
  }

  const viewLink = document.createElement('a');
  viewLink.className = 'btn btn-secondary btn-sm';
  viewLink.href = `/job.html?id=${job.id}`;
  viewLink.textContent = 'View';
  viewLink.onclick = (e) => e.stopPropagation();
  actions.appendChild(viewLink);

  card.appendChild(actions);

  card.onclick = () => {
    window.location.href = `/job.html?id=${job.id}`;
  };

  return card;
}

export function renderJobTable(jobs) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>ID</th><th>Type</th><th>Status</th><th></th></tr>';
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const job of jobs) {
    const tr = document.createElement('tr');

    const tdId = document.createElement('td');
    tdId.style.fontFamily = 'monospace';
    tdId.textContent = job.id.slice(0, 8);
    tr.appendChild(tdId);

    const tdType = document.createElement('td');
    tdType.textContent = job.type;
    tr.appendChild(tdType);

    const tdStatus = document.createElement('td');
    tdStatus.appendChild(renderStatusBadge(job.status));
    tr.appendChild(tdStatus);

    const tdAction = document.createElement('td');
    const link = document.createElement('a');
    link.href = `/job.html?id=${job.id}`;
    link.textContent = 'View';
    link.className = 'btn btn-secondary btn-sm';
    tdAction.appendChild(link);
    tr.appendChild(tdAction);

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}

export function renderEmptyState(message) {
  const div = document.createElement('div');
  div.className = 'empty-state';
  const p = document.createElement('p');
  p.textContent = message;
  div.appendChild(p);
  return div;
}

let toastContainer = null;

export function showToast(message, type = 'success') {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

export function renderLoadingSpinner() {
  const div = document.createElement('div');
  div.className = 'loading-container';
  const spinner = document.createElement('span');
  spinner.className = 'spinner';
  div.appendChild(spinner);
  const text = document.createElement('span');
  text.textContent = 'Loading...';
  div.appendChild(text);
  return div;
}
