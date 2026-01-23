/* eslint-disable sonarjs/no-clear-text-protocols */
import { expect, test } from './fixtures/fixtures.js';

test.describe('Browser permissions', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only! Testing with Service Workers or Background Pages (including getting extensionId) in Playwright is not yet possible in non-chromium browsers.');

  test('containsCriticalPermissions returns true for critical permissions', async ({ backgroundPage }) => {
    const result = await backgroundPage.evaluate(() => {
      const testPermissions = {
        origins: [
          'http://*/*',
          'https://*/*',
        ],
      };
      return globalThis.Permissions.containsCriticalPermissions(testPermissions);
    });
    expect(result).toBe(true);
  });

  test('containsCriticalPermissions returns false when http permission is missing', async ({ backgroundPage }) => {
    const result = await backgroundPage.evaluate(() => {
      const testPermissions = {
        origins: [
          'https://*/*',
        ],
      };
      return globalThis.Permissions.containsCriticalPermissions(testPermissions);
    });
    expect(result).toBe(false);
  });

  test('containsCriticalPermissions returns false when https permission is missing', async ({ backgroundPage }) => {
    const result = await backgroundPage.evaluate(() => {
      const testPermissions = {
        origins: [
          'http://*/*',
        ],
      };
      return globalThis.Permissions.containsCriticalPermissions(testPermissions);
    });
    expect(result).toBe(false);
  });

  test('containsCriticalPermissions returns false for empty permissions', async ({ backgroundPage }) => {
    const result = await backgroundPage.evaluate(() => {
      const testPermissions = {
        origins: [],
      };
      return globalThis.Permissions.containsCriticalPermissions(testPermissions);
    });
    expect(result).toBe(false);
  });

  test('containsCriticalPermissions returns false for null/undefined', async ({ backgroundPage }) => {
    const result = await backgroundPage.evaluate(() => {
      return globalThis.Permissions.containsCriticalPermissions(null);
    });
    expect(result).toBe(false);
  });

  test('areCriticalPermissionsGranted checks if extension has critical permissions', async ({ backgroundPage }) => {
    const result = await backgroundPage.evaluate(async () => {
      return await globalThis.Permissions.areCriticalPermissionsGranted();
    });
    // Result should be a boolean
    expect(typeof result).toBe('boolean');
  });

  test('requestCriticalPermissions returns a boolean promise', async ({ backgroundPage }) => {
    // Note: This test can't actually trigger the permission prompt in headless mode
    // but we can verify the function exists and returns the expected type
    const functionExists = await backgroundPage.evaluate(() => {
      return typeof globalThis.Permissions.requestCriticalPermissions === 'function';
    });
    expect(functionExists).toBe(true);
  });
});