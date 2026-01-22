import { expect, test } from './fixtures/fixtures.js';

test.describe('Action popup', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only! Testing with Service Workers or Background Pages (including getting extensionId) in Playwright is not yet possible in non-chromium browsers.');

  test('loads', async ({ page, browserExtensionUrlProtocol, extensionId }) => {
    await page.goto(`${browserExtensionUrlProtocol}://${extensionId}/action-popup.html`);
    await expect(page).toHaveTitle('Action Popup | Clear Links');
  });

  test('toggles dark mode and applies CSS changes', async ({ page, browserExtensionUrlProtocol, extensionId }) => {
    await page.goto(`${browserExtensionUrlProtocol}://${extensionId}/action-popup.html`);

    // Get initial styles in light mode
    const bodyLightBg = await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor);
    const h1LightColor = await page.locator('h1').first().evaluate(el => getComputedStyle(el).color);

    // Trigger Dark mode
    await page.emulateMedia({ colorScheme: 'dark' });

    // Get styles after dark mode is enabled
    const bodyDarkBg = await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor);
    const h1DarkColor = await page.locator('h1').first().evaluate(el => getComputedStyle(el).color);

    // Verify CSS values have changed
    await expect(bodyLightBg).not.toEqual(bodyDarkBg);
    await expect(h1LightColor).not.toEqual(h1DarkColor);
  });

  // ------------ //
  // Action Badge //
  // ------------ //

  test('action badge setErrorStatus sets badge text', async ({ backgroundPage }) => {
    await backgroundPage.evaluate(() => {
      // eslint-disable-next-line no-undef
      return ActionBadge.setErrorStatus();
    });
    const badgeText = await backgroundPage.evaluate(() => {
      return browser.action.getBadgeText({});
    });
    await expect(badgeText).not.toEqual('');
  });

  test('action badge clearStatus removes badge text', async ({ backgroundPage }) => {
    // First set error status
    await backgroundPage.evaluate(() => {
      // eslint-disable-next-line no-undef
      return ActionBadge.setErrorStatus();
    });
    // Then clear it
    await backgroundPage.evaluate(() => {
      // eslint-disable-next-line no-undef
      return ActionBadge.clearStatus();
    });
    const badgeText = await backgroundPage.evaluate(() => {
      return browser.action.getBadgeText({});
    });
    await expect(badgeText).toEqual('');
  });
});
