import './lib/browser-polyfill.min.js';
import * as ActionBadge from './action-badge.js';
import * as Permissions from './permissions.js';
import { defaultSettings, defaultSettingsLocal } from './defaultSettings.js';

// Local settings (e.g. page activation options and locally stored auth tokens)
let currentLocalSettingsValues = defaultSettingsLocal;
// Synced settings (e.g. user preferences)
let currentSyncSettingsValues = defaultSettings;

initialise();

// Listen for options changes
browser.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    mergeSettingsChanges(currentLocalSettingsValues, changes);
  } else if (namespace === 'sync') {
    mergeSettingsChanges(currentSyncSettingsValues, changes);
  }
});

// Message Passing
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const resultPromise = handleRuntimeMessage(request, sender);
  // Async handler path
  if (resultPromise instanceof Promise) {
    resultPromise
      .then((result) => {
        if (result !== undefined) {
          sendResponse(result);
        }
      })
      .catch((error) => {
        // Ensure promise rejections from handleRuntimeMessage are not silently swallowed
        console.error('Error while handling runtime message:', error);
      });
    return true; // Inform caller to await async response
  }
  // Sync handler path (no response expected)
  if (resultPromise !== undefined) {
    sendResponse(resultPromise);
  }
  return false;
});

// Some sites may preload (firing a premature onload event before attached to a tab) and later replace a tab's content (but no new onload event would fire).
// Code can't be injected into a DOM that has no tab, so simultaneously listen here for onTabReplaced, as well as the standard passed message request above.
browser.webNavigation.onTabReplaced.addListener(async (details) => {
  try {
    const tab = await browser.tabs.get(details.tabId);
    // Tab exists
    injectExtension(tab.id, new URL(tab.url).hostname);
  } catch (error) {
    console.error(error);
  }
});

/**
 * Shared runtime message handler so tests can call the same logic without relying on the service worker process.
 * @param {object} request - The incoming message payload.
 * @param {object} sender - The sender metadata from browser.runtime.onMessage.
 * @returns {Promise<object|undefined>|object|undefined} - The response payload, or undefined when no response is required.
 */
function handleRuntimeMessage(request, sender) {
  // Tabs that preload are forced to skip injection, as we cannot work with tab URLs that start with 'chrome://' (e.g., new tabs, instead of eventual webpage)
  // Pre-loaded tabs will be activated when they receive focus (see contentScriptActivationFilter.js)
  if (request.activationHostname && !sender?.tab?.url?.startsWith('chrome://')) {
    injectExtension(sender.tab.id, request.activationHostname);
    return undefined;
  }

  if (request.shortURL) {
    return new Promise((resolve) => {
      expandURL(request.shortURL, request.checkCache, (response) => {
        // TODO - Store response.result.longUrl into a cache/map
        resolve(response);
      });
    });
  }

  return undefined;
}

/**
 * Initializes the extension by loading local and synced settings.
 */
async function initialise() {
  // Load local settings
  currentLocalSettingsValues = await browser.storage.local.get(defaultSettingsLocal);
  // Load synced settings
  try {
    currentSyncSettingsValues = await browser.storage.sync.get(defaultSettings);
  } catch (err) {
    // Settings initialised earlier with defaults, so no need to re-initialise defaults here.
    console.warn('Sync storage not available. Will save sync settings locally instead: ' + err);
    // Cache the synced settings with the offline settings
    currentSyncSettingsValues = currentLocalSettingsValues.syncOffline;
  }

  // Check permissions
  // Regardless of whether host permissions for `http(s)://*/` are required
  // or optional in the manifest, browsers may require the user to explicitly
  // grant them. This is especially true for Firefox, which requires the user
  // to grant host permissions for all websites. If the user denies these
  // permissions, the extension will not work.
  const criticalPermissionsGranted = await Permissions.areCriticalPermissionsGranted();
  // Set Action Badge text to indicate user attention is required to fix a permissions issue
  if (!criticalPermissionsGranted) {
    ActionBadge.setErrorStatus();
  }

  // These permissions event listeners are only for permissions that require
  // user attention. They have to be checked in the background script as well
  // as the action popup script, as either can be the first to detect a
  // permissions change (and the other may not be active).
  browser.permissions.onAdded.addListener((permissions) => {
    // Check that all permissions that require user attention are granted
    if (Permissions.containsCriticalPermissions(permissions)) {
      // Clear permissions warnings
      // Ensure badge text/status is hidden
      ActionBadge.clearStatus();
    }
  });
  browser.permissions.onRemoved.addListener((permissions) => {
    if (Permissions.containsCriticalPermissions(permissions)) {
      // Set Action Badge text to indicate user attention is required to fix a permissions issue
      // This is a critical status, not a warning, as without the critical permissions the core extension functionality cannot work.
      ActionBadge.setErrorStatus();
    }
  });
}

