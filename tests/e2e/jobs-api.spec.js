// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Jobs API — CRUD and batch', () => {
  test('GET /api/jobs returns empty list initially', async ({ request }) => {
    // Note: in-memory store persists across tests in the same worker run,
    // so this test may see jobs from prior tests. We just check the shape.
    const res = await request.get('/api/jobs');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.jobs).toBeDefined();
    expect(Array.isArray(body.jobs)).toBe(true);
  });

  test('GET /api/jobs/:id returns a created job', async ({ request }) => {
    const createRes = await request.post('/api/jobs', {
      data: {
        type: 'transform',
        input: { records: [{ name: 'A', value: 5, category: 'cat' }] },
      },
    });
    const created = await createRes.json();

    const getRes = await request.get(`/api/jobs/${created.id}`);
    expect(getRes.status()).toBe(200);
    const fetched = await getRes.json();
    expect(fetched.id).toBe(created.id);
    expect(fetched.type).toBe('transform');
    expect(fetched.status).toBe('complete');
  });

  test('GET /api/jobs/:id returns 404 for nonexistent job', async ({ request }) => {
    const res = await request.get('/api/jobs/does-not-exist');
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Job not found');
  });

  test('DELETE /api/jobs/:id deletes a job', async ({ request }) => {
    const createRes = await request.post('/api/jobs', {
      data: {
        type: 'transform',
        input: { records: [{ name: 'X', value: 1, category: 'z' }] },
      },
    });
    const created = await createRes.json();

    const deleteRes = await request.delete(`/api/jobs/${created.id}`);
    expect(deleteRes.status()).toBe(204);

    const getRes = await request.get(`/api/jobs/${created.id}`);
    expect(getRes.status()).toBe(404);
  });

  test('DELETE /api/jobs/:id returns 404 for nonexistent job', async ({ request }) => {
    const res = await request.delete('/api/jobs/does-not-exist');
    expect(res.status()).toBe(404);
  });

  test('GET /api/jobs?status= filters by status', async ({ request }) => {
    // Create a review job (status: review) and a transform job (status: complete)
    await request.post('/api/jobs', {
      data: {
        type: 'review',
        input: { records: [{ name: 'R', value: 10, category: 'x' }] },
      },
    });
    await request.post('/api/jobs', {
      data: {
        type: 'transform',
        input: { records: [{ name: 'T', value: 10, category: 'x' }] },
      },
    });

    const reviewRes = await request.get('/api/jobs?status=review');
    const reviewBody = await reviewRes.json();
    expect(reviewBody.jobs.length).toBeGreaterThanOrEqual(1);
    for (const job of reviewBody.jobs) {
      expect(job.status).toBe('review');
    }

    const completeRes = await request.get('/api/jobs?status=complete');
    const completeBody = await completeRes.json();
    expect(completeBody.jobs.length).toBeGreaterThanOrEqual(1);
    for (const job of completeBody.jobs) {
      expect(job.status).toBe('complete');
    }
  });

  test('POST /api/jobs returns 400 for missing type', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { input: { records: [] } },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test('POST /api/jobs returns 400 for invalid type', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'invalid', input: {} },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid job type');
  });

  test('POST /api/jobs returns 400 for missing input', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'transform' },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe('Batch jobs', () => {
  test('POST /api/jobs/batch processes multiple jobs', async ({ request }) => {
    const res = await request.post('/api/jobs/batch', {
      data: {
        jobs: [
          { type: 'transform', input: { records: [{ name: 'A', value: 10, category: 'x' }] } },
          { type: 'transform', input: { records: [{ name: 'B', value: 20, category: 'y' }] } },
          { type: 'report', input: { reportType: 'sales' } },
        ],
      },
    });
    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.jobs).toHaveLength(3);
    expect(body.jobs[0].status).toBe('complete');
    expect(body.jobs[1].status).toBe('complete');
    expect(body.jobs[2].status).toBe('complete');
  });

  test('batch with mixed success and failure', async ({ request }) => {
    const res = await request.post('/api/jobs/batch', {
      data: {
        jobs: [
          { type: 'transform', input: { records: [{ name: 'A', value: 10, category: 'x' }] } },
          { type: 'transform', input: { records: [] } }, // will fail validation
          { type: 'report', input: { reportType: 'inventory' } },
        ],
      },
    });
    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.jobs).toHaveLength(3);
    expect(body.jobs[0].status).toBe('complete');
    expect(body.jobs[1].status).toBe('failed');
    expect(body.jobs[2].status).toBe('complete');
  });

  test('batch with review jobs returns review status', async ({ request }) => {
    const res = await request.post('/api/jobs/batch', {
      data: {
        jobs: [
          { type: 'review', input: { records: [{ name: 'A', value: 10, category: 'x' }] } },
          { type: 'transform', input: { records: [{ name: 'B', value: 20, category: 'y' }] } },
        ],
      },
    });
    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.jobs[0].status).toBe('review');
    expect(body.jobs[1].status).toBe('complete');
  });

  test('batch returns 400 for missing jobs array', async ({ request }) => {
    const res = await request.post('/api/jobs/batch', {
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test('each batch job gets a unique id', async ({ request }) => {
    const res = await request.post('/api/jobs/batch', {
      data: {
        jobs: [
          { type: 'transform', input: { records: [{ name: 'A', value: 1, category: 'a' }] } },
          { type: 'transform', input: { records: [{ name: 'B', value: 2, category: 'b' }] } },
        ],
      },
    });
    const body = await res.json();
    expect(body.jobs[0].id).not.toBe(body.jobs[1].id);
  });

  test('batch jobs are retrievable individually', async ({ request }) => {
    const res = await request.post('/api/jobs/batch', {
      data: {
        jobs: [
          { type: 'report', input: { reportType: 'sales' } },
        ],
      },
    });
    const body = await res.json();
    const id = body.jobs[0].id;

    const getRes = await request.get(`/api/jobs/${id}`);
    expect(getRes.status()).toBe(200);
    const fetched = await getRes.json();
    expect(fetched.id).toBe(id);
    expect(fetched.type).toBe('report');
  });
});
