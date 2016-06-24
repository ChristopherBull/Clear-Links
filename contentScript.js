// Cache settings
var settings;
// Init the tooltip
var tooltip = $($.parseHTML("<div id='ClContainer'><img src='" + chrome.extension.getURL("images/green-padlock.png") + "' alt='Secure protocol used in link' class='ClIcon'></img><img src='" + chrome.extension.getURL("images/email-icon.png") + "' alt='This is a Mailto link' class='ClIcon'></img><img src='" + chrome.extension.getURL("images/JS-icon.png") + "' alt='This link uses Javascript' class='ClIcon'></img><img src='" + chrome.extension.getURL("images/hourglass.svg") + "' alt='Requesting Full URL' class='ClIcon ClLoading'></img><img src='" + chrome.extension.getURL("images/BrokenGlass.png") + "' alt='Unexpandable Short URL' class='ClIcon'></img><p id='ClURL'></p></div>"));
var secureIcon = tooltip.children().first();
var emailIcon = secureIcon.next();
var jsIcon = emailIcon.next();
var loadingIcon = jsIcon.next();
var unexpandableIcon = loadingIcon.next();
var domain = tooltip.children().last();
// Timers
var resizeEndTimer; // No native resize end event, so timing our own.

// Load settings
chrome.storage.sync.get(defaultSettings, function(items){
	settings = items;	
	for (var key in settings) {
		if (settings.hasOwnProperty(key)) {
			applySettingToTooltip(key, settings[key]);
		}
	}
});
// Listen for options changes
chrome.storage.onChanged.addListener(function(changes, namespace){
	for (var key in changes) {
		if (changes.hasOwnProperty(key) && changes[key].newValue !== undefined) {
			settings[key] = changes[key].newValue;
			applySettingToTooltip(key, settings[key]);
		}
	}
});

// Main - Document ready
$(function() {
	// Listen for window size changes
	$(window).on('resize', function() {
		clearTimeout(resizeEndTimer);
		resizeEndTimer = setTimeout(cacheWinDimensions, 250);
	});
	// Store initial window dimensions
	cacheWinDimensions();
	
	// Attach and detach the tooltip; on() works for current and dynamically (future) created elements
	$(document.body).on('mouseenter', 'a', function(e){
		if(this.href == ""){
			return; // Ignore elements with no href attr (empty href still report a URL though)
		}
		switch(this.protocol){
			case 'javascript:':
				if(settings.displayJavascriptLinks){
					showTooltip(e.target, "&#x200B;", false, true, false);
				}
				break;
			case 'mailto:':
				if(settings.displayMailtoLinks){
					showTooltip(e.target, "mailto:<span style='color:" + settings.cssColorMailto + ";'>" + this.href.substring(7, this.href.length) + "</span>", false, false, true);
				}
				break;
			case 'https:':
			case 'http:':
			case 'file':
			default:
				
				//1=external domains
				//2=external page (may be same domain)
				//3=any page
				
				// Determine if only showing external domains
				if(displayingExternalDomainsOnly(this.hostname)){
					// TODO (?) - move to more appropriate position (does this need to be before, during , or after URL disection? If a short URL is detected, do we cancel URL disection below until we receive the full long URL from any APIs?
					var isShortAndExpandable = expandShortUrl(this.href, this.hostname, this.pathname);
					if(isShortAndExpandable.isShort){
						if(isShortAndExpandable.toExpand){
							loadingIcon.css("display", "inline");
							unexpandableIcon.css("display", "none");
						}else{
							loadingIcon.css("display", "none");
							unexpandableIcon.css("display", "inline");
						}
					}else{
						loadingIcon.css("display", "none");
						unexpandableIcon.css("display", "none");
					}
					
					var urlToDisplay = formatDisectedURL(this.href, this.protocol, this.username, this.password, this.hostname, this.port, this.pathname, this.search, this.hash);
					
					// TODO - check if link uses JS (in addition to the href attr), and if the user has set the option to show it
					var issecureIcon = false;
					if(this.protocol && this.protocol == "https:"){
						issecureIcon = true;
					}else{
						issecureIcon = false;
					}
					var isJS = false;
					var titleAttr = $(this).attr('title');
					var hasTitle = titleAttr !== undefined && titleAttr != "";
					showTooltip(e.target, urlToDisplay, issecureIcon, isJS, false, hasTitle);
				}
				break;
		}
	});

	// Attach and detach the tooltip on() <form> <buttons>
	/*$(document.body).on('mouseenter', 'button', function(e){
		showTooltip("btn");
	})
	.on('mouseleave', 'button', function(e){
		hideTooltip();
	});*/

	/*// Attach and detach the tooltip on() <form> <buttons>
	//$(document.body).on('mouseenter', 'input[type="submit"]', function(e){
	//$(document.body).on('mouseenter', ':submit', function(e){
	$(document.body).on('mouseenter', 'input', function(e){
		console.log("Submit button/input");
		showTooltip("input submit btn");
	})
	.on('mouseleave', 'input', function(e){
		hideTooltip();
	});*/
	
	/*//$('iframe').load(function(){
	$('#iframeResult').load(function(){
		console.log('iframe loaded');
        $('iframe').contents().find('body').on('mouseenter', 'input', function(e){
			console.log("In iframe: Submit input field");
			showTooltip("input btn");
		})
		.on('mouseleave', 'input', function(e){
			hideTooltip();
		});
    });*/
});

