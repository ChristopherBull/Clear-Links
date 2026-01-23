import { expect, test } from './fixtures/fixtures.js';

test.describe('Service worker', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only! Testing with Service Workers or Background Pages in Playwright is not yet possible in non-chromium browsers.');

  test('service worker is registered and running background.js', ({ backgroundPage }) => {
    const scriptUrl = backgroundPage.url();
    expect(scriptUrl.includes('background.js')).toBe(true);
  });

  test('service worker can access extension storage', async ({ backgroundPage }) => {
    const hasStorageAccess = await backgroundPage.evaluate(async () => {
      const data = await browser.storage.local.get();
      return data !== undefined && data !== null;
    });
    expect(hasStorageAccess).toBe(true);
  });
});
