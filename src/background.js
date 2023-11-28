// Load local settings (e.g. page activation options)
var currentLocalSettingsVals = defaultSettingsLocal;
chrome.storage.local.get(defaultSettingsLocal, function(items){
	if (!chrome.runtime.lastError){
		// Cache the local settings
		currentLocalSettingsVals = items;
	}
});
// Listen for options changes
chrome.storage.onChanged.addListener(function(changes, namespace){
	if(namespace == "local"){
		for (var key in changes) {
			if (changes.hasOwnProperty(key) && changes[key].newValue !== undefined) {
				currentLocalSettingsVals[key] = changes[key].newValue;
			}
		}
	}
});

// Message Passing
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	// Page activation (black/whitelist)
	// Background script will decide (looking at user options) if the extension should fully activate for this webpage, then inject the relevant code.
	// Allows users to blacklist/whitelist sites. Also reduces overall CPU/RAM usage, at the cost of a few additional cycles on each pages startup.
	if(request.activationHostname && sender.tab){
		injectExtension(sender.tab.id, request.activationHostname);
	// URL expansion request
	}else if(request.shortURL){
		expandURL(request.shortURL, request.checkCache, function(response){
			// TODO - Store response.result.longUrl into a cache/map
			sendResponse(response);
		});
		return true; // necessary to inform contentScript to expect an Async message response
	}
});

// Some sites may load as prerendered and later tab is replaced (e.g. initial google searches from a new tab).
// Code can't be injected into a DOM that has no tab, so simultaneously listen here for onTabReplaced, as well as the standard passed message request above.
chrome.webNavigation.onTabReplaced.addListener(function(details){
	chrome.tabs.get(details.tabId,function(tab){
		if(!chrome.runtime.lastError){
			// Tab exists
			injectExtension(tab.id, new URL(tab.url).hostname);
		}
	});
});

function injectExtension(tabID, hostname){
	activateOnTab(tabID, hostname, function(){
		chrome.tabs.insertCSS(tabID, {allFrames: true, runAt: "document_end", file:"contentScript.css"}, function(){
			//css finished injecting
			chrome.tabs.executeScript(tabID, {allFrames: true, runAt: "document_end", file:"jquery-2.2.3.min.js"}, function(){
				//script finished injecting
				chrome.tabs.executeScript(tabID, {allFrames: true, runAt: "document_end", file:"defaultSettings.js"}, function(){
					//script finished injecting
					chrome.tabs.executeScript(tabID, {allFrames: true, runAt: "document_end", file:"contentScript.js"});
				});
			});
		});
	});
}

function activateOnTab(tabId, docHostname, activationCallback){
	tabExists(tabId, function(tabHostname){ // i.e. don't activate on Options page
		switch(currentLocalSettingsVals.activationFilter){
			case 1: // Allow All
				activationCallback();
				break;
			case 2: // Whitelisted sites only
				if(isUrlToBeFiltered(tabHostname, currentLocalSettingsVals.domainWhitelist)){
					activationCallback();
				}
				break;
			case 3: // Blacklisted sites only
				if(!isUrlToBeFiltered(tabHostname, currentLocalSettingsVals.domainBlacklist)){
					activationCallback();
				}
				break;
		}
	});
}

// Checks if given URL (tabHostname) resides within the given array (filterListArray)
function isUrlToBeFiltered(tabHostname, filterListArray){
	if(filterListArray.indexOf(tabHostname) > -1){
		return true;
	}else{
		return false;
	}
}

// Test tab ID actually exists (sometimes errors are thrown from Chrome settings tabs etc.)
function tabExists(tabId, callback){
	chrome.tabs.get(tabId,function(tab){
		if(!chrome.runtime.lastError){
			// Tab exists
			callback(new URL(tab.url).hostname);
		}
	});
}

// TODO - Long/Short URL cache
// Store in local storage, not synced.
// TODO - Periodically (24hr) clean cache of old unaccessed short urls (e.g. not accessed for 7 days)

// Short URL Expansion
function expandURL(url, checkCache, callbackAfterExpansion){
	var expandedUrl = "";
	// Check hash cache first before making an API request
	if(typeof checkCache !== 'undefined' && checkCache == true){
		// TODO
	}
	// Determine short URL service
	switch(new URL(url).hostname){
		case 'bit.ly':
		case 'j.mp':
			expandUrl_BitLy(url, callbackAfterExpansion);
			break;
		case 'goo.gl':
			// TODO - Check user options to see if goo.gl links should be expanded (a checkbox in the options menu, or (e.g.) is an API key available?)
			Auth_GooGl(function(bAuthSuccess){
				if(bAuthSuccess){
					expandUrl_GooGl(url, callbackAfterExpansion);
				}else{
					callbackAfterExpansion({ignore: true});
				}
			});
			break;
	}
}

// Google API - Authenticate
var oauthToken_Googl = "";
function Auth_GooGl(postAuthCallback){
	if(oauthToken_Googl == ""){
		// TODO - check if should Auth with stored API key, or use chrome.identity.
		chrome.identity.getAuthToken(function(token) { // interactive=false // Async
			if(chrome.runtime.lastError){
				postAuthCallback(false); // Auth failed
			}else{
				// Authenticate (no need to 'gapi.auth.setToken(token)' if within 'chrome.identity.getAuthToken'
				var manifest = chrome.runtime.getManifest();
				gapi.auth.authorize({client_id: manifest.oauth2.client_id, scope: manifest.oauth2.scopes, immediate: true}, function(authResult){
					if (authResult && !authResult.error) {
						gapi.client.load('urlshortener', 'v1').then(function(){
							oauthToken_Googl = token; // Cache auth token
							postAuthCallback(true); // Auth success
						});
					}
				});
			}
		});
	}else{
		postAuthCallback(true); // Auth previously successful
	}
}

// Google API - Expand URL
function expandUrl_GooGl(url, callbackAfterExpansion){
	var request = gapi.client.urlshortener.url.get({
		'shortUrl': url
	});
	request.then(function(response){
		if(response.result.status == "OK"){
			callbackAfterExpansion(response);
		}else{ // Deal with malicious/removed links (which are known to Google)
			callbackAfterExpansion({result:{error:{message:"Goo.gl link "+response.result.status}}});
		}
	}, function(reason) {
		console.log('Error (Goo.gl): "' + url + '" - ' + reason.result.error.message);
		callbackAfterExpansion(reason);
	});
}

function expandUrl_BitLy(url, callbackAfterExpansion){
	if(currentLocalSettingsVals.OAuth_BitLy.enabled){
		$.ajax('https://api-ssl.bitly.com/v3/expand?access_token='+currentLocalSettingsVals.OAuth_BitLy.token+'&shortUrl=' + encodeURI(url), {
			success: function (result){
				if(result['status_code'] != 200){
					console.log("Bit.ly: Bad request - " + result['status_txt']);
					// Create the JSON formmated response expected in contentScript: response.result.error.message
					callbackAfterExpansion({result:{error:{message:result['status_txt']}}});
				}else{
					// Create the JSON formmated response expected in contentScript: response.result.longUrl
					callbackAfterExpansion({result:{longUrl:result.data.expand[0].long_url}});
				}
			},
			error: function (response){
				console.log("AJAX Error: Cannot get data");
				console.log(response);
				// TODO
			}
		});
	}else{
		callbackAfterExpansion({ignore: true});
	}
}