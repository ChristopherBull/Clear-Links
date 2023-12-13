(async () => {
    // Chrome extensions do not allow JS modules to be executed, so need to dynamically import the content script.
    const src = chrome.extension.getURL('contentScript.js');
    const contentScript = await import(src);
    // Initialise content script with default settings.
    contentScript.initialise();
})();