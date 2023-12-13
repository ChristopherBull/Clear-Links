// Default settings values
export const defaultSettings = {
  // General Behaviour
  displayExternalDomainsOnly: true,
  displayOnKnownShortUrlDomainsOnly: false,
  displayDomainOnly: true,
  displayUrlScheme: true,
  displayUrlAuth: 1, // 0=No auth, 1=Username, 2=username+password, 3=user+masked password
  displayUrlHostname: true,
  displayUrlPort: false,
  displayUrlPath: true,
  displayUrlQuery: false,
  displayUrlFragment: false,
  displayMailtoLinks: true,
  displayJavascriptLinks: false,
  // Position
  relativeToMouse: true,
  // Style - Tooltip
  theme: '1', // Light theme
  // Style - div
  background: '#ffffff',
  border: '1px solid #A2A0A0',
  'border-radius': '3px',
  cssColorBorder: '#A2A0A0', // border-color
  // Style - p
  cssColorGeneralURLText: '#dddddd', // color
  'font-family': 'sans-serif',
  'font-size': 'small',
  // Style - span Domain
  cssColorDomainText: '#808080', // color
  // Style - span MailTo
  cssColorMailto: '#808080', // color
  // Animation
  durationDelay: 100,
  durationFadeIn: 150,
  durationFadeOut: 200
  // oauthBitly:'', // TODO - moved and refactored to local storage
};
// Local (not synced) default settings
export const defaultSettingsLocal = {
  // Page Activation - size of filter list may exceed storage limits in sync, so must be local, not synced.
  activationFilter: 1, // 1=All, 2=Whitelist, 3=Blacklist
  domainWhitelist: [],
  domainBlacklist: [],
  // Oauth tokens - requires signing in and authorising accounts, so must be stored locally, not synced.
  OAuthGooGl: { enabled: false },
  OAuthBitLy: { enabled: false, token: '' }
};
