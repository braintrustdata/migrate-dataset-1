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

test.describe('Delete and Archive', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('/api/reset');
    await page.request.post('/api/seed', {
      data: {
        emails: [
          makeEmail({ subject: 'Email to Delete', folder: 'inbox' }),
          makeEmail({ subject: 'Email to Archive', folder: 'inbox' }),
          makeEmail({ subject: 'Email to Spam', folder: 'inbox' }),
          makeEmail({ subject: 'Trash Email 1', folder: 'trash' }),
          makeEmail({ subject: 'Trash Email 2', folder: 'trash' }),
          makeEmail({ subject: 'Spam Email', folder: 'spam' }),
        ],
      },
    });
    await page.goto('/');
    await page.waitForSelector('[data-testid="email-list"]');
  });

  test('delete email moves it to trash', async ({ page }) => {
    const row = page.locator('[data-testid="email-row"]').filter({ hasText: 'Email to Delete' });
    await row.locator('[data-testid="email-checkbox"]').click();

    await page.locator('[data-testid="toolbar-delete"]').click();

    // Verify removed from inbox
    await expect(page.locator('[data-testid="email-row"]').filter({ hasText: 'Email to Delete' })).toHaveCount(0);

    // Verify in trash
    await page.locator('[data-testid="folder-trash"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    await expect(page.locator('[data-testid="email-subject"]').filter({ hasText: 'Email to Delete' })).toBeVisible();
    // Trash should now have 3 emails
    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(3);
  });

  test('delete from trash permanently removes email', async ({ page }) => {
    await page.locator('[data-testid="folder-trash"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(2);

    const trashRow = page.locator('[data-testid="email-row"]').filter({ hasText: 'Trash Email 1' });
    await trashRow.locator('[data-testid="email-checkbox"]').click();

    await page.locator('[data-testid="toolbar-delete"]').click();

    // Should be permanently removed
    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="email-subject"]').filter({ hasText: 'Trash Email 1' })).toHaveCount(0);
  });

  test('empty trash removes all trash emails', async ({ page }) => {
    await page.locator('[data-testid="folder-trash"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(2);

    await page.locator('[data-testid="empty-trash-btn"]').click();

    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(0);
  });

  test('archive email moves it to archive folder', async ({ page }) => {
    const row = page.locator('[data-testid="email-row"]').filter({ hasText: 'Email to Archive' });
    await row.locator('[data-testid="email-checkbox"]').click();

    await page.locator('[data-testid="toolbar-archive"]').click();

    // Removed from inbox
    await expect(page.locator('[data-testid="email-row"]').filter({ hasText: 'Email to Archive' })).toHaveCount(0);

    // Verify in archive
    await page.locator('[data-testid="folder-archive"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    await expect(page.locator('[data-testid="email-subject"]').filter({ hasText: 'Email to Archive' })).toBeVisible();
  });

  test('move email to spam', async ({ page }) => {
    const row = page.locator('[data-testid="email-row"]').filter({ hasText: 'Email to Spam' });
    await row.locator('[data-testid="email-checkbox"]').click();

    await page.locator('[data-testid="toolbar-spam"]').click();

    // Removed from inbox
    await expect(page.locator('[data-testid="email-row"]').filter({ hasText: 'Email to Spam' })).toHaveCount(0);

    // Verify in spam
    await page.locator('[data-testid="folder-spam"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    await expect(page.locator('[data-testid="email-subject"]').filter({ hasText: 'Email to Spam' })).toBeVisible();
    // Original spam + newly moved = 2
    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(2);
  });

  test('move email from spam back to inbox', async ({ page }) => {
    await page.locator('[data-testid="folder-spam"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(1);

    const spamRow = page.locator('[data-testid="email-row"]').filter({ hasText: 'Spam Email' });
    await spamRow.locator('[data-testid="email-checkbox"]').click();

    // Move back - use the "not spam" / move to inbox action (toolbar-spam toggles it back)
    await page.locator('[data-testid="toolbar-spam"]').click();

    // Should be gone from spam
    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(0);

    // Verify in inbox
    await page.locator('[data-testid="folder-inbox"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    await expect(page.locator('[data-testid="email-subject"]').filter({ hasText: 'Spam Email' })).toBeVisible();
  });
});
