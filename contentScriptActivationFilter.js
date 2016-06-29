// Check (before load event) if this webpage should have the extension injected.
// Background script will decide (looking at user options).
// Allows users to blacklist/whitelist sites.
// Also reduces overall CPU/RAM usage, at the cost of a few additional cycles on each pages startup.
chrome.runtime.sendMessage({activationHostname: window.location.hostname});