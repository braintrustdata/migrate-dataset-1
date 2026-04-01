const { test, expect } = require('@playwright/test');

test.describe('Drafts', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('/api/reset');
    await page.request.post('/api/seed', {
      data: {
        emails: [
          {
            from: { name: 'Me', address: 'me@gmail-clone.local' },
            to: [{ name: 'Alice Smith', address: 'alice@test.com' }],
            cc: [],
            bcc: [],
            subject: 'Existing Draft',
            body: '<p>Draft body content</p>',
            bodyText: 'Draft body content',
            folder: 'drafts',
            read: true,
            starred: false,
            labels: [],
            attachments: [],
          },
          {
            from: { name: 'Bob Jones', address: 'bob@test.com' },
            to: [{ name: 'Me', address: 'me@gmail-clone.local' }],
            cc: [],
            bcc: [],
            subject: 'Inbox Email',
            body: '<p>Regular email</p>',
            bodyText: 'Regular email',
            folder: 'inbox',
            read: false,
            starred: false,
            labels: [],
            attachments: [],
          },
        ],
      },
    });
    await page.goto('/');
    await page.waitForSelector('[data-testid="email-list"]');
  });

  test('compose and save as draft', async ({ page }) => {
    await page.locator('[data-testid="compose-btn"]').click();
    await expect(page.locator('[data-testid="compose-modal"]')).toBeVisible();

    await page.locator('[data-testid="compose-to"]').fill('carol@test.com');
    await page.locator('[data-testid="compose-subject"]').fill('New Draft Subject');
    await page.locator('[data-testid="compose-body"]').fill('This is a draft being saved.');

    await page.locator('[data-testid="compose-save-draft"]').click();
    // Wait for notification confirming draft was saved
    await expect(page.locator('[data-testid="notification"]')).toContainText(/[Dd]raft/i);

    // Verify draft was created via API (compose modal stays open, which is Gmail-like)
    const res = await page.request.get('/api/emails?folder=drafts');
    const data = await res.json();
    expect(data.emails.length).toBe(2); // existing + new
    const newDraft = data.emails.find(e => e.subject === 'New Draft Subject');
    expect(newDraft).toBeTruthy();
  });

  test('open draft from Drafts folder opens compose with pre-filled fields', async ({ page }) => {
    await page.locator('[data-testid="folder-drafts"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    // Click on the existing draft
    await page.locator('[data-testid="email-row"]').filter({ hasText: 'Existing Draft' }).click();

    // Should open compose modal with pre-filled fields
    await expect(page.locator('[data-testid="compose-modal"]')).toBeVisible();
    // To field uses chips, not plain input value
    const toChips = page.locator('#compose-to-chips .compose-chip');
    await expect(toChips).toHaveCount(1);
    await expect(toChips.first()).toContainText(/alice/i);
    await expect(page.locator('[data-testid="compose-subject"]')).toHaveValue('Existing Draft');
  });

  test('edit draft and send it', async ({ page }) => {
    await page.locator('[data-testid="folder-drafts"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    // Open the draft
    await page.locator('[data-testid="email-row"]').filter({ hasText: 'Existing Draft' }).click();
    await expect(page.locator('[data-testid="compose-modal"]')).toBeVisible();

    // Edit the body
    await page.locator('[data-testid="compose-body"]').fill('Updated draft body - now sending.');

    // Send it
    await page.locator('[data-testid="compose-send"]').click();
    await expect(page.locator('[data-testid="compose-modal"]')).toBeHidden();

    // Verify removed from Drafts
    await page.locator('[data-testid="folder-drafts"]').click();
    await page.waitForSelector('[data-testid="email-list"]');
    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(0);

    // Verify appears in Sent
    await page.locator('[data-testid="folder-sent"]').click();
    await page.waitForSelector('[data-testid="email-list"]');
    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="email-subject"]').first()).toContainText('Existing Draft');
  });

  test('discard a draft', async ({ page }) => {
    await page.locator('[data-testid="folder-drafts"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    // Open the draft
    await page.locator('[data-testid="email-row"]').filter({ hasText: 'Existing Draft' }).click();
    await expect(page.locator('[data-testid="compose-modal"]')).toBeVisible();

    // Discard it
    await page.locator('[data-testid="compose-discard"]').click();
    await expect(page.locator('[data-testid="compose-modal"]')).toBeHidden();

    // Verify removed from Drafts
    await page.locator('[data-testid="folder-drafts"]').click();
    await page.waitForSelector('[data-testid="email-list"]');
    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(0);
  });

  test('drafts count badge updates', async ({ page }) => {
    // Initially 1 draft
    const badge = page.locator('[data-testid="folder-count-drafts"]');
    await expect(badge).toContainText('1');

    // Create a new draft
    await page.locator('[data-testid="compose-btn"]').click();
    await page.locator('[data-testid="compose-to"]').fill('someone@test.com');
    await page.locator('[data-testid="compose-subject"]').fill('Another Draft');
    await page.locator('[data-testid="compose-body"]').fill('Draft content');

    await page.locator('[data-testid="compose-save-draft"]').click();
    // Wait for notification then badge update
    await expect(page.locator('[data-testid="notification"]')).toContainText(/[Dd]raft/i);

    // Badge should update to 2
    await expect(badge).toContainText('2');
  });
});
