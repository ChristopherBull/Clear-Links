// Cache settings
var settings;
// Init the tooltip
var tooltip = $($.parseHTML("<div style='all:initial;position:fixed;top:0;left:0;z-index:9999;max-width:30em;padding:4px 5px;display:none;'><img src='" + chrome.extension.getURL("img/green-padlock.png") + "' alt='Secure protocol used in link' style='float:left;display:none;width:14px;height:14px;margin-top:2px;margin-right:3px;'></img><img src='" + chrome.extension.getURL("img/email-icon.png") + "' alt='This is a Mailto link' style='float:left;display:none;margin-top:2px;margin-right:3px;'></img><img src='" + chrome.extension.getURL("img/JS-icon.png") + "' alt='This link uses Javascript' style='float:left;display:none;margin-top:2px;margin-right:3px;'></img><p style='all:initial;float:none;margin:0 2px 0 0;word-wrap:break-word;'></p></div>"));
var secure = tooltip.children().first();
var emailIcon = secure.next();
var jsIcon = emailIcon.next();
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
					showTooltip("&#x200B;", false, true, false);
				}
				break;
			case 'mailto:':
				if(settings.displayMailtoLinks){
					showTooltip("mailto:<span style='color:" + settings.cssColorMailto + ";'>" + this.href.substring(7, this.href.length) + "</span>", false, false, true);
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
				if(((settings.displayExternalDomainsOnly && this.hostname != location.hostname) || !settings.displayExternalDomainsOnly)) 
				{
					var urlToDisplay = "";
					var isSecure = false;
					if(this.protocol && this.protocol == "https:"){
						isSecure = true;
					}
					else{
						isSecure = false;
					}
					if(settings.displayDomainOnly){
						if(this.hostname){
							urlToDisplay += "<span style='color:" + settings.cssColorDomainText[1] + ";'>" + this.hostname + "</span>";
						}
					}
					else{
						if(settings.displayUrlScheme && this.protocol){
							urlToDisplay += this.protocol
								+ (this.href.startsWith(this.protocol + "//") ? "//" : "");
						}
						if(settings.displayUrlAuth >= 1 && this.username){
							urlToDisplay += this.username;
							if(settings.displayUrlAuth >= 2 && this.password){
								if(settings.displayUrlAuth >= 3){
									urlToDisplay += ':' + this.password.replace(/./g, '*');
								}
								else{
									urlToDisplay += ':' + this.password;
								}
							}
							urlToDisplay += '@';
						}
						if(settings.displayUrlHostname && this.hostname){
							urlToDisplay += "<span style='color:" + settings.cssColorDomainText[1] + ";'>" + this.hostname + "</span>";
						}
						if(settings.displayUrlPort && this.port && this.port != ""){
							urlToDisplay += ":" + this.port;
						}
						if(settings.displayUrlPath && this.pathname){
							urlToDisplay += this.pathname;							
							/*if(this.host + this.path == location.host + location.path){
								console.log("Same page");
							}*/
						}
						if(settings.displayUrlQuery && this.search){
							urlToDisplay += this.search;
						}
						if(settings.displayUrlFragment && this.hash){
							urlToDisplay += this.hash;
							// Bookmark only links ('#')
							/*if(this.href == window.location.href + '#'){
								showTooltip('#', false, false, false);
							}*/
						}
					}
					
					// TODO - check if link uses JS, and if the user has set the option to show it
					var isJS = false;
					
					showTooltip(urlToDisplay, isSecure, isJS, false);
				}
				break;
		}
	})
	.on('mouseleave', 'a', function(e){
		hideTooltip();
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

function showTooltip(urlToDisplay, isSecure, isJS, isMailto/*, elemToAttachTo*/){
	// When compiling the urlToDisplay sent to this function (for https, http, file), some HREFs (in combination with user options) may return an empty string.
	if(urlToDisplay === undefined || urlToDisplay.trim() == ""){
		return;
	}
	
	// Attach mouse move event
	// TODO - not necessary if using absolute corner positioning in options
	$(window).mousemove(mouseRelativePosition);
	// Show the tooltip
	if (!$.contains(document, tooltip[0])) { // Fast check
		// Initial attach/Re-attach element - lazilly attach element. Some sites detach this element dynamically (i.e. after page load), so fast check on each mouseover.
		$(document.body).append(tooltip); // Attaching at bottom of document reduces chance of CSS inheritance issues, and stops need to attach/detach after each event.
	}
	domain.html(urlToDisplay);
	secure.css("display", (isSecure ? "inline" : "none"));
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
	tooltip.finish(); // Stop all animations on other elements
	tooltip
		.delay(settings.durationDelay)
		.fadeIn(settings.durationFadeIn)
		.css("width", "auto"); // Run at start of animation, not after the fade animation.
}

function hideTooltip(){
	$(window).unbind("mousemove", mouseRelativePosition);
	tooltip.stop().fadeOut(settings.durationFadeOut);
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

function mouseRelativePosition(e){
	// Determine if tooltip breaches the window
	var top;
	if((e.clientY + tooltip.height() + 50) <= winDimensions.h){
		top = (e.clientY + 20);
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