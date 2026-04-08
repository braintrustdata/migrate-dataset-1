import { getJob, approveJob, rejectJob, deleteJob } from './api.js';
import { renderNav, renderStatusBadge, renderLoadingSpinner, showToast } from './components.js';

const app = document.getElementById('app');
let pollingInterval = null;

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

function renderTransformResult(result) {
  const div = document.createElement('div');
  const table = document.createElement('table');
  let thead = '<thead><tr><th>Category</th><th>Count</th><th>Sum</th><th>Average</th></tr></thead>';
  let rows = '';
  let totalCount = 0, totalSum = 0;

  for (const row of result.summary) {
    rows += `<tr><td>${row.category}</td><td>${row.count}</td><td>${row.sum}</td><td>${row.average}</td></tr>`;
    totalCount += row.count;
    totalSum += row.sum;
  }
  rows += `<tr style="font-weight:600"><td>Total</td><td>${totalCount}</td><td>${totalSum}</td><td>${totalCount ? (Math.round(totalSum / totalCount * 100) / 100) : 0}</td></tr>`;

  table.innerHTML = thead + '<tbody>' + rows + '</tbody>';
  div.appendChild(table);
  return div;
}

function renderReportResult(result) {
  const div = document.createElement('div');

  if (result.sources.sales) {
    const h3 = document.createElement('h2');
    h3.textContent = 'Sales';
    h3.style.marginTop = '1rem';
    div.appendChild(h3);
    const table = document.createElement('table');
    let rows = '';
    for (const item of result.sources.sales.items) {
      rows += `<tr><td>${item.product}</td><td>${item.quantity}</td><td>$${item.revenue.toLocaleString()}</td></tr>`;
    }
    table.innerHTML = `<thead><tr><th>Product</th><th>Quantity</th><th>Revenue</th></tr></thead><tbody>${rows}<tr style="font-weight:600"><td>Total</td><td></td><td>$${result.sources.sales.total.toLocaleString()}</td></tr></tbody>`;
    div.appendChild(table);
  }

  if (result.sources.inventory) {
    const h3 = document.createElement('h2');
    h3.textContent = 'Inventory';
    h3.style.marginTop = '1rem';
    div.appendChild(h3);
    const table = document.createElement('table');
    let rows = '';
    for (const item of result.sources.inventory.items) {
      const low = item.inStock <= item.reorderLevel;
      rows += `<tr><td>${item.product}</td><td>${item.inStock}${low ? ' <span style="color:var(--color-danger)">(Low)</span>' : ''}</td><td>${item.reorderLevel}</td></tr>`;
    }
    table.innerHTML = `<thead><tr><th>Product</th><th>In Stock</th><th>Reorder Level</th></tr></thead><tbody>${rows}</tbody>`;
    div.appendChild(table);
  }

  if (result.sources.customers) {
    const h3 = document.createElement('h2');
    h3.textContent = 'Customers';
    h3.style.marginTop = '1rem';
    div.appendChild(h3);
    const p = document.createElement('p');
    p.textContent = `Total: ${result.sources.customers.totalCustomers} | Active: ${result.sources.customers.activeCustomers}`;
    p.style.marginBottom = '0.5rem';
    div.appendChild(p);
    const table = document.createElement('table');
    let rows = '';
    for (const c of result.sources.customers.topCustomers) {
      rows += `<tr><td>${c.name}</td><td>$${c.spend.toLocaleString()}</td></tr>`;
    }
    table.innerHTML = `<thead><tr><th>Top Customer</th><th>Spend</th></tr></thead><tbody>${rows}</tbody>`;
    div.appendChild(table);
  }

  if (result.merged.crossReference) {
    const h3 = document.createElement('h2');
    h3.textContent = 'Cross Reference';
    h3.style.marginTop = '1rem';
    div.appendChild(h3);
    const table = document.createElement('table');
    let rows = '';
    for (const item of result.merged.crossReference) {
      rows += `<tr><td>${item.product}</td><td>${item.quantity}</td><td>$${item.revenue.toLocaleString()}</td><td>${item.inStock}</td><td>${item.lowStock ? '<span style="color:var(--color-danger)">Yes</span>' : 'No'}</td></tr>`;
    }
    table.innerHTML = `<thead><tr><th>Product</th><th>Sold</th><th>Revenue</th><th>In Stock</th><th>Low Stock</th></tr></thead><tbody>${rows}</tbody>`;
    div.appendChild(table);
  }

  return div;
}

