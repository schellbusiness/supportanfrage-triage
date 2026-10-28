import { defineConfig, devices } from '@playwright/test';

// Getestet wird immer gegen die öffentliche URL. BASE_URL wählt die Version (v1 oder v2).
const BASE_URL = process.env.BASE_URL ?? 'https://schellbusiness.github.io/supportanfrage-triage/v1/';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/report.json' }],
  ],
  use: {
    baseURL: BASE_URL,
    locale: 'de-DE',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
