import * as ContentScript from './contentScript.js';
import { defaultSettings, defaultSettingsLocal } from './defaultSettings.js';
import { Confirm } from './optionsConfirmDialog.js';
import { initAllSharedListeners } from './contentScriptSharedLib.js';
import { themes } from './themes.js';

/////////////////////
// Vertical Tab UI //
/////////////////////

const allLinks = document.querySelectorAll('.tabs a');
const allTabs = document.querySelectorAll('.tab-content');

const shiftTabs = (linkId) => {
  allTabs.forEach((tab, i) => {
    if (tab.id.includes(linkId)) {
      allTabs.forEach((tabItem) => {
        tabItem.style = `transform: translateY(-${i * 500}px);`;
      });
    }
  });
};

allLinks.forEach((elem) => {
  elem.addEventListener('click', () => {
    const linkId = elem.id;
    const hrefLinkClick = elem.href;

    allLinks.forEach((link) => {
      if (link.href == hrefLinkClick) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    shiftTabs(linkId);
  });
});

// Handle proper selection for initial load
const currentHash = window.location.hash;
let activeLink = document.querySelector('.tabs a');

if (currentHash) {
  const visibleHash = document.getElementById(
    `${currentHash.replace('#', '')}`,
  );
  if (visibleHash) {
    activeLink = visibleHash;
  }
}
activeLink.classList.toggle('active');
shiftTabs(activeLink.id);

///////////////
// Utilities //
///////////////

/**
 * Debounces a function to limit the rate at which it is called.
 * @param {Function} func - The function to be debounced.
 * @param {number} [timeout=300] - The time in milliseconds to wait before invoking the function.
 * @returns {Function} - The debounced function.
 */
function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

/**
 * Sets the provided data in the sync storage.
 * If an error occurs, the data will be stored in the local storage instead.
 * @param {object} data - The data to be stored in the sync storage.
 * @returns {Promise<void>} - A promise that resolves when the data is successfully stored.
 */
async function setSyncStorageWithOfflineFallback(data) {
  try {
    await browser.storage.sync.set(data);
  } catch (error) {
    console.warn('Unable to save to Sync storage, saving to local storage instead: ' + error);
    // Prepare fallback data for merging with existing data in syncOffline settings
    const fallbackData = { syncOffline: {} };
    for (const [ key, value ] of Object.entries(data)) {
      fallbackData.syncOffline[`${key}`] = value;
    }
    // Merge fallbackData with existing data in syncOffline
    Object.assign(currentLocalSettingsValues.syncOffline, fallbackData.syncOffline);
    // Save to local storage
    await browser.storage.local.set({ syncOffline: currentLocalSettingsValues.syncOffline });
  }
}

/////////////////////////////////
// Options page -- Tab content //
/////////////////////////////////

// General Options - DOM elements
let chkDisplayExternalDomainsOnly;
// URL parts
let chkDisplayDomainOnly;
let chkDisplayUrlScheme;
let rdoDisplayUrlNoAuth;
let rdoDisplayUrlUsername;
let rdoDisplayUrlPassword;
let rdoDisplayUrlPassMask;
let chkDisplayUrlHostname;
let chkDisplayUrlPort;
let chkDisplayUrlPath;
let chkDisplayUrlQuery;
let chkDisplayUrlFragment;
// Other link types
let chkDisplayJavascriptLinks;
let chkDisplayMailtoLinks;
let chkDisplayShortUrlsOnly;

// DOM elements - Option fields
let durationDelay;
let durationFadeIn;
let durationFadeOut;
let colorBackground;
let colorBorder;
let colorDomainText;
let colorGeneralURLText;
let colorIcon;
let themeSelect;

// DOM elements - Domain Activation
let txtDomainsAllowlist;
let listDomainsAllowlist;
let txtDomainsDenylist;
let listDomainsDenylist;

// DOM elements - Short URL
let txtBitlyUser;
let pwdBitlyPass;
let btnOauthBitly;
let btnOauthBitlyForgetToken;
let btnOauthBitlyTick;
let divOauthBitlyLoggedIn;
let divOauthBitlyLoggedOut;

// Cached retrieved settings values.
let currentSyncSettingsValues = defaultSettings;
let currentLocalSettingsValues = defaultSettingsLocal;

/**
 * Initializes the options page.
 *
 * This function performs the following tasks:
 * - Caches references to DOM elements used in the script.
 * - Sets up event listeners for UI changes.
 * - Restores settings and updates the UI accordingly.
 * - Saves settings when UI elements are changed.
 * - Handles short URL authentication and revocation.
 * - Handles domain activation and allowlist/denylist management.
 * - Handles theme selection and preview updates.
 * - Initializes the content script for previewing settings.
 * - Loads additional page content.
 * @returns {Promise<void>} A promise that resolves when the initialization is complete.
 */
async function initialize() {
  // Cache references to DOM elements
  // Only cache references to DOM elements that are used in this script multiple times.
  // DOM elements - Visibility options
  chkDisplayExternalDomainsOnly = document.getElementById('chkDisplayExternalDomainsOnly');
  chkDisplayDomainOnly = document.getElementById('chkDisplayDomainOnly');
  chkDisplayUrlScheme = document.getElementById('chkDisplayUrlScheme');
  rdoDisplayUrlNoAuth = document.getElementById('rdoDisplayUrlNoAuth');
  rdoDisplayUrlUsername = document.getElementById('rdoDisplayUrlUsername');
  rdoDisplayUrlPassword = document.getElementById('rdoDisplayUrlPassword');
  rdoDisplayUrlPassMask = document.getElementById('rdoDisplayUrlPassMask');
  chkDisplayUrlHostname = document.getElementById('chkDisplayUrlHostname');
  chkDisplayUrlPort = document.getElementById('chkDisplayUrlPort');
  chkDisplayUrlPath = document.getElementById('chkDisplayUrlPath');
  chkDisplayUrlQuery = document.getElementById('chkDisplayUrlQuery');
  chkDisplayUrlFragment = document.getElementById('chkDisplayUrlFragment');
  chkDisplayJavascriptLinks = document.getElementById('chkDisplayJavascriptLinks');
  chkDisplayMailtoLinks = document.getElementById('chkDisplayMailtoLinks');
  chkDisplayShortUrlsOnly = document.getElementById('chkDisplayShortUrlsOnly');
  // DOM elements - Domain activation
  txtDomainsAllowlist = document.getElementById('txt-domains-allowlist');
  listDomainsAllowlist = document.getElementById('list-domains-allowlist');
  txtDomainsDenylist = document.getElementById('txt-domains-denylist');
  listDomainsDenylist = document.getElementById('list-domains-denylist');
  // DOM elements - Option fields
  durationDelay = document.getElementById('durationDelay');
  durationFadeIn = document.getElementById('durationFadeIn');
  durationFadeOut = document.getElementById('durationFadeOut');
  colorBackground = document.getElementById('colorBackground');
  colorBorder = document.getElementById('colorBorder');
  colorDomainText = document.getElementById('colorDomainText');
  colorGeneralURLText = document.getElementById('colorGeneralURLText');
  colorIcon = document.getElementById('colorIcon');
  themeSelect = document.getElementById('theme-select');
  // DOM elements - Short URL
  txtBitlyUser = document.getElementById('txtBitlyUser');
  pwdBitlyPass = document.getElementById('pwd-bitly-pass');
  btnOauthBitly = document.getElementById('btn-oauth-bitly');
  btnOauthBitlyForgetToken = document.getElementById('btn-oauth-bitly-forget-token');
  btnOauthBitlyTick = document.getElementById('auth-tick-bitly');
  divOauthBitlyLoggedIn = document.getElementById('divOauthBitlyLoggedIn');
  divOauthBitlyLoggedOut = document.getElementById('divOauthBitlyLoggedOut');

  // Event handlers for UI changes only (prior to restoring settings, so UI will update to reflect settings)
  // Domain activation
  document.querySelectorAll('#form-activation-type input').forEach((el) => {
    el.addEventListener('change', () => {
      showActivationTypeOptions(el.value);
    });
  });
  [ colorBackground, colorBorder, colorGeneralURLText, colorDomainText, colorIcon ].forEach((colourPickerElem) => {
    colourPickerElem.addEventListener('change', (event) => {
      try {
        const el = event.target;
        // Set theme to custom
        themeSelect.value = '0';
        // Save the setting
        setSyncStorageWithOfflineFallback({
          [el.dataset.storageKey]: el.value,
          [themeSelect.dataset.storageKey]: themeSelect.value,
        });
        currentSyncSettingsValues[el.dataset.storageKey] = el.value;
        // Update the preview items
        document.querySelectorAll(el.dataset.previewClass).forEach((previewElement) => {
          previewElement.style[el.dataset.styleKey] = el.value;
        });
        // UI to show saved.
        showPopup('saved');
      } catch (err) {
        console.error(err);
        showPopup('error', 'Error saving setting: ' + err.message);
      }
    });
  });

  // Get all the settings, update the UI
  await restoreSettings();

  // Add event listeners to UI elements.
  // Add remaining listeners here which can update the state/settings of the extension.
  // Event Listeners - Visibility options
  chkDisplayDomainOnly.addEventListener('change', chkDisplayDomainOnlyChange);
  // Event listeners - Page Activation
  document.getElementById('btn-domains-allowlist-add').addEventListener('click', addToAllowlist);
  document.getElementById('btn-domains-allowlist-remove').addEventListener('click', removeFromAllowlist);
  document.getElementById('btn-domains-denylist-add').addEventListener('click', addToDenylist);
  document.getElementById('btn-domains-denylist-remove').addEventListener('click', removeFromDenylist);
  // Event listeners - Short URLs
  btnOauthBitly.addEventListener('click', () => {
    oauthBitlyBasicAuth(txtBitlyUser.value, pwdBitlyPass.value);
  });
  btnOauthBitlyForgetToken.addEventListener('click', () => {
    // Confirm with user before forgetting OAuth token
    Confirm.open({
      title: 'Forget Bit.ly OAuth Token?',
      message: 'Are you sure you want to remove the Bit.ly OAuth token?',
      onOk: async () => {
        try {
          // Remove token from local settings
          await browser.storage.local.set({
            OAuthBitLy: { enabled: false, token: '' },
          });
          // Update cached copy of local settings
          currentLocalSettingsValues.OAuthBitLy = { enabled: false, token: '' };
          oauthBitlyUpdateUI();
        } catch (err) {
          console.error(err);
          showPopup('error', 'Error forgetting OAuth token: ' + err.message);
        }
      },
    });
  });
  // Event listeners - About page
  document.getElementById('restore').addEventListener('click', restoreSyncedSettings);
  document.getElementById('btn-del-all').addEventListener('click', btnDelAllSavedDataClick);

  // All checkboxes - Save settings on change/click
  document.querySelectorAll('input[type=checkbox].save-on-change').forEach((el) => {
    el.addEventListener('change', async () => {
      try {
        await setSyncStorageWithOfflineFallback({
          [el.dataset.storageKey]: el.checked,
        });
        // UI to show saved.
        showPopup('saved');
      } catch (err) {
        console.error(err);
        showPopup('error', 'Error saving setting: ' + err.message);
      }
    });
  });
  // All radio buttons (synced) - Save settings on change/click
  document.querySelectorAll('input[type=radio].save-on-change').forEach((el) => {
    el.addEventListener('change', async () => {
      try {
        await setSyncStorageWithOfflineFallback({
          [el.dataset.storageKey]: parseInt(el.value),
        });
        // UI to show saved.
        showPopup('saved');
      } catch (err) {
        console.error(err);
        showPopup('error', 'Error saving setting: ' + err.message);
      }
    });
  });
  // All radio buttons (local) - Save settings on change/click
  document.querySelectorAll('input[type=radio].save-local-on-change').forEach((el) => {
    el.addEventListener('change', async () => {
      try {
        await browser.storage.local.set({
          [el.dataset.storageKey]: parseInt(el.value),
        });
        // UI to show saved.
        showPopup('saved');
      } catch (err) {
        console.error(err);
        showPopup('error', 'Error saving setting: ' + err.message);
      }
    });
  });
  // All number fields - Save settings on change (with a debounce)
  document.querySelectorAll('input[type=number].save-on-change').forEach((el) => {
    // Set a change listener to update the UI to show unsaved changes (outside of the debounce function).
    el.addEventListener('change', () => {
      try {
        // Validate - Check if value is valid immediately, for user feedback.
        validateNumberFieldValue(el);
        // Validation passed - UI to show unsaved.
        el.style.backgroundColor = 'rgba(255, 255, 0, 0.25)';
      } catch (err) {
        console.error(err);
        el.style.backgroundColor = 'pink';
        showPopup('error', 'Error saving setting: ' + err.message);
      }
    });

    // Set a debounce listener to save the settings.
    el.addEventListener('change', debounce(async () => {
      let value;
      try {
        // Validate - Check if value is valid (after debounce, to ensure saving valid numbers only)
        value = validateNumberFieldValue(el);
      } catch (err) {
        // Silently skip saving invalid values (error reporting occurred on the immediate change event handler)
        return;
      }
      // Check if value changed (not reset to current value)
      if (value === currentSyncSettingsValues[el.dataset.storageKey]) {
        // Value unchanged - Do nothing but reset the UI to show saved.
        // NB A user may have changed value from an invalid input (which changes background from red to yellow) to the currently saved value.
        el.style.backgroundColor = 'white';
        return;
      }
      try {
        // Save
        await setSyncStorageWithOfflineFallback({
          [el.dataset.storageKey]: parseInt(value),
        });
        currentSyncSettingsValues[el.dataset.storageKey] = value;
        // UI to show saved.
        el.style.backgroundColor = 'white';
        showPopup('saved');
      } catch (err) {
        console.error(err);
        el.style.backgroundColor = 'pink';
        showPopup('error', 'Error saving setting: ' + err.message);
      }
    }, 1500));
  });
  // Select field (theme) - Save settings on change
  themeSelect.addEventListener('change', async () => {
    try {
      await setSyncStorageWithOfflineFallback({
        [themeSelect.dataset.storageKey]: themeSelect.value,
      });
      currentSyncSettingsValues[themeSelect.dataset.storageKey] = themeSelect.value;
      applyPresetTheme(true);
      // UI to show saved.
      showPopup('saved');
    } catch (err) {
      console.error(err);
      showPopup('error', 'Error saving setting: ' + err.message);
    }
  });

  // Init previews -- Don't allow the preview links to actually navigate anywhere (just for mouseover demos).
  document.querySelectorAll('.preview-link').forEach((el) => {
    el.addEventListener('click', (event) => {
      event.preventDefault();
      return false;
    });
  });

  // Initialise content script -- for previewing settings within the Options Page
  // Options page should not cache Short URLs to enable user to repeatedly test example short URLs given in the Options page.
  const urlContentScriptCSS = browser.runtime.getURL('contentScript.css');
  ContentScript.initialise(urlContentScriptCSS, currentSyncSettingsValues, false, 'a.preview-link');
  // Setup message passing and related listeners.
  initAllSharedListeners();

  // Load additional page content (one-time)
  const manifestData = browser.runtime.getManifest();
  document.getElementById('about-page-extension-version').textContent = manifestData.version;
  document.getElementById('about-page-extension-description').textContent = manifestData.description;
}

/**
 * Validates a number field value.
 * Checks if the number is NaN or negative.
 * @param {HTMLInputElement} el - The input element to validate.
 * @returns {number} - The validated number value.
 * @throws {Error} - If the value is not a number or is a negative number.
 */
function validateNumberFieldValue(el) {
  const value = parseInt(el.value);
  if (isNaN(value)) {
    // Invalid value; NaN
    throw new Error('Invalid value - must be a number.');
  }
  if (value < 0) {
    // Invalid value; must be positive
    throw new Error('Invalid value - must be a positive number.');
  }
  return value;
}

/**
 * Restores the settings for the Options menu UI.
 * Retrieves synced and local non-synced settings from Chrome storage.
 * Updates the UI elements with the retrieved settings.
 * Handles errors and displays appropriate messages.
 * Applies preset theme and enables/disables UI elements based on selected options.
 * Loads allowlist and denylist for page activation.
 * Updates OAuth tokens for connected/authorized accounts.
 * @returns {Promise<void>} A promise that resolves when the settings are restored.
 */
async function restoreSettings() {
  // Get all local non-synced settings
  try {
    currentLocalSettingsValues = await browser.storage.local.get(defaultSettingsLocal);
  } catch (err) {
    // Settings initialised earlier with defaults, so no need to re-initialise defaults here.
    console.error(err);
    showPopup('warning', 'Error restoring local settings. Using defaults instead.');
  }

  // Get all synced settings
  try {
    currentSyncSettingsValues = await browser.storage.sync.get(defaultSettings);
  } catch (err) {
    // Settings initialised earlier with defaults, so no need to re-initialise defaults here.
    console.warn('Sync storage not available. Will save sync settings locally instead: ' + err);
    showPopup('warning', 'Error restoring synced settings. Loading local settings instead.');
    // Cache the synced settings locally with the offline settings
    currentSyncSettingsValues = currentLocalSettingsValues.syncOffline;
  }

  // Update the Options menu UI with the settings
  try {
    // Synced settings
    chkDisplayExternalDomainsOnly.checked = currentSyncSettingsValues.displayExternalDomainsOnly;
    chkDisplayDomainOnly.checked = currentSyncSettingsValues.displayDomainOnly;
    chkDisplayUrlScheme.checked = currentSyncSettingsValues.displayUrlScheme;
    switch (parseInt(currentSyncSettingsValues.displayUrlAuth)) {
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
    chkDisplayUrlHostname.checked = currentSyncSettingsValues.displayUrlHostname;
    chkDisplayUrlPort.checked = currentSyncSettingsValues.displayUrlPort;
    chkDisplayUrlPath.checked = currentSyncSettingsValues.displayUrlPath;
    chkDisplayUrlQuery.checked = currentSyncSettingsValues.displayUrlQuery;
    chkDisplayUrlFragment.checked = currentSyncSettingsValues.displayUrlFragment;
    chkDisplayJavascriptLinks.checked = currentSyncSettingsValues.displayJavascriptLinks;
    chkDisplayMailtoLinks.checked = currentSyncSettingsValues.displayMailtoLinks;
    chkDisplayShortUrlsOnly.checked = currentSyncSettingsValues.displayOnKnownShortUrlDomainsOnly;
    // Update the Options menu UI
    durationDelay.value = currentSyncSettingsValues.durationDelay;
    durationFadeIn.value = currentSyncSettingsValues.durationFadeIn;
    durationFadeOut.value = currentSyncSettingsValues.durationFadeOut;
    themeSelect.value = currentSyncSettingsValues.theme;
    colorBackground.value = currentSyncSettingsValues.background;
    colorBorder.value = currentSyncSettingsValues.cssColorBorder;
    colorDomainText.value = currentSyncSettingsValues.cssColorDomainText;
    colorGeneralURLText.value = currentSyncSettingsValues.cssColorGeneralURLText;
    colorIcon.value = currentSyncSettingsValues.cssBackgroundColorIcon;
    // Update Style preview
    applyPresetTheme();
    // Enable/Disable UI elements depending on selected options.
    chkDisplayDomainOnlyChange();

    // Get non-synced settings

    // Page Activation
    document.querySelector('#activationType' + currentLocalSettingsValues.activationFilter).checked = true;
    showActivationTypeOptions(currentLocalSettingsValues.activationFilter);
    // Page Activation - Load allowlist
    let i;
    // Empty allowlist element
    while (listDomainsAllowlist.options.length > 0) {
      listDomainsAllowlist.remove(0);
    }
    // Re-fill allowlist element
    for (i = 0; i < currentLocalSettingsValues.domainWhitelist.length; i++) {
      const option = document.createElement('option');
      option.text = currentLocalSettingsValues.domainWhitelist[i];
      listDomainsAllowlist.add(option);
    }
    // Page Activation - Load denylist
    // Empty denylist element
    while (listDomainsDenylist.options.length > 0) {
      listDomainsDenylist.remove(0);
    }
    // Re-fill denylist element
    for (i = 0; i < currentLocalSettingsValues.domainBlacklist.length; i++) {
      const option = document.createElement('option');
      option.text = currentLocalSettingsValues.domainBlacklist[i];
      listDomainsDenylist.add(option);
    }
    // Short URLs -- OAuth tokens
    document.getElementById('lbl-oauth-bitly-token').textContent = currentLocalSettingsValues.OAuthBitLy.token;

    // Load OAuth tokens to show in the UI which accounts are connected/authorised
    oauthBitlyUpdateUI();
  } catch (err) {
    console.error(err);
    showPopup('error', 'Error restoring settings: ' + err.message);
  }
}

/**
 * Displays a popup with a specific type and message.
 * @param {string} type - The type of the popup. Possible values: 'info', 'success', 'warning', 'error', 'saved'.
 * @param {string} message - The message to be displayed in the popup.
 */
function showPopup(type, message) {
  const alertElem = document.getElementById('alert');
  // Hide all icons
  alertElem.querySelectorAll('.alert-icon').forEach((el) => {
    el.style.display = 'none';
  });
  // Hide background for all alert types
  alertElem.classList.remove('alert-info', 'alert-success', 'alert-warning', 'alert-error');
  // Show specific icon for the given type
  switch (type) {
    case 'info':
      alertElem.querySelector('.alert-icon-info').style.display = 'inherit';
      alertElem.classList.add('alert-info');
      break;
    case 'success':
      alertElem.querySelector('.alert-icon-success').style.display = 'inherit';
      alertElem.classList.add('alert-success');
      break;
    case 'warning':
      alertElem.querySelector('.alert-icon-warning').style.display = 'inherit';
      alertElem.classList.add('alert-warning');
      break;
    case 'error':
      alertElem.querySelector('.alert-icon-error').style.display = 'inherit';
      alertElem.classList.add('alert-error');
      break;
    // Specific style/icons for more precise alert types
    case 'saved':
      alertElem.querySelector('.alert-icon-saved').style.display = 'inherit';
      alertElem.classList.add('alert-success');
      break;
  }
  // Set the message
  switch (type) {
    case 'info':
    case 'success':
    case 'warning':
    case 'error':
      alertElem.querySelector('.message').textContent = message;
      break;
    // Specific style/icons for more precise alert types
    case 'saved':
      alertElem.querySelector('.message').textContent = message || 'Saved';
      break;
  }
  // Show the alert
  alertElem.style.opacity = 1;
  alertElem.style.visibility = 'visible';
  // Hide the alert after 3 seconds (clearing previous timeout if any)
  if (alertElem.timeout) {
    clearTimeout(alertElem.timeout);
  }
  alertElem.timeout = setTimeout(() => {
    alertElem.style.opacity = 0;
    alertElem.style.visibility = 'hidden';
  }, 3000);
}

// Click Events

/**
 * Shows a confirmation dialog which will restore synced settings to their default values.
 */
function restoreSyncedSettings() {
  // Confirm with user before restoring default settings
  Confirm.open({
    title: 'Restore Default Settings',
    message: 'Are you sure you want to restore default settings?<br><br><em>Warning:</em> This will delete all your saved settings and cannot be undone.',
    onOk: async () => {
      // Clear synced settings
      try {
        await browser.storage.sync.clear();
        // Re-Save default sync values
        await browser.storage.sync.set(defaultSettings);
      } catch (err) {
        console.warn('Unable to reset Sync storage as it is unavailable, will reset offline copy: ' + err);
        // Do not replace all local settings with defaults, only the syncOffline settings
        await browser.storage.local.set({
          syncOffline: defaultSettings,
        });
      }
      // Update Options menu UI
      await restoreSettings();
      showPopup('saved', 'Default settings restored');
    },
  });
}

/**
 * Function to handle the click event of the "Delete All Saved Data" button.
 * Shows a confirmation dialog which will delete all saved data in the extension.
 */
function btnDelAllSavedDataClick() {
  // Confirm with user before deleting all saved data
  Confirm.open({
    title: 'Delete All Extension Data',
    message: 'Are you sure you want to delete all data in this extension?<br><br><em>Warning:</em> This will delete all your saved settings, local preferences, and authentication credentials. This cannot be undone.',
    onOk: async () => {
      // Clear synced settings
      try {
        await browser.storage.sync.clear();
        // Re-Save default sync values
        await browser.storage.sync.set(defaultSettings);
      } catch (err) {
        console.warn('Unable to clear Sync storage as it is unavailable: ' + err);
      }
      // Clear local settings
      await browser.storage.local.clear();
      // Re-Save default local values
      await browser.storage.local.set(defaultSettingsLocal);
      // Update Options menu UI
      await restoreSettings();
      showPopup('success', 'All data deleted.');
    },
  });
}

/**
 * Function to handle the change event of the "chkDisplayDomainOnly" checkbox.
 * Disables or enables various UI elements based on the checkbox's checked state.
 */
function chkDisplayDomainOnlyChange() {
  if (chkDisplayDomainOnly.checked) {
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
  } else {
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

/**
 * Shows or hides activation type UI options based on the provided type.
 * @param {number} type - The activation type. One of: 1='All', 2='Allowlist', 3='Denylist'.
 */
function showActivationTypeOptions(type) {
  switch (parseInt(type)) {
    case 1:
      document.getElementById('form-allowlist').style.display = 'none';
      document.getElementById('form-denylist').style.display = 'none';
      break;
    case 2:
      document.getElementById('form-allowlist').style.display = 'inherit';
      document.getElementById('form-denylist').style.display = 'none';
      break;
    case 3:
      document.getElementById('form-allowlist').style.display = 'none';
      document.getElementById('form-denylist').style.display = 'inherit';
      break;
  }
}

/**
 * Checks if a given URL is valid.
 * @param {string} sUrl - The URL to be validated.
 * @returns {URL} - The validated URL object.
 * @throws {Error} - If the URL is empty or invalid.
 */
function isValidUrl(sUrl) {
  // Check if URL is empty or undefined
  if (!sUrl) {
    throw new Error('URL is empty');
  }
  // Include URL protocol if not specified (otherwise URL constructor will throw exception)
  if (!sUrl.includes('://')) {
    sUrl = 'http://' + sUrl;
  }
  // Create URL object
  try {
    return new URL(sUrl);
  } catch (err) {
    console.error(err.message);
    throw err;
  }
}

/**
 * Adds a domain to the allowlist.
 * Saves the domain to local storage and updates the UI.
 * @returns {Promise<void>} A promise that resolves when the domain is added to the allowlist.
 */
async function addToAllowlist() {
  let tmpUrl;
  try {
    tmpUrl = isValidUrl(txtDomainsAllowlist.value);
  } catch (err) {
    showPopup('error', 'Invalid domain: ' + err.message);
    return;
  }

  // If tmpUrl is null, silently skip
  if (tmpUrl == null) {
    return;
  }

  // Is domain not already in Storage?
  // TODO Allow user to choose local or sync storage (or both)
  if (currentLocalSettingsValues.domainWhitelist.indexOf(tmpUrl.hostname) === -1) {
    // Add to Allowlist Storage
    currentLocalSettingsValues.domainWhitelist.push(tmpUrl.hostname);
    await browser.storage.local.set({ domainWhitelist: currentLocalSettingsValues.domainWhitelist });
    // Add to Allowlist UI
    const option = document.createElement('option');
    option.text = tmpUrl.hostname;
    listDomainsAllowlist.add(option);
    // Clean UI
    txtDomainsAllowlist.value = '';
    showPopup('saved');
  } else {
    showPopup('info', 'Domain already in allowlist');
  }
}

/**
 * Removes selected entries from the allowlist.
 * Saves the updated allowlist to local storage and updates the UI.
 * @returns {Promise<void>} A promise that resolves when the entries are removed.
 */
async function removeFromAllowlist() {
  // Determine which allowlist entries to remove
  const indicesToRemove = [];
  for (let count = listDomainsAllowlist.options.length - 1; count >= 0; count--) {
    if (listDomainsAllowlist.options[count].selected === true) {
      indicesToRemove.push(count); // Cache index for UI updating after successful storage update
      currentLocalSettingsValues.domainWhitelist.splice(count, 1); // Remove entry from model
    }
  }
  // Update the local storage
  await browser.storage.local.set({ domainWhitelist: currentLocalSettingsValues.domainWhitelist });
  // Update the UI
  indicesToRemove.forEach((index) => {
    listDomainsAllowlist.remove(index);
  });
  showPopup('saved');
}

/**
 * Adds a domain to the denylist.
 * Saves the domain to local storage and updates the UI.
 * @returns {Promise<void>} A promise that resolves when the domain is added to the denylist.
 */
async function addToDenylist() {
  let tmpUrl;
  try {
    tmpUrl = isValidUrl(txtDomainsDenylist.value);
  } catch (err) {
    showPopup('error', 'Invalid domain: ' + err.message);
    return;
  }

  // If tmpUrl is null, silently skip
  if (tmpUrl == null) {
    return;
  }

  // Is domain not already in Storage?
  if (currentLocalSettingsValues.domainBlacklist.indexOf(tmpUrl.hostname) === -1) {
    // Add to Denylist Storage
    currentLocalSettingsValues.domainBlacklist.push(tmpUrl.hostname);
    await browser.storage.local.set({ domainBlacklist: currentLocalSettingsValues.domainBlacklist });
    // Add to Denylist UI
    const option = document.createElement('option');
    option.text = tmpUrl.hostname;
    listDomainsDenylist.add(option);
    // Clean UI
    txtDomainsDenylist.value = '';
    showPopup('saved');
  } else {
    showPopup('info', 'Domain already in denylist');
  }
}

/**
 * Removes selected entries from the denylist.
 * Saves the updated denylist to local storage and updates the UI.
 * @returns {Promise<void>} A promise that resolves when the entries are removed.
 */
async function removeFromDenylist() {
  // Determine which denylist entries to remove
  const indicesToRemove = [];
  for (let count = listDomainsDenylist.options.length - 1; count >= 0; count--) {
    if (listDomainsDenylist.options[count].selected === true) {
      indicesToRemove.push(count); // Cache index for UI updating after successful storage update
      currentLocalSettingsValues.domainBlacklist.splice(count, 1); // Remove entry from model
    }
  }
  // Update the local storage
  await browser.storage.local.set({ domainBlacklist: currentLocalSettingsValues.domainBlacklist });
  // Update the UI
  indicesToRemove.forEach((index) => {
    listDomainsDenylist.remove(index);
  });
  showPopup('saved');
}

/* Styles */

/**
 * Applies a preset theme to the UI style options, updates preview items, and saves the preset settings.
 * @param {boolean} [savePresetSettings=false] - Indicates whether to save the preset settings.
 */
function applyPresetTheme(savePresetSettings = false) {
  let sTheme;
  switch (themeSelect.value) {
    case '0': // Custom
      sTheme = 'custom';
      break;
    case '1': // Light/Default
      sTheme = 'light';
      break;
    case '2': // Dark
      sTheme = 'dark';
      break;
    case '3': // Original
      sTheme = 'original';
      break;
  }
  // Update the UI style options with predefined theme defaults
  if (sTheme !== 'custom') {
    colorBackground.value = themes[sTheme].div.background;
    colorBorder.value = themes[sTheme].div['border-color'];
    colorGeneralURLText.value = themes[sTheme].p.color;
    colorDomainText.value = themes[sTheme].spanDomain.color;
    colorIcon.value = themes[sTheme].icon.background;
  }
  document.querySelectorAll('.cl-container').forEach((el) => {
    el.style.background = colorBackground.value;
    el.style.borderColor = colorBorder.value;
  });
  document.querySelectorAll('.cl-url').forEach((el) => {
    el.style.color = colorGeneralURLText.value;
  });
  document.querySelectorAll('.cl-domain').forEach((el) => {
    el.style.color = colorDomainText.value;
  });
  document.querySelectorAll('.cl-icon').forEach((el) => {
    el.style.background = colorIcon.value;
  });
  // Save the preset settings (the contentScript listens for these changes individually and updates the style accordingly)
  // NB: Cannot simply save the themeSelect.value, as the contentScript does not listen for changes to the themeSelect.value.
  if (savePresetSettings) {
    setSyncStorageWithOfflineFallback({
      background: colorBackground.value,
      cssColorBorder: colorBorder.value,
      cssColorDomainText: colorDomainText.value,
      cssColorGeneralURLText: colorGeneralURLText.value,
      cssColorMailto: colorDomainText.value, // TODO make customisable - currently re-uses the domain text colour
      cssBackgroundColorIcon: colorIcon.value,
    });
  }
}

/* Short URLs */

/**
 * Updates the UI based on the current state of Bitly OAuth.
 */
function oauthBitlyUpdateUI() {
  if (currentLocalSettingsValues.OAuthBitLy.enabled) {
    btnOauthBitly.disabled = true;
    btnOauthBitlyForgetToken.style.display = 'inherit';
    btnOauthBitlyTick.className = 'auth-tick';
    divOauthBitlyLoggedIn.style.display = 'inherit';
    divOauthBitlyLoggedOut.style.display = 'none';
  } else {
    btnOauthBitly.disabled = false;
    btnOauthBitlyForgetToken.style.display = 'none';
    btnOauthBitlyTick.className = 'auth-tick-hidden';
    divOauthBitlyLoggedIn.style.display = 'none';
    divOauthBitlyLoggedOut.style.display = 'inherit';
  }
}

/**
 * Performs OAuth authentication using HTTPS Basic Authentication Flow with Bitly.
 * @param {string} userID - The user ID for authentication.
 * @param {string} userSecret - The user secret for authentication.
 */
function oauthBitlyBasicAuth(userID, userSecret) {
  // Update UI (logging in)
  btnOauthBitly.disabled = true;
  // HTTPS Basic Authentication Flow (with hashed username and password)
  // Note 1: Unable to use "Resource Owner Credentials Grants" as "client_secret" is not secret in a public Chrome extension
  // Note 2: Unable to use "OAuth Web Flow", as it requires a "redirect_uri"; unable to get BitLy's implementation to work with Chrome Extensions' Options' pages. Also requires "client_secret" (see Note 2 for details)
  fetch('https://api-ssl.bitly.com/oauth/access_token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(userID + ':' + userSecret),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((response) => {
    if (response.ok) {
      // On success - "HTTP Basic Authentication Flow" response (access token) is a String, not an Object.
      response.text().then((txtResponse) => {
        browser.storage.local.set({
          OAuthBitLy: { enabled: true, token: txtResponse },
        }, () => { // On saved
          // Update local copy of settings
          currentLocalSettingsValues.OAuthBitLy = { enabled: true, token: txtResponse };
          // Update UI (after saved)
          document.getElementById('lbl-oauth-bitly-token').textContent = txtResponse;
          oauthBitlyUpdateUI();
        });
        // Update UI (immediately)
        document.getElementById('pwd-bitly-pass').value = '';
        btnOauthBitly.disabled = false;
      });
    } else {
      response.json().then((jsonResponse) => {
        const errMessage = 'Bit.ly error (' + response.status + '): ' + jsonResponse.message + ' - ' + jsonResponse.description;
        console.error(errMessage);
        showPopup('error', errMessage);
      });
      // Update UI
      document.getElementById('pwd-bitly-pass').value = '';
      btnOauthBitly.disabled = false;
    }
  }).catch((err) => {
    console.error(err);
    showPopup('error', 'Error authenticating with Bit.ly: ' + err.message);
  });
}

// MAIN
window.addEventListener('load', initialize);
