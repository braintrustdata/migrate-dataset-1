const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3002',
    headless: true,
    actionTimeout: 5000,
  },
  webServer: {
    command: 'npx wrangler dev --port 3002',
    port: 3002,
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
});
