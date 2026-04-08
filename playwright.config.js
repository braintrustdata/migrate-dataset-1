// @ts-check
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 15_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3003',
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'npx wrangler dev --port 3003',
    url: 'http://localhost:3003',
    reuseExistingServer: false,
    timeout: 15_000,
  },
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
});
