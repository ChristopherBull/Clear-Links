// Default settings values
export const defaultSettings = {
  // General Behaviour
  'displayExternalDomainsOnly': true,
  'displayOnKnownShortUrlDomainsOnly': false,
  'displayDomainOnly': true,
  'displayUrlScheme': true,
  'displayUrlAuth': 1, // 0=No auth, 1=Username, 2=username+password, 3=user+masked password
  'displayUrlHostname': true,
  'displayUrlPort': false,
  'displayUrlPath': true,
  'displayUrlQuery': false,
  'displayUrlFragment': false,
  'displayMailtoLinks': true,
  'displayJavascriptLinks': false,
  // Position
  'relativeToMouse': true,
  // Style - Tooltip
  'theme': '1', // Light theme
  // Style - div
  'background': '#ffffff',
  'border': '1px solid #A2A0A0',
  'border-radius': '3px',
  'cssColorBorder': '#A2A0A0',
  // Style - icon
  'cssBackgroundColorIcon': '#808080',
  // Style - p
  'cssColorGeneralURLText': '#dddddd',
  'font-family': 'sans-serif',
  'font-size': 'small',
  // Style - span Domain
  'cssColorDomainText': '#808080',
  // Style - span MailTo
  'cssColorMailto': '#808080',
  // Animation
  'durationDelay': 100,
  'durationFadeIn': 150,
  'durationFadeOut': 200,
};
// Local (not synced) default settings
export const defaultSettingsLocal = {
  // Page Activation - size of filter list may exceed storage limits in sync, so must be local, not synced.
  activationFilter: 1, // 1=All, 2=Allowlist, 3=Denylist
  // TODO deprecate name and migrate to allowlist (create a check on startup to migrate old settings)
  domainWhitelist: [],
  domainBlacklist: [],
  // Oauth tokens - requires signing in and authorising accounts, so must be stored locally, not synced.
  OAuthBitLy: { enabled: false, token: '' },
  // Offline mode - follows `defaultSettings` schema, but locally stored, if sync storage is unavailable.
  syncOffline: defaultSettings,
};
