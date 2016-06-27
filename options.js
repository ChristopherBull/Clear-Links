// Init the JQuery UI elems
$("#tabs").tabs();
$("#accordionOauth").accordion({
	active: false,
	collapsible: true,
	heightStyle: "content",
	animate: false
});

// Cached DOM elems
var btnSave;
var btnRestore;
var divConfirm;
var btnConfirmY;
var btnConfirmN;
var spnSaved;

// General Options - DOM elems
var chkDisplayExternalDomainsOnly;
// URL parts
var chkDisplayDomainOnly;
var chkDisplayUrlScheme;
var rdoDisplayUrlNoAuth;
var rdoDisplayUrlUsername;
var rdoDisplayUrlPassword;
var rdoDisplayUrlPassMask;
var chkDisplayUrlHostname;
var chkDisplayUrlPort;
var chkDisplayUrlPath;
var chkDisplayUrlQuery;
var chkDisplayUrlFragment;
// Other link types
var chkDisplayJavascriptLinks;
var chkDisplayMailtoLinks;

// DOM elems - Option fields
var durationDelay;
var durationFadeIn;
var durationFadeOut;
var colorBackground;
var colorBorder;
var colorDomainText;
var colorGeneralURLText;

// DOM elems - Domain Activation
var btnDomainsWhitelistAdd;
var btnDomainsWhitelistRemove;
var txtDomainsWhitelist;
var listDomainsWhitelist;
var btnDomainsBlacklistAdd;
var btnDomainsBlacklistRemove;
var txtDomainsBlacklist;
var listDomainsBlacklist;

// DOM elems - Short URL
//var btnOauthBitly;
var btnOauthGoogl;
var btnOauthGoogl_Revoke;

// Cached retrieved settigns values.
var currentSettingsVals = defaultSettings;

