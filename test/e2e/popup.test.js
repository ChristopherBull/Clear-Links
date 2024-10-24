import { expect, test } from './fixtures/fixtures.js';

test.describe('Action popup', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only! Testing with Service Workers or Background Pages (including getting extensionId) in Playwright is not yet possible in non-chromium browsers.');

  test('loads', async ({ page, browserExtensionUrlProtocol, extensionId }) => {
    await page.goto(`${browserExtensionUrlProtocol}://${extensionId}/action-popup.html`);
    await expect(page).toHaveTitle('Action Popup | Clear Links');
  });
});
