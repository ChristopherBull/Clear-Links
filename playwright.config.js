// @ts-check
import { defineConfig, devices } from '@playwright/test';

const TESTING_WEBSERVER_BASE_URL = 'http://127.0.0.1:8080';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  outputDir: 'docs/test-results/e2e/playwright',
  testDir: './test/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    [ 'html', { outputFolder: 'docs/test-results/e2e/playwright-report' } ],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: TESTING_WEBSERVER_BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    // {
    //   name: 'chromium',
    //   use: { ...devices['Desktop Chrome'] },
    // },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      // Cannot run Firefox tests in parallel due to install workaround in
      // `test/e2e/fixtures/fixtures.js` using RDP (only 1 browser instance
      // can listen/connect to RDP port at a time).
      // NOTE: This is a temporary workaround until Playwright supports
      // installing Firefox extensions (microsoft/playwright#7297), after which
      // this `fullyParallel` option can be deleted (i.e. inherit from
      // the global config).
      fullyParallel: false,
    },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  // Run a local web server to test against webpages (Chrome restricts extensions on file://)
  webServer: {
    command: 'npm run test:e2e:start-server',
    url: TESTING_WEBSERVER_BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
});
