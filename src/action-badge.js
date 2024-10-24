/**
 * A collection of shared functions for managing the browser action badge.
 */

/**
 * Sets the browser action badge to indicate an error.
 * The badge background color is set to red and the text is set to an exclamation mark.
 */
export function setErrorStatus() {
  browser.action.setBadgeBackgroundColor({ color: '#FF0000' });
  browser.action.setBadgeText({ text: '!' });
}

/**
 * Clears the action badge text.
 * This function sets the action badge text to an empty string, effectively clearing any badge status.
 * Note: This function does not track multiple issues and clears all badge statuses.
 */
export function clearStatus() {
  browser.action.setBadgeText({ text: '' });
}
