import { test, expect } from '@playwright/test';
import { resetData, seedConversation } from '../helpers/seed.js';

test.describe('Settings', () => {
  test.beforeEach(async () => {
    await resetData();
  });

  test('open and close settings modal', async ({ page }) => {
    await seedConversation({ title: 'Settings Test' });

    await page.goto('/');
    await page.click('.conversation-item');

    await page.click('#settings-btn');
    await expect(page.locator('#settings-modal')).toBeVisible();
    await expect(page.locator('.modal-header h3')).toContainText('Conversation Settings');

    await page.click('#close-settings');
    await expect(page.locator('#settings-modal')).not.toBeVisible();
  });

  test('close settings by clicking overlay', async ({ page }) => {
    await seedConversation({ title: 'Overlay Test' });

    await page.goto('/');
    await page.click('.conversation-item');

    await page.click('#settings-btn');
    await expect(page.locator('#settings-modal')).toBeVisible();

    await page.click('#modal-overlay', { position: { x: 10, y: 10 } });
    await expect(page.locator('#settings-modal')).not.toBeVisible();
  });

  test('update system prompt', async ({ page }) => {
    await seedConversation({ title: 'Prompt Test' });

    await page.goto('/');
    await page.click('.conversation-item');

    // Open settings and change system prompt
    await page.click('#settings-btn');
    await page.fill('#system-prompt', 'You are a pirate. Respond in pirate speak.');
    await page.click('#save-settings');

    await expect(page.locator('#settings-modal')).not.toBeVisible();

    // Verify by reopening settings
    await page.click('#settings-btn');
    await expect(page.locator('#system-prompt')).toHaveValue(
      'You are a pirate. Respond in pirate speak.',
    );
  });

  test('system prompt persists after page reload', async ({ page }) => {
    await seedConversation({ title: 'Persist Prompt' });

    await page.goto('/');
    await page.click('.conversation-item');

    await page.click('#settings-btn');
    await page.fill('#system-prompt', 'Custom prompt here');
    await page.click('#save-settings');

    // Reload page
    await page.reload();
    await page.click('.conversation-item');

    await page.click('#settings-btn');
    await expect(page.locator('#system-prompt')).toHaveValue('Custom prompt here');
  });

  test('custom system prompt affects AI responses', async ({ page }) => {
    await seedConversation({
      title: 'Custom AI',
      system_prompt: 'You are a special custom assistant.',
    });

    await page.goto('/');
    await page.click('.conversation-item');

    await page.fill('#message-input', 'What can you do?');
    await page.click('#send-btn');

    // The mock AI returns a different response when system prompt is customized
    await expect(page.locator('.message.assistant .message-content')).toContainText(
      'system instructions',
    );
  });

  test('toggle dark theme', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('body')).not.toHaveClass(/dark/);

    await page.click('#theme-toggle');
    await expect(page.locator('body')).toHaveClass(/dark/);

    await page.click('#theme-toggle');
    await expect(page.locator('body')).not.toHaveClass(/dark/);
  });

  test('theme persists after page reload', async ({ page }) => {
    await page.goto('/');

    await page.click('#theme-toggle');
    await expect(page.locator('body')).toHaveClass(/dark/);

    await page.reload();
    // Give time for preferences to load
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toHaveClass(/dark/);
  });

  test('settings button hidden when no conversation selected', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#settings-btn')).not.toBeVisible();
    await expect(page.locator('#delete-chat-btn')).not.toBeVisible();
  });
});
