import { expect, test } from './fixtures/fixtures.js';

test.describe('Smoke Tests', () => {
  // Playwright does not yet support service workers or background pages in
  // non-chromium browsers (e.g. Firefox). Skips this whole group accordingly.
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only! Testing with Service Workers or Background Pages in Playwright is not yet possible in non-chromium browsers.');

  test('isTestBuild flag must exist to ensure running against test build', async ({ backgroundPage }) => {
    // Fail fast if running against a production build instead of a test build
    const isTestBuild = await backgroundPage.evaluate(() => globalThis.isTestBuild);
    expect(isTestBuild).toBe(true);
  });
});