// Determine if only showing external domains
function displayingExternalDomainsOnly(hostname){
	if(((settings.displayExternalDomainsOnly && hostname != location.hostname) || !settings.displayExternalDomainsOnly)){
		return true;
	}else{
		return false;
	}
}

function formatDisectedURL(href, protocol, username, pword, hostname, port, pathname, search, hash){
	var urlToDisplay = "";
	if(settings.displayDomainOnly){
		if(hostname){
			urlToDisplay += "<span style='color:" + settings.cssColorDomainText[1] + ";'>" + hostname + "</span>";
		}
	}
	else{
		if(settings.displayUrlScheme && protocol){
			urlToDisplay += protocol
				+ (href.startsWith(protocol + "//") ? "//" : "");
		}
		if(settings.displayUrlAuth >= 1 && username){
			urlToDisplay += username;
			if(settings.displayUrlAuth >= 2 && pword){
				if(settings.displayUrlAuth >= 3){
					urlToDisplay += ':' + pword.replace(/./g, '*');
				}
				else{
					urlToDisplay += ':' + pword;
				}
			}
			urlToDisplay += '@';
		}
		if(settings.displayUrlHostname && hostname){
			urlToDisplay += "<span style='color:" + settings.cssColorDomainText[1] + ";'>" + hostname + "</span>";
		}
		if(settings.displayUrlPort && port && port != ""){
			urlToDisplay += ":" + port;
		}
		if(settings.displayUrlPath && pathname){
			urlToDisplay += pathname;
		}
		if(settings.displayUrlQuery && search){
			urlToDisplay += search;
		}
		if(settings.displayUrlFragment && hash){
			urlToDisplay += hash;
			// Bookmark only links ('#')
			/*if(href == window.location.href + '#'){
				showTooltip(domElem, '#', false, false, false);
			}*/
		}
	}
	return urlToDisplay;
}

