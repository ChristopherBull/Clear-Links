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

  test('short URL expansion (for bit.ly) returns ignore when Bitly OAuth is disabled', async ({ backgroundCoveragePage }) => {
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

  test('onTabReplaced triggers injection for replaced tab', async ({ backgroundCoveragePage }) => {
    const result = await backgroundCoveragePage.evaluate(async () => {
      const calls = { tabsGet: 0, executeScript: 0 };

      // Capture the listener background.js registers so we can call it manually.
      const originalAddListener = browser.webNavigation.onTabReplaced.addListener;
      let capturedListener;
      browser.webNavigation.onTabReplaced.addListener = (fn) => {
        capturedListener = fn;
      };

      // Stub tabs.get to return a replaced tab URL and count invocations (background.js calls it twice: onTabReplaced + tabExists).
      const originalTabsGet = browser.tabs.get;
      browser.tabs.get = (tabId) => {
        calls.tabsGet += 1;
        return { id: tabId, url: 'https://replaced.example/' };
      };

      // Count content-script injections; delegate to real executeScript if present to avoid breaking internals.
      const originalExecuteScript = browser.scripting.executeScript;
      browser.scripting.executeScript = (...args) => {
        calls.executeScript += 1;
        return originalExecuteScript?.(...args) ?? [];
      };

      await import(chrome.runtime.getURL('background.js'));

      if (!capturedListener) {
        throw new Error('onTabReplaced listener not registered');
      }

      await capturedListener({ tabId: 5 });

      browser.webNavigation.onTabReplaced.addListener = originalAddListener;
      browser.tabs.get = originalTabsGet;
      browser.scripting.executeScript = originalExecuteScript;

      return calls;
    });

    // Two tabs.get calls: one in onTabReplaced handler, one in background.tabExists.
    expect(result.tabsGet).toBe(2);
    // Two injections expected: shared lib + main content script.
    expect(result.executeScript).toBe(2);
  });

  test('activationFilter allowlist injects only allowlisted host', async ({ backgroundCoveragePage }) => {
    const result = await backgroundCoveragePage.evaluate(async () => {
      const calls = { executeScript: 0 };

      const originalStorageLocalGet = browser.storage.local.get;
      const originalStorageSyncGet = browser.storage.sync.get;
      browser.storage.local.get = () => ({
        activationFilter: 2,
        domainWhitelist: [ 'allowed.example' ],
        domainBlacklist: [],
        OAuthBitLy: { enabled: false, token: '' },
        syncOffline: {},
      });
      browser.storage.sync.get = () => ({
        displayExternalDomainsOnly: true,
      });

      const originalTabsGet = browser.tabs.get;
      browser.tabs.get = tabId => ({ id: tabId, url: 'https://allowed.example/page' });

      const originalExecuteScript = browser.scripting.executeScript;
      browser.scripting.executeScript = (...args) => {
        calls.executeScript += 1;
        return originalExecuteScript?.(...args) ?? [];
      };

      await import(chrome.runtime.getURL('background.js'));

      await globalThis.clearLinksTestHooks.runtimeMessageHandler(
        { activationHostname: 'allowed.example' },
        { tab: { id: 1, url: 'https://allowed.example/page' } },
      );

      browser.storage.local.get = originalStorageLocalGet;
      browser.storage.sync.get = originalStorageSyncGet;
      browser.tabs.get = originalTabsGet;
      browser.scripting.executeScript = originalExecuteScript;

      return calls;
    });

    // Two injections expected: shared lib + main content script.
    expect(result.executeScript).toBe(2);
  });

  test('activationFilter allowlist blocks non-allowlisted host', async ({ backgroundCoveragePage }) => {
    const result = await backgroundCoveragePage.evaluate(async () => {
      const calls = { executeScript: 0 };

      const originalStorageLocalGet = browser.storage.local.get;
      const originalStorageSyncGet = browser.storage.sync.get;
      browser.storage.local.get = () => ({
        activationFilter: 2,
        domainWhitelist: [ 'allowed.example' ],
        domainBlacklist: [],
        OAuthBitLy: { enabled: false, token: '' },
        syncOffline: {},
      });
      browser.storage.sync.get = () => ({
        displayExternalDomainsOnly: true,
      });

      const originalTabsGet = browser.tabs.get;
      browser.tabs.get = tabId => ({ id: tabId, url: 'https://blocked.example/' });

      const originalExecuteScript = browser.scripting.executeScript;
      browser.scripting.executeScript = (...args) => {
        calls.executeScript += 1;
        return originalExecuteScript?.(...args) ?? [];
      };

      await import(chrome.runtime.getURL('background.js'));

      await globalThis.clearLinksTestHooks.runtimeMessageHandler(
        { activationHostname: 'blocked.example' },
        { tab: { id: 1, url: 'https://blocked.example/' } },
      );

      browser.storage.local.get = originalStorageLocalGet;
      browser.storage.sync.get = originalStorageSyncGet;
      browser.tabs.get = originalTabsGet;
      browser.scripting.executeScript = originalExecuteScript;

      return calls;
    });

    expect(result.executeScript).toBe(0);
  });

  test('activationFilter denylist injects when host not denylisted', async ({ backgroundCoveragePage }) => {
    const result = await backgroundCoveragePage.evaluate(async () => {
      const calls = { executeScript: 0 };

      const originalStorageLocalGet = browser.storage.local.get;
      const originalStorageSyncGet = browser.storage.sync.get;
      browser.storage.local.get = () => ({
        activationFilter: 3,
        domainWhitelist: [],
        domainBlacklist: [ 'deny.example' ],
        OAuthBitLy: { enabled: false, token: '' },
        syncOffline: {},
      });
      browser.storage.sync.get = () => ({
        displayExternalDomainsOnly: true,
      });

      const originalTabsGet = browser.tabs.get;
      browser.tabs.get = tabId => ({ id: tabId, url: 'https://ok.example/' });

      const originalExecuteScript = browser.scripting.executeScript;
      browser.scripting.executeScript = (...args) => {
        calls.executeScript += 1;
        return originalExecuteScript?.(...args) ?? [];
      };

      await import(chrome.runtime.getURL('background.js'));

      await globalThis.clearLinksTestHooks.runtimeMessageHandler(
        { activationHostname: 'ok.example' },
        { tab: { id: 1, url: 'https://ok.example/' } },
      );

      browser.storage.local.get = originalStorageLocalGet;
      browser.storage.sync.get = originalStorageSyncGet;
      browser.tabs.get = originalTabsGet;
      browser.scripting.executeScript = originalExecuteScript;

      return calls;
    });

    // Two injections expected: shared lib + main content script.
    expect(result.executeScript).toBe(2);
  });

  test('activationFilter denylist blocks denylisted host', async ({ backgroundCoveragePage }) => {
    const result = await backgroundCoveragePage.evaluate(async () => {
      const calls = { executeScript: 0 };

      const originalStorageLocalGet = browser.storage.local.get;
      const originalStorageSyncGet = browser.storage.sync.get;
      browser.storage.local.get = () => ({
        activationFilter: 3,
        domainWhitelist: [],
        domainBlacklist: [ 'deny.example' ],
        OAuthBitLy: { enabled: false, token: '' },
        syncOffline: {},
      });
      browser.storage.sync.get = () => ({
        displayExternalDomainsOnly: true,
      });

      const originalTabsGet = browser.tabs.get;
      browser.tabs.get = tabId => ({ id: tabId, url: 'https://deny.example/' });

      const originalExecuteScript = browser.scripting.executeScript;
      browser.scripting.executeScript = (...args) => {
        calls.executeScript += 1;
        return originalExecuteScript?.(...args) ?? [];
      };

      await import(chrome.runtime.getURL('background.js'));

      await globalThis.clearLinksTestHooks.runtimeMessageHandler(
        { activationHostname: 'deny.example' },
        { tab: { id: 1, url: 'https://deny.example/' } },
      );

      browser.storage.local.get = originalStorageLocalGet;
      browser.storage.sync.get = originalStorageSyncGet;
      browser.tabs.get = originalTabsGet;
      browser.scripting.executeScript = originalExecuteScript;

      return calls;
    });

    expect(result.executeScript).toBe(0);
  });
});
