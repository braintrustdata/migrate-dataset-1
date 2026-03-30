import { test, expect } from '@playwright/test';
import { resetData } from '../helpers/seed.js';
import path from 'path';
import fs from 'fs';

test.beforeEach(async () => {
  await resetData();
});

function getTestVideoPath() {
  const fixturePath = path.resolve('./tests/fixtures/test-video.mp4');
  if (!fs.existsSync(fixturePath)) {
    fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
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

function getTextFilePath() {
  const fixturePath = path.resolve('./tests/fixtures/test-file.txt');
  if (!fs.existsSync(fixturePath)) {
    fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
    fs.writeFileSync(fixturePath, 'This is not a video file', 'utf8');
  }
  return fixturePath;
}

test('upload button is disabled before selecting a file', async ({ page }) => {
  await page.goto('/upload');
  await expect(page.locator('#uploadBtn')).toBeDisabled();
  await expect(page.locator('#uploadBtn')).toHaveText(/Select a video file/i);
});

test('selecting a non-video file shows an error', async ({ page }) => {
  await page.goto('/upload');

  // Set a .txt file
  await page.locator('#fileInput').setInputFiles(getTextFilePath());

  await expect(page.locator('#errorMsg')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('#errorMsg')).toContainText(/valid video/i);

  // Upload button should still be disabled
  await expect(page.locator('#uploadBtn')).toBeDisabled();
});

test('submitting without title shows error', async ({ page }) => {
  await page.goto('/upload');

  await page.locator('#fileInput').setInputFiles(getTestVideoPath());
  // Leave title empty, fill channel name
  await page.fill('#uploaderName', 'validchannel');

  await page.locator('#uploadBtn').click();
  await expect(page.locator('#errorMsg')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('#errorMsg')).toContainText(/title/i);
});

test('submitting without channel name shows error', async ({ page }) => {
  await page.goto('/upload');

  await page.locator('#fileInput').setInputFiles(getTestVideoPath());
  await page.fill('#uploadTitle', 'Valid Title');
  // Leave channel name empty

  await page.locator('#uploadBtn').click();
  await expect(page.locator('#errorMsg')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('#errorMsg')).toContainText(/channel/i);
});

test('upload button is disabled during upload', async ({ page }) => {
  await page.goto('/upload');

  await page.locator('#fileInput').setInputFiles(getTestVideoPath());
  await page.fill('#uploadTitle', 'Disable Test');
  await page.fill('#uploaderName', 'disablechannel');

  await page.locator('#uploadBtn').click();

  // Button should be disabled immediately after click
  await expect(page.locator('#uploadBtn')).toBeDisabled({ timeout: 3000 });

  // Wait for completion
  await page.waitForURL(/\/watch\?v=/, { timeout: 15000 });
});

test('valid upload completes and redirects to watch page', async ({ page }) => {
  await page.goto('/upload');

  await page.locator('#fileInput').setInputFiles(getTestVideoPath());
  await page.fill('#uploadTitle', 'Valid Upload Test');
  await page.fill('#uploadDescription', 'A valid upload');
  await page.fill('#uploadTags', 'valid,test');
  await page.fill('#uploaderName', 'validuser');

  await page.locator('#uploadBtn').click();

  await page.waitForURL(/\/watch\?v=/, { timeout: 15000 });
  await expect(page.locator('#videoTitle')).toHaveText('Valid Upload Test', { timeout: 8000 });
});

test('file preview is shown after selecting a valid video', async ({ page }) => {
  await page.goto('/upload');

  expect(await page.locator('#filePreview').isVisible()).toBe(false);
  await page.locator('#fileInput').setInputFiles(getTestVideoPath());
  await expect(page.locator('#filePreview')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('#previewFileName')).toContainText('test-video.mp4');
});