/**
 * Injects the extension into a specified tab with the given hostname.
 * @param {number} tabID - The ID of the tab to inject the extension into.
 * @param {string} hostname - The hostname of the tab to inject the extension into.
 */
function injectExtension(tabID, hostname) {
  activateOnTab(tabID, hostname, () => {
    const contentScriptSrc = browser.runtime.getURL('contentScript.js');
    const contentScriptSharedSrc = browser.runtime.getURL('contentScriptSharedLib.js');
    const contentScriptCssSrc = browser.runtime.getURL('contentScript.css');
    // Add to Content Script (part of the Isolated World)
    browser.scripting.executeScript({
      target: { tabId: tabID, allFrames: true },
      args: [ contentScriptSharedSrc ],
      func: setupContentScript,
    });
    // Inject function to load the main content script (part of the Main World)
    browser.scripting.executeScript({
      target: { tabId: tabID, allFrames: true },
      world: browser.scripting.ExecutionWorld.MAIN,
      args: [
        contentScriptSrc,
        contentScriptCssSrc,
        currentSyncSettingsValues,
      ],
      func: injectMainContentScript,
    });
  });
}

/**
 * Insert and setup remaining content script code.
 * @param {string} src - The URL of a script to be added to the content script.
 */
async function setupContentScript(src) {
  const contentScriptShared = await import(src);
  // Setup message passing and related listeners.
  contentScriptShared.initAllSharedListeners();
}

/**
 * This function is injected into the webpage, and is responsible for loading the main content script.
 * Chrome extensions do not allow JS modules to be executed, so this function instead dynamically imports the main content script.
 * @param {string} srcURL - The URL of the content script to be injected into the webpage.
 * @param {string} cssURL - The URL of the content script's CSS to be injected into the webpage. Is dynamically loaded because of cross-browser URL scheme differences.
 * @param {object} contentScriptSettings - The settings to be passed to the content script.
 */
async function injectMainContentScript(srcURL, cssURL, contentScriptSettings) {
  const mainContentScript = await import(srcURL);
  // Initialise content script with default settings.
  mainContentScript.initialise(cssURL, contentScriptSettings);
}

/**
 * Activates the extension on a tab based on the document hostname.
 * @param {number} tabId - The ID of the tab to check if activating. Used to confirm tab exists.
 * @param {string} docHostname - The hostname of the document associated with the tab.
 * @param {Function} activationCallback - The callback function to be executed for activation.
 */
function activateOnTab(tabId, docHostname, activationCallback) {
  tabExists(tabId, () => { // Don't activate on Options page
    switch (currentLocalSettingsValues.activationFilter) {
      case 1: // Allow All
        activationCallback();
        break;
      case 2: // Allowlisted sites only
        if (isUrlToBeFiltered(docHostname, currentLocalSettingsValues.domainWhitelist)) {
          activationCallback();
        }
        break;
      case 3: // Denylisted sites only
        if (!isUrlToBeFiltered(docHostname, currentLocalSettingsValues.domainBlacklist)) {
          activationCallback();
        }
        break;
    }
  });
}

