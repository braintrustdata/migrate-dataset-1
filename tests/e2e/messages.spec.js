import { test, expect } from '@playwright/test';
import { resetData, seedConversation } from '../helpers/seed.js';

test.describe('Messages', () => {
  test.beforeEach(async () => {
    await resetData();
  });

  test('send a message and receive AI response', async ({ page }) => {
    await page.goto('/');
    await page.click('#new-chat-btn');

    await page.fill('#message-input', 'Hello');
    await page.click('#send-btn');

    // Wait for AI response
    await expect(page.locator('.message.user')).toHaveCount(1);
    await expect(page.locator('.message.assistant')).toHaveCount(1);
    await expect(page.locator('.message.user .message-content')).toContainText('Hello');
    await expect(page.locator('.message.assistant .message-content')).not.toBeEmpty();
  });

  test('send message with Enter key', async ({ page }) => {
    await page.goto('/');
    await page.click('#new-chat-btn');

    await page.fill('#message-input', 'Hi there');
    await page.press('#message-input', 'Enter');

    await expect(page.locator('.message.user')).toHaveCount(1);
    await expect(page.locator('.message.assistant')).toHaveCount(1);
  });

  test('Shift+Enter adds newline instead of sending', async ({ page }) => {
    await page.goto('/');
    await page.click('#new-chat-btn');

    await page.fill('#message-input', 'line one');
    await page.press('#message-input', 'Shift+Enter');
    // No message should be sent
    await expect(page.locator('.message')).toHaveCount(0);
  });

  test('empty input does not send', async ({ page }) => {
    await page.goto('/');
    await page.click('#new-chat-btn');

    await page.click('#send-btn');
    await expect(page.locator('.message')).toHaveCount(0);
  });

  test('message history persists across page loads', async ({ page }) => {
    const { id } = await seedConversation({
      title: 'Persistent Chat',
      messages: [
        { role: 'user', content: 'Test message' },
        { role: 'assistant', content: 'Test response' },
      ],
    });

    await page.goto('/');
    await page.click('.conversation-item');

    await expect(page.locator('.message')).toHaveCount(2);
    await expect(page.locator('.message.user .message-content')).toContainText('Test message');
    await expect(page.locator('.message.assistant .message-content')).toContainText('Test response');

    // Reload and re-select
    await page.reload();
    await page.click('.conversation-item');
    await expect(page.locator('.message')).toHaveCount(2);
  });

  test('send multiple messages in sequence', async ({ page }) => {
    await page.goto('/');
    await page.click('#new-chat-btn');

    await page.fill('#message-input', 'First message');
    await page.click('#send-btn');
    await expect(page.locator('.message')).toHaveCount(2);

    await page.fill('#message-input', 'Second message');
    await page.click('#send-btn');
    await expect(page.locator('.message')).toHaveCount(4);
  });

  test('delete a message', async ({ page }) => {
    await seedConversation({
      title: 'Delete Msg Test',
      messages: [
        { role: 'user', content: 'Delete me' },
        { role: 'assistant', content: 'Response here' },
      ],
    });

    await page.goto('/');
    await page.click('.conversation-item');
    await expect(page.locator('.message')).toHaveCount(2);

    // Hover and click delete on the user message
    await page.locator('.message.user').hover();
    await page.locator('.message.user .btn-danger').click();

    await expect(page.locator('.message')).toHaveCount(1);
    await expect(page.locator('.message.assistant')).toHaveCount(1);
  });

  test('auto-titles conversation after first message', async ({ page }) => {
    await page.goto('/');
    await page.click('#new-chat-btn');

    await page.fill('#message-input', 'Tell me about quantum computing');
    await page.click('#send-btn');

    await expect(page.locator('.message.assistant')).toHaveCount(1);
    await expect(page.locator('.conversation-item').first()).toContainText(
      'Tell me about quantum computing',
    );
  });

  test('greeting gets appropriate response', async ({ page }) => {
    await page.goto('/');
    await page.click('#new-chat-btn');

    await page.fill('#message-input', 'Hello');
    await page.click('#send-btn');

    await expect(page.locator('.message.assistant .message-content')).toContainText(
      'AI assistant',
    );
  });

  test('coding question gets coding response', async ({ page }) => {
    await page.goto('/');
    await page.click('#new-chat-btn');

    await page.fill('#message-input', 'Help me write a function');
    await page.click('#send-btn');

    await expect(page.locator('.message.assistant .message-content')).toContainText('coding');
  });

  test('streams response via WebSocket with visible tokens', async ({ page }) => {
    await page.goto('/');
    await page.click('#new-chat-btn');

    // Wait for WebSocket to connect
    await page.waitForSelector('body[data-ws="open"]', { timeout: 5000 });

    await page.fill('#message-input', 'Hello');
    await page.click('#send-btn');

    // Streaming element should appear with the .streaming class
    await expect(page.locator('.message.assistant.streaming')).toHaveCount(1);

    // After streaming completes the class is removed and actions appear
    await expect(page.locator('.message.assistant.streaming')).toHaveCount(0, { timeout: 10000 });
    await expect(page.locator('.message.assistant .message-actions')).toBeVisible();
    await expect(page.locator('.message.assistant .message-content')).toContainText('AI assistant');
  });
});
