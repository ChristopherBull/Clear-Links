import { defaultSettings } from './defaultSettings.js';

(async () => {
  // Chrome extensions do not allow JS modules to be executed, so need to dynamically import the content script.
  const src = chrome.runtime.getURL('contentScript.js');
  const contentScript = await import(src);
  // Load synced settings (e.g. user preferences)
  const settings = await chrome.storage.sync.get(defaultSettings); // TODO errors! JS module not loaded.
  // Initialise content script.
  // Options page should not cache Short URLs to enable user to test with example short URLs given in the Options page.
  contentScript.initialise(settings, false);

  // TODO - Move this to a JS module for contentScript Message Passing (to reduce code duplication in contentScriptActivationFilter.js and contentScriptLoaderForOptionsPage.js)
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
})();