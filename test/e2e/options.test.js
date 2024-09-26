import { expect, test } from './fixtures/fixtures.js';

// Test browser extension options page.
// Requires access to the extension's service worker/background page.
test.describe('Options page', () => {
  // Playwright does not yet support service workers or background pages in
  // non-chromium browsers (e.g. Firefox)
  // Note: placing test skip logic here will skip all tests in this describe
  // block, and is substantially faster than placing it in each test (or
  // evaluated for each test).
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only! Testing with Service Workers or Background Pages in Playwright is not yet possible in non-chromium browsers.');

  test('opens and has correct title', async ({ optionsPage }) => {
    await expect(optionsPage).toHaveTitle('Link Domain Transparency — Options');
  });

  test('has Visibility tab', async ({ optionsPage }) => {
    const tab1 = await optionsPage.locator('#tab1[title="Visibility"]');
    await expect(tab1).toBeAttached();
  });
});