/**
 * Checks if given URL (tabHostname) resides within the given array (filterListArray)
 * @param {string} tabHostname - A URL hostname (e.g. www.example.com)
 * @param {string[]} filterListArray - An array of URL hostnames
 * @returns {boolean} True if the URL is in the array
 */
function isUrlToBeFiltered(tabHostname, filterListArray) {
  return filterListArray.indexOf(tabHostname) > -1;
}

/**
 * Checks if a tab with the given ID exists.
 * Sometimes errors are thrown from Chrome settings tabs etc.
 * @param {number} tabId - The ID of the tab to check.
 * @param {Function} callback - The callback function to be executed if the tab exists.
 */
async function tabExists(tabId, callback) {
  try {
    await browser.tabs.get(tabId);
    // Tab exists
    callback();
  } catch (error) {
    console.error(error);
  }
}

/**
 * Merges the changes from the `changes` object into the `currentSettings` object.
 * @param {object} currentSettings - The current settings object.
 * @param {object} changes - The changes object containing the updated values.
 */
function mergeSettingsChanges(currentSettings, changes) {
  for (const key in changes) {
    if (Object.hasOwn(changes, key) && changes[key].newValue !== undefined) {
      currentSettings[key] = changes[key].newValue;
    }
  }
}

// TODO - Long/Short URL cache
// Store in local storage, not synced.
// TODO - Periodically (24hr) clean cache of old not accessed short urls (e.g. not accessed for 7 days)

/**
 * Expands a short URL to its original long URL.
 * @param {string} url - The short URL to be expanded.
 * @param {boolean} checkCache - Indicates whether to check the cache for the long URL.
 * @param {Function} callbackAfterExpansion - The callback function to be executed after the URL is expanded.
 */
function expandURL(url, checkCache, callbackAfterExpansion) {
  // Check hash cache first before making an API request
  if (typeof checkCache !== 'undefined' && checkCache === true) {
    // TODO
  }
  // TODO - Debounce expansion requests (5 seconds?) -- check if expansion fetch/request is already in-flight and awaiting a response with a separate requests cache (with timestamps of requests).
  // Determine short URL service
  switch (new URL(url).hostname) {
    case 'bit.ly':
    case 'j.mp':
      expandUrlBitLy(url, callbackAfterExpansion);
      break;
  }
}

/**
 * Uses the Bitly API to expand short Bitly URLs (`bit.ly`).
 * @param {string} url - The short Bitly URL to be expanded.
 * @param {Function} callbackAfterExpansion - The callback function to be executed after the URL is expanded.
 */
function expandUrlBitLy(url, callbackAfterExpansion) {
  if (currentLocalSettingsValues.OAuthBitLy.enabled) {
    // Strip out the protocol (e.g. http://) from the url (could this be done upstream in contentScript.js?)
    const oURL = new URL(url);
    const urlHostAndPathname = oURL.hostname + oURL.pathname;
    // Make API request to expand the short URL
    fetch('https://api-ssl.bitly.com/v4/expand', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + currentLocalSettingsValues.OAuthBitLy.token,
        'Content-Type': 'application/json',
      },
      // eslint-disable-next-line camelcase
      body: JSON.stringify({ bitlink_id: urlHostAndPathname }),
    }).then((response) => {
      response.json().then((jsonResponse) => {
        if (response.ok) {
          // TODO cache the long URL
          // Create the JSON formatted response expected in contentScript: response.result.longUrl
          callbackAfterExpansion({
            result: { longUrl: jsonResponse.long_url },
            source: { url }, // For checking if the response is for the moused-over link (protect against delayed responses)
          });
        } else {
          console.error('Bit.ly error (' + response.status + '): ' + jsonResponse.message + ' - ' + jsonResponse.description);
          // Create the JSON formatted response expected in contentScript: response.result.error.message
          callbackAfterExpansion({ result: { error: { message: jsonResponse.message } } });
        }
      });
    }).catch(err => console.error(err));
  } else {
    callbackAfterExpansion({
      ignore: true,
      source: { url },
    });
  }
}
