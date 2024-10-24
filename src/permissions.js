/**
 * This module contains functions for managing permissions
 * and is shared between the background script and the action popup.
 */

/**
 * The permissions required for the extension to function.
 * Some required permissions are considered optional by the browser (requiring
 * explicit user activation) but they are critical to the core functionality,
 * and without them the extension will not work
 * @type {object}
 * @property {Array<string>} origins - The list of origin permissions.
 */
const criticalPermissions = {
  origins: [
    // eslint-disable-next-line sonarjs/no-clear-text-protocols
    'http://*/',
    'https://*/',
  ],
};

/**
 * Checks if the extension has the necessary permissions to function.
 * @returns {boolean} - Returns true if the extension has the necessary permissions, otherwise false.
 */
// eslint-disable-next-line require-await
export async function areCriticalPermissionsGranted() {
  return browser.permissions.contains(criticalPermissions);
}

/**
 * Checks if the given permissions are critical for the extension's functionality.
 * This function is used to determine if the permissions object returned by an add/remove permissions event listener
 * Critical permissions are feature critical. For example, host permissions for all websites
 * are required, unless the user has acknowledged that they will manually activate the extension on each page.
 * @param {object} permissions - The `browser.permissions.Permissions` object to check.
 * @param {Array<string>} permissions.origins - The list of origin permissions.
 * @returns {boolean} - Returns true if the permissions are critical, otherwise false.
 */
export function containsCriticalPermissions(permissions) {
  // eslint-disable-next-line sonarjs/no-clear-text-protocols
  return !!(permissions?.origins?.includes('http://*/*') && permissions?.origins?.includes('https://*/*'));
}

/**
 * Requests the necessary permissions for the extension.
 * @returns {Promise<boolean>} A promise which resolves to `true` if the user granted the permissions.
 */
// eslint-disable-next-line require-await
export async function requestCriticalPermissions() {
  // Returns a promise which resolves to `true` if the user granted the permissions.
  return browser.permissions.request(criticalPermissions);
}
