/**
 * Playwright Configuration for Riksdagsmonitor Visual Regression Tests
 *
 * Configures visual regression testing for all 9 dashboards across
 * desktop, tablet, and mobile viewports.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Directory for visual regression test files
  testDir: './tests/visual-regression',

  // Run tests in parallel
  fullyParallel: false,

  // Fail the build on CI if tests are left with test.only
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 1 : 0,

  // Limit worker parallelism
  workers: process.env.CI ? 1 : 2,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  // Shared settings for all projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    // Matches Vite's preview server default port (4173).
    // Override with PLAYWRIGHT_BASE_URL env var if the port is unavailable.
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Capture screenshot only on failure by default
    screenshot: 'only-on-failure',

    // Extra timeout for chart rendering
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  // Visual regression settings
  expect: {
    toHaveScreenshot: {
      // Allow small pixel differences due to anti-aliasing
      maxDiffPixels: 100,
      // Threshold for pixel matching (0.0 - 1.0)
      threshold: 0.2,
      // Animation handling
      animations: 'disabled',
    },
    timeout: 30000,
  },

  // Configure projects for desktop, tablet, and mobile viewports
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'Tablet',
      use: {
        ...devices['iPad (gen 7)'],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'Mobile',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 375, height: 667 },
      },
    },
  ],

  // Local dev server config
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'npm run preview',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 60000,
      },
});
