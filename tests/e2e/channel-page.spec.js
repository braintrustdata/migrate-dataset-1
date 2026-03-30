import { test, expect } from '@playwright/test';
import { resetData, seedVideo } from '../helpers/seed.js';

test.beforeEach(async () => {
  await resetData();
});

test('channel page shows all videos for that user', async ({ page }) => {
  await seedVideo({ title: 'Channel Video 1', uploaderName: 'channelowner' });
  await seedVideo({ title: 'Channel Video 2', uploaderName: 'channelowner' });
  await seedVideo({ title: 'Other User Video', uploaderName: 'otheruser' });

  await page.goto('/channel?u=channelowner');
  await expect(page.locator('#channelNameHeading')).toHaveText('channelowner', { timeout: 8000 });

  // Should show exactly 2 videos (not the other user's)
  await expect(page.locator('.video-card')).toHaveCount(2, { timeout: 8000 });
  const titles = await page.locator('.card-title').allTextContents();
  expect(titles).toContain('Channel Video 1');
  expect(titles).toContain('Channel Video 2');
  expect(titles).not.toContain('Other User Video');
});

test('clicking a channel video card navigates to watch page', async ({ page }) => {
  const video = await seedVideo({ title: 'Clickable Channel Video', uploaderName: 'clickuser' });

  await page.goto('/channel?u=clickuser');
  await expect(page.locator('.video-card')).toHaveCount(1, { timeout: 8000 });

  await page.locator('.video-card').first().click();
  await expect(page).toHaveURL(`/watch?v=${video.videoId}`);
  await expect(page.locator('#videoTitle')).toHaveText('Clickable Channel Video', { timeout: 8000 });
});

test('channel page has consistent avatar color', async ({ page }) => {
  await seedVideo({ uploaderName: 'coloruser' });

  await page.goto('/channel?u=coloruser');
  await expect(page.locator('#channelAvatarLarge')).toBeVisible({ timeout: 8000 });
  const color1 = await page.locator('#channelAvatarLarge').evaluate(el => el.style.background);

  // Reload page — color should be the same
  await page.reload();
  await expect(page.locator('#channelAvatarLarge')).toBeVisible({ timeout: 8000 });
  const color2 = await page.locator('#channelAvatarLarge').evaluate(el => el.style.background);

  expect(color1).toBe(color2);
});

test('channel page shows video count', async ({ page }) => {
  await seedVideo({ uploaderName: 'countuser' });
  await seedVideo({ uploaderName: 'countuser' });

  await page.goto('/channel?u=countuser');
  await expect(page.locator('#channelMeta')).toContainText('2', { timeout: 8000 });
});

test('channel with no videos shows empty state', async ({ page }) => {
  await page.goto('/channel?u=emptyuser');
  await expect(page.locator('#channelNameHeading')).toHaveText('emptyuser', { timeout: 8000 });
  await expect(page.locator('.empty-state')).toBeVisible({ timeout: 8000 });
});

test('channel tabs switch between Videos and About', async ({ page }) => {
  await seedVideo({ uploaderName: 'tabuser' });

  await page.goto('/channel?u=tabuser');
  await expect(page.locator('#videosTab')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('#aboutTab')).not.toBeVisible();

  await page.locator('[data-tab="about"]').click();
  await expect(page.locator('#aboutTab')).toBeVisible();
  await expect(page.locator('#videosTab')).not.toBeVisible();

  await page.locator('[data-tab="videos"]').click();
  await expect(page.locator('#videosTab')).toBeVisible();
});

test('channel API returns channel profile', async ({ request }) => {
  const res = await request.get('/api/channels/apiuser');
  expect(res.status()).toBe(200);
  const data = await res.json();
  expect(data.username).toBe('apiuser');
  expect(data).toHaveProperty('avatarColor');
  expect(data).toHaveProperty('videoCount');
});
