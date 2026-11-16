import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 2,
  retries: process.env.CI ? 1 : 0,
  timeout: 30000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4180/NEUSfreshmen_Galgame/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHANNEL
      ? { channel: process.env.PLAYWRIGHT_CHANNEL }
      : {},
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    {
      name: 'phone',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
    {
      name: 'landscape',
      use: { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    command: 'npm run build && node scripts/server.mjs --dist --base /NEUSfreshmen_Galgame',
    url: 'http://127.0.0.1:4180/NEUSfreshmen_Galgame/',
    env: { PORT: '4180' },
    reuseExistingServer: false,
    timeout: 30000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 1000 },
  },
});
