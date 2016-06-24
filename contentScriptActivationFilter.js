window.addEventListener("load", function(){
	// Background script will decide (looking at user options) if the extension should fully activate for this webpage, then inject the relevant code.
	// Allows users to blacklist/whitelist sites. Also reduces overall CPU/RAM usage, at the cost of a few additional cycles on each pages startup.
	chrome.runtime.sendMessage({activationFilter: window.location.href});
});