function initialize(){
	// Cache DOM elems
	btnSave = document.getElementById("save");
	btnRestore = document.getElementById("restore");
	divConfirm = document.getElementById("confirm");
	btnConfirmY = document.getElementById("btnConfirmY");
	btnConfirmN = document.getElementById("btnConfirmN");
	spnSaved = $("#saved").hide();
	// General options
	chkDisplayExternalDomainsOnly = document.getElementById("chkDisplayExternalDomainsOnly");
	chkDisplayDomainOnly = document.getElementById("chkDisplayDomainOnly");
	chkDisplayUrlScheme = document.getElementById("chkDisplayUrlScheme");
	rdoDisplayUrlNoAuth = document.getElementById("rdoDisplayUrlNoAuth");
	rdoDisplayUrlUsername = document.getElementById("rdoDisplayUrlUsername");
	rdoDisplayUrlPassword = document.getElementById("rdoDisplayUrlPassword");
	rdoDisplayUrlPassMask = document.getElementById("rdoDisplayUrlPassMask");
	chkDisplayUrlHostname = document.getElementById("chkDisplayUrlHostname");
	chkDisplayUrlPort = document.getElementById("chkDisplayUrlPort");
	chkDisplayUrlPath = document.getElementById("chkDisplayUrlPath");
	chkDisplayUrlQuery = document.getElementById("chkDisplayUrlQuery");
	chkDisplayUrlFragment = document.getElementById("chkDisplayUrlFragment");
	chkDisplayJavascriptLinks = document.getElementById("chkDisplayJavascriptLinks");
	chkDisplayMailtoLinks = document.getElementById("chkDisplayMailtoLinks");
	// Option fields
	durationDelay = document.getElementById("durationDelay");
	durationFadeIn = document.getElementById("durationFadeIn");
	durationFadeOut = document.getElementById("durationFadeOut");
	colorBackground = document.getElementById("colorBackground");
	colorBorder = document.getElementById("colorBorder");
	colorDomainText = document.getElementById("colorDomainText");
	colorGeneralURLText = document.getElementById("colorGeneralURLText");
	// Short URL DOM elems
	//btnOauthBitly = document.getElementById("btnOauthBitly");
	btnOauthGoogl = document.getElementById("btnOauthGoogl");
	btnOauthGoogl_Revoke = document.getElementById("btnOauthGoogl_Revoke");
	// DOM elems - Domain activation
	$('#formActivationType input').on('change', showActivationTypeOptions);
	btnDomainsWhitelistAdd = document.getElementById("btnDomainsWhitelistAdd");
	btnDomainsWhitelistRemove = document.getElementById("btnDomainsWhitelistRemove");
	txtDomainsWhitelist = document.getElementById("txtDomainsWhitelist");
	listDomainsWhitelist = document.getElementById("listDomainsWhitelist");
	$('#btnClearErrMsgWhitelist').click(hideWhitelistErrMsg);
	btnDomainsBlacklistAdd = document.getElementById("btnDomainsBlacklistAdd");
	btnDomainsBlacklistRemove = document.getElementById("btnDomainsBlacklistRemove");
	txtDomainsBlacklist = document.getElementById("txtDomainsBlacklist");
	listDomainsBlacklist = document.getElementById("listDomainsBlacklist");
	$('#btnClearErrMsgBlacklist').click(hideBlacklistErrMsg);
	
	// Get all the settings, update the UI
	restoreSettings();
	
	// Add event listeners to UI elems.
	btnSave.addEventListener("click", btnSave_Click);
	btnRestore.addEventListener("click", btnRestore_Click);
	chkDisplayDomainOnly.addEventListener("change", chkDisplayDomainOnly_Change);
	// Page Activation
	btnDomainsWhitelistAdd.addEventListener("click", addToWhitelist);
	btnDomainsWhitelistRemove.addEventListener("click", removeFromWhitelist);
	btnDomainsBlacklistAdd.addEventListener("click", addToBlacklist);
	btnDomainsBlacklistRemove.addEventListener("click", removeFromBlacklist);
	// Short URLs
	//btnOauthBitly.addEventListener("click", oauth_Bitly);
	btnOauthGoogl.addEventListener("click", oauth_Googl);
	btnOauthGoogl_Revoke.addEventListener("click", oauth_Googl_Revoke);
	
	// Load OAuth tokens to show in the UI which accounts are connected/authorised
	oauth_Googl_Silent();
	
	// Real-time validation
	$(durationDelay).focusout(function(e){
		if(durationDelay.value < 0){
			durationDelay.value = currentSettingsVals.durationDelay;
		}
	});
	$(durationFadeIn).focusout(function(e){
		if(durationFadeIn.value < 0){
			durationFadeIn.value = currentSettingsVals.durationFadeIn;
		}
	});
	$(durationFadeOut).focusout(function(e){
		if(durationFadeOut.value < 0){
			durationFadeOut.value = currentSettingsVals.durationFadeOut;
		}
	});
	
	// Init previews
	$('.previewLink').click(function(e){
		return false; // Don't allow the preview links to actually navigate anywhere.
	});
}

function restoreSettings(){
	// Get all the settings, update the UI
	chrome.storage.sync.get(defaultSettings, function(items){
		if (!chrome.runtime.lastError){
			// Cache the settings
			currentSettingsVals = items;
			// Update the Options menu UI - General
			chkDisplayExternalDomainsOnly.checked = items.displayExternalDomainsOnly;
			chkDisplayDomainOnly.checked = items.displayDomainOnly;
			chkDisplayUrlScheme.checked = items.displayUrlScheme;
			switch(items.displayUrlAuth){
				case 0:
					rdoDisplayUrlNoAuth.checked = true;
					break;
				case 1:
					rdoDisplayUrlUsername.checked = true;
					break;
				case 2:
					rdoDisplayUrlPassword.checked = true;
					break;
				case 3:
					rdoDisplayUrlPassMask.checked = true;
					break;
			}
			chkDisplayUrlHostname.checked = items.displayUrlHostname;
			chkDisplayUrlPort.checked = items.displayUrlPort;
			chkDisplayUrlPath.checked = items.displayUrlPath;
			chkDisplayUrlQuery.checked = items.displayUrlQuery;
			chkDisplayUrlFragment.checked = items.displayUrlFragment;
			chkDisplayJavascriptLinks.checked = items.displayJavascriptLinks;
			chkDisplayMailtoLinks.checked = items.displayMailtoLinks;
			// Page Activation
			$('#activationType' + items.activationFilter).prop("checked", true).change();
			// Update the Options menu UI
			durationDelay.value = items.durationDelay;
			durationFadeIn.value = items.durationFadeIn;
			durationFadeOut.value = items.durationFadeOut;
			colorBackground.value = items.background;
			colorBorder.value = items.cssColorBorder[1];
			colorDomainText.value = items.cssColorDomainText[1];
			colorGeneralURLText.value = items.cssColorGeneralURLText[1];
			// OAuth tokens
			//document.getElementById("txtOauthBitly").value = items.oauthBitly;
		}
		
		// Enable/Diable UI elements depending on selected options.
		chkDisplayDomainOnly_Change();
	});
	// Get non-synced settings
	chrome.storage.local.get({domainBlacklist:[], domainWhitelist:[]}, function(items){
		if (!chrome.runtime.lastError){
			// TODO
		}
	});
}

