(async () => {
    // Chrome extensions do not allow JS modules to be executed, so need to dynamically import the content script.
    const src = chrome.extension.getURL('contentScript.js');
    const contentScript = await import(src);
    // Initialise content script.
    // Options page should not cache Short URLs to enable user to test with example short URLs given in the Options page.
    contentScript.initialise(false);
})();