// Check (before load event, if possible) if this webpage should have the extension injected.
// Background script will decide (looking at user options).
// Allows users to blacklist/whitelist sites.
// Also reduces overall CPU/RAM usage, at the cost of a few additional cycles on each pages startup.
(async () => {
  const response = await chrome.runtime.sendMessage({ activationHostname: window.location.hostname });
  if(response?.inject) {
    initialise();
  }
})();

/**
 * Initialise the content script.
 * Set up message passing between injected script, this content script, and background script.
 * Access to chrome.* APIs is not available in the injected script, this content script acts as a proxy.
 */
function initialise() {
  // Setup message passing.
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
      window.postMessage({type : 'TO_PAGE_EXPANDED_SHORT_URL', message : response}, '*');
    }
  }, false);

  // Listen for synced-user-options changes
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if(namespace === 'sync') {
      // Send changes to injected script
      window.postMessage({type : 'TO_PAGE_SYNC_USER_OPTIONS_CHANGED', message : changes}, '*');
    }
  });
}