// Click Events

function btnSave_Click(){
	// Get option values that require validation.
	var iDurationDelay = parseInt(durationDelay.value);
	if(isNaN(iDurationDelay) || !Number.isInteger(iDurationDelay) || iDurationDelay < 0){
		iDurationDelay = defaultSettings.delay;
		durationDelay.value = iDurationDelay;
	}
	var iDurationFadeIn = parseInt(durationFadeIn.value);
	if(isNaN(iDurationFadeIn) || !Number.isInteger(iDurationFadeIn) || iDurationFadeIn < 0){
		iDurationFadeIn = defaultSettings.durationFadeIn;
		durationFadeIn.value = iDurationFadeIn;
	}
	var iDurationFadeOut = parseInt(durationFadeOut.value);
	if(isNaN(iDurationFadeOut) || !Number.isInteger(iDurationFadeOut) || iDurationFadeOut < 0){
		iDurationFadeOut = defaultSettings.durationFadeOut;
		durationFadeOut.value = iDurationFadeOut;
	}
	
	// TODO - validate oauth tokens
	//var bitlyOauthTok = document.getElementById("txtOauthBitly").value;
	
	// Save values
	chrome.storage.sync.set({
		// General
		displayExternalDomainsOnly: chkDisplayExternalDomainsOnly.checked,
		displayDomainOnly: chkDisplayDomainOnly.checked,
		displayUrlScheme: chkDisplayUrlScheme.checked,
		displayUrlAuth: (rdoDisplayUrlNoAuth.checked ? 0 : 
			rdoDisplayUrlUsername.checked ? 1 : 
			rdoDisplayUrlPassword.checked ? 2 : 3),
		displayUrlHostname: chkDisplayUrlHostname.checked,
		displayUrlPort: chkDisplayUrlPort.checked,
		displayUrlPath: chkDisplayUrlPath.checked,
		displayUrlQuery: chkDisplayUrlQuery.checked,
		displayUrlFragment: chkDisplayUrlFragment.checked,
		displayJavascriptLinks: chkDisplayJavascriptLinks.checked,
		displayMailtoLinks: chkDisplayMailtoLinks.checked,
		// Page Activation
		activationFilter: parseInt($('input[name=activationType]:checked', '#formActivationType').val()),
		// Style
		background: colorBackground.value,
		cssColorBorder: ['border-color', colorBorder.value],
		cssColorDomainText: ['color', colorDomainText.value],
		cssColorGeneralURLText: ['color', colorGeneralURLText.value],
		// Animation
		durationDelay: iDurationDelay,
		durationFadeIn: iDurationFadeIn,
		durationFadeOut: iDurationFadeOut,
		// OAuth tokens
		//oauthBitly: bitlyOauthTok
	}, function(){ // On saved
		spnSaved.show().delay(2500).fadeOut();
	});
}

function btnRestore_Click(){
	btnConfirmY.onclick = function(){
		chrome.storage.sync.clear(function(){ // On cleared
			// Re-Save default values
			chrome.storage.sync.set(defaultSettings, function(){ // On saved
				// Update Options menu UI
				restoreSettings();
				divConfirm.style.visibility='hidden';
				spnSaved.show().delay(2500).fadeOut();
			});
		});
	};
	btnConfirmN.onclick = function(){
		divConfirm.style.visibility='hidden';
	};
	divConfirm.style.visibility='visible';
}

