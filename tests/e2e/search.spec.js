const { test, expect } = require('@playwright/test');

const makeEmail = (overrides) => ({
  from: { name: 'Alice Smith', address: 'alice@test.com' },
  to: [{ name: 'Me', address: 'me@gmail-clone.local' }],
  cc: [],
  bcc: [],
  subject: 'Default Subject',
  body: '<p>Default body</p>',
  bodyText: 'Default body',
  folder: 'inbox',
  read: false,
  starred: false,
  labels: [],
  attachments: [],
  ...overrides,
});

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('/api/reset');
    await page.request.post('/api/seed', {
      data: {
        emails: [
          makeEmail({ subject: 'Quarterly Report', from: { name: 'Alice Smith', address: 'alice@test.com' } }),
          makeEmail({ subject: 'Meeting Notes', from: { name: 'Bob Jones', address: 'bob@test.com' } }),
          makeEmail({ subject: 'Lunch Plans', from: { name: 'Carol White', address: 'carol@test.com' }, folder: 'sent' }),
          makeEmail({ subject: 'Budget Review', from: { name: 'Alice Smith', address: 'alice@test.com' }, starred: true }),
          makeEmail({
            subject: 'File Attached',
            from: { name: 'Dave Brown', address: 'dave@test.com' },
            attachments: [{ filename: 'report.pdf', contentType: 'application/pdf', size: 1024 }],
          }),
        ],
      },
    });
    await page.goto('/');
    await page.waitForSelector('[data-testid="email-list"]');
  });

  test('search by subject text', async ({ page }) => {
    await page.locator('[data-testid="search-input"]').fill('Quarterly');
    await page.locator('[data-testid="search-btn"]').click();

    await page.waitForSelector('[data-testid="email-list"]');
    const rows = page.locator('[data-testid="email-row"]');
    await expect(rows).toHaveCount(1);
    await expect(page.locator('[data-testid="email-subject"]').first()).toContainText('Quarterly Report');
  });

  test('search by sender using from: operator', async ({ page }) => {
    await page.locator('[data-testid="search-input"]').fill('from:alice');
    await page.locator('[data-testid="search-btn"]').click();

    await page.waitForSelector('[data-testid="email-list"]');
    const rows = page.locator('[data-testid="email-row"]');
    await expect(rows).toHaveCount(2);
    await expect(page.locator('[data-testid="email-subject"]').filter({ hasText: 'Quarterly Report' })).toBeVisible();
    await expect(page.locator('[data-testid="email-subject"]').filter({ hasText: 'Budget Review' })).toBeVisible();
  });

  test('search returns empty for non-matching query', async ({ page }) => {
    await page.locator('[data-testid="search-input"]').fill('xyznonexistent');
    await page.locator('[data-testid="search-btn"]').click();

    await page.waitForSelector('[data-testid="email-list"]');
    const rows = page.locator('[data-testid="email-row"]');
    await expect(rows).toHaveCount(0);
  });

  test('search with has:attachment', async ({ page }) => {
    await page.locator('[data-testid="search-input"]').fill('has:attachment');
    await page.locator('[data-testid="search-btn"]').click();

    await page.waitForSelector('[data-testid="email-list"]');
    const rows = page.locator('[data-testid="email-row"]');
    await expect(rows).toHaveCount(1);
    await expect(page.locator('[data-testid="email-subject"]').first()).toContainText('File Attached');
  });

  test('search with is:starred', async ({ page }) => {
    await page.locator('[data-testid="search-input"]').fill('is:starred');
    await page.locator('[data-testid="search-btn"]').click();

    await page.waitForSelector('[data-testid="email-list"]');
    const rows = page.locator('[data-testid="email-row"]');
    await expect(rows).toHaveCount(1);
    await expect(page.locator('[data-testid="email-subject"]').first()).toContainText('Budget Review');
  });

  test('search with in:sent', async ({ page }) => {
    await page.locator('[data-testid="search-input"]').fill('in:sent');
    await page.locator('[data-testid="search-btn"]').click();

    await page.waitForSelector('[data-testid="email-list"]');
    const rows = page.locator('[data-testid="email-row"]');
    await expect(rows).toHaveCount(1);
    await expect(page.locator('[data-testid="email-subject"]').first()).toContainText('Lunch Plans');
  });

  test('search via Enter key', async ({ page }) => {
    await page.locator('[data-testid="search-input"]').fill('Meeting');
    await page.locator('[data-testid="search-input"]').press('Enter');

    await page.waitForSelector('[data-testid="email-list"]');
    const rows = page.locator('[data-testid="email-row"]');
    await expect(rows).toHaveCount(1);
    await expect(page.locator('[data-testid="email-subject"]').first()).toContainText('Meeting Notes');
  });
});
