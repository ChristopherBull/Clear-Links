// Init the JQuery UI elements
$("#tabs").tabs();
$("#accordionOauth").accordion({
	active: false,
	collapsible: true,
	heightStyle: "content",
	animate: false
});

// Cached DOM elements
var btnSave;
var btnRestore;
var divConfirm;
var btnConfirmY;
var btnConfirmN;
var spnSaved;

// General Options - DOM elements
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
var chkDisplayShortUrlsOnly;

// DOM elements - Option fields
var durationDelay;
var durationFadeIn;
var durationFadeOut;
var colorBackground;
var colorBorder;
var colorDomainText;
var colorGeneralURLText;
/*var tooltipPreview;
var tooltipPreviewText;
var tooltipPreviewTextDomain;*/
var themeSelect;

// DOM elements - Domain Activation
var btnDomainsWhitelistAdd;
var btnDomainsWhitelistRemove;
var txtDomainsWhitelist;
var listDomainsWhitelist;
var btnDomainsBlacklistAdd;
var btnDomainsBlacklistRemove;
var txtDomainsBlacklist;
var listDomainsBlacklist;

// DOM elements - Short URL
var txtBitlyUser;
var pwdBitlyPass;
var btnOauthBitly;
var btnOauthGoogl;
var btnOauthGoogl_Revoke;

// Cached retrieved settings values.
var currentSyncSettingsValues = defaultSettings;
var currentLocalSettingsValues = defaultSettingsLocal;

