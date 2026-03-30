import { test, expect } from '@playwright/test';
import { resetData, seedVideo } from '../helpers/seed.js';

test.beforeEach(async () => {
  await resetData();
});

test('search finds video by title', async ({ page }) => {
  await seedVideo({ title: 'Cooking Basics', tags: ['food', 'cooking'] });
  await seedVideo({ title: 'JavaScript Tutorial', tags: ['coding', 'js'] });

  await page.goto('/search?q=cooking');
  await expect(page.locator('#searchResults .search-card')).toHaveCount(1, { timeout: 8000 });
  await expect(page.locator('.search-card-title').first()).toContainText('Cooking Basics');
});

test('search finds video by tag', async ({ page }) => {
  await seedVideo({ title: 'Cooking Basics', tags: ['food', 'cooking'] });
  await seedVideo({ title: 'JavaScript Tutorial', tags: ['coding', 'js'] });

  await page.goto('/search?q=js');
  await expect(page.locator('#searchResults .search-card')).toHaveCount(1, { timeout: 8000 });
  await expect(page.locator('.search-card-title').first()).toContainText('JavaScript Tutorial');
});

test('search with no results shows empty state', async ({ page }) => {
  await seedVideo({ title: 'Cooking Basics' });

  await page.goto('/search?q=zzznoresults');
  await expect(page.locator('.empty-state')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.empty-state h2')).toHaveText('No videos found');
});

test('search is case-insensitive', async ({ page }) => {
  await seedVideo({ title: 'Cooking Basics', tags: ['food'] });

  await page.goto('/search?q=COOKING');
  await expect(page.locator('#searchResults .search-card')).toHaveCount(1, { timeout: 8000 });
});

test('search shows result count', async ({ page }) => {
  await seedVideo({ title: 'Cooking Basics', tags: ['food'] });
  await seedVideo({ title: 'Advanced Cooking', tags: ['food'] });

  await page.goto('/search?q=cooking');
  await expect(page.locator('#resultCount')).toContainText('2', { timeout: 8000 });
});

test('search from home page header navigates to search page', async ({ page }) => {
  await seedVideo({ title: 'Header Search Video' });

  await page.goto('/');
  await page.fill('input[name="q"]', 'Header Search');
  await page.press('input[name="q"]', 'Enter');

  await expect(page).toHaveURL(/\/search\?q=Header/);
  await expect(page.locator('#searchResults .search-card')).toHaveCount(1, { timeout: 8000 });
});

test('search API returns correct structure', async ({ request }) => {
  const res = await request.get('/api/search?q=test');
  expect(res.status()).toBe(200);
  const data = await res.json();
  expect(data).toHaveProperty('videos');
  expect(data).toHaveProperty('total');
  expect(data).toHaveProperty('page');
  expect(data).toHaveProperty('totalPages');
  expect(data).toHaveProperty('query');
  expect(Array.isArray(data.videos)).toBe(true);
});

test('search result links go to correct watch page', async ({ page }) => {
  const video = await seedVideo({ title: 'Linkable Search Video', tags: ['link'] });

  await page.goto('/search?q=Linkable');
  await expect(page.locator('#searchResults .search-card')).toHaveCount(1, { timeout: 8000 });

  await page.locator('.search-card').first().click();
  await expect(page).toHaveURL(`/watch?v=${video.videoId}`);
  await expect(page.locator('#videoTitle')).toHaveText('Linkable Search Video', { timeout: 8000 });
});
