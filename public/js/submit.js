import { createJob } from './api.js';
import { renderNav, showToast } from './components.js';

const samples = {
  transform: JSON.stringify({
    records: [
      { name: 'Item 1', value: 10, category: 'Electronics' },
      { name: 'Item 2', value: 25, category: 'electronics' },
      { name: 'Item 3', value: 15, category: 'Books' },
      { name: 'Item 4', value: 30, category: 'books' },
      { name: 'Item 5', value: 20, category: 'Electronics' },
    ],
  }, null, 2),
  report: JSON.stringify({
    reportType: 'combined',
  }, null, 2),
  review: JSON.stringify({
    records: [
      { name: 'Expense 1', value: 500, category: 'Travel' },
      { name: 'Expense 2', value: 1200, category: 'Equipment' },
      { name: 'Expense 3', value: 75, category: 'travel' },
    ],
  }, null, 2),
};

const descriptions = {
  transform: 'Validate, normalize, and aggregate records by category',
  report: 'Generate a report from sales, inventory, and customer data',
  review: 'Process records and park for human approval before completing',
};

function init() {
  document.body.prepend(renderNav('/submit.html'));

  const textarea = document.getElementById('job-input');
  const errorEl = document.getElementById('input-error');
  const submitBtn = document.getElementById('submit-btn');
  const descEl = document.getElementById('type-description');
  const radios = document.querySelectorAll('input[name="jobType"]');

  function getSelectedType() {
    for (const r of radios) {
      if (r.checked) return r.value;
    }
    return 'transform';
  }

  function updateSample() {
    const type = getSelectedType();
    textarea.value = samples[type];
    descEl.textContent = descriptions[type];
    errorEl.textContent = '';
  }

  for (const r of radios) {
    r.addEventListener('change', updateSample);
  }

  updateSample();

  submitBtn.addEventListener('click', async () => {
    errorEl.textContent = '';
    const type = getSelectedType();
    let input;

    try {
      input = JSON.parse(textarea.value);
    } catch {
      errorEl.textContent = 'Invalid JSON. Please check your input.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';

    try {
      const job = await createJob(type, input);
      showToast('Job created successfully');
      setTimeout(() => {
        window.location.href = `/job.html?id=${job.id}`;
      }, 500);
    } catch (err) {
      showToast(err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Job';
    }
  });
}

init();
