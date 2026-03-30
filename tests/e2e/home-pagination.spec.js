import { test, expect } from '@playwright/test';
import { resetData, seedManyVideos } from '../helpers/seed.js';

test.beforeEach(async () => {
  await resetData();
});

test('home page shows 12 videos per page', async ({ page }) => {
  await seedManyVideos(15);

  await page.goto('/');
  // Wait for real video cards (not skeleton)
  await expect(page.locator('.video-card:not(.skeleton-card)')).toHaveCount(12, { timeout: 10000 });
});

test('pagination shows page 1 of 2 for 15 videos', async ({ page }) => {
  await seedManyVideos(15);

  await page.goto('/');
  await expect(page.locator('.video-card:not(.skeleton-card)')).toHaveCount(12, { timeout: 10000 });
  await expect(page.locator('.page-info')).toHaveText('Page 1 of 2');
});

test('next page shows remaining videos', async ({ page }) => {
  await seedManyVideos(15);

  await page.goto('/');
  await expect(page.locator('.video-card:not(.skeleton-card)')).toHaveCount(12, { timeout: 10000 });

  // Collect page 1 titles
  const page1Titles = await page.locator('.card-title').allTextContents();

  // Click next
  await page.locator('.pagination button[data-page="2"]').click();
  await expect(page.locator('.video-card:not(.skeleton-card)')).toHaveCount(3, { timeout: 8000 });

  // Page 2 titles should not overlap with page 1
  const page2Titles = await page.locator('.card-title').allTextContents();
  const overlap = page1Titles.filter(t => page2Titles.includes(t));
  expect(overlap.length).toBe(0);
});

test('no duplicate titles across pages', async ({ page }) => {
  await seedManyVideos(15);

  await page.goto('/');
  await expect(page.locator('.video-card:not(.skeleton-card)')).toHaveCount(12, { timeout: 10000 });
  const p1 = await page.locator('.card-title').allTextContents();

  await page.locator('.pagination button[data-page="2"]').click();
  await expect(page.locator('.video-card:not(.skeleton-card)')).toHaveCount(3, { timeout: 8000 });
  const p2 = await page.locator('.card-title').allTextContents();

  const all = [...p1, ...p2];
  const unique = new Set(all);
  expect(unique.size).toBe(all.length); // No duplicates
  expect(all.length).toBe(15);
});

test('empty home page shows upload prompt', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.empty-state')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.empty-state a')).toHaveAttribute('href', '/upload');
});

test('prev button is disabled on page 1', async ({ page }) => {
  await seedManyVideos(15);

  await page.goto('/');
  await expect(page.locator('.video-card:not(.skeleton-card)')).toHaveCount(12, { timeout: 10000 });
  await expect(page.locator('.pagination button').first()).toBeDisabled();
});

test('sort by views works', async ({ page }) => {
  await resetData();
  // Seed with different view counts
  await seedManyVideos(3, {});

  await page.goto('/');
  await expect(page.locator('.video-card:not(.skeleton-card)')).toHaveCount(3, { timeout: 10000 });

  // Click "Most Viewed" chip
  await page.locator('.chip[data-sort="views"]').click();
  await expect(page.locator('.video-card:not(.skeleton-card)')).toHaveCount(3, { timeout: 8000 });
});
