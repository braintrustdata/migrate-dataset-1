const { test, expect } = require('@playwright/test');

test.describe('Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('/api/reset');

    // Generate 55 emails for pagination testing
    const emails = [];
    for (let i = 1; i <= 55; i++) {
      emails.push({
        from: { name: `Sender ${i}`, address: `sender${i}@test.com` },
        to: [{ name: 'Me', address: 'me@gmail-clone.local' }],
        cc: [],
        bcc: [],
        subject: `Email Number ${String(i).padStart(3, '0')}`,
        body: `<p>Body of email ${i}</p>`,
        bodyText: `Body of email ${i}`,
        folder: 'inbox',
        read: false,
        starred: false,
        labels: [],
        attachments: [],
      });
    }

    await page.request.post('/api/seed', { data: { emails } });
    await page.goto('/');
    await page.waitForSelector('[data-testid="email-list"]');
  });

  test('first page shows 50 emails', async ({ page }) => {
    const rows = page.locator('[data-testid="email-row"]');
    await expect(rows).toHaveCount(50);
  });

  test('pagination info shows correct range', async ({ page }) => {
    const info = page.locator('[data-testid="pagination-info"]');
    await expect(info).toContainText('1');
    await expect(info).toContainText('50');
    await expect(info).toContainText('55');
  });

  test('click next shows remaining emails', async ({ page }) => {
    await page.locator('[data-testid="pagination-next"]').click();

    await page.waitForSelector('[data-testid="email-list"]');
    const rows = page.locator('[data-testid="email-row"]');
    await expect(rows).toHaveCount(5);

    // Pagination info should reflect second page
    const info = page.locator('[data-testid="pagination-info"]');
    await expect(info).toContainText('51');
    await expect(info).toContainText('55');
  });

  test('click prev returns to first page', async ({ page }) => {
    // Go to page 2
    await page.locator('[data-testid="pagination-next"]').click();
    await page.waitForSelector('[data-testid="email-list"]');
    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(5);

    // Go back to page 1
    await page.locator('[data-testid="pagination-prev"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    const rows = page.locator('[data-testid="email-row"]');
    await expect(rows).toHaveCount(50);

    const info = page.locator('[data-testid="pagination-info"]');
    await expect(info).toContainText('1');
    await expect(info).toContainText('50');
  });

  test('prev button is disabled on first page', async ({ page }) => {
    const prevBtn = page.locator('[data-testid="pagination-prev"]');
    await expect(prevBtn).toBeDisabled();
  });

  test('next button is disabled on last page', async ({ page }) => {
    await page.locator('[data-testid="pagination-next"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    const nextBtn = page.locator('[data-testid="pagination-next"]');
    await expect(nextBtn).toBeDisabled();
  });
});
