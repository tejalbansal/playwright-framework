import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment-specific .env file
const ENV = process.env.TEST_ENV || 'staging';
dotenv.config({ path: path.resolve(__dirname, `config/.env.${ENV}`) });
dotenv.config({ path: path.resolve(__dirname, 'config/.env'), override: false });

export default defineConfig({
  // Test directory
  testDir: './tests',

  // Global test timeout
  timeout: 60_000,

  // Expect timeout for assertions
  expect: {
    timeout: 10_000,
  },

  // Reporter configuration
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit-results.xml' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['list'],
  ],

  // Global test options
  use: {
    // Base URL resolved from environment config
    baseURL: process.env.BASE_URL || 'https://www.saucedemo.com',

    // Use data-test as the testId attribute so getByTestId() resolves it
    testIdAttribute: 'data-test',

    // Screenshots on failure
    screenshot: 'only-on-failure',

    // Video recording on retry
    video: 'on-first-retry',

    // Trace on first retry for debugging
    trace: 'on-first-retry',

    // Action timeout
    actionTimeout: 15_000,

    // Navigation timeout
    navigationTimeout: 30_000,

    // Viewport
    viewport: { width: 1280, height: 720 },

    // Locale
    locale: 'en-US',

    // Time zone
    timezoneId: 'America/New_York',
  },

  // Output directory for test artifacts
  outputDir: 'test-results/',

  // Retry on CI, no retries locally
  retries: process.env.CI ? 2 : 0,

  // Parallel workers - use fewer on CI to avoid rate limiting
  workers: process.env.CI ? 2 : undefined,

  // Fail fast - stop after first failure on CI (optional)
  forbidOnly: !!process.env.CI,

  // Project configurations for cross-browser testing
  // Each test is fully isolated — no shared storageState. Login runs per-test
  // via the authenticatedPage fixture defined in fixtures/fixtures.ts.
  projects: [
    // ─── Desktop browsers ─────────────────────────────────────────────────────
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // ─── Mobile browsers (smoke only) ─────────────────────────────────────────
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: '**/*.smoke.spec.ts',
    },

    // ─── API tests (no browser required) ──────────────────────────────────────
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: process.env.API_BASE_URL || 'https://dummyjson.com',
        extraHTTPHeaders: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    },
  ],
});
