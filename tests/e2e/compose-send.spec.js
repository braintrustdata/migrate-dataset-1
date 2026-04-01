const { test, expect } = require('@playwright/test');

test.describe('Compose and Send', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('/api/reset');
    await page.request.post('/api/seed', {
      data: {
        emails: [
          {
            from: { name: 'Alice Smith', address: 'alice@test.com' },
            to: [{ name: 'Me', address: 'me@gmail-clone.local' }],
            cc: [],
            bcc: [],
            subject: 'Existing Email',
            body: '<p>Hello there</p>',
            bodyText: 'Hello there',
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

  test('compose and send a basic email', async ({ page }) => {
    await page.locator('[data-testid="compose-btn"]').click();
    await expect(page.locator('[data-testid="compose-modal"]')).toBeVisible();

    await page.locator('[data-testid="compose-to"]').fill('bob@test.com');
    await page.locator('[data-testid="compose-subject"]').fill('Hello Bob');
    await page.locator('[data-testid="compose-body"]').fill('Hi Bob, how are you?');

    await page.locator('[data-testid="compose-send"]').click();

    await expect(page.locator('[data-testid="compose-modal"]')).toBeHidden();

    // Navigate to Sent folder and verify
    await page.locator('[data-testid="folder-sent"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    const sentRow = page.locator('[data-testid="email-row"]');
    await expect(sentRow).toHaveCount(1);
    await expect(sentRow.locator('[data-testid="email-subject"]')).toContainText('Hello Bob');
  });

  test('compose with CC and BCC fields', async ({ page }) => {
    await page.locator('[data-testid="compose-btn"]').click();
    await expect(page.locator('[data-testid="compose-modal"]')).toBeVisible();

    // Toggle CC/BCC fields
    await page.locator('[data-testid="cc-bcc-toggle"]').click();

    await page.locator('[data-testid="compose-to"]').fill('bob@test.com');
    await page.locator('[data-testid="compose-cc"]').fill('carol@test.com');
    await page.locator('[data-testid="compose-bcc"]').fill('dave@test.com');
    await page.locator('[data-testid="compose-subject"]').fill('Team Update');
    await page.locator('[data-testid="compose-body"]').fill('Here is the update.');

    await page.locator('[data-testid="compose-send"]').click();

    await expect(page.locator('[data-testid="compose-modal"]')).toBeHidden();

    // Verify in Sent
    await page.locator('[data-testid="folder-sent"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    const sentRow = page.locator('[data-testid="email-row"]');
    await expect(sentRow).toHaveCount(1);
    await expect(sentRow.locator('[data-testid="email-subject"]')).toContainText('Team Update');
  });

  test('send with empty subject shows (no subject)', async ({ page }) => {
    await page.locator('[data-testid="compose-btn"]').click();
    await expect(page.locator('[data-testid="compose-modal"]')).toBeVisible();

    await page.locator('[data-testid="compose-to"]').fill('bob@test.com');
    // Leave subject empty
    await page.locator('[data-testid="compose-body"]').fill('No subject email body');

    await page.locator('[data-testid="compose-send"]').click();

    await expect(page.locator('[data-testid="compose-modal"]')).toBeHidden();

    await page.locator('[data-testid="folder-sent"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    const sentRow = page.locator('[data-testid="email-row"]');
    await expect(sentRow).toHaveCount(1);
    await expect(sentRow.locator('[data-testid="email-subject"]')).toContainText('(no subject)');
  });

  test('compose and discard', async ({ page }) => {
    await page.locator('[data-testid="compose-btn"]').click();
    await expect(page.locator('[data-testid="compose-modal"]')).toBeVisible();

    await page.locator('[data-testid="compose-to"]').fill('bob@test.com');
    await page.locator('[data-testid="compose-subject"]').fill('Will be discarded');
    await page.locator('[data-testid="compose-body"]').fill('This will not be sent');

    await page.locator('[data-testid="compose-discard"]').click();

    await expect(page.locator('[data-testid="compose-modal"]')).toBeHidden();

    // Verify nothing in Sent
    await page.locator('[data-testid="folder-sent"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    const sentRows = page.locator('[data-testid="email-row"]');
    await expect(sentRows).toHaveCount(0);
  });

  test('sent email has correct details in Sent folder', async ({ page }) => {
    await page.locator('[data-testid="compose-btn"]').click();
    await expect(page.locator('[data-testid="compose-modal"]')).toBeVisible();

    await page.locator('[data-testid="compose-to"]').fill('recipient@test.com');
    await page.locator('[data-testid="compose-subject"]').fill('Detailed Email');
    await page.locator('[data-testid="compose-body"]').fill('This has specific content to verify.');

    await page.locator('[data-testid="compose-send"]').click();
    await expect(page.locator('[data-testid="compose-modal"]')).toBeHidden();

    await page.locator('[data-testid="folder-sent"]').click();
    await page.waitForSelector('[data-testid="email-list"]');

    // Click into the sent email to view detail
    const sentRow = page.locator('[data-testid="email-row"]').first();
    await sentRow.click();

    await expect(page.locator('[data-testid="email-detail"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-subject"]')).toContainText('Detailed Email');
    await expect(page.locator('[data-testid="detail-body"]')).toContainText('This has specific content to verify.');
  });
});
