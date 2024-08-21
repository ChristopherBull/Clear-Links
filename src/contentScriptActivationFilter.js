// Check (before load event, if possible) if this webpage should have the extension injected.
// Background script will decide (looking at user options).
// Allows users to denylist/allowlist sites.
// Also reduces overall CPU/RAM usage, at the cost of a few additional cycles on each pages startup.

/**
 * Activates the main content scripts.
 * Sends a message to the background script with the activation hostname.
 * The Background service worker checks if the webpage should have the
 * extension injected.
 */
function activateMainContentScripts() {
  chrome.runtime.sendMessage({ activationHostname: window.location.hostname });
}

// Create a one-time backup activation point, after tab has focus, in case the tab is preloading
// in the background and the initial injection request is rejected.
// This named event listener should be removed once the content script is activated.
window.addEventListener('focus', activateMainContentScripts, { once: true });

// Initial activation request (will be rejected if tab is preloading)
// Will occur before load/ready events.
activateMainContentScripts();
