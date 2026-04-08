import { createBatch } from './api.js';
import { renderNav, renderJobTable, showToast } from './components.js';

const defaultBatch = JSON.stringify([
  { type: 'transform', input: { records: [{ name: 'A', value: 10, category: 'x' }, { name: 'B', value: 20, category: 'y' }] } },
  { type: 'transform', input: { records: [{ name: 'C', value: 30, category: 'x' }, { name: 'D', value: 40, category: 'z' }] } },
  { type: 'report', input: { reportType: 'sales' } },
], null, 2);

function init() {
  document.body.prepend(renderNav('/batch.html'));

  const textarea = document.getElementById('batch-input');
  const errorEl = document.getElementById('input-error');
  const submitBtn = document.getElementById('submit-btn');
  const resultsDiv = document.getElementById('results');

  textarea.value = defaultBatch;

  submitBtn.addEventListener('click', async () => {
    errorEl.textContent = '';
    resultsDiv.innerHTML = '';
    let jobs;

    try {
      jobs = JSON.parse(textarea.value);
    } catch {
      errorEl.textContent = 'Invalid JSON. Please check your input.';
      return;
    }

    if (!Array.isArray(jobs)) {
      errorEl.textContent = 'Input must be a JSON array of jobs.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';

    try {
      const data = await createBatch(jobs);
      showToast('Batch submitted successfully');

      const successCount = data.jobs.filter(j => j.status === 'complete' || j.status === 'review').length;
      const summary = document.createElement('p');
      summary.style.marginBottom = '0.75rem';
      summary.style.fontWeight = '500';
      summary.textContent = `${successCount} of ${data.jobs.length} jobs completed successfully`;
      resultsDiv.appendChild(summary);
      resultsDiv.appendChild(renderJobTable(data.jobs));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Batch';
    }
  });
}

init();
