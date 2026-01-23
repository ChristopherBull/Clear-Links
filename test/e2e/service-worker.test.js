import { expect, test } from './fixtures/fixtures.js';

test.describe('Service worker', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only! Testing with Service Workers or Background Pages in Playwright is not yet possible in non-chromium browsers.');
});
