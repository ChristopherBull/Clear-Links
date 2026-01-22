import { expect, test } from './fixtures/fixtures.js';

test.describe('Service worker', () => {
  test('Service Workers are expected to not yet be supported in non-Chromium browsers', async ({ browserName, context }) => {
    // Some tests are skipped due to Playwright not yet supporting service workers in non-chromium browsers.
    // If this tests fails, it means that Playwright now supports service workers in non-chromium browsers and the skipped tests should be tested and re-enabled.
    // NB: https://playwright.dev/docs/api/class-browsercontext#browser-context-service-workers
    if (browserName === 'chromium') {
      // Expect service workers to be a function in chromium browsers
      await expect(context.serviceWorkers).toBeDefined();
    } else {
      // Expect service workers to be undefined in non-chromium browsers
      await expect(context.serviceWorkers).toBeUndefined();
    }
  });
});
