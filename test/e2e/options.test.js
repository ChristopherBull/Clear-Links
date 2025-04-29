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

  test('confirm dialog opens when clicking on "Reset to defaults"', async ({ optionsPage }) => {
    const tabAbout = await optionsPage.locator('#tab6[title="About"]');
    const restoreDefaultsButton = await optionsPage.locator('#restore');
    // Click the "About" tab
    await tabAbout.click();
    // Wait for the "Restore Defaults" button to be visible
    await expect(restoreDefaultsButton).toBeVisible();
    // Click the "Restore Defaults" button
    await restoreDefaultsButton.click();
    // Wait for the confirm dialog to appear (it is attached when the button is clicked)
    const confirmDialog = await optionsPage.locator('.confirm');
    // Wait for the confirm dialog to appear
    await expect(confirmDialog).toBeVisible();
  });

  test('confirm dialog disappears when closed', async ({ optionsPage }) => {
    const tabAbout = await optionsPage.locator('#tab6[title="About"]');
    const restoreDefaultsButton = await optionsPage.locator('#restore');
    // Click the "About" tab
    await tabAbout.click();
    // Wait for the "Restore Defaults" button to be visible
    await expect(restoreDefaultsButton).toBeVisible();
    // Click the "Restore Defaults" button
    await restoreDefaultsButton.click();
    // Wait for the confirm dialog to appear (it is attached when the button is clicked)
    const confirmDialog = await optionsPage.locator('.confirm');
    // Wait for the confirm dialog to appear
    await expect(confirmDialog).toBeVisible();
    // Click the close button
    const closeButton = await confirmDialog.locator('.confirm-close');
    await closeButton.click();
    // Wait for the confirm dialog to disappear
    await expect(confirmDialog).not.toBeVisible();
  });

  test('confirm dialog disappears when cancelled', async ({ optionsPage }) => {
    const tabAbout = await optionsPage.locator('#tab6[title="About"]');
    const restoreDefaultsButton = await optionsPage.locator('#restore');
    // Click the "About" tab
    await tabAbout.click();
    // Wait for the "Restore Defaults" button to be visible
    await expect(restoreDefaultsButton).toBeVisible();
    // Click the "Restore Defaults" button
    await restoreDefaultsButton.click();
    // Wait for the confirm dialog to appear (it is attached when the button is clicked)
    const confirmDialog = await optionsPage.locator('.confirm');
    // Wait for the confirm dialog to appear
    await expect(confirmDialog).toBeVisible();
    // Click the cancel button
    const cancelButton = await confirmDialog.locator('.confirm-button-cancel');
    await cancelButton.click();
    // Wait for the confirm dialog to disappear
    await expect(confirmDialog).not.toBeVisible();
  });
});
