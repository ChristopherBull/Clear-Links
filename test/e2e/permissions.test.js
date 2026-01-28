/* eslint-disable sonarjs/no-clear-text-protocols */
import { expect, test } from './fixtures/fixtures.js';

/**
 * Executes requestCriticalPermissions inside a page context with a stubbed prompt.
 * Ensures coverage instrumentation sees permissions.js when run via page.evaluate.
 * @returns {Promise<{ value: boolean, capturedArgs: { origins: string[] } }>} Captured request result and args.
 */
async function runRequestCriticalPermissionsInPage() {
  const Permissions = await import(chrome.runtime.getURL('permissions.js'));

  const originalRequest = browser.permissions.request;
  let capturedArgs;
  browser.permissions.request = (args) => {
    capturedArgs = args;
    return true;
  };

  try {
    const value = await Permissions.requestCriticalPermissions();
    return { value, capturedArgs };
  } finally {
    browser.permissions.request = originalRequest;
  }
}

/**
 * Executes containsCriticalPermissions inside a page context for coverage visibility.
 * @returns {Promise<{ ok: boolean, missingHttp: boolean }>} Boolean results for coverage.
 */
async function runContainsCriticalPermissionsInPage() {
  const Permissions = await import(chrome.runtime.getURL('permissions.js'));
  return {
    ok: Permissions.containsCriticalPermissions({ origins: [ 'http://*/*', 'https://*/*' ] }),
    missingHttp: Permissions.containsCriticalPermissions({ origins: [ 'https://*/*' ] }),
  };
}

/**
 * Runs containsCriticalPermissions in a page context with the provided permissions object.
 * @param {{ origins?: string[] }|null} permissions Permissions argument to test.
 * @returns {Promise<boolean>} Result of containsCriticalPermissions.
 */
async function runContainsCriticalPermissions(permissions) {
  const Permissions = await import(chrome.runtime.getURL('permissions.js'));
  return Permissions.containsCriticalPermissions(permissions);
}

/**
 * Runs areCriticalPermissionsGranted in a page context.
 * @returns {Promise<boolean>} Whether critical permissions are granted.
 */
async function runAreCriticalPermissionsGrantedInPage() {
  const Permissions = await import(chrome.runtime.getURL('permissions.js'));
  return Permissions.areCriticalPermissionsGranted();
}

test.describe('Browser permissions', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only! Testing with Service Workers or Background Pages (including getting extensionId) in Playwright is not yet possible in non-chromium browsers.');

  test('containsCriticalPermissions returns true for critical permissions', async ({ actionPage }) => {
    const result = await actionPage.evaluate(runContainsCriticalPermissions, { origins: [ 'http://*/*', 'https://*/*' ] });
    expect(result).toBe(true);
  });

  test('containsCriticalPermissions returns false when http permission is missing', async ({ actionPage }) => {
    const result = await actionPage.evaluate(runContainsCriticalPermissions, { origins: [ 'https://*/*' ] });
    expect(result).toBe(false);
  });

  test('containsCriticalPermissions returns false when https permission is missing', async ({ actionPage }) => {
    const result = await actionPage.evaluate(runContainsCriticalPermissions, { origins: [ 'http://*/*' ] });
    expect(result).toBe(false);
  });

  test('containsCriticalPermissions returns false for empty permissions', async ({ actionPage }) => {
    const result = await actionPage.evaluate(runContainsCriticalPermissions, { origins: [] });
    expect(result).toBe(false);
  });

  test('containsCriticalPermissions returns false for null/undefined', async ({ actionPage }) => {
    const result = await actionPage.evaluate(runContainsCriticalPermissions, null);
    expect(result).toBe(false);
  });

  test('areCriticalPermissionsGranted checks if extension has critical permissions', async ({ actionPage }) => {
    const result = await actionPage.evaluate(runAreCriticalPermissionsGrantedInPage);
    expect(typeof result).toBe('boolean');
  });

  test('requestCriticalPermissions runs in a page context (with stubbed prompt)', async ({ actionPage }) => {
    const result = await actionPage.evaluate(runRequestCriticalPermissionsInPage);
    expect(result.value).toBe(true);
    expect(result.capturedArgs.origins).toEqual([ 'http://*/', 'https://*/' ]);
  });

  test('containsCriticalPermissions runs end-to-end in page context', async ({ actionPage }) => {
    const results = await actionPage.evaluate(runContainsCriticalPermissionsInPage);
    expect(results.ok).toBe(true);
    expect(results.missingHttp).toBe(false);
  });
});
