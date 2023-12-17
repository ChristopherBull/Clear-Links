import { defaultSettings } from './defaultSettings.js';
import { initAllSharedListeners } from './contentScriptSharedLib.js';

(async () => {
  // Chrome extensions do not allow JS modules to be executed, so need to dynamically import the content script.
  const src = chrome.runtime.getURL('contentScript.js');
  const contentScript = await import(src);
  // Load synced settings (e.g. user preferences)
  const settings = await chrome.storage.sync.get(defaultSettings);

  // Initialise content script.
  // Options page should not cache Short URLs to enable user to test with example short URLs given in the Options page.
  contentScript.initialise(settings, false);
  // Setup message passing and related listeners.
  initAllSharedListeners();
})();