function chkDisplayDomainOnly_Change(){
	if(chkDisplayDomainOnly.checked){
		chkDisplayUrlScheme.disabled = true;
		rdoDisplayUrlNoAuth.disabled = true;
		rdoDisplayUrlUsername.disabled = true;
		rdoDisplayUrlPassword.disabled = true;
		rdoDisplayUrlPassMask.disabled = true;
		chkDisplayUrlHostname.disabled = true;
		chkDisplayUrlPort.disabled = true;
		chkDisplayUrlPath.disabled = true;
		chkDisplayUrlQuery.disabled = true;
		chkDisplayUrlFragment.disabled = true;
		chkDisplayUrlScheme.parentNode.className = 'disabled';
		rdoDisplayUrlNoAuth.parentNode.className = 'disabled';
		rdoDisplayUrlUsername.parentNode.className = 'disabled';
		rdoDisplayUrlPassword.parentNode.className = 'disabled';
		rdoDisplayUrlPassMask.parentNode.className = 'disabled';
		chkDisplayUrlHostname.parentNode.className = 'disabled';
		chkDisplayUrlPort.parentNode.className = 'disabled';
		chkDisplayUrlPath.parentNode.className = 'disabled';
		chkDisplayUrlQuery.parentNode.className = 'disabled';
		chkDisplayUrlFragment.parentNode.className = 'disabled';
	}else{
		chkDisplayUrlScheme.disabled = false;
		rdoDisplayUrlNoAuth.disabled = false;
		rdoDisplayUrlUsername.disabled = false;
		rdoDisplayUrlPassword.disabled = false;
		rdoDisplayUrlPassMask.disabled = false;
		chkDisplayUrlHostname.disabled = false;
		chkDisplayUrlPort.disabled = false;
		chkDisplayUrlPath.disabled = false;
		chkDisplayUrlQuery.disabled = false;
		chkDisplayUrlFragment.disabled = false;
		chkDisplayUrlScheme.parentNode.className = 'enabled';
		rdoDisplayUrlNoAuth.parentNode.className = 'enabled';
		rdoDisplayUrlUsername.parentNode.className = 'enabled';
		rdoDisplayUrlPassword.parentNode.className = 'enabled';
		rdoDisplayUrlPassMask.parentNode.className = 'enabled';
		chkDisplayUrlHostname.parentNode.className = 'enabled';
		chkDisplayUrlPort.parentNode.className = 'enabled';
		chkDisplayUrlPath.parentNode.className = 'enabled';
		chkDisplayUrlQuery.parentNode.className = 'enabled';
		chkDisplayUrlFragment.parentNode.className = 'enabled';
	}
}

/* Page activation */

function showActivationTypeOptions(e){
	switch($('input[name=activationType]:checked', '#formActivationType').val()){
		case '1': // == All
			$('#formWhitelist').hide();
			$('#formBlacklist').hide();
			break;
		case '2': // == Whitelist
			$('#formWhitelist').show();
			$('#formBlacklist').hide();
			break;
		case '3': // == Blacklist
			$('#formWhitelist').hide();
			$('#formBlacklist').show();
			break;
	}
}

function isValidUrl(sUrl){
	if(sUrl == ""){
		return null;
	}else{
		// include URL protocol if not specified (otherwise URL constructor will throw exception)
		if(!sUrl.includes("://")){
			sUrl = "http://" + sUrl;
		}
		// Create URL object
		try{
			return new URL(sUrl);
		}catch(err){
			console.log(err.message);
			throw err;
		}
	}
}

function addToWhitelist(clickEvt){
	var tmpUrl;
	try{
		tmpUrl = isValidUrl(txtDomainsWhitelist.value);
		hideWhitelistErrMsg();
	}catch(err){
		// TODO - inform user of invalid URL
		$('#txtErrMsgDomainWhitelist').text(err.message);
		$('#divErrAreaWhitelist').show();
		return;
	}
	if(tmpUrl != null){ // null == silently skip
		// Is domain not already in Storage?
		
		// Add to Whitelist Storage
		
		// Add to Whitelist UI
		var option = document.createElement("option");
		option.text = tmpUrl.hostname;
		listDomainsWhitelist.add(option);
		// Clean UI
		txtDomainsWhitelist.value = "";
	}
}

function removeFromWhitelist(clickEvt){
	for(var count = listDomainsWhitelist.options.length-1; count >= 0; count--){
		if(listDomainsWhitelist.options[count].selected == true){
			// Remove from Whitelist UI
			listDomainsWhitelist.remove(count);
		}
	}
}

