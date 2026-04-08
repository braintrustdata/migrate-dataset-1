// @ts-check
import { test, expect } from '@playwright/test';

const REVIEW_INPUT = {
  records: [
    { name: 'Expense 1', value: 500, category: 'Travel' },
    { name: 'Expense 2', value: 1200, category: 'Equipment' },
    { name: 'Expense 3', value: 75, category: 'travel' },
  ],
};

test.describe('Review jobs', () => {
  test('creates a review job in review status', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'review', input: REVIEW_INPUT },
    });
    expect(res.status()).toBe(201);

    const job = await res.json();
    expect(job.type).toBe('review');
    expect(job.status).toBe('review');
    expect(job.result).toBeDefined();
  });

  test('review job has processed transform result', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'review', input: REVIEW_INPUT },
    });
    const job = await res.json();

    // Result should be the transform processing result (pre-approval)
    const result = job.result;
    expect(result.summary).toBeDefined();
    expect(result.totalRecords).toBe(3);

    // travel: 500 + 75 = 575 (two records)
    const travel = result.summary.find((s) => s.category === 'travel');
    expect(travel.count).toBe(2);
    expect(travel.sum).toBe(575);

    // equipment: 1200 (one record)
    const equipment = result.summary.find((s) => s.category === 'equipment');
    expect(equipment.count).toBe(1);
    expect(equipment.sum).toBe(1200);
  });

  test('approve a review job sets status to complete', async ({ request }) => {
    const createRes = await request.post('/api/jobs', {
      data: { type: 'review', input: REVIEW_INPUT },
    });
    const created = await createRes.json();
    expect(created.status).toBe('review');

    const approveRes = await request.post(`/api/jobs/${created.id}/approve`);
    expect(approveRes.status()).toBe(200);

    const approved = await approveRes.json();
    expect(approved.status).toBe('complete');
    expect(approved.result.reviewStatus).toBe('approved');
    expect(approved.result.reviewedAt).toBeTruthy();
    expect(approved.result.processed).toBeDefined();
    expect(approved.result.processed.summary).toBeDefined();
  });

  test('reject a review job sets status to rejected', async ({ request }) => {
    const createRes = await request.post('/api/jobs', {
      data: { type: 'review', input: REVIEW_INPUT },
    });
    const created = await createRes.json();

    const rejectRes = await request.post(`/api/jobs/${created.id}/reject`);
    expect(rejectRes.status()).toBe(200);

    const rejected = await rejectRes.json();
    expect(rejected.status).toBe('rejected');
    expect(rejected.result.reviewStatus).toBe('rejected');
    expect(rejected.result.reviewedAt).toBeTruthy();
  });

  test('cannot approve a non-review job', async ({ request }) => {
    const createRes = await request.post('/api/jobs', {
      data: {
        type: 'transform',
        input: { records: [{ name: 'A', value: 10, category: 'x' }] },
      },
    });
    const job = await createRes.json();
    expect(job.status).toBe('complete');

    const approveRes = await request.post(`/api/jobs/${job.id}/approve`);
    expect(approveRes.status()).toBe(400);
    const body = await approveRes.json();
    expect(body.error).toContain('not in review');
  });

  test('cannot reject a non-review job', async ({ request }) => {
    const createRes = await request.post('/api/jobs', {
      data: {
        type: 'transform',
        input: { records: [{ name: 'A', value: 10, category: 'x' }] },
      },
    });
    const job = await createRes.json();

    const rejectRes = await request.post(`/api/jobs/${job.id}/reject`);
    expect(rejectRes.status()).toBe(400);
  });

  test('cannot approve an already approved job', async ({ request }) => {
    const createRes = await request.post('/api/jobs', {
      data: { type: 'review', input: REVIEW_INPUT },
    });
    const created = await createRes.json();

    await request.post(`/api/jobs/${created.id}/approve`);
    const secondApprove = await request.post(`/api/jobs/${created.id}/approve`);
    expect(secondApprove.status()).toBe(400);
  });

  test('approve 404 for nonexistent job', async ({ request }) => {
    const res = await request.post('/api/jobs/nonexistent-id/approve');
    expect(res.status()).toBe(404);
  });

  test('reject 404 for nonexistent job', async ({ request }) => {
    const res = await request.post('/api/jobs/nonexistent-id/reject');
    expect(res.status()).toBe(404);
  });

  test('review job fails with invalid input', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'review', input: { records: [] } },
    });
    const job = await res.json();
    expect(job.status).toBe('failed');
    expect(job.error).toBeTruthy();
  });
});