function initialize(){
	// Cache DOM elements
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
	chkDisplayShortUrlsOnly = document.getElementById("chkDisplayShortUrlsOnly");
	// Option fields
	durationDelay = document.getElementById("durationDelay");
	durationFadeIn = document.getElementById("durationFadeIn");
	durationFadeOut = document.getElementById("durationFadeOut");
	colorBackground = document.getElementById("colorBackground");
	colorBorder = document.getElementById("colorBorder");
	colorDomainText = document.getElementById("colorDomainText");
	colorGeneralURLText = document.getElementById("colorGeneralURLText");
	/*tooltipPreview = document.getElementById("tooltipPreview");
	tooltipPreviewText = document.getElementById("tooltipPreviewText");
	tooltipPreviewTextDomain = document.getElementById("tooltipPreviewTextDomain");*/
	themeSelect = document.getElementById("themeSelect");
	// Short URL DOM elements
	txtBitlyUser = document.getElementById('txtBitlyUser');
	pwdBitlyPass = document.getElementById('pwdBitlyPass');
	btnOauthBitly = document.getElementById("btnOauthBitly");
	btnOauthGoogl = document.getElementById("btnOauthGoogl");
	btnOauthGoogl_Revoke = document.getElementById("btnOauthGoogl_Revoke");
	// DOM elements - Domain activation
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
	
	// Event handlers (prior to restoring settings)
	colorBackground.addEventListener("change", function(){
		//tooltipPreview.style.background = colorBackground.value;
		$('.ClContainer').css('background', colorBackground.value);
		themeSelect.value = "0";
	});
	colorBorder.addEventListener("change", function(){
		//tooltipPreview.style.borderColor = colorBorder.value;
		$('.ClContainer').css('border-color', colorBorder.value);
		themeSelect.value = "0";
	});
	colorGeneralURLText.addEventListener("change", function(){
		//tooltipPreviewText.style.color = colorGeneralURLText.value;
		$('.ClURL').css('color', colorGeneralURLText.value);
		themeSelect.value = "0";
	});
	colorDomainText.addEventListener("change", function(){
		//tooltipPreviewTextDomain.style.color = colorDomainText.value;
		$('.ClDomain').css('color', colorDomainText.value);
		themeSelect.value = "0";
	});
	
	// Get all the settings, update the UI
	restoreSettings();
	
	// Add event listeners to UI elements.
	btnSave.addEventListener("click", btnSave_Click);
	btnRestore.addEventListener("click", btnRestore_Click);
	$('#delAll').click(btnDelAllSavedData_Click);
	chkDisplayDomainOnly.addEventListener("change", chkDisplayDomainOnly_Change);
	// Page Activation
	btnDomainsWhitelistAdd.addEventListener("click", addToWhitelist);
	btnDomainsWhitelistRemove.addEventListener("click", removeFromWhitelist);
	btnDomainsBlacklistAdd.addEventListener("click", addToBlacklist);
	btnDomainsBlacklistRemove.addEventListener("click", removeFromBlacklist);
	// Style
	themeSelect.addEventListener("change", previewPresetTheme);
	// Short URLs
	btnOauthBitly.addEventListener("click", function(){
		oauth_Bitly_BasicAuth(txtBitlyUser.value, pwdBitlyPass.value);
	});
	btnOauthGoogl.addEventListener("click", oauth_Googl);
	btnOauthGoogl_Revoke.addEventListener("click", oauth_Googl_Revoke);
	
	document.getElementById('btnOauthBitly_ForgetToken').addEventListener("click", function(){
		chrome.storage.local.set({
			OAuth_BitLy: {enabled:false,token:""}
		}, function(){ // On saved
			currentLocalSettingsValues.OAuth_BitLy = {enabled:false,token:""}; // Update local copy of settings
			oauth_Bitly_UpdateUI();
		});
	});
	
	// Real-time validation
	$(durationDelay).focusout(function(e){
		if(durationDelay.value < 0){
			durationDelay.value = currentSyncSettingsValues.durationDelay;
		}
	});
	$(durationFadeIn).focusout(function(e){
		if(durationFadeIn.value < 0){
			durationFadeIn.value = currentSyncSettingsValues.durationFadeIn;
		}
	});
	$(durationFadeOut).focusout(function(e){
		if(durationFadeOut.value < 0){
			durationFadeOut.value = currentSyncSettingsValues.durationFadeOut;
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
			currentSyncSettingsValues = items;
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
			chkDisplayShortUrlsOnly.checked = items.displayOnKnownShortUrlDomainsOnly;
			// Update the Options menu UI
			durationDelay.value = items.durationDelay;
			durationFadeIn.value = items.durationFadeIn;
			durationFadeOut.value = items.durationFadeOut;
			themeSelect.value = items.theme;
			colorBackground.value = items.background;
			colorBorder.value = items.cssColorBorder;
			colorDomainText.value = items.cssColorDomainText;
			colorGeneralURLText.value = items.cssColorGeneralURLText;
			
			// Update Style preview
			previewPresetTheme();
		}
		
		// Enable/Disable UI elements depending on selected options.
		chkDisplayDomainOnly_Change();
	});
	// Get non-synced settings
	chrome.storage.local.get(defaultSettingsLocal, function(items){
		if (!chrome.runtime.lastError){
			// Cache the local settings
			currentLocalSettingsValues = items;
			// Page Activation
			$('#activationType' + items.activationFilter).prop("checked", true).change();
			// Page Activation - Load whitelist
			var i;
			for(i = listDomainsWhitelist.options.length - 1 ; i >= 0 ; i--){ // Empty list UI
				listDomainsWhitelist.remove(i);
			}
			for(i = 0; i < currentLocalSettingsValues.domainWhitelist.length; i++){ // Re-fill list UI
				// Add to Whitelist UI
				var option = document.createElement("option");
				option.text = currentLocalSettingsValues.domainWhitelist[i];
				listDomainsWhitelist.add(option);
			}
			// Page Activation - Load blacklist
			for(i = listDomainsBlacklist.options.length - 1 ; i >= 0 ; i--){ // Empty list UI
				listDomainsBlacklist.remove(i);
			}
			for(i = 0; i < currentLocalSettingsValues.domainBlacklist.length; i++){ // Re-fill list UI
				// Add to Blacklist UI
				var option = document.createElement("option");
				option.text = currentLocalSettingsValues.domainBlacklist[i];
				listDomainsBlacklist.add(option);
			}
			// Short URLs -- OAuth tokens
			document.getElementById("lblOauthBitly_Token").textContent = items.OAuth_BitLy.token;
		}
		// Load OAuth tokens to show in the UI which accounts are connected/authorised
		oauth_Googl_Silent();
		oauth_Bitly_UpdateUI();
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
		displayOnKnownShortUrlDomainsOnly: chkDisplayShortUrlsOnly.checked,
		// Style
		theme: themeSelect.value,
			// div
			background: colorBackground.value,
			cssColorBorder: colorBorder.value,
			// p
			cssColorGeneralURLText: colorGeneralURLText.value,
			// spanDomain
			cssColorDomainText: colorDomainText.value, // color
		// Animation
		durationDelay: iDurationDelay,
		durationFadeIn: iDurationFadeIn,
		durationFadeOut: iDurationFadeOut,
	}, function(){ // On saved
		chrome.storage.local.set({
			// Page Activation
			activationFilter: parseInt($('input[name=activationType]:checked', '#formActivationType').val())
		}, function(){ // On (local only) saved
			// Must occur after both sync and local are set (hence chained callback functions).
			spnSaved.show().delay(2500).fadeOut();
		});
	});
}

