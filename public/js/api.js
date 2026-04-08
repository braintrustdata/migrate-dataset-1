const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

export async function createJob(type, input) {
  return request('/jobs', {
    method: 'POST',
    body: JSON.stringify({ type, input }),
  });
}

export async function createBatch(jobs) {
  return request('/jobs/batch', {
    method: 'POST',
    body: JSON.stringify({ jobs }),
  });
}

export async function listJobs(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return request(`/jobs${query}`);
}

export async function getJob(id) {
  return request(`/jobs/${encodeURIComponent(id)}`);
}

export async function approveJob(id) {
  return request(`/jobs/${encodeURIComponent(id)}/approve`, { method: 'POST' });
}

export async function rejectJob(id) {
  return request(`/jobs/${encodeURIComponent(id)}/reject`, { method: 'POST' });
}

export async function deleteJob(id) {
  return request(`/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
