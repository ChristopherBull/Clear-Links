import { defaultSettingsLocal, defaultSettings } from './defaultSettings.js';

// Local settings (e.g. page activation options and locally stored auth tokens)
let currentLocalSettingsValues = defaultSettingsLocal;
// Synced settings (e.g. user preferences)
let currentSyncSettingsValues = defaultSettings;

initialise();

// Listen for options changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if(namespace === 'local') {
    mergeSettingsChanges(currentLocalSettingsValues, changes);
  } else if(namespace === 'sync') {
    mergeSettingsChanges(currentSyncSettingsValues, changes);
  }
});

// Message Passing
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Page activation (black/whitelist)
  // Background script will decide (looking at user options) if the extension should fully activate for this webpage, then inject the relevant code.
  // Allows users to blacklist/whitelist sites. Also, reduces extension's footprint.
  if(request.activationHostname && sender.tab) {
    // Respond to the contentScript so it knows to prepare to collaborate with the injected script (contentScripts can access some chrome.* APIs)
    sendResponse({ inject: true });
    // Inject the main script into the webpage (it will have DOM access, but no access to chrome.* APIs)
    injectExtension(sender.tab.id, request.activationHostname);
    // URL expansion request
  } else if(request.shortURL) {
    expandURL(request.shortURL, request.checkCache, (response) => {
      // TODO - Store response.result.longUrl into a cache/map
      sendResponse(response);
    });
    return true; // necessary to inform contentScript to expect an Async message response
  }
});

// Some sites may load as pre-rendered and later tab is replaced (e.g. initial google searches from a new tab).
// Code can't be injected into a DOM that has no tab, so simultaneously listen here for onTabReplaced, as well as the standard passed message request above.
chrome.webNavigation.onTabReplaced.addListener((details) => {
  chrome.tabs.get(details.tabId, (tab) => {
    if(!chrome.runtime.lastError) {
      // Tab exists
      injectExtension(tab.id, new URL(tab.url).hostname);
    }
  });
});

async function initialise() {
  // Load local settings
  currentLocalSettingsValues = await chrome.storage.local.get(defaultSettingsLocal);
  // Load synced settings
  currentSyncSettingsValues = await chrome.storage.sync.get(defaultSettings);
}