function btnRestore_Click(){
	btnConfirmY.onclick = function(){
		// Clear synced settings
		chrome.storage.sync.clear(function(){ // On sync cleared
			// Re-Save default sync values
			chrome.storage.sync.set(defaultSettings, function(){ // On sync saved
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
	$('#restore_FurtherInfo').show();
	$('#delAll_FurtherInfo').hide();
}

function btnDelAllSavedData_Click(){
	btnConfirmY.onclick = function(){
		// Clear synced settings
		chrome.storage.sync.clear(function(){ // On sync cleared
			// Re-Save default sync values
			chrome.storage.sync.set(defaultSettings, function(){ // On sync saved
				// Clear local settings
				chrome.storage.local.clear(function(){ // On local cleared
					// Re-Save default local values
					chrome.storage.local.set(defaultSettingsLocal, function(){ // On local saved
						// Update Options menu UI
						restoreSettings();
						divConfirm.style.visibility='hidden';
						spnSaved.show().delay(2500).fadeOut();
					});
				});
			});
		});
	};
	btnConfirmN.onclick = function(){
		divConfirm.style.visibility='hidden';
	};
	divConfirm.style.visibility='visible';
	$('#delAll_FurtherInfo').show();
	$('#restore_FurtherInfo').hide();
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
		$('#txtErrMsgDomainWhitelist').text(err.message);
		$('#divErrAreaWhitelist').show();
		return;
	}
	if(tmpUrl != null){ // null == silently skip
		// Is domain not already in Storage?
		if(currentLocalSettingsValues.domainWhitelist.indexOf(tmpUrl.hostname) == -1){
			// Add to Whitelist Storage
			currentLocalSettingsValues.domainWhitelist.push(tmpUrl.hostname);
			chrome.storage.local.set({domainWhitelist: currentLocalSettingsValues.domainWhitelist}, function(){ // On local settings saved
				// Add to Whitelist UI
				var option = document.createElement("option");
				option.text = tmpUrl.hostname;
				listDomainsWhitelist.add(option);
				// Clean UI
				txtDomainsWhitelist.value = "";
			});
		}
	}
}

function removeFromWhitelist(clickEvt){
	// Determine which whitelist entries to remove
	var indicesToRemove = [];
	for(var count = listDomainsWhitelist.options.length-1; count >= 0; count--){
		if(listDomainsWhitelist.options[count].selected == true){
			indicesToRemove.push(count); // Cache index for UI updating after successful storage update
			currentLocalSettingsValues.domainWhitelist.splice(count, 1); // Remove entry from model
		}
	}
	// Update the local storage
	chrome.storage.local.set({domainWhitelist: currentLocalSettingsValues.domainWhitelist}, function(){ // On (local only) saved
		// Update the UI
		for(var i = 0; i < indicesToRemove.length; i++){
			listDomainsWhitelist.remove(indicesToRemove[i]);
		}
	});
}

function addToBlacklist(clickEvt){
	var tmpUrl;
	try{
		tmpUrl = isValidUrl(txtDomainsBlacklist.value);
		hideBlacklistErrMsg();
	}catch(err){
		$('#txtErrMsgDomainBlacklist').text(err.message);
		$('#divErrAreaBlacklist').show();
		return;
	}
	if(tmpUrl != null){ // null == silently skip
		// Is domain not already in Storage?
		if(currentLocalSettingsValues.domainBlacklist.indexOf(tmpUrl.hostname) == -1){
			// Add to Blacklist Storage
			currentLocalSettingsValues.domainBlacklist.push(tmpUrl.hostname);
			chrome.storage.local.set({domainBlacklist: currentLocalSettingsValues.domainBlacklist}, function(){ // On local settings saved
				// Add to Blacklist UI
				var option = document.createElement("option");
				option.text = tmpUrl.hostname;
				listDomainsBlacklist.add(option);
				// Clean UI
				txtDomainsBlacklist.value = "";
			});
		}
	}
}

function removeFromBlacklist(clickEvt){
	// Determine which blacklist entries to remove
	var indicesToRemove = [];
	for(var count = listDomainsBlacklist.options.length-1; count >= 0; count--){
		if(listDomainsBlacklist.options[count].selected == true){
			indicesToRemove.push(count); // Cache index for UI updating after successful storage update
			currentLocalSettingsValues.domainBlacklist.splice(count, 1); // Remove entry from model
		}
	}
	// Update the local storage
	chrome.storage.local.set({domainBlacklist: currentLocalSettingsValues.domainBlacklist}, function(){ // On (local only) saved
		// Update the UI
		for(var i = 0; i < indicesToRemove.length; i++){
			listDomainsBlacklist.remove(indicesToRemove[i]);
		}
	});
}

function hideWhitelistErrMsg(){
	$('#divErrAreaWhitelist').hide();
}

function hideBlacklistErrMsg(){
	$('#divErrAreaBlacklist').hide();
}

/* Styles */

function previewPresetTheme(){
	var sTheme;
	switch(themeSelect.value){
		case "0": // Custom
			return;
		case "1": // Light/Default
			sTheme = 'light';
			break;
		case "2": // Dark
			sTheme = 'dark';
			break;
		case "3": // Original
			sTheme = 'original';
			break;
	}
	colorBackground.value = themes[sTheme].div.background;
	colorBorder.value = themes[sTheme].div['border-color'];
	$('.ClContainer').css('background', colorBackground.value)
		.css('border-color', colorBorder.value);
	colorGeneralURLText.value = themes[sTheme].p.color;
	$('.ClURL').css('color', colorGeneralURLText.value);
	colorDomainText.value = themes[sTheme].spanDomain.color;
	$('.ClDomain').css('color', colorDomainText.value);
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
			if(currentLocalSettingsValues.OAuth_GooGl.enabled){
				chrome.storage.local.set({OAuth_GooGl:{enabled:false}});
			}
			// TODO
			// Update UI
			btnOauthGoogl.disabled = false;
			$(btnOauthGoogl_Revoke).hide();
		}else{
			if(!currentLocalSettingsValues.OAuth_GooGl.enabled){
				chrome.storage.local.set({OAuth_GooGl:{enabled:true}});
			}
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

			// Update local storage
			chrome.storage.local.set({OAuth_GooGl:{enabled:false}});
			
			// Update UI.
			btnOauthGoogl.disabled = false;
			$(btnOauthGoogl_Revoke).hide();
			$("#authTickGooGl").attr('class', 'authTickHidden');
		}
	});
}

function oauth_Bitly_UpdateUI(){
	if(currentLocalSettingsValues.OAuth_BitLy.enabled){
		$('#btnOauthBitly').prop("disabled", true);
		$('#btnOauthBitly_ForgetToken').show();
		$("#authTickBitLy").attr('class', 'authTick');
		$("#divOauthBitly_LoggedIn").show();
		$("#divOauthBitly_LoggedOut").hide();
	}else{
		$('#btnOauthBitly').prop("disabled", false);
		$('#btnOauthBitly_ForgetToken').hide();
		$("#authTickBitLy").attr('class', 'authTickHidden');
		$("#divOauthBitly_LoggedIn").hide();
		$("#divOauthBitly_LoggedOut").show();
	}
}

function oauth_Bitly_BasicAuth(user_id, user_secret){
	// Update UI (logging in)
	$('#btnOauthBitly').prop("disabled", true);
	// HTTP Basic Authentication Flow (with hashed username and password)
	// Note 1: Unable to use "Resource Owner Credentials Grants" as "client_secret" is not secret in a public Chrome extension
	// Note 2: Unable to use "OAuth Web Flow", as it requires a "redirect_uri"; unable to get BitLy's implementation to work with Chrome Extensions' Options' pages. Also requires "client_secret" (see Note 2 for details)
	$.ajax({
        url: 'https://api-ssl.bitly.com/oauth/access_token',
        method: 'POST',
        headers:{
            'Authorization' : 'Basic ' + btoa(user_id + ':' + user_secret),
            'Content-Type' : 'application/x-www-form-urlencoded',
        },
        success: function (result){
			if(typeof result !== 'object'){
				// On success - "HTTP Basic Authentication Flow" response (access token) is a String, not an Object.
				chrome.storage.local.set({
					OAuth_BitLy: {enabled:true,token:result}
				}, function(){ // On saved
					currentLocalSettingsValues.OAuth_BitLy = {enabled:true,token:result}; // Update local copy of settings
					document.getElementById("lblOauthBitly_Token").textContent = result;
					oauth_Bitly_UpdateUI();
				});
			}else{ // Error - perhaps invalid login credentials
				// TODO
			}
			// Update UI
			document.getElementById('pwdBitlyPass').value = "";
			$('#btnOauthBitly').prop("disabled", false);
			console.log(result);
        },
        error: function (response){
            console.log("Cannot get data");
			console.log(response);
			// Update UI
			document.getElementById('pwdBitlyPass').value = "";
			$('#btnOauthBitly').prop("disabled", false);
        }
    });
}

// MAIN
window.addEventListener("load", initialize);