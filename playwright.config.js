// @ts-check
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 15_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:3001',
    reuseExistingServer: false,
    timeout: 15_000,
    env: {
      PORT: '3001',
      DATA_DIR: './test-data',
    },
  },
  workers: 1, // Sequential to avoid data race between tests
  reporter: [['list'], ['html', { open: 'never' }]],
});