function injectExtension(tabID, hostname) {
  activateOnTab(tabID, hostname, async function() {
    const contentScriptSrc = chrome.runtime.getURL('contentScript.js');
    const contentScriptSharedSrc = chrome.runtime.getURL('contentScriptSharedLib.js');
    chrome.scripting.insertCSS({
      files: [ 'contentScript.css' ],
      target: { allFrames: true, tabId: tabID },
    });
    // Inject jQuery and wait before injecting the main content script
    await chrome.scripting.executeScript({
      files : [ 'jquery-2.2.3.min.js' ],
      target : { tabId : tabID, allFrames: true },
      world: chrome.scripting.ExecutionWorld.MAIN,
    });
    // Add to Content Script (part of the Isolated World)
    chrome.scripting.executeScript({
      target: { tabId: tabID, allFrames: true },
      args: [ contentScriptSharedSrc ],
      function: setupContentScript,
    });
    // Inject function to load the main content script (part of the Main World)
    chrome.scripting.executeScript({
      target: { tabId: tabID, allFrames: true },
      world: chrome.scripting.ExecutionWorld.MAIN,
      args: [ contentScriptSrc, currentSyncSettingsValues ],
      function: injectMainContentScript,
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
 * @param {string} src - The URL of the content script to be injected into the webpage.
 */
async function injectMainContentScript(src, contentScriptSettings) {
  const mainContentScript = await import(src);
  // Initialise content script with default settings.
  mainContentScript.initialise(contentScriptSettings);
}

function activateOnTab(tabId, docHostname, activationCallback) {
  tabExists(tabId, function(tabHostname) { // i.e. don't activate on Options page
    switch(currentLocalSettingsValues.activationFilter) {
      case 1: // Allow All
        activationCallback();
        break;
      case 2: // Whitelisted sites only
        if(isUrlToBeFiltered(tabHostname, currentLocalSettingsValues.domainWhitelist)) {
          activationCallback();
        }
        break;
      case 3: // Blacklisted sites only
        if(!isUrlToBeFiltered(tabHostname, currentLocalSettingsValues.domainBlacklist)) {
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

// Test tab ID actually exists (sometimes errors are thrown from Chrome settings tabs etc.)
function tabExists(tabId, callback) {
  chrome.tabs.get(tabId, function(tab) {
    if(!chrome.runtime.lastError) { // TODO check if tab.url is undefined/empty, etc.
      // Tab exists
      callback(new URL(tab.url).hostname); // TODO - TypeError: Failed to construct 'URL': Invalid URL
    }
  });
}

function mergeSettingsChanges(currentSettings, changes) {
  for (const key in changes) {
    if (Object.prototype.hasOwnProperty.call(changes, key) && changes[key].newValue !== undefined) {
      currentSettings[key] = changes[key].newValue;
    }
  }
}

// TODO - Long/Short URL cache
// Store in local storage, not synced.
// TODO - Periodically (24hr) clean cache of old not accessed short urls (e.g. not accessed for 7 days)

// Short URL Expansion
function expandURL(url, checkCache, callbackAfterExpansion) {
  // Check hash cache first before making an API request
  if(typeof checkCache !== 'undefined' && checkCache === true) {
    // TODO
  }
  // TODO - Debounce expansion requests (5 seconds?) -- check if expansion fetch/request is already in-flight and awaiting a response with a separate requests cache (with timestamps of requests).
  // Determine short URL service
  switch(new URL(url).hostname) {
    case 'bit.ly':
    case 'j.mp':
      expandUrlBitLy(url, callbackAfterExpansion);
      break;
    case 'goo.gl':
      // TODO - Check user options to see if goo.gl links should be expanded (a checkbox in the options menu, or (e.g.) is an API key available?)
      authenticateGoogleAPI(function(bAuthSuccess) {
        if(bAuthSuccess) {
          expandUrlGooGl(url, callbackAfterExpansion);
        } else {
          callbackAfterExpansion({
            ignore: true,
            source: { url: url },
          });
        }
      });
      break;
  }
}

// Google API - Authenticate
let oauthTokenGoogl = '';
function authenticateGoogleAPI(postAuthCallback) {
  if(oauthTokenGoogl === '') {
    // TODO - check if should Auth with stored API key, or use chrome.identity.
    chrome.identity.getAuthToken(function(token) { // interactive=false // Async
      if(chrome.runtime.lastError) {
        postAuthCallback(false); // Auth failed
      } else {
        // Authenticate (no need to 'gapi.auth.setToken(token)' if within 'chrome.identity.getAuthToken'
        const manifest = chrome.runtime.getManifest();
        gapi.auth.authorize({ client_id: manifest.oauth2.client_id, scope: manifest.oauth2.scopes, immediate: true }, function(authResult) {
          if (authResult && !authResult.error) {
            gapi.client.load('urlshortener', 'v1').then(function() {
              oauthTokenGoogl = token; // Cache auth token
              postAuthCallback(true); // Auth success
            });
          }
        });
      }
    });
  } else {
    postAuthCallback(true); // Auth previously successful
  }
}

// Google API - Expand URL
function expandUrlGooGl(url, callbackAfterExpansion) {
  const request = gapi.client.urlshortener.url.get({
    shortUrl: url,
  });
  request.then(function(response) {
    if(response.result.status === 'OK') {
      callbackAfterExpansion(response);
    } else { // Deal with malicious/removed links (which are known to Google)
      callbackAfterExpansion({ result: { error: { message: 'Goo.gl link ' + response.result.status } } });
    }
  }, function(reason) {
    console.error('Error (Goo.gl): "' + url + '" - ' + reason.result.error.message);
    callbackAfterExpansion(reason);
  });
}

function expandUrlBitLy(url, callbackAfterExpansion) {
  if(currentLocalSettingsValues.OAuthBitLy.enabled) {
    // Strip out the protocol (e.g. http://) from the url (could this be done upstream in contentScript.js?)
    const oURL = new URL(url);
    const urlHostAndPathname = oURL.hostname + oURL.pathname;
    // Make API request to expand the short URL
    fetch('https://api-ssl.bitly.com/v4/expand', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + currentLocalSettingsValues.OAuthBitLy.token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bitlink_id: urlHostAndPathname }),
    }).then(function (response) {
      response.json().then(function (jsonResponse) {
        if (response.ok) {
          // TODO cache the long URL
          // Create the JSON formatted response expected in contentScript: response.result.longUrl
          callbackAfterExpansion({ 
            result: { longUrl: jsonResponse.long_url },
            source: { url: url }, // for checking if the response is for the moused-over link (protect against delayed responses)
          });
        } else {
          console.error('Bit.ly error (' + response.status + '): ' + jsonResponse.message + ' - ' + jsonResponse.description);
          // Create the JSON formatted response expected in contentScript: response.result.error.message
          callbackAfterExpansion({ result: { error: { message: jsonResponse.message } } });
        }
      });
    }).catch((err) => console.error(err));
  } else {
    callbackAfterExpansion({
      ignore: true,
      source: { url: url },
    });
  }
}
