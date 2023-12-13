import { defaultSettingsLocal } from './defaultSettings.js';

// Load local settings (e.g. page activation options)
let currentLocalSettingsValues = defaultSettingsLocal;
chrome.storage.local.get(defaultSettingsLocal, function(items) {
  if (!chrome.runtime.lastError) {
    // Cache the local settings
    currentLocalSettingsValues = items;
  }
});
// Listen for options changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if(namespace === 'local') {
    for (const key in changes) {
      if (Object.prototype.hasOwnProperty.call(changes, key) && changes[key].newValue !== undefined) {
        currentLocalSettingsValues[key] = changes[key].newValue;
      }
    }
  }
});

// Message Passing
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Page activation (black/whitelist)
  // Background script will decide (looking at user options) if the extension should fully activate for this webpage, then inject the relevant code.
  // Allows users to blacklist/whitelist sites. Also reduces overall CPU/RAM usage, at the cost of a few additional cycles on each pages startup.
  if(request.activationHostname && sender.tab) {
    injectExtension(sender.tab.id, request.activationHostname);
    // URL expansion request
  }else if(request.shortURL) {
    expandURL(request.shortURL, request.checkCache, function(response) {
      // TODO - Store response.result.longUrl into a cache/map
      sendResponse(response);
    });
    return true; // necessary to inform contentScript to expect an Async message response
  }
});

// Some sites may load as pre-rendered and later tab is replaced (e.g. initial google searches from a new tab).
// Code can't be injected into a DOM that has no tab, so simultaneously listen here for onTabReplaced, as well as the standard passed message request above.
chrome.webNavigation.onTabReplaced.addListener(function(details) {
  chrome.tabs.get(details.tabId, function(tab) {
    if(!chrome.runtime.lastError) {
      // Tab exists
      injectExtension(tab.id, new URL(tab.url).hostname);
    }
  });
});

function injectExtension(tabID, hostname) {
  activateOnTab(tabID, hostname, function() {
    chrome.tabs.insertCSS(tabID, { allFrames: true, runAt: 'document_end', file: 'contentScript.css' }, function() {
      // css finished injecting
      chrome.tabs.executeScript(tabID, { allFrames: true, runAt: 'document_end', file: 'jquery-2.2.3.min.js' }, function() {
        // script finished injecting
        chrome.tabs.executeScript(tabID, { allFrames: true, runAt: 'document_end', file: 'contentScriptLoader.js' });
      });
    });
  });
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
    if(!chrome.runtime.lastError) {
      // Tab exists
      callback(new URL(tab.url).hostname);
    }
  });
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
          callbackAfterExpansion({ ignore: true });
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
    shortUrl: url
  });
  request.then(function(response) {
    if(response.result.status === 'OK') {
      callbackAfterExpansion(response);
    } else { // Deal with malicious/removed links (which are known to Google)
      callbackAfterExpansion({ result: { error: { message: 'Goo.gl link ' + response.result.status } } });
    }
  }, function(reason) {
    console.log('Error (Goo.gl): "' + url + '" - ' + reason.result.error.message);
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bitlink_id: urlHostAndPathname })
    }).then(function (response) {
      response.json().then(function (jsonResponse) {
        if (response.ok) {
          // Create the JSON formatted response expected in contentScript: response.result.longUrl
          callbackAfterExpansion({ result: { longUrl: jsonResponse.long_url } });
        } else {
          console.error('Bit.ly error (' + response.status + '): ' + jsonResponse.message + ' - ' + jsonResponse.description);
          // Create the JSON formatted response expected in contentScript: response.result.error.message
          callbackAfterExpansion({ result: { error: { message: jsonResponse.message } } });
        }
      });
    }).catch((err) => console.error(err));
  } else {
    callbackAfterExpansion({ ignore: true });
  }
}
