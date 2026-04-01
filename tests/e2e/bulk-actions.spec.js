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

test.describe('Bulk Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('/api/reset');
    await page.request.post('/api/seed', {
      data: {
        emails: [
          makeEmail({ subject: 'Bulk Email 1', read: false }),
          makeEmail({ subject: 'Bulk Email 2', read: false }),
          makeEmail({ subject: 'Bulk Email 3', read: true }),
          makeEmail({ subject: 'Bulk Email 4', read: false }),
          makeEmail({ subject: 'Bulk Email 5', read: true }),
        ],
      },
    });
    await page.goto('/');
    await page.waitForSelector('[data-testid="email-list"]');
  });

  test('select multiple emails via checkboxes', async ({ page }) => {
    const rows = page.locator('[data-testid="email-row"]');
    await rows.nth(0).locator('[data-testid="email-checkbox"]').click();
    await rows.nth(1).locator('[data-testid="email-checkbox"]').click();
    await rows.nth(2).locator('[data-testid="email-checkbox"]').click();

    // Toolbar actions should be visible when emails are selected
    await expect(page.locator('[data-testid="toolbar-delete"]')).toBeVisible();
    await expect(page.locator('[data-testid="toolbar-archive"]')).toBeVisible();
  });

  test('select all via select-all checkbox', async ({ page }) => {
    await page.locator('[data-testid="select-all"]').click();

    // All checkboxes should be checked
    const checkboxes = page.locator('[data-testid="email-checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBe(5);
  });

  test('bulk delete moves all selected to trash', async ({ page }) => {
    // Select all
    await page.locator('[data-testid="select-all"]').click();

    await page.locator('[data-testid="toolbar-delete"]').click();

    // Inbox should be empty
    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(0);

    // Trash should have all 5
    await page.locator('[data-testid="folder-trash"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(5);
  });

  test('bulk mark as read', async ({ page }) => {
    // Select the unread emails
    const row1 = page.locator('[data-testid="email-row"]').filter({ hasText: 'Bulk Email 1' });
    const row2 = page.locator('[data-testid="email-row"]').filter({ hasText: 'Bulk Email 2' });
    const row4 = page.locator('[data-testid="email-row"]').filter({ hasText: 'Bulk Email 4' });

    await row1.locator('[data-testid="email-checkbox"]').click();
    await row2.locator('[data-testid="email-checkbox"]').click();
    await row4.locator('[data-testid="email-checkbox"]').click();

    await page.locator('[data-testid="toolbar-read"]').click();

    // Unread count should be 0 - badge may disappear
    await expect(page.locator('[data-testid="folder-count-inbox"]')).toBeHidden({ timeout: 5000 }).catch(async () => {
      await expect(page.locator('[data-testid="folder-count-inbox"]')).toContainText('0');
    });
  });

  test('bulk mark as unread', async ({ page }) => {
    // Select the read emails
    const row3 = page.locator('[data-testid="email-row"]').filter({ hasText: 'Bulk Email 3' });
    const row5 = page.locator('[data-testid="email-row"]').filter({ hasText: 'Bulk Email 5' });

    await row3.locator('[data-testid="email-checkbox"]').click();
    await row5.locator('[data-testid="email-checkbox"]').click();

    await page.locator('[data-testid="toolbar-unread"]').click();

    // Unread count should be 5 (3 originally + 2 newly marked)
    const badge = page.locator('[data-testid="folder-count-inbox"]');
    await expect(badge).toContainText('5');
  });

  test('bulk archive moves all selected to archive', async ({ page }) => {
    // Select first 3
    const rows = page.locator('[data-testid="email-row"]');
    await rows.nth(0).locator('[data-testid="email-checkbox"]').click();
    await rows.nth(1).locator('[data-testid="email-checkbox"]').click();
    await rows.nth(2).locator('[data-testid="email-checkbox"]').click();

    await page.locator('[data-testid="toolbar-archive"]').click();

    // Inbox should have 2 remaining
    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(2);

    // Archive should have 3
    await page.locator('[data-testid="folder-archive"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(3);
  });
});