function renderJobDetail(job) {
  const content = document.getElementById('content');
  content.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.className = 'detail-header';
  const h1 = document.createElement('h1');
  h1.textContent = `${job.type.charAt(0).toUpperCase() + job.type.slice(1)} Job`;
  header.appendChild(h1);
  header.appendChild(renderStatusBadge(job.status));
  content.appendChild(header);

  // Meta
  const meta = document.createElement('div');
  meta.className = 'detail-meta';
  meta.innerHTML = `
    <span>ID: <code>${job.id}</code></span>
    <span>Created: ${new Date(job.createdAt).toLocaleString()} (${timeAgo(job.createdAt)})</span>
    <span>Updated: ${new Date(job.updatedAt).toLocaleString()} (${timeAgo(job.updatedAt)})</span>
  `;
  content.appendChild(meta);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'actions-bar';

  if (job.status === 'review') {
    const approveBtn = document.createElement('button');
    approveBtn.className = 'btn btn-success';
    approveBtn.textContent = 'Approve';
    approveBtn.onclick = async () => {
      try {
        await approveJob(job.id);
        showToast('Job approved');
        loadJob(job.id);
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
    actions.appendChild(approveBtn);

    const rejectBtn = document.createElement('button');
    rejectBtn.className = 'btn btn-danger';
    rejectBtn.textContent = 'Reject';
    rejectBtn.onclick = async () => {
      try {
        await rejectJob(job.id);
        showToast('Job rejected');
        loadJob(job.id);
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
    actions.appendChild(rejectBtn);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-danger';
  deleteBtn.textContent = 'Delete';
  deleteBtn.onclick = async () => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    try {
      await deleteJob(job.id);
      showToast('Job deleted');
      window.location.href = '/';
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  actions.appendChild(deleteBtn);

  content.appendChild(actions);

  // Error
  if (job.status === 'failed' && job.error) {
    const errorBanner = document.createElement('div');
    errorBanner.className = 'error-banner';
    errorBanner.textContent = job.error;
    content.appendChild(errorBanner);
  }

  // Input
  const inputSection = document.createElement('details');
  inputSection.className = 'collapsible section card';
  inputSection.open = true;
  const inputSummary = document.createElement('summary');
  inputSummary.textContent = 'Input';
  inputSection.appendChild(inputSummary);
  const inputPre = document.createElement('pre');
  inputPre.textContent = JSON.stringify(job.input, null, 2);
  inputSection.appendChild(inputPre);
  content.appendChild(inputSection);

  // Result
  if (job.status === 'complete' && job.result) {
    const resultSection = document.createElement('div');
    resultSection.className = 'section card';
    const h2 = document.createElement('h2');
    h2.textContent = 'Result';
    resultSection.appendChild(h2);

    if (job.type === 'transform') {
      resultSection.appendChild(renderTransformResult(job.result));
    } else if (job.type === 'report') {
      resultSection.appendChild(renderReportResult(job.result));
    } else if (job.type === 'review') {
      const reviewResult = job.result;
      if (reviewResult.processed) {
        resultSection.appendChild(renderTransformResult(reviewResult.processed));
      }
      const statusP = document.createElement('p');
      statusP.style.marginTop = '0.75rem';
      statusP.innerHTML = `<strong>Review Status:</strong> ${reviewResult.reviewStatus}`;
      if (reviewResult.reviewedAt) {
        statusP.innerHTML += ` | <strong>Reviewed:</strong> ${new Date(reviewResult.reviewedAt).toLocaleString()}`;
      }
      resultSection.appendChild(statusP);
    }

    content.appendChild(resultSection);
  }

  // Review result (pre-approval)
  if (job.status === 'review' && job.result) {
    const resultSection = document.createElement('div');
    resultSection.className = 'section card';
    const h2 = document.createElement('h2');
    h2.textContent = 'Processed Result (Awaiting Review)';
    resultSection.appendChild(h2);
    resultSection.appendChild(renderTransformResult(job.result));
    content.appendChild(resultSection);
  }

  // Polling for pending/processing
  if (job.status === 'pending' || job.status === 'processing') {
    const pollingDiv = document.createElement('div');
    pollingDiv.className = 'loading-container';
    pollingDiv.innerHTML = '<span class="spinner"></span> <span>Processing...</span>';
    content.appendChild(pollingDiv);

    if (!pollingInterval) {
      pollingInterval = setInterval(() => loadJob(job.id), 1000);
    }
  } else if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

async function loadJob(id) {
  const content = document.getElementById('content');
  try {
    const job = await getJob(id);
    renderJobDetail(job);
  } catch (err) {
    content.innerHTML = '';
    const notFound = document.createElement('div');
    notFound.className = 'empty-state';
    notFound.innerHTML = `<p>Job not found</p><a href="/" class="btn btn-primary">Back to Dashboard</a>`;
    content.appendChild(notFound);
  }
}

function init() {
  document.body.prepend(renderNav(null));

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const content = document.createElement('div');
  content.id = 'content';
  app.appendChild(content);

  if (!id) {
    content.innerHTML = '<div class="empty-state"><p>No job ID provided</p><a href="/" class="btn btn-primary">Back to Dashboard</a></div>';
    return;
  }

  content.appendChild(renderLoadingSpinner());
  loadJob(id);
}

init();
