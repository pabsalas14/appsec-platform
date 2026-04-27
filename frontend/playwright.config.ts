import { defineConfig, devices } from '@playwright/test';

const TEST_BASE_URL =
  process.env.E2E_BASE_URL ?? process.env.TEST_BASE_URL ?? 'http://localhost:3000';
const API_BASE_URL = process.env.TEST_API_BASE_URL ?? 'http://localhost:8000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  globalTimeout: 600000,

  use: {
    baseURL: TEST_BASE_URL,
    apiURL: API_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 10000,
    actionTimeout: 5000,
  },

  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  projects: process.env.CI
    ? [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
      ],
});
