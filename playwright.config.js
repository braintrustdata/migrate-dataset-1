// @ts-check
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'npx wrangler dev --port 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: false,
    timeout: 30_000,
  },
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
});
