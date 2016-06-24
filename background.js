// Message Passing
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	// Page activation (black/whitelist)
	// Background script will decide (looking at user options) if the extension should fully activate for this webpage, then inject the relevant code.
	// Allows users to blacklist/whitelist sites. Also reduces overall CPU/RAM usage, at the cost of a few additional cycles on each pages startup.
	if(request.activationFilter && sender.tab){
		activateOnTab(new URL(request.activationFilter), sender.tab.id, function(){
			chrome.tabs.insertCSS(sender.tab.id, {file:"contentScript.css"}, function() {
				//css finished injecting
				chrome.tabs.executeScript(sender.tab.id, {file:"jquery-2.2.3.min.js"}, function() {
					//script finished injecting
					chrome.tabs.executeScript(sender.tab.id, {file:"defaultSettings.js"}, function() {
						//script finished injecting
						chrome.tabs.executeScript(sender.tab.id, {file:"contentScript.js"}, function() {
							//script finished injecting
						});
					});
				});
			});
		});
	// URL expansion request
	}else if(request.shortURL){
		expandURL(request.shortURL, function(response){
			sendResponse(response);
		});
		return true; // necessary to inform contentScript to expect an Async message response
	}
});

function activateOnTab(url, tabId, activationCallback){
	// activate on all pages?
	// or, check whitelist
	// or, check blacklist
	
	//console.log("url.hostname: " + url.hostname);
	//console.log("url.href: " + url.href);
	
	// TEST - example of a site to skip
	/*if(url.hostname.endsWith('.com')){
		return;
	}*/
	
	// Test tab ID actually exists (sometimes errors are thrown from Chrome settings tabs etc.)
	chrome.tabs.get(tabId,function(){
		if(!chrome.runtime.lastError){
			// Tab exists
			activationCallback();
		}
	});
}

// TODO - Long/Short URL cache
// TODO - Periodically (24hr) clean cache of old unaccessed short urls (e.g. not accessed for 7 days)

// Short URL Expansion
function expandURL(url, callbackAfterExpansion){
	var expandedUrl = "";
	// TODO - check hash cache first before making an API request
	switch(new URL(url).hostname){
		//case 'bit.ly':
		//	break;
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
	request.then(function(response) {
		// TODO - Store response.result.longUrl into a cache
		callbackAfterExpansion(response);
	}, function(reason) {
		console.log('Error (Goo.gl): "' + url + '" - ' + reason.result.error.message);
		callbackAfterExpansion(reason);
	});
}