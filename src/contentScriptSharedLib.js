/**
 * This file contains code that is shared between the content script and
 * the content script loader for the options page.
 */

/**
 * Initialise shared functionality for the content script.
 * Set up message passing between injected script, this content script, and background script.
 * Access to chrome.* APIs is not available in the injected script, this content script acts as a proxy.
 * Also sets up related listeners.
 */
export function initAllSharedListeners() {
  setupMessagePassing();
  listenForSettingsChanges();
}

/**
 * Prepare message passing between injected script, the content script, and background script.
 */
export function setupMessagePassing() {
  window.addEventListener('message', async (event) => {
    // We only accept messages from ourselves
    if (event.source !== window) {
      return;
    }
    // Determine type of event
    if (event.data.type && (event.data.type === 'FROM_PAGE_SHORT_URL')) {
      // Request backend to expand the short URL
      const response = await chrome.runtime.sendMessage(event.data.message);
      // Return the response to the injected script
      window.postMessage({ type: 'TO_PAGE_EXPANDED_SHORT_URL', message: response }, '*');
    }
  }, false);
}

/**
 * Listen for changes to synced user options.
 */
export function listenForSettingsChanges() {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      // Send changes to injected script
      window.postMessage({ type: 'TO_PAGE_SYNC_USER_OPTIONS_CHANGED', message: changes }, '*');
    }
  });
}
