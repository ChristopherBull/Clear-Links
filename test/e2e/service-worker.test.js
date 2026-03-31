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

  // Load background.js inside the coverage shim page so V8 can instrument it
  // (service worker itself runs in a separate process without coverage hooks).
  test('background.js loads in coverage shim page', async ({ backgroundCoveragePage }) => {
    const loaded = await backgroundCoveragePage.evaluate(async () => {
      await import(chrome.runtime.getURL('background.js'));
      return true;
    });
    expect(loaded).toBe(true);
  });

  test('short URL expansion returns ignore when Bitly OAuth is disabled', async ({ backgroundCoveragePage }) => {
    const expansionResult = await backgroundCoveragePage.evaluate(async () => {
      await import(chrome.runtime.getURL('background.js'));
      return globalThis.clearLinksTestHooks.sendRuntimeMessage(
        { shortURL: 'https://bit.ly/example', checkCache: true },
        { tab: { id: 1, url: 'https://example.com' } },
      );
    });

    expect(expansionResult.ignore).toBe(true);
    expect(expansionResult.source.url).toBe('https://bit.ly/example');
  });

  test('ActionBadge error status is clear when critical permissions are granted', async ({ backgroundCoveragePage }) => {
    const result = await backgroundCoveragePage.evaluate(async () => {
      // eslint-disable-next-line sonarjs/no-clear-text-protocols
      const criticalPermissions = { origins: [ 'http://*/', 'https://*/' ] };

      await import(chrome.runtime.getURL('background.js'));

      const [ hasPermissions, badgeText ] = await Promise.all([
        browser.permissions.contains(criticalPermissions),
        browser.action.getBadgeText({}),
      ]);

      return { hasPermissions, badgeText };
    });

    expect(result.hasPermissions).toBe(true);
    expect(result.badgeText).toBe('');
  });
});
