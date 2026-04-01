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

test.describe('Star and Read/Unread', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('/api/reset');
    await page.request.post('/api/seed', {
      data: {
        emails: [
          makeEmail({ subject: 'Unread Message Alpha', read: false }),
          makeEmail({ subject: 'Unread Message Beta', read: false }),
          makeEmail({ subject: 'Previously Read', read: true }),
          makeEmail({ subject: 'Already Starred', read: true, starred: true }),
        ],
      },
    });
    await page.goto('/');
    await page.waitForSelector('[data-testid="email-list"]');
  });

  test('star an email from the list', async ({ page }) => {
    const firstRow = page.locator('[data-testid="email-row"]').filter({ hasText: 'Unread Message Alpha' });
    const starBtn = firstRow.locator('[data-testid="email-star"]');

    await starBtn.click();

    // Navigate to starred folder to verify
    await page.locator('[data-testid="folder-starred"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    const starredRows = page.locator('[data-testid="email-row"]');
    // Already Starred + newly starred = 2
    await expect(starredRows).toHaveCount(2);
    await expect(page.locator('[data-testid="email-subject"]').filter({ hasText: 'Unread Message Alpha' })).toBeVisible();
  });

  test('unstar a starred email', async ({ page }) => {
    const starredRow = page.locator('[data-testid="email-row"]').filter({ hasText: 'Already Starred' });
    const starBtn = starredRow.locator('[data-testid="email-star"]');

    await starBtn.click();

    // Navigate to starred folder
    await page.locator('[data-testid="folder-starred"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    // Should no longer appear in starred
    const rows = page.locator('[data-testid="email-row"]');
    await expect(rows).toHaveCount(0);
  });

  test('clicking email to view marks it as read', async ({ page }) => {
    const unreadRow = page.locator('[data-testid="email-row"]').filter({ hasText: 'Unread Message Alpha' });

    // Click to view
    await unreadRow.click();
    await expect(page.locator('[data-testid="email-detail"]')).toBeVisible();

    // Go back
    await page.locator('[data-testid="back-btn"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    // Verify the unread count decreased - was 2 unread, now should be 1
    const badge = page.locator('[data-testid="folder-count-inbox"]');
    await expect(badge).toContainText('1');
  });

  test('starred folder shows only starred emails', async ({ page }) => {
    await page.locator('[data-testid="folder-starred"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    const rows = page.locator('[data-testid="email-row"]');
    await expect(rows).toHaveCount(1);
    await expect(page.locator('[data-testid="email-subject"]').first()).toContainText('Already Starred');
  });

  test('bulk mark as read', async ({ page }) => {
    // Select the two unread emails
    const row1 = page.locator('[data-testid="email-row"]').filter({ hasText: 'Unread Message Alpha' });
    const row2 = page.locator('[data-testid="email-row"]').filter({ hasText: 'Unread Message Beta' });

    await row1.locator('[data-testid="email-checkbox"]').click();
    await row2.locator('[data-testid="email-checkbox"]').click();

    await page.locator('[data-testid="toolbar-read"]').click();

    // Unread count should now be 0 - badge might disappear or show 0
    await expect(page.locator('[data-testid="folder-count-inbox"]')).toBeHidden({ timeout: 5000 }).catch(async () => {
      await expect(page.locator('[data-testid="folder-count-inbox"]')).toContainText('0');
    });
  });

  test('bulk mark as unread', async ({ page }) => {
    // Select the "Previously Read" email
    const readRow = page.locator('[data-testid="email-row"]').filter({ hasText: 'Previously Read' });
    await readRow.locator('[data-testid="email-checkbox"]').click();

    await page.locator('[data-testid="toolbar-unread"]').click();

    // Unread count should increase - was 2, now 3
    const badge = page.locator('[data-testid="folder-count-inbox"]');
    await expect(badge).toContainText('3');
  });
});
