import { expect, test } from './fixtures/fixtures.js';

test.describe('Smoke Tests', () => {
  test('build integrity: manifest.json is bundled', async ({ optionsPage }) => {
    const exists = await optionsPage.evaluate(async () => {
      const url = chrome.runtime.getURL('manifest.json');
      const response = await fetch(url);
      return response.ok;
    });
    expect(exists).toBe(true);
  });

  test('Service Workers currently only expected in Chromium test runs', async ({ browserName, context }) => {
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

  test('isTestBuild flag must exist to ensure running against test build', async ({ backgroundPage }) => {
    // Fail fast if running against a production build instead of a test build
    const isTestBuild = await backgroundPage.evaluate(() => globalThis.isTestBuild);
    expect(isTestBuild).toBe(true);
  });
});
