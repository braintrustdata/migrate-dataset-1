import { test, expect } from '@playwright/test';
import { resetData, seedVideo } from '../helpers/seed.js';

// Helper: submit the comment form specifically (not the header search form)
async function submitComment(page) {
  await page.locator('#commentForm button[type="submit"]').click();
}

test.beforeEach(async () => {
  await resetData();
});

test('post a comment and see it appear', async ({ page }) => {
  const video = await seedVideo({ title: 'Comment Test Video' });

  await page.goto(`/watch?v=${video.videoId}`);
  await expect(page.locator('#videoTitle')).toHaveText('Comment Test Video', { timeout: 8000 });

  // Post a comment
  await page.fill('#commentAuthor', 'commentuser');
  await page.fill('#commentBody', 'This is a Playwright comment');
  await submitComment(page);

  // Comment appears in list
  await expect(page.locator('.comment-item')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('.comment-text').first()).toHaveText('This is a Playwright comment');
  await expect(page.locator('.comment-author').first()).toContainText('commentuser');

  // Comment count shows 1
  await expect(page.locator('#commentCount')).toHaveText('1');
});

test('comment count increments after posting', async ({ page }) => {
  const video = await seedVideo({ title: 'Count Test Video' });

  await page.goto(`/watch?v=${video.videoId}`);
  await expect(page.locator('#commentCount')).toHaveText('0', { timeout: 8000 });

  await page.fill('#commentAuthor', 'counter');
  await page.fill('#commentBody', 'First comment');
  await submitComment(page);
  await expect(page.locator('#commentCount')).toHaveText('1', { timeout: 5000 });

  await page.fill('#commentBody', 'Second comment');
  await submitComment(page);
  await expect(page.locator('#commentCount')).toHaveText('2', { timeout: 5000 });
});

test('delete a comment removes it from the list', async ({ page }) => {
  const video = await seedVideo({ title: 'Delete Comment Test' });

  await page.goto(`/watch?v=${video.videoId}`);
  await expect(page.locator('#videoTitle')).toContainText('Delete Comment Test', { timeout: 8000 });

  // Post comment
  await page.fill('#commentAuthor', 'deleteuser');
  await page.fill('#commentBody', 'This comment will be deleted');
  await submitComment(page);
  await expect(page.locator('.comment-item')).toHaveCount(1, { timeout: 5000 });
  await expect(page.locator('#commentCount')).toHaveText('1');

  // Delete button should be visible (we are the author)
  const deleteBtn = page.locator('.comment-delete-btn').first();
  await expect(deleteBtn).toBeVisible();

  // Handle confirm dialog
  page.once('dialog', dialog => dialog.accept());
  await deleteBtn.click();

  // Comment is gone
  await expect(page.locator('.comment-item')).toHaveCount(0, { timeout: 5000 });
  await expect(page.locator('#commentCount')).toHaveText('0');
});

test('comment persists after page reload', async ({ page }) => {
  const video = await seedVideo({ title: 'Persistent Comment Test' });

  await page.goto(`/watch?v=${video.videoId}`);
  await expect(page.locator('#videoTitle')).toContainText('Persistent Comment', { timeout: 8000 });

  await page.fill('#commentAuthor', 'persistentuser');
  await page.fill('#commentBody', 'This should persist');
  await submitComment(page);
  await expect(page.locator('.comment-item')).toHaveCount(1, { timeout: 5000 });

  // Reload and check comment is still there
  await page.reload();
  await expect(page.locator('.comment-item')).toHaveCount(1, { timeout: 8000 });
  await expect(page.locator('.comment-text').first()).toHaveText('This should persist');
});

test('comment API returns 404 for nonexistent video', async ({ request }) => {
  const res = await request.post('/api/videos/nonexistent/comments', {
    data: { authorName: 'user', body: 'hello' },
  });
  expect(res.status()).toBe(404);
});
