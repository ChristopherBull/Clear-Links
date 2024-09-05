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
  // Remove any preload checks (catch instances where the page is not preloaded)
  // Check function exists, otherwise Options page throws error, as listener added in ActivationFiler (not options page)
  if (typeof activateMainContentScripts === 'function') {
    // eslint-disable-next-line no-undef
    removeEventListener('focus', activateMainContentScripts);
  }
  // Init message passing and listeners
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
 * Listen for changes to synced user options and send the changes to the injected script.
 * If the changes are not synced (i.e. local offline contentScript settings),
 * they are filtered to avoid background local-only settings being sent to contentScript.
 */
export function listenForSettingsChanges() {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      // Send changes to injected script
      window.postMessage({ type: 'TO_PAGE_SYNC_USER_OPTIONS_CHANGED', message: changes }, '*');
    } else if (namespace === 'local') {
      // Filter out non-syncOffline changes
      for (const key in changes) {
        if (key === 'syncOffline') {
          // Format filtered changes to match API (with `newValue` and `oldValue` keys)
          const filteredMessage = {};
          const newValue = changes[key].newValue;
          const oldValue = changes[key].oldValue;
          for (const syncOfflineKey in newValue) {
            if (newValue[syncOfflineKey] !== oldValue?.[syncOfflineKey]) {
              filteredMessage[syncOfflineKey] = {
                oldValue: oldValue?.[syncOfflineKey],
                newValue: newValue[syncOfflineKey],
              };
            }
          }
          // Send changes to injected script if any were found after filtering (otherwise ignore and reduce noise)
          window.postMessage({ type: 'TO_PAGE_SYNC_USER_OPTIONS_CHANGED', message: filteredMessage }, '*');
          break;
        }
      }
    }
  });
}