function addToBlacklist(clickEvt){
	var tmpUrl;
	try{
		tmpUrl = isValidUrl(txtDomainsBlacklist.value);
		hideBlacklistErrMsg();
	}catch(err){
		// TODO - inform user of invalid URL
		$('#txtErrMsgDomainBlacklist').text(err.message);
		$('#divErrAreaBlacklist').show();
		return;
	}
	if(tmpUrl != null){ // null == silently skip
		// Is domain not already in Storage?
		
		// Add to Blacklist Storage
		
		// Add to Blacklist UI
		var option = document.createElement("option");
		option.text = tmpUrl.hostname;
		listDomainsBlacklist.add(option);
		// Clean UI
		txtDomainsBlacklist.value = "";
	}
}

function removeFromBlacklist(clickEvt){
	for(var count = listDomainsBlacklist.options.length-1; count >= 0; count--){
		if(listDomainsBlacklist.options[count].selected == true){
			// Remove from Blacklist UI
			listDomainsBlacklist.remove(count);
		}
	}
}

function hideWhitelistErrMsg(){
	$('#divErrAreaWhitelist').hide();
}

function hideBlacklistErrMsg(){
	$('#divErrAreaBlacklist').hide();
}

/* Short URLs */

// Retrieve OAuth tokens for UI purposes silently in the background
function oauth_Googl_Silent(){
	oauth_Googl(null, true);
}

// Retrieve Google OAuth token
// Fails if "OAuth2 not granted or revoked"
function oauth_Googl(e, silent){
	// Check if 'silent' is undefined
	if (typeof silent === 'undefined' || silent === null) {
		silent = false; // Default
	}
	// Request Google OAuth
	chrome.identity.getAuthToken({ 'interactive': !silent }, function(token) { // If unavailable ("OAuth2 not granted or revoked"), gets user to login; opens a login tab.
		if (chrome.runtime.lastError){
			console.log("Google OAuth failed (silent: " + silent + ")");
			// TODO
			// Update UI
			btnOauthGoogl.disabled = false;
			$(btnOauthGoogl_Revoke).hide();
		}else{
			// Update UI - Show Auth token to user
			btnOauthGoogl.disabled = true;
			$(btnOauthGoogl_Revoke).show();
			$("#authTickGooGl").attr('class', 'authTick');
			// DEBUG ONLY - Test Auth by expanding an example URL
			/*chrome.runtime.sendMessage({shortURL: 'http://goo.gl/fbsS', urlHostname: 'goo.gl'}, function(response) {
				if(response.ignore || response.result.error){
					console.log("Problem");
				}else{
					console.log(response.result.longUrl);
				}
			});*/
		}
	});
}

// Revoke the Clear Links' OAuth token for the user's Google account
function oauth_Googl_Revoke(){
	chrome.identity.getAuthToken({'interactive': false}, function(current_token){
		if(chrome.runtime.lastError){
			// TODO
		}else{
			// Remove the local cached token
			chrome.identity.removeCachedAuthToken({ token: current_token }, function(){});
			// Make a request to revoke token in the server
			var xhr = new XMLHttpRequest();
			xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' + current_token);
			xhr.send();

			// Update UI.
			btnOauthGoogl.disabled = false;
			$(btnOauthGoogl_Revoke).hide();
			$("#authTickGooGl").attr('class', 'authTickHidden');
		}
	});
}

/*function oauth_Bitly(){
	var YOURUSERNAME = 'user';
	var YOURPASSWORD = 'pass';
	
	console.log("Sending: " + btoa(YOURUSERNAME + ':' + YOURPASSWORD));
	
	$.ajax({
        url: 'https://api-ssl.bitly.com/oauth/access_token',
        method: 'POST',
        headers: {
            'Authorization' : 'Basic ' + btoa(YOURUSERNAME + ':' + YOURPASSWORD),
            'Content-Type' : 'application/x-www-form-urlencoded',
        },
        success: function (result) {
			if(typeof yourVariable !== 'object'){
				document.getElementById("txtOauthBitly").value = result;
			}else{ // Error - perhaps invalid login credentials
				// TODO
			}
			console.log(result);
        },
        error: function (response) {
            console.log("Cannot get data");
			console.log(response);
        }
    });
}*/

// MAIN
window.addEventListener("load", initialize);