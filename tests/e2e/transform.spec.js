// @ts-check
import { test, expect } from '@playwright/test';

const TRANSFORM_INPUT = {
  records: [
    { name: 'Item 1', value: 10, category: 'Electronics' },
    { name: 'Item 2', value: 25, category: 'electronics' },
    { name: 'Item 3', value: 15, category: 'Books' },
    { name: 'Item 4', value: 30, category: 'books' },
    { name: 'Item 5', value: 20, category: 'Electronics' },
  ],
};

test.describe('Transform jobs', () => {
  test('creates and processes a transform job', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'transform', input: TRANSFORM_INPUT },
    });
    expect(res.status()).toBe(201);

    const job = await res.json();
    expect(job.id).toBeTruthy();
    expect(job.type).toBe('transform');
    expect(job.status).toBe('complete');
    expect(job.error).toBeUndefined();
    expect(job.result).toBeDefined();
    expect(job.createdAt).toBeTruthy();
    expect(job.updatedAt).toBeTruthy();
  });

  test('normalizes categories to lowercase and groups them', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'transform', input: TRANSFORM_INPUT },
    });
    const job = await res.json();
    const { summary } = job.result;

    // "Electronics" and "electronics" merge into "electronics"
    // "Books" and "books" merge into "books"
    expect(summary).toHaveLength(2);

    const books = summary.find((s) => s.category === 'books');
    expect(books).toBeDefined();
    expect(books.count).toBe(2);
    expect(books.sum).toBe(45); // 15 + 30
    expect(books.average).toBe(22.5);

    const electronics = summary.find((s) => s.category === 'electronics');
    expect(electronics).toBeDefined();
    expect(electronics.count).toBe(3);
    expect(electronics.sum).toBe(55); // 10 + 25 + 20
    expect(electronics.average).toBeCloseTo(18.33, 1);
  });

  test('results are sorted alphabetically by category', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'transform', input: TRANSFORM_INPUT },
    });
    const job = await res.json();
    const categories = job.result.summary.map((s) => s.category);
    expect(categories).toEqual([...categories].sort());
  });

  test('sets totalRecords count', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'transform', input: TRANSFORM_INPUT },
    });
    const job = await res.json();
    expect(job.result.totalRecords).toBe(5);
  });

  test('sets processedAt timestamp', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'transform', input: TRANSFORM_INPUT },
    });
    const job = await res.json();
    expect(job.result.processedAt).toBeTruthy();
    // Should be a valid ISO date
    expect(new Date(job.result.processedAt).toISOString()).toBe(job.result.processedAt);
  });

  test('clamps negative values to 0', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: {
        type: 'transform',
        input: {
          records: [
            { name: 'A', value: -10, category: 'test' },
            { name: 'B', value: 20, category: 'test' },
          ],
        },
      },
    });
    const job = await res.json();
    expect(job.status).toBe('complete');
    const group = job.result.summary.find((s) => s.category === 'test');
    expect(group.sum).toBe(20); // -10 clamped to 0, + 20
    expect(group.count).toBe(2);
    expect(group.average).toBe(10);
  });

  test('trims whitespace from name and category', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: {
        type: 'transform',
        input: {
          records: [
            { name: '  A  ', value: 10, category: '  Test  ' },
            { name: 'B', value: 20, category: 'test' },
          ],
        },
      },
    });
    const job = await res.json();
    expect(job.status).toBe('complete');
    // Both should be in "test" category after trim + lowercase
    expect(job.result.summary).toHaveLength(1);
    expect(job.result.summary[0].category).toBe('test');
    expect(job.result.summary[0].count).toBe(2);
  });

  test('fails with empty records array', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: {
        type: 'transform',
        input: { records: [] },
      },
    });
    expect(res.status()).toBe(201);
    const job = await res.json();
    expect(job.status).toBe('failed');
    expect(job.error).toContain('non-empty');
  });

  test('fails with missing records field', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: {
        type: 'transform',
        input: {},
      },
    });
    const job = await res.json();
    expect(job.status).toBe('failed');
    expect(job.error).toBeTruthy();
  });

  test('fails with invalid record structure', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: {
        type: 'transform',
        input: {
          records: [{ name: 'A', value: 'not a number', category: 'test' }],
        },
      },
    });
    const job = await res.json();
    expect(job.status).toBe('failed');
    expect(job.error).toContain('number');
  });
});
