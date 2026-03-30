import { test, expect } from '@playwright/test';
import { resetData } from '../helpers/seed.js';
import path from 'path';
import fs from 'fs';

test.beforeEach(async () => {
  await resetData();
});

// Create a minimal valid video file for upload tests
function getTestVideoPath() {
  const fixturePath = path.resolve('./tests/fixtures/test-video.mp4');
  if (!fs.existsSync(fixturePath)) {
    // Write a stub MP4 (enough bytes for the upload handler to accept)
    const dir = path.dirname(fixturePath);
    fs.mkdirSync(dir, { recursive: true });
    // Minimal ftyp box for MP4
    const buf = Buffer.from([
      0x00,0x00,0x00,0x20, 0x66,0x74,0x79,0x70,
      0x69,0x73,0x6f,0x6d, 0x00,0x00,0x02,0x00,
      0x69,0x73,0x6f,0x6d, 0x69,0x73,0x6f,0x32,
      0x61,0x76,0x63,0x31, 0x6d,0x70,0x34,0x31,
    ]);
    fs.writeFileSync(fixturePath, buf);
  }
  return fixturePath;
}

test('upload a video and land on the watch page', async ({ page }) => {
  const videoPath = getTestVideoPath();

  await page.goto('/upload');
  await expect(page).toHaveTitle(/Upload/i);

  // Set file
  await page.locator('#fileInput').setInputFiles(videoPath);

  // Fill form fields
  await page.fill('#uploadTitle', 'E2E Test Video');
  await page.fill('#uploadDescription', 'A test description');
  await page.fill('#uploadTags', 'e2e,test');
  await page.fill('#uploaderName', 'testchannel');

  // Submit and wait for redirect
  const [response] = await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/upload') && res.status() === 201),
    page.locator('#uploadBtn').click(),
  ]);

  // Should redirect to watch page
  await page.waitForURL(/\/watch\?v=/, { timeout: 10000 });

  // Video title on watch page
  await expect(page.locator('#videoTitle')).toHaveText('E2E Test Video', { timeout: 8000 });

  // Video element has stream src
  const videoSrc = await page.locator('#mainPlayer').getAttribute('src');
  expect(videoSrc).toMatch(/\/stream\//);

  // View count shows 1 (incremented by getVideo call)
  await expect(page.locator('#viewCount')).toContainText('1', { timeout: 5000 });

  // Channel name shown
  await expect(page.locator('#channelNameLink')).toHaveText('testchannel');
});

test('progress bar appears during upload', async ({ page }) => {
  const videoPath = getTestVideoPath();

  await page.goto('/upload');
  await page.locator('#fileInput').setInputFiles(videoPath);
  await page.fill('#uploadTitle', 'Progress Test');
  await page.fill('#uploaderName', 'progresschannel');

  // Submit
  page.locator('#uploadBtn').click();

  // Progress bar should appear
  await expect(page.locator('#progressWrap')).toBeVisible({ timeout: 5000 });

  // Wait for completion
  await page.waitForURL(/\/watch\?v=/, { timeout: 15000 });
});

test('uploaded video appears on home page', async ({ page }) => {
  const videoPath = getTestVideoPath();

  await page.goto('/upload');
  await page.locator('#fileInput').setInputFiles(videoPath);
  await page.fill('#uploadTitle', 'Home Page Test Video');
  await page.fill('#uploaderName', 'homechannel');
  page.locator('#uploadBtn').click();

  await page.waitForURL(/\/watch\?v=/, { timeout: 15000 });

  // Go to home
  await page.goto('/');
  await expect(page.locator('.video-card')).toHaveCount(1, { timeout: 8000 });
  await expect(page.locator('.card-title').first()).toHaveText('Home Page Test Video');
});
