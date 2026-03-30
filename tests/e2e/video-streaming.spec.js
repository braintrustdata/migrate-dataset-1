import { test, expect } from '@playwright/test';
import { resetData, seedVideo } from '../helpers/seed.js';

test.beforeEach(async () => {
  await resetData();
});

test('stream endpoint responds with 206 for range requests', async ({ request }) => {
  const video = await seedVideo({ title: 'Stream Test' });

  // Full request first (no range)
  const full = await request.get(`/stream/${video.videoId}`);
  expect([200, 206]).toContain(full.status());

  // Range request
  const range = await request.get(`/stream/${video.videoId}`, {
    headers: { Range: 'bytes=0-15' },
  });
  expect(range.status()).toBe(206);
  expect(range.headers()['content-range']).toMatch(/^bytes 0-15\//);
  expect(range.headers()['accept-ranges']).toBe('bytes');
});

test('stream endpoint returns 404 for unknown video', async ({ request }) => {
  const res = await request.get('/stream/nonexistent-video-id');
  expect(res.status()).toBe(404);
});

test('watch page loads video with correct src', async ({ page }) => {
  const video = await seedVideo({ title: 'Stream Watch Test' });

  // Capture range requests
  const rangeRequests = [];
  page.on('request', req => {
    if (req.url().includes('/stream/') && req.headers()['range']) {
      rangeRequests.push(req);
    }
  });

  await page.goto(`/watch?v=${video.videoId}`);
  await expect(page.locator('#videoTitle')).toHaveText('Stream Watch Test', { timeout: 8000 });

  const src = await page.locator('#mainPlayer').getAttribute('src');
  expect(src).toBe(`/stream/${video.videoId}`);
});

test('stream respects range boundary with partial content', async ({ request }) => {
  const video = await seedVideo({ title: 'Range Boundary Test' });

  // Request just first byte
  const res = await request.get(`/stream/${video.videoId}`, {
    headers: { Range: 'bytes=0-0' },
  });
  expect(res.status()).toBe(206);
  const body = await res.body();
  expect(body.length).toBe(1);
});

test('stream returns 416 for out-of-range request', async ({ request }) => {
  const video = await seedVideo({ title: 'Out of Range Test' });

  const res = await request.get(`/stream/${video.videoId}`, {
    headers: { Range: 'bytes=999999999-9999999999' },
  });
  expect(res.status()).toBe(416);
});
