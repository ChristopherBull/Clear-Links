// Default settings values
var defaultSettings = {
	// General Behaviour
	displayExternalDomainsOnly:true,
	displayDomainOnly:true,
		displayUrlScheme:true,
		displayUrlAuth:1, // 0=No auth, 1=Username, 2=username+password, 3=user+masked password
		displayUrlHostname:true,
		displayUrlPort:false,
		displayUrlPath:true,
		displayUrlQuery:false,
		displayUrlFragment:false,
	displayMailtoLinks:true,
	displayJavascriptLinks:true,
	// Position
	relativeToMouse: true,
	// Style - Tooltip
	background: '#294F6D',
	border: '1px solid #5F7F99',
	'border-radius': '3px',
	cssColorBorder: ['border-color', '#5F7F99'],
	cssColorGeneralURLText: ['color', '#808080'],
	// Style - Tooltip:Domain
	cssColorDomainText: ['color', '#BBCCD9'],
	'font-family': 'sans-serif',
	'font-size': 'small',
	// Style - span CSS (no need to specify CSS attr name)
	cssColorMailto: '#BBCCD9',
	// Animation
	durationDelay: 100,
	durationFadeIn: 150,
	durationFadeOut: 200,
	// Oauth tokens
	oauthBitly: '',
};
// Local (not synced) default settings
var defaultSettingsLocal = {
	// Page Activation
	activationFilter:1, // 1=All, 2=Whitelist, 3=Blacklist
	domainWhitelist:[],
	domainBlacklist:[]
};