function showTooltip(domElem, urlToDisplay, issecureIcon, isJS, isMailto, hasTooltipAttr){
	// When compiling the urlToDisplay sent to this function (for https, http, file), some HREFs (in combination with user options) may return an empty string.
	if(urlToDisplay === undefined || urlToDisplay.trim() == ""){
		return;
	}
	
	tooltip.finish(); // Stop all animations on other elements
	tooltip
		.delay(settings.durationDelay)
		.fadeIn(settings.durationFadeIn)
		.css("width", "auto"); // Run at start of animation, not after the fade animation.
	
	// Attach mouse move event
	// TODO - not necessary if using absolute corner positioning in options
	$(window).mousemove({'hasTooltipAttr': hasTooltipAttr}, mouseRelativeCursorPosition);
	// Show the tooltip
	if (!$.contains(document, tooltip[0])){ // Fast check
		// Initial attach/Re-attach element - lazilly attach element. Some sites detach this element dynamically (i.e. after page load), so fast check on each mouseover.
		$(document.body).append(tooltip); // Attaching at bottom of document reduces chance of CSS inheritance issues, and stops need to attach/detach after each event.
	}
	domain.html(urlToDisplay);
	secureIcon.css("display", (issecureIcon ? "inline-block" : "none"));
	emailIcon.css("display", (isMailto ? "inline" : "none"));
	if(isJS){
		jsIcon.css("display", "inline");
		if(urlToDisplay == "&#x200B;"){
			jsIcon.css("margin-right", "-2px");
		}
		else{
			jsIcon.css("margin-right", "3px");
		}
	}
	else{
		jsIcon.css("display", "none");
	}
	
	// Attach a specific mouseleave event to the target of the mouseenter event (reduces likelihood of multiuple orphaned tooltips when a site interfers with this extension)
	var localTooltip = tooltip;
	var target = $(domElem);
	function localMouseLeave(e){
		// Remove mouse leave event (avoid events stacking)
		target.off('mouseleave', localMouseLeave);
		// Hide the Tooltip
		$(window).unbind("mousemove", mouseRelativeCursorPosition); // Cancel additional mousemove tracking when not over a link.
		localTooltip.stop().fadeOut(settings.durationFadeOut); // Hide the locally referenced tooltip (in case of some DOM refreshing wizardry).
	}
	target.on('mouseleave', localMouseLeave);
}

function applySettingToTooltip(param, value){
	switch (param) {
		case 'background':
		case 'border':
		case 'border-radius':
			tooltip.css(param, value);
			break;
		case 'font-family':
		case 'font-size':
			domain.css(param, value);
			break;
		case 'cssColorBorder':
			tooltip.css(value[0], value[1]);
			break;
		case 'cssColorGeneralURLText':
			domain.css(value[0], value[1]);
			break;
	}
}

var winDimensions;
function cacheWinDimensions(){
	winDimensions = {
		h : $(window).height(),
		w : $(window).width()
	};
}

function mouseRelativeCursorPosition(e){
	// Determine if tooltip breaches the window
	var top;
	if((e.clientY + tooltip.height() + 50) <= winDimensions.h){
		// Elements with existing default tooltips will cover ours, so adjust position.
		if(e.data.hasTooltipAttr){
			top = (e.clientY);
		}
		else{
			top = (e.clientY + 20);
		}
	}
	else{
		top = (e.clientY - tooltip.height() - 20);
	}
	var left;
	if((e.clientX + tooltip.width() + 50) <= winDimensions.w){
		left = (e.clientX + 20);
	}
	else{
		left = (e.clientX - tooltip.width() - 20);
	}
	// Set position
	tooltip.css({
		"top": top + 'px',
		"left": left + 'px'
	});
}

function expandShortUrl(href, hostname, pathname){
	if(pathname && pathname != "/"){ // No need to request full URL if no pathname (or just '/') present.
		switch (hostname){
			case 'bit.ly':
				if(false){// TODO - Check if we are to expand this short URL in the user options (e.g. is an API key available?)
					return {isShort:true,toExpand:true};
				}else{
					return {isShort:true,toExpand:false};
				}
			case 'goo.gl':
				if(true){
					// Request URL Expansion
					chrome.runtime.sendMessage({shortURL: href}, function(response) {
						if(response.ignore || response.result.error){
							// Disable rotating loading image
							loadingIcon.css("display", "none");
							unexpandableIcon.css("display", "inline");
						}else{
							var tmpUrl = new URL(response.result.longUrl);
							domain.html(formatDisectedURL(tmpUrl.href, tmpUrl.protocol, tmpUrl.username, tmpUrl.pword, tmpUrl.hostname, tmpUrl.port, tmpUrl.pathname, tmpUrl.search, tmpUrl.hash));
							loadingIcon.css("display", "none");
						}
					});
					return {isShort:true,toExpand:true};
				}else{
					return {isShort:true,toExpand:false};
				}
		}
	}
	return {isShort:false,toExpand:false};
}