// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Report jobs', () => {
  test('creates a sales report', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'report', input: { reportType: 'sales' } },
    });
    expect(res.status()).toBe(201);

    const job = await res.json();
    expect(job.status).toBe('complete');
    expect(job.result.sources.sales).toBeDefined();
    expect(job.result.sources.inventory).toBeUndefined();
    expect(job.result.sources.customers).toBeUndefined();
  });

  test('sales report has correct stubbed data', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'report', input: { reportType: 'sales' } },
    });
    const job = await res.json();
    const sales = job.result.sources.sales;

    expect(sales.total).toBe(26600);
    expect(sales.items).toHaveLength(5);
    expect(sales.items[0]).toEqual({ product: 'Widget A', quantity: 150, revenue: 4500 });
    expect(sales.items[4]).toEqual({ product: 'Gizmo Z', quantity: 300, revenue: 6000 });
  });

  test('creates an inventory report', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'report', input: { reportType: 'inventory' } },
    });
    expect(res.status()).toBe(201);

    const job = await res.json();
    expect(job.status).toBe('complete');
    expect(job.result.sources.sales).toBeUndefined();
    expect(job.result.sources.inventory).toBeDefined();
    expect(job.result.sources.customers).toBeUndefined();
  });

  test('inventory report has correct stubbed data', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'report', input: { reportType: 'inventory' } },
    });
    const job = await res.json();
    const inventory = job.result.sources.inventory;

    expect(inventory.items).toHaveLength(5);
    expect(inventory.items[0]).toEqual({ product: 'Widget A', inStock: 500, reorderLevel: 100 });
    expect(inventory.items[3]).toEqual({ product: 'Gadget Y', inStock: 10, reorderLevel: 50 });
  });

  test('creates a combined report with all sources', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'report', input: { reportType: 'combined' } },
    });
    expect(res.status()).toBe(201);

    const job = await res.json();
    expect(job.status).toBe('complete');
    expect(job.result.sources.sales).toBeDefined();
    expect(job.result.sources.inventory).toBeDefined();
    expect(job.result.sources.customers).toBeDefined();
  });

  test('combined report has customer data', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'report', input: { reportType: 'combined' } },
    });
    const job = await res.json();
    const customers = job.result.sources.customers;

    expect(customers.totalCustomers).toBe(1250);
    expect(customers.activeCustomers).toBe(890);
    expect(customers.topCustomers).toHaveLength(3);
    expect(customers.topCustomers[0]).toEqual({ name: 'Acme Corp', spend: 15000 });
  });

  test('combined report has cross-reference data', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'report', input: { reportType: 'combined' } },
    });
    const job = await res.json();
    const crossRef = job.result.merged.crossReference;

    expect(crossRef).toBeDefined();
    expect(crossRef).toHaveLength(5);

    // Widget B: inStock 50, reorderLevel 100 → lowStock true
    const widgetB = crossRef.find((c) => c.product === 'Widget B');
    expect(widgetB.lowStock).toBe(true);
    expect(widgetB.inStock).toBe(50);
    expect(widgetB.quantity).toBe(85);

    // Widget A: inStock 500, reorderLevel 100 → lowStock false
    const widgetA = crossRef.find((c) => c.product === 'Widget A');
    expect(widgetA.lowStock).toBe(false);
  });

  test('combined report merged object has reportType', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'report', input: { reportType: 'combined' } },
    });
    const job = await res.json();
    expect(job.result.merged.reportType).toBe('combined');
  });

  test('report has generatedAt timestamp', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'report', input: { reportType: 'sales' } },
    });
    const job = await res.json();
    expect(job.result.generatedAt).toBeTruthy();
    expect(new Date(job.result.generatedAt).toISOString()).toBe(job.result.generatedAt);
  });

  test('fails with invalid reportType', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'report', input: { reportType: 'invalid' } },
    });
    const job = await res.json();
    expect(job.status).toBe('failed');
    expect(job.error).toContain('reportType');
  });

  test('fails with missing reportType', async ({ request }) => {
    const res = await request.post('/api/jobs', {
      data: { type: 'report', input: {} },
    });
    const job = await res.json();
    expect(job.status).toBe('failed');
    expect(job.error).toBeTruthy();
  });
});
