import { test, expect } from '@playwright/test';
import { resetData, seedConversation } from '../helpers/seed.js';

test.describe('Conversations', () => {
  test.beforeEach(async () => {
    await resetData();
  });

  test('create a new conversation', async ({ page }) => {
    await page.goto('/');
    await page.click('#new-chat-btn');

    await expect(page.locator('.conversation-item')).toHaveCount(1);
    await expect(page.locator('.conversation-item').first()).toContainText('New Conversation');
    await expect(page.locator('#input-area')).toBeVisible();
    await expect(page.locator('#settings-btn')).toBeVisible();
  });

  test('list multiple conversations in sidebar', async ({ page }) => {
    await seedConversation({ title: 'First Chat' });
    await seedConversation({ title: 'Second Chat' });

    await page.goto('/');
    await expect(page.locator('.conversation-item')).toHaveCount(2);
  });

  test('select a conversation shows its title', async ({ page }) => {
    await seedConversation({ title: 'My Chat' });

    await page.goto('/');
    await page.click('.conversation-item');

    await expect(page.locator('#chat-title')).toContainText('My Chat');
    await expect(page.locator('.conversation-item.active')).toHaveCount(1);
  });

  test('switch between conversations', async ({ page }) => {
    await seedConversation({
      title: 'Chat A',
      messages: [{ role: 'user', content: 'msg-a' }],
    });
    await seedConversation({
      title: 'Chat B',
      messages: [{ role: 'user', content: 'msg-b' }],
    });

    await page.goto('/');

    // Select Chat B (first in list because most recent)
    await page.locator('.conversation-item', { hasText: 'Chat B' }).click();
    await expect(page.locator('#chat-title')).toContainText('Chat B');
    await expect(page.locator('.message-content').first()).toContainText('msg-b');

    // Switch to Chat A
    await page.locator('.conversation-item', { hasText: 'Chat A' }).click();
    await expect(page.locator('#chat-title')).toContainText('Chat A');
    await expect(page.locator('.message-content').first()).toContainText('msg-a');
  });

  test('rename a conversation via title click', async ({ page }) => {
    await seedConversation({ title: 'Old Title' });

    await page.goto('/');
    await page.click('.conversation-item');

    // Click the title to start editing
    await page.click('#chat-title');
    const input = page.locator('#title-edit-input');
    await expect(input).toBeVisible();

    await input.fill('New Title');
    await input.press('Enter');

    // Title should update in header and sidebar
    await expect(page.locator('#chat-title')).toContainText('New Title');
    await expect(page.locator('.conversation-item')).toContainText('New Title');
  });

  test('delete a conversation', async ({ page }) => {
    await seedConversation({ title: 'To Delete' });

    await page.goto('/');
    await page.click('.conversation-item');

    page.on('dialog', (dialog) => dialog.accept());
    await page.click('#delete-chat-btn');

    await expect(page.locator('.conversation-item')).toHaveCount(0);
    await expect(page.locator('#input-area')).not.toBeVisible();
    await expect(page.locator('.empty-state')).toBeVisible();
  });

  test('cancel delete keeps conversation', async ({ page }) => {
    await seedConversation({ title: 'Keep Me' });

    await page.goto('/');
    await page.click('.conversation-item');

    page.on('dialog', (dialog) => dialog.dismiss());
    await page.click('#delete-chat-btn');

    await expect(page.locator('.conversation-item')).toHaveCount(1);
    await expect(page.locator('#chat-title')).toContainText('Keep Me');
  });

  test('empty state shown when no conversations', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.no-conversations')).toBeVisible();
    await expect(page.locator('.empty-state')).toBeVisible();
  });
});
