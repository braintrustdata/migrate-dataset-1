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

test.describe('Labels', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('/api/reset');
    await page.request.post('/api/seed', {
      data: {
        emails: [
          makeEmail({ subject: 'Work Email' }),
          makeEmail({ subject: 'Personal Email' }),
          makeEmail({ subject: 'Labeled Email', labels: ['important'] }),
        ],
        labels: [
          { id: 'important', name: 'Important', color: '#ff0000' },
        ],
      },
    });
    await page.goto('/');
    await page.waitForSelector('[data-testid="email-list"]');
  });

  test('create a new label', async ({ page }) => {
    await page.locator('[data-testid="create-label-btn"]').click();
    await expect(page.locator('[data-testid="label-dialog"]')).toBeVisible();

    await page.locator('[data-testid="label-name-input"]').fill('Urgent');
    await page.locator('[data-testid="label-color-input"]').fill('#ff6600');

    await page.locator('[data-testid="label-save-btn"]').click();
    await expect(page.locator('[data-testid="label-dialog"]')).toBeHidden();

    // Verify the new label appears in sidebar navigation
    await expect(page.getByText('Urgent')).toBeVisible();
  });

  test('apply label to email via toolbar', async ({ page }) => {
    const row = page.locator('[data-testid="email-row"]').filter({ hasText: 'Work Email' });
    await row.locator('[data-testid="email-checkbox"]').click();

    await page.locator('[data-testid="toolbar-label"]').click();
    await expect(page.locator('[data-testid="label-menu"]')).toBeVisible();

    // Click on the Important label in the dropdown
    await page.locator('[data-testid="label-menu"]').getByText('Important').click();

    // Verify label chip appears on the email row
    const updatedRow = page.locator('[data-testid="email-row"]').filter({ hasText: 'Work Email' });
    await expect(updatedRow).toContainText('Important');
  });

  test('filter emails by label from sidebar', async ({ page }) => {
    // Click on the Important label in sidebar to filter
    await page.goto('/#label/important');
    await page.waitForSelector('[data-testid="email-list"]');

    const rows = page.locator('[data-testid="email-row"]');
    await expect(rows).toHaveCount(1);
    await expect(page.locator('[data-testid="email-subject"]').first()).toContainText('Labeled Email');
  });

  test('remove label from email', async ({ page }) => {
    // Select the labeled email
    const row = page.locator('[data-testid="email-row"]').filter({ hasText: 'Labeled Email' });
    await row.locator('[data-testid="email-checkbox"]').click();

    // Open label dropdown and toggle off Important
    await page.locator('[data-testid="toolbar-label"]').click();
    await expect(page.locator('[data-testid="label-menu"]')).toBeVisible();

    await page.locator('[data-testid="label-menu"]').getByText('Important').click();

    // Navigate to label view - should be empty
    await page.goto('/#label/important');
    await page.waitForSelector('[data-testid="email-list"]');

    await expect(page.locator('[data-testid="email-row"]')).toHaveCount(0);
  });

  test('labeled email shows label chip in list', async ({ page }) => {
    const labeledRow = page.locator('[data-testid="email-row"]').filter({ hasText: 'Labeled Email' });
    await expect(labeledRow).toContainText('Important');
  });
});
