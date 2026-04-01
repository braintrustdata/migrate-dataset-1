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

test.describe('Inbox and Folders', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('/api/reset');
    await page.request.post('/api/seed', {
      data: {
        emails: [
          makeEmail({ subject: 'Inbox Email 1', folder: 'inbox', read: false }),
          makeEmail({ subject: 'Inbox Email 2', folder: 'inbox', read: true }),
          makeEmail({ subject: 'Sent Email', folder: 'sent', from: { name: 'Me', address: 'me@gmail-clone.local' }, to: [{ name: 'Bob', address: 'bob@test.com' }] }),
          makeEmail({ subject: 'Draft Email', folder: 'drafts' }),
          makeEmail({ subject: 'Trash Email', folder: 'trash' }),
          makeEmail({ subject: 'Spam Email', folder: 'spam' }),
          makeEmail({ subject: 'Starred Inbox', folder: 'inbox', starred: true, read: true }),
          makeEmail({ subject: 'Archived Email', folder: 'archive' }),
        ],
      },
    });
    await page.goto('/');
    await page.waitForSelector('[data-testid="email-list"]');
  });

  test('inbox shows only inbox emails', async ({ page }) => {
    const rows = page.locator('[data-testid="email-row"]');
    await expect(rows).toHaveCount(3); // 2 inbox + 1 starred inbox
    await expect(page.locator('[data-testid="email-subject"]').filter({ hasText: 'Inbox Email 1' })).toBeVisible();
    await expect(page.locator('[data-testid="email-subject"]').filter({ hasText: 'Inbox Email 2' })).toBeVisible();
    await expect(page.locator('[data-testid="email-subject"]').filter({ hasText: 'Starred Inbox' })).toBeVisible();
  });

  test('inbox shows unread count badge', async ({ page }) => {
    const badge = page.locator('[data-testid="folder-count-inbox"]');
    // 2 unread emails in inbox (Inbox Email 1 and Starred Inbox... wait Starred Inbox is read:true)
    // Only Inbox Email 1 is unread
    await expect(badge).toContainText('1');
  });

  test('folder navigation shows correct emails', async ({ page }) => {
    // Sent folder
    await page.locator('[data-testid="folder-sent"]').click();
    await page.waitForSelector('[data-testid="email-list"]');
    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="email-subject"]').first()).toContainText('Sent Email');

    // Drafts folder
    await page.locator('[data-testid="folder-drafts"]').click();
    await page.waitForSelector('[data-testid="email-list"]');
    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="email-subject"]').first()).toContainText('Draft Email');

    // Trash folder
    await page.locator('[data-testid="folder-trash"]').click();
    await page.waitForSelector('[data-testid="email-list"]');
    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="email-subject"]').first()).toContainText('Trash Email');

    // Spam folder
    await page.locator('[data-testid="folder-spam"]').click();
    await page.waitForSelector('[data-testid="email-list"]');
    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="email-subject"]').first()).toContainText('Spam Email');
  });

  test('starred view shows only starred emails', async ({ page }) => {
    await page.locator('[data-testid="folder-starred"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    const rows = page.locator('[data-testid="email-row"]');
    await expect(rows).toHaveCount(1);
    await expect(page.locator('[data-testid="email-subject"]').first()).toContainText('Starred Inbox');
  });

  test('all mail shows everything except trash and spam', async ({ page }) => {
    await page.locator('[data-testid="folder-all"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    const rows = page.locator('[data-testid="email-row"]');
    // inbox(3) + sent(1) + drafts(1) + archive(1) = 6, excluding trash and spam
    await expect(rows).toHaveCount(6);
  });

  test('click email to view detail and back button returns to list', async ({ page }) => {
    await page.locator('[data-testid="email-row"]').first().click();

    await expect(page.locator('[data-testid="email-detail"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-subject"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-from"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-body"]')).toBeVisible();

    // Back button
    await page.locator('[data-testid="back-btn"]').click();
    await expect(page.locator('[data-testid="email-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(3);
  });
});
