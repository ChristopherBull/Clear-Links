import { defaultSettings, defaultSettingsLocal } from './defaultSettings.js';
import { themes } from './themes.js';
import { initAllSharedListeners } from './contentScriptSharedLib.js';
import { Confirm } from './optionsConfirmDialog.js';
import * as ContentScript from './contentScript.js';


/////////////////////
// Vertical Tab UI //
/////////////////////

const allLinks = document.querySelectorAll('.tabs a');
const allTabs = document.querySelectorAll('.tab-content');

const shiftTabs = (linkId) => {
  allTabs.forEach((tab, i) => {
      
    if (tab.id.includes(linkId)) {
      allTabs.forEach((tabItem) => { 
        tabItem.style = `transform: translateY(-${i*500}px);`;
      });
    }
  });
};

allLinks.forEach((elem) => {
  elem.addEventListener('click', function() {
    const linkId = elem.id;
    const hrefLinkClick = elem.href;

    allLinks.forEach((link) => {
      if (link.href == hrefLinkClick){
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    shiftTabs(linkId);
  });
});

// handle proper selection for initial load
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
let btnOauthGoogl;
let btnOauthGooglRevoke;

// Cached retrieved settings values.
let currentSyncSettingsValues = defaultSettings;
let currentLocalSettingsValues = defaultSettingsLocal;

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
  themeSelect = document.getElementById('theme-select');
  // DOM elements - Short URL
  txtBitlyUser = document.getElementById('txtBitlyUser');
  pwdBitlyPass = document.getElementById('pwd-bitly-pass');
  btnOauthBitly = document.getElementById('btn-oauth-bitly');
  btnOauthBitlyForgetToken = document.getElementById('btn-oauth-bitly-forget-token');
  btnOauthBitlyTick = document.getElementById('auth-tick-bitly');
  divOauthBitlyLoggedIn = document.getElementById('divOauthBitlyLoggedIn');
  divOauthBitlyLoggedOut = document.getElementById('divOauthBitlyLoggedOut');
  btnOauthGoogl = document.getElementById('btn-oauth-googl');
  btnOauthGooglRevoke = document.getElementById('btn-oauth-googl-revoke');

  // Event handlers for UI changes only (prior to restoring settings, so UI will update to reflect settings)
  // Domain activation
  document.querySelectorAll('#form-activation-type input').forEach((el) => {
    el.addEventListener('change', () => { showActivationTypeOptions(el.value); });
  });
  [colorBackground, colorBorder, colorGeneralURLText, colorDomainText].forEach((colourPickerElem) => {
    colourPickerElem.addEventListener('change', (event) => {
      document.querySelectorAll('.cl-container').forEach((el) => {
        el.style.background = event.target.value;
      });
      themeSelect.value = '0';
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
  // Event listeners - Style
  themeSelect.addEventListener('change', previewPresetTheme);
  // Event listeners - Animation
  // Real-time validation
  // TODO update these focusout listeners to use change event listeners instead (with a debounce)
  durationDelay.addEventListener('focusout', () => {
    if (durationDelay.value < 0) {
      durationDelay.value = currentSyncSettingsValues.durationDelay;
    }
  });
  durationFadeIn.addEventListener('focusout', () => {
    if (durationFadeIn.value < 0) {
      durationFadeIn.value = currentSyncSettingsValues.durationFadeIn;
    }
  });
  durationFadeOut.addEventListener('focusout', () => {
    if (durationFadeOut.value < 0) {
      durationFadeOut.value = currentSyncSettingsValues.durationFadeOut;
    }
  });
  // Event listeners - Short URLs
  btnOauthBitly.addEventListener('click', () => {
    oauthBitlyBasicAuth(txtBitlyUser.value, pwdBitlyPass.value);
  });
  btnOauthGoogl.addEventListener('click', oauthGoogl);
  btnOauthGooglRevoke.addEventListener('click', oauthGooglRevoke);
  btnOauthBitlyForgetToken.addEventListener('click', async () => {
    try {
      // Update local settings
      await chrome.storage.local.set({
        OAuthBitLy: { enabled: false, token: '' },
      });
      // Update cached copy of local settings
      currentLocalSettingsValues.OAuthBitLy = { enabled: false, token: '' };
      oauthBitlyUpdateUI();
    } catch (err) {
      console.error(err);
      showPopup('error', 'Error forgetting OAuth token: ' + err.message);
    }
  });
  // Event listeners - About page
  document.getElementById('restore').addEventListener('click', restoreSyncedSettings);
  document.getElementById('btn-del-all').addEventListener('click', btnDelAllSavedDataClick);

  // All checkboxes - Save settings on change/click
  document.querySelectorAll('input[type=checkbox].save-on-change').forEach((el) => {
    el.addEventListener('change', async () => {
      try {
      await chrome.storage.sync.set({
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

  // Init previews -- Don't allow the preview links to actually navigate anywhere (just for mouseover demos).
  document.querySelectorAll('.preview-link').forEach((el) => {
    el.addEventListener('click', (event) => {
      event.preventDefault();
      return false;
    });
  });

  // Initialise content script -- for previewing settings within the Options Page
  // Options page should not cache Short URLs to enable user to repeatedly test example short URLs given in the Options page.
  ContentScript.initialise(currentSyncSettingsValues, false, 'a.preview-link');
  // Setup message passing and related listeners.
  initAllSharedListeners();

  // Load additional page content (one-time)
  const manifestData = chrome.runtime.getManifest();
  document.getElementById('about-page-extension-version').textContent = manifestData.version;
  document.getElementById('about-page-extension-description').textContent = manifestData.description;
}

async function restoreSettings() {
  try {
  // Get all the settings, update the UI
    const items = await chrome.storage.sync.get(defaultSettings);
      // Cache the settings
      currentSyncSettingsValues = items;
      // Update the Options menu UI - General
      chkDisplayExternalDomainsOnly.checked = items.displayExternalDomainsOnly;
      chkDisplayDomainOnly.checked = items.displayDomainOnly;
      chkDisplayUrlScheme.checked = items.displayUrlScheme;
      switch (items.displayUrlAuth) {
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
    // Enable/Disable UI elements depending on selected options.
    chkDisplayDomainOnlyChange();

  // Get non-synced settings
    const itemsLocal = await chrome.storage.local.get(defaultSettingsLocal);
      // Cache the local settings
    currentLocalSettingsValues = itemsLocal;
      // Page Activation
    document.querySelector('#activationType' + itemsLocal.activationFilter).checked = true;
    showActivationTypeOptions(itemsLocal.activationFilter);
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
    document.getElementById('lbl-oauth-bitly-token').textContent = itemsLocal.OAuthBitLy.token;

    // Load OAuth tokens to show in the UI which accounts are connected/authorised
    oauthGooglSilent();
    oauthBitlyUpdateUI();
  } catch (err) {
    console.error(err);
    showPopup('error', 'Error restoring settings: ' + err.message);
  }
}

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
      alertElem.querySelector('.message').textContent = message ? message : 'Saved';
      break;
  }
  // Show the alert
  alertElem.style.opacity = 1;
  // Hide the alert after 3 seconds (clearing previous timeout if any)
  if (alertElem.timeout) {
    clearTimeout(alertElem.timeout);
  }
  alertElem.timeout = setTimeout(() => {
    alertElem.style.opacity = 0;
  }, 3000);
}

// Click Events

function btnSaveClick() {
  // Get option values that require validation.
  let iDurationDelay = parseInt(durationDelay.value);
  if (isNaN(iDurationDelay) || !Number.isInteger(iDurationDelay) || iDurationDelay < 0) {
    iDurationDelay = defaultSettings.delay;
    durationDelay.value = iDurationDelay;
  }
  let iDurationFadeIn = parseInt(durationFadeIn.value);
  if (isNaN(iDurationFadeIn) || !Number.isInteger(iDurationFadeIn) || iDurationFadeIn < 0) {
    iDurationFadeIn = defaultSettings.durationFadeIn;
    durationFadeIn.value = iDurationFadeIn;
  }
  let iDurationFadeOut = parseInt(durationFadeOut.value);
  if (isNaN(iDurationFadeOut) || !Number.isInteger(iDurationFadeOut) || iDurationFadeOut < 0) {
    iDurationFadeOut = defaultSettings.durationFadeOut;
    durationFadeOut.value = iDurationFadeOut;
  }

  // Save values
  chrome.storage.sync.set({
    // General
    displayExternalDomainsOnly: chkDisplayExternalDomainsOnly.checked,
    displayDomainOnly: chkDisplayDomainOnly.checked,
    displayUrlScheme: chkDisplayUrlScheme.checked,
    displayUrlAuth: (rdoDisplayUrlNoAuth.checked
      ? 0
      : rdoDisplayUrlUsername.checked
        ? 1
        : rdoDisplayUrlPassword.checked ? 2 : 3),
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
  }, function() { // On saved
    chrome.storage.local.set({
      // Page Activation
      activationFilter: parseInt($('input[name=activationType]:checked', '#form-activation-type').val()),
    }, function() { // On (local only) saved
      // Must occur after both sync and local are set (hence chained callback functions).
      showPopup('saved');
    });
  });
}

/*
 * Restores default settings.
 */
async function restoreSyncedSettings() {
  // Confirm with user before restoring default settings
  Confirm.open({
    title: 'Restore Default Settings',
    message: 'Are you sure you want to restore default settings?<br><br><em>Warning:</em> This will delete all your saved settings and cannot be undone.',
    onOk: async () => {
    // Clear synced settings
    await chrome.storage.sync.clear();
      // Re-Save default sync values
    await chrome.storage.sync.set(defaultSettings);
        // Update Options menu UI
      await restoreSettings();
      showPopup('saved', 'Default settings restored');
    },
  });
}

/*
 * Deletes all saved data.
 */
function btnDelAllSavedDataClick() {
  // Confirm with user before deleting all saved data
  Confirm.open({
    title: 'Delete All Extension Data',
    message: 'Are you sure you want to delete all data in this extension?<br><br><em>Warning:</em> This will delete all your saved settings, local preferences, and authentication credentials. This cannot be undone.',
    onOk: async () => {
    // Clear synced settings
      await chrome.storage.sync.clear();
      // Re-Save default sync values
      await chrome.storage.sync.set(defaultSettings);
        // Clear local settings
      await chrome.storage.local.clear();
          // Re-Save default local values
      await chrome.storage.local.set(defaultSettingsLocal);
            // Update Options menu UI
      await restoreSettings();
      showPopup('success', 'All data deleted.');
    },
  });
}

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

/*
 * Displays or hides additional options depending on the selected activation type.
 * @param {string|int} type - The activation type of the selected radio button. One of: 1='All', 2='Allowlist', 3='Denylist'.
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

function isValidUrl(sUrl) {
  if (!sUrl) {
    return null;
  } else {
    // include URL protocol if not specified (otherwise URL constructor will throw exception)
    if (!sUrl.includes('://')) {
      sUrl = 'http://' + sUrl;
    }
    // Create URL object
    try {
      return new URL(sUrl);
    } catch (err) {
      console.log(err.message);
      throw err;
    }
  }
}

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
    await chrome.storage.local.set({ domainWhitelist: currentLocalSettingsValues.domainWhitelist });
      // Add to Allowlist UI
      const option = document.createElement('option');
      option.text = tmpUrl.hostname;
      listDomainsAllowlist.add(option);
      // Clean UI
      txtDomainsAllowlist.value = '';
  } else {
    showPopup('info', 'Domain already in allowlist');
  }
}

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
  await chrome.storage.local.set({ domainWhitelist: currentLocalSettingsValues.domainWhitelist });
    // Update the UI
  indicesToRemove.forEach((index) => {
    listDomainsAllowlist.remove(index);
  });
}

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
    await chrome.storage.local.set({ domainBlacklist: currentLocalSettingsValues.domainBlacklist });
      // Add to Denylist UI
      const option = document.createElement('option');
      option.text = tmpUrl.hostname;
      listDomainsDenylist.add(option);
      // Clean UI
      txtDomainsDenylist.value = '';
  } else {
    showPopup('info', 'Domain already in denylist');
  }
}

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
  await chrome.storage.local.set({ domainBlacklist: currentLocalSettingsValues.domainBlacklist });
    // Update the UI
  indicesToRemove.forEach((index) => {
    listDomainsDenylist.remove(index);
  });
}

/* Styles */

function previewPresetTheme() {
  let sTheme;
  switch (themeSelect.value) {
    case '0': // Custom
      return;
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
  colorBackground.value = themes[sTheme].div.background;
  colorBorder.value = themes[sTheme].div['border-color'];
  document.querySelectorAll('.cl-container').forEach((el) => {
    el.style.background = colorBackground.value;
    el.style.borderColor = colorBorder.value;
  });
  colorGeneralURLText.value = themes[sTheme].p.color;
  document.querySelectorAll('.cl-url').forEach((el) => {
    el.style.color = colorGeneralURLText.value;
  });
  colorDomainText.value = themes[sTheme].spanDomain.color;
  document.querySelectorAll('.ClDomain').forEach((el) => {
    el.style.color = colorDomainText.value;
  });
}

/* Short URLs */

// Retrieve OAuth tokens for UI purposes silently in the background
function oauthGooglSilent() {
  oauthGoogl(null, true);
}

// Retrieve Google OAuth token
// Fails if "OAuth2 not granted or revoked"
function oauthGoogl(e, silent) {
  // Check if 'silent' is undefined
  if (typeof silent === 'undefined' || silent === null) {
    silent = false; // Default
  }
  // Request Google OAuth
  chrome.identity.getAuthToken({ interactive: !silent }, function() { // If unavailable ("OAuth2 not granted or revoked"), gets user to login; opens a login tab.
    if (chrome.runtime.lastError) {
      console.log('Google OAuth failed (silent: ' + silent + ')');
      if (currentLocalSettingsValues.OAuthGooGl.enabled) {
        chrome.storage.local.set({ OAuthGooGl: { enabled: false } });
      }
      // TODO
      // Update UI
      btnOauthGoogl.disabled = false;
      btnOauthGooglRevoke.style.display = 'none';
    } else {
      if (!currentLocalSettingsValues.OAuthGooGl.enabled) {
        chrome.storage.local.set({ OAuthGooGl: { enabled: true } });
      }
      // Update UI - Show Auth token to user
      btnOauthGoogl.disabled = true;
      btnOauthGooglRevoke.style.display = 'inherit';
      document.getElementById('auth-tick-googl').className = 'auth-tick';
      // DEBUG ONLY - Test Auth by expanding an example URL
      /* chrome.runtime.sendMessage({shortURL: 'http://goo.gl/fbsS', urlHostname: 'goo.gl'}, function(response) {
        if(response.ignore || response.result.error){
          console.log("Problem");
        } else {
          console.log(response.result.longUrl);
        }
      }); */
    }
  });
}

// Revoke the Clear Links' OAuth token for the user's Google account
function oauthGooglRevoke() {
  chrome.identity.getAuthToken({ interactive: false }, function(currentToken) {
    if (chrome.runtime.lastError) {
      // TODO
    } else {
      // Remove the local cached token
      chrome.identity.removeCachedAuthToken({ token: currentToken }, function() {});
      // Make a request to revoke token in the server
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' + currentToken);
      xhr.send();

      // Update local storage
      chrome.storage.local.set({ OAuthGooGl: { enabled: false } });

      // Update UI.
      btnOauthGoogl.disabled = false;
      btnOauthGooglRevoke.style.display = 'none';
      document.getElementById('auth-tick-googl').className = 'auth-tick-hidden';
    }
  });
}

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

function oauthBitlyBasicAuth(userID, userSecret) {
  // Update UI (logging in)
  btnOauthBitly.disabled = true;
  // HTTP Basic Authentication Flow (with hashed username and password)
  // Note 1: Unable to use "Resource Owner Credentials Grants" as "client_secret" is not secret in a public Chrome extension
  // Note 2: Unable to use "OAuth Web Flow", as it requires a "redirect_uri"; unable to get BitLy's implementation to work with Chrome Extensions' Options' pages. Also requires "client_secret" (see Note 2 for details)
  fetch('https://api-ssl.bitly.com/oauth/access_token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(userID + ':' + userSecret),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then(function (response) {
    if (response.ok) {
      // On success - "HTTP Basic Authentication Flow" response (access token) is a String, not an Object.
      response.text().then(function (txtResponse) {
        chrome.storage.local.set({
          OAuthBitLy: { enabled: true, token: txtResponse },
        }, function() { // On saved
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
      response.json().then(function (jsonResponse) {
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
