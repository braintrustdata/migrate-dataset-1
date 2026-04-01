const { test, expect } = require('@playwright/test');

test.describe('Reply, Reply All, and Forward', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('/api/reset');
    await page.request.post('/api/seed', {
      data: {
        emails: [
          {
            from: { name: 'Alice Smith', address: 'alice@test.com' },
            to: [{ name: 'Me', address: 'me@gmail-clone.local' }],
            cc: [{ name: 'Bob Jones', address: 'bob@test.com' }],
            bcc: [],
            subject: 'Project Update',
            body: '<p>Here is the latest update on the project.</p>',
            bodyText: 'Here is the latest update on the project.',
            folder: 'inbox',
            read: false,
            starred: false,
            labels: [],
            attachments: [],
          },
          {
            from: { name: 'Carol White', address: 'carol@test.com' },
            to: [{ name: 'Me', address: 'me@gmail-clone.local' }],
            cc: [],
            bcc: [],
            subject: 'Quick Question',
            body: '<p>Can we meet tomorrow?</p>',
            bodyText: 'Can we meet tomorrow?',
            folder: 'inbox',
            read: true,
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

  test('reply pre-fills To with sender and Re: prefix in subject', async ({ page }) => {
    // Open the email from Alice
    await page.locator('[data-testid="email-row"]').filter({ hasText: 'Project Update' }).click();
    await expect(page.locator('[data-testid="email-detail"]')).toBeVisible();

    await page.locator('[data-testid="reply-btn"]').click();
    await expect(page.locator('[data-testid="compose-modal"]')).toBeVisible();

    // Verify To is pre-filled with sender (shown as chip, not input value)
    const toChips = page.locator('#compose-to-chips .compose-chip');
    await expect(toChips).toHaveCount(1);
    await expect(toChips.first()).toContainText(/Alice/i);
    // Verify subject has Re: prefix
    await expect(page.locator('[data-testid="compose-subject"]')).toHaveValue(/Re:\s*Project Update/);
  });

  test('reply all includes all original recipients', async ({ page }) => {
    // Open the email from Alice (which has CC: Bob)
    await page.locator('[data-testid="email-row"]').filter({ hasText: 'Project Update' }).click();
    await expect(page.locator('[data-testid="email-detail"]')).toBeVisible();

    await page.locator('[data-testid="reply-all-btn"]').click();
    await expect(page.locator('[data-testid="compose-modal"]')).toBeVisible();

    // To should have the sender as a chip
    const toChips = page.locator('#compose-to-chips .compose-chip');
    await expect(toChips).toHaveCount(1);
    await expect(toChips.first()).toContainText(/Alice/i);
    // CC should have bob as a chip
    const ccChips = page.locator('#compose-cc-chips .compose-chip');
    await expect(ccChips).toHaveCount(1);
    await expect(ccChips.first()).toContainText(/bob/i);
    // Subject should have Re: prefix
    await expect(page.locator('[data-testid="compose-subject"]')).toHaveValue(/Re:\s*Project Update/);
  });

  test('forward has Fwd: prefix and empty To field', async ({ page }) => {
    await page.locator('[data-testid="email-row"]').filter({ hasText: 'Project Update' }).click();
    await expect(page.locator('[data-testid="email-detail"]')).toBeVisible();

    await page.locator('[data-testid="forward-btn"]').click();
    await expect(page.locator('[data-testid="compose-modal"]')).toBeVisible();

    // To should be empty
    await expect(page.locator('[data-testid="compose-to"]')).toHaveValue('');
    // Subject should have Fwd: prefix
    await expect(page.locator('[data-testid="compose-subject"]')).toHaveValue(/Fwd:\s*Project Update/);
  });

  test('send a reply and it appears in Sent folder', async ({ page }) => {
    await page.locator('[data-testid="email-row"]').filter({ hasText: 'Quick Question' }).click();
    await expect(page.locator('[data-testid="email-detail"]')).toBeVisible();

    await page.locator('[data-testid="reply-btn"]').click();
    await expect(page.locator('[data-testid="compose-modal"]')).toBeVisible();

    await page.locator('[data-testid="compose-body"]').fill('Yes, let us meet at 3pm.');

    await page.locator('[data-testid="compose-send"]').click();
    await expect(page.locator('[data-testid="compose-modal"]')).toBeHidden();

    // Check Sent folder
    await page.locator('[data-testid="folder-sent"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    const sentRow = page.locator('[data-testid="email-row"]');
    await expect(sentRow).toHaveCount(1);
    await expect(sentRow.locator('[data-testid="email-subject"]')).toContainText('Re:');
    await expect(sentRow.locator('[data-testid="email-subject"]')).toContainText('Quick Question');
  });

  test('forward email to a new recipient and send', async ({ page }) => {
    await page.locator('[data-testid="email-row"]').filter({ hasText: 'Project Update' }).click();
    await expect(page.locator('[data-testid="email-detail"]')).toBeVisible();

    await page.locator('[data-testid="forward-btn"]').click();
    await expect(page.locator('[data-testid="compose-modal"]')).toBeVisible();

    await page.locator('[data-testid="compose-to"]').fill('dave@test.com');
    await page.locator('[data-testid="compose-body"]').fill('FYI - see below.');

    await page.locator('[data-testid="compose-send"]').click();
    await expect(page.locator('[data-testid="compose-modal"]')).toBeHidden();

    // Check Sent folder
    await page.locator('[data-testid="folder-sent"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    const sentRow = page.locator('[data-testid="email-row"]');
    await expect(sentRow).toHaveCount(1);
    await expect(sentRow.locator('[data-testid="email-subject"]')).toContainText('Fwd:');
  });
});
