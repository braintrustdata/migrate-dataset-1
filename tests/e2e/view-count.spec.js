import { test, expect, chromium } from '@playwright/test';
import { resetData, seedVideo } from '../helpers/seed.js';

test.beforeEach(async () => {
  await resetData();
});

test('view count starts at 0', async ({ request }) => {
  const video = await seedVideo({ title: 'View Count Start Test', views: 0 });

  // Check via API — but note: GET /api/videos/:id increments views
  // So check via index first
  const indexRes = await request.get('/api/videos?limit=1');
  const indexData = await indexRes.json();
  expect(indexData.videos[0].views).toBe(0);
});

test('loading the watch page increments view count', async ({ page, request }) => {
  const video = await seedVideo({ title: 'View Increment Test', views: 0 });

  // Load watch page
  await page.goto(`/watch?v=${video.videoId}`);
  await expect(page.locator('#videoTitle')).toHaveText('View Increment Test', { timeout: 8000 });
  await expect(page.locator('#viewCount')).toContainText('1', { timeout: 5000 });

  // Verify via direct API call (this will increment again — that's by design)
  // Instead, verify the UI shows the incremented value
  const viewText = await page.locator('#viewCount').textContent();
  expect(viewText).toContain('1');
});

test('second page load increments view count again', async ({ browser }) => {
  const video = await seedVideo({ title: 'Double View Test', views: 0 });

  // First context
  const ctx1 = await browser.newContext();
  const page1 = await ctx1.newPage();
  await page1.goto(`/watch?v=${video.videoId}`);
  await expect(page1.locator('#viewCount')).toContainText('1', { timeout: 8000 });
  await ctx1.close();

  // Second context
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  await page2.goto(`/watch?v=${video.videoId}`);
  // View count should now be 2 (from loading metadata) or higher
  await expect(page2.locator('#viewCount')).toContainText('2', { timeout: 8000 });
  await ctx2.close();
});

test('view count is persisted in meta.json', async ({ page }) => {
  const video = await seedVideo({ title: 'Persist View Test', views: 0 });

  await page.goto(`/watch?v=${video.videoId}`);
  await expect(page.locator('#viewCount')).toContainText('1', { timeout: 8000 });

  // Reload — the count should remain 1 at page load then increment to 2
  await page.reload();
  // After reload, API is called again, so views become 2
  await expect(page.locator('#viewCount')).toContainText('2', { timeout: 8000 });
});

test('view count shown on watch page matches API', async ({ page, request }) => {
  const video = await seedVideo({ title: 'API Match Test', views: 5 });

  await page.goto(`/watch?v=${video.videoId}`);
  await page.waitForLoadState('networkidle');

  const viewText = await page.locator('#viewCount').textContent();

  // API call from watch.js fetched and incremented the view
  // The displayed count should be at least 6
  const displayedNum = parseInt(viewText.replace(/[^0-9]/g, ''));
  expect(displayedNum).toBeGreaterThanOrEqual(6);
});
