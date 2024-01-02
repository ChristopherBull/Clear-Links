import { defaultSettings } from './defaultSettings.js';

let useShortUrlCache = true;

export function initialise(contentScriptSettings = defaultSettings, cacheShortUrls = true) {
  settings = contentScriptSettings;
  useShortUrlCache = cacheShortUrls; // TODO - migrate to settings object (synced storage)

  applyAllSettingToTooltip(settings);

  // Setup message passing (between this injected script, content script (proxy), and background script)
  window.addEventListener('message', (event) => {
    // We only accept messages from ourselves
    if (event.source !== window) {
      return;
    }
    // Determine type of event
    if (event.data.type && (event.data.type === 'TO_PAGE_EXPANDED_SHORT_URL')) {
      receiveExpandedURL(event.data.message);
    } else if (event.data.type && (event.data.type === 'TO_PAGE_SYNC_USER_OPTIONS_CHANGED')) {
      applyAllSettingChangesToTooltip(event.data.message);
    }
  }, true);
}

// Cache settings
let settings;
let winDimensions;
// Init the tooltip
const tooltip = $($.parseHTML('<div id="cl-container"><img src="" alt="Secure protocol used in link" class="cl-icon cl-icon-padlock-locked"></img><img src="" alt="This is a Mailto link" class="cl-icon cl-icon-email"></img><img src="" alt="This link uses Javascript" class="cl-icon cl-icon-js"></img><img src="" alt="Requesting Full URL" class="cl-icon cl-loading cl-icon-hourglass"></img><img src="" alt="Short URL is not expandable" class="cl-icon cl-icon-hourglass-broken"></img><p class="cl-url"></p></div>'));
const secureIcon = tooltip.children().first();
const emailIcon = secureIcon.next();
const jsIcon = emailIcon.next();
const loadingIcon = jsIcon.next();
const notExpandableIcon = loadingIcon.next();
const urlText = tooltip.children().last();
// Timers
let resizeEndTimer; // No native resize end event, so timing our own.

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
  $(document.body).on('mouseenter', 'a', function() {
    if(!this.href) {
      return; // Ignore elements with no href attr (empty href still report a URL though)
    }
    switch(this.protocol) {
      case 'javascript:':
        if(settings.displayJavascriptLinks) {
          showTooltip($(this), '&#x200B;', false, true, false);
        }
        break;
      case 'mailto:':
        if(settings.displayMailtoLinks) {
          showTooltip($(this), buildStringHtmlColouredHostname(settings.cssColorMailto, this.href.substring(7, this.href.length)), false, false, true);
        }
        break;
      case 'https:':
      case 'http:':
      case 'file:':
      default:

        // 1=external domains
        // 2=external page (may be same domain)
        // 3=any page

        // Determine if this is an external domain (if only showing external domains), otherwise always true
        if(displayingExternalDomainsOnly(this.hostname)) {
          let urlToDisplay = '';
          // TODO (?) - move to more appropriate position (does this need to be before, during , or after URL dissection? If a short URL is detected, do we cancel URL dissection below until we receive the full long URL from any APIs?
          const isShortAndExpandable = expandShortUrl(this);
          if(isShortAndExpandable.isShort) {
            if(typeof isShortAndExpandable.quickExpand !== 'undefined' && isShortAndExpandable.quickExpand !== '') {
              loadingIcon.css('display', 'none');
              notExpandableIcon.css('display', 'none');
              let tmpUrl;
              try{
                tmpUrl = new URL(isShortAndExpandable.quickExpand);
              } catch(err) {
                break;
              }
              urlToDisplay = formatDissectedURL(tmpUrl.href, tmpUrl.protocol, tmpUrl.username, tmpUrl.password, tmpUrl.hostname, tmpUrl.port, tmpUrl.pathname, tmpUrl.search, tmpUrl.hash);
            }else if(isShortAndExpandable.toExpand) {
              loadingIcon.css('display', 'inline');
              notExpandableIcon.css('display', 'none');
            } else {
              loadingIcon.css('display', 'none');
              notExpandableIcon.css('display', 'inline');
            }
          }else if(!settings.displayOnKnownShortUrlDomainsOnly) {
            loadingIcon.css('display', 'none');
            notExpandableIcon.css('display', 'none');
          } else {
            break;
          }

          if(!urlToDisplay) {
            urlToDisplay = formatDissectedURL(this.href, this.protocol, this.username, this.password, this.hostname, this.port, this.pathname, this.search, this.hash);
          }

          // TODO - check if link uses JS (in addition to the href attr), and if the user has set the option to show it
          let isSecureIcon = false;
          if(this.protocol && this.protocol === 'https:') {
            isSecureIcon = true;
          } else {
            isSecureIcon = false;
          }

          showTooltip($(this), urlToDisplay, isSecureIcon, false, false);
        }
        break;
    }
  });

  // Attach and detach the tooltip on() <form> <buttons>
  /* $(document.body).on('mouseenter', 'button', function(e) {
      showTooltip("btn");
    })
    .on('mouseleave', 'button', function(e) {
      hideTooltip();
    }); */

  /* // Attach and detach the tooltip on() <form> <buttons>
    //$(document.body).on('mouseenter', 'input[type="submit"]', function(e) {
    //$(document.body).on('mouseenter', ':submit', function(e) {
    $(document.body).on('mouseenter', 'input', function(e) {
      console.log("Submit button/input");
      showTooltip("input submit btn");
    })
    .on('mouseleave', 'input', function(e) {
      hideTooltip();
    }); */

  /* //$('iframe').load(function() {
    $('#iframeResult').load(function() {
      console.log('iframe loaded');
      $('iframe').contents().find('body').on('mouseenter', 'input', function(e) {
        console.log("In iframe: Submit input field");
        showTooltip("input btn");
      })
      .on('mouseleave', 'input', function(e) {
        hideTooltip();
      });
    }); */
});

/**
   * Determine if a given hostname is an external domain (if only showing external domains), otherwise always true
   * @param {string} hostname - The hostname of the link being hovered over.
   * @returns {boolean} True if the link is an external domain, or if the user has not set the option to only show external domains.
   */
function displayingExternalDomainsOnly(hostname) {
  return !!((settings.displayExternalDomainsOnly && hostname !== location.hostname) || !settings.displayExternalDomainsOnly);
}

function buildStringHtmlColouredHostname(colour, hostname) {
  return '<span style="color:' + colour + ';">' + hostname + '</span>';
}

function formatDissectedURL(href, protocol, username, password, hostname, port, pathname, search, hash) {
  let urlToDisplay = '';
  if(settings.displayDomainOnly) {
    if(hostname) {
      urlToDisplay += buildStringHtmlColouredHostname(settings.cssColorDomainText, hostname);
    }
  } else {
    if(settings.displayUrlScheme && protocol) {
      urlToDisplay += protocol +
          (href.startsWith(protocol + '//') ? '//' : '');
    }
    if(settings.displayUrlAuth >= 1 && username) {
      urlToDisplay += username;
      if(settings.displayUrlAuth >= 2 && password) {
        if(settings.displayUrlAuth >= 3) {
          urlToDisplay += ':' + password.replace(/./g, '*');
        } else {
          urlToDisplay += ':' + password;
        }
      }
      urlToDisplay += '@';
    }
    if(settings.displayUrlHostname && hostname) {
      urlToDisplay += buildStringHtmlColouredHostname(settings.cssColorDomainText, hostname);
    }
    if(settings.displayUrlPort && port && port !== '') {
      urlToDisplay += ':' + port;
    }
    if(settings.displayUrlPath && pathname) {
      urlToDisplay += pathname;
    }
    if(settings.displayUrlQuery && search) {
      urlToDisplay += search;
    }
    if(settings.displayUrlFragment && hash) {
      urlToDisplay += hash;
      // Bookmark only links ('#')
      /* if(href == window.location.href + '#'){
          showTooltip(domElem, '#', false, false, false);
        } */
    }
  }
  return urlToDisplay;
}

function showTooltip(jqDomElem, urlToDisplay, isSecureIcon, isJS, isMailto) {
  // When compiling the urlToDisplay sent to this function (for https, http, file), some HREFs (in combination with user options) may return an empty string.
  if(urlToDisplay === undefined || urlToDisplay.trim() === '') {
    return;
  }

  tooltip.finish(); // Stop all animations on other elements
  tooltip
    .delay(settings.durationDelay)
    .fadeIn(settings.durationFadeIn)
    .css('width', 'auto'); // Run at start of animation, not after the fade animation.

  // Attach mouse move event
  const titleAttr = jqDomElem.attr('title');
  // TODO - not necessary if using absolute corner positioning in options
  $(window).mousemove({ hasTooltipAttr: titleAttr !== undefined && titleAttr !== '' }, mouseRelativeCursorPosition);
  // Show the tooltip
  if (!$.contains(document, tooltip[0])) { // Fast check
    // Initial attach/Re-attach element - lazily attach element. Some sites detach this element dynamically (i.e. after page load), so fast check on each mouseover.
    $(document.body).append(tooltip); // Attaching at bottom of document reduces chance of CSS inheritance issues, and stops need to attach/detach after each event.
  }
  urlText.html(urlToDisplay);
  secureIcon.css('display', (isSecureIcon ? 'inline-block' : 'none'));
  emailIcon.css('display', (isMailto ? 'inline' : 'none'));
  if(isJS) {
    jsIcon.css('display', 'inline');
    if(urlToDisplay === '&#x200B;') {
      jsIcon.css('margin-right', '-2px');
    } else {
      jsIcon.css('margin-right', '3px');
    }
  } else {
    jsIcon.css('display', 'none');
  }

  // Attach a specific mouseleave event to the target of the mouseenter event (reduces likelihood of multiple orphaned tooltips when a site interferes with this extension)
  const localTooltip = tooltip;
  function localMouseLeave() {
    // Hide the Tooltip
    $(window).unbind('mousemove', mouseRelativeCursorPosition); // Cancel additional mousemove tracking when not over a link.
    localTooltip.stop().fadeOut(settings.durationFadeOut); // Hide the locally referenced tooltip (in case of some DOM refreshing wizardry).
  }
  jqDomElem.one('mouseleave', localMouseLeave); // fire only once (avoid events stacking)
}

/**
   * 
   * @param {object} settings - All settings to be applied to the tooltip.
   */
function applyAllSettingToTooltip(settings) {
  for (const key in settings) {
    if (Object.hasOwn(settings, key)) {
      applySettingToTooltip(key, settings[key]);
    }
  }
}

/**
   * 
   * @param {object} changes - A subset of settings that have been updated.
   */
function applyAllSettingChangesToTooltip(changes) {
  for (const key in changes) {
    if (Object.hasOwn(changes, key) && changes[key].newValue !== undefined) {
      settings[key] = changes[key].newValue;
      applySettingToTooltip(key, changes[key]);
    }
  }
}

function applySettingToTooltip(param, value) {
  switch (param) {
    case 'background':
    case 'border':
    case 'border-radius':
      tooltip.css(param, value);
      break;
    case 'font-family':
    case 'font-size':
      urlText.css(param, value);
      break;
    case 'cssColorBorder':
      tooltip.css('border-color', value);
      break;
    case 'cssColorGeneralURLText':
      urlText.css('color', value);
      break;
  }
}

function cacheWinDimensions() {
  winDimensions = {
    h: $(window).height(),
    w: $(window).width(),
  };
}

function mouseRelativeCursorPosition(e) {
  // Determine if tooltip breaches the window
  let top;
  if((e.clientY + tooltip.height() + 50) <= winDimensions.h) {
    // Elements with existing default tooltips will cover ours, so adjust position.
    if(e.data.hasTooltipAttr) {
      top = (e.clientY - (tooltip.height() / 2)); // Avoid "real" tooltips obscuring my tooltip
    } else {
      top = (e.clientY + 20);
    }
  } else {
    top = (e.clientY - tooltip.height() - 20);
  }
  let left;
  if((e.clientX + tooltip.width() + 50) <= winDimensions.w) {
    left = (e.clientX + 20);
  } else{
    left = (e.clientX - tooltip.width() - 20);
  }
  // Set position
  tooltip.css({
    top: top + 'px',
    left: left + 'px',
  });
}

const dataParamNameSourceShortURL = 'source-short-url';

function expandShortUrl(sourceElem, quickExpandUrl = '', bRecursiveIsShort = false) {
  if(sourceElem.pathname && sourceElem.pathname !== '/') { // No need to request full URL if no pathname (or just '/') present.
    // Cache the original short URL, so we can check if the user has moved on to another link before we receive the response.
    const tooltipDataShortUrl = tooltip.data(dataParamNameSourceShortURL);
    if(tooltipDataShortUrl !== sourceElem.href) {
      tooltip.data(dataParamNameSourceShortURL, sourceElem.href);
    }
    // Determine short URL service
    switch (sourceElem.hostname) {
      case 'bit.ly':
      case 'j.mp':
      case 'goo.gl':
        // Request URL Expansion
        window.postMessage({type : 'FROM_PAGE_SHORT_URL', message : { shortURL: sourceElem.href, checkCache: useShortUrlCache }}, '*');
        return { isShort: true, toExpand: true, quickExpand: quickExpandUrl };
      case 't.co':
        if(window.location.hostname === 'twitter.com') { // only guarantee correct URL if on Twitter.com
          try{
            // Attempt to expand the source behind the t.co link (unless it is a further 't.co' link; avoids indefinite recursive loops).
            let expandedUrl;
            if(sourceElem.dataset && sourceElem.dataset.expandedUrl) {
              expandedUrl = new URL(sourceElem.dataset.expandedUrl);
            } else { // Some t.co links do not have a expandedUrl attr, but may have URL in 'title' attr.
              expandedUrl = new URL(sourceElem.title);
            }
            // Avoid recursive t.co expansions.
            if(expandedUrl.hostname !== 't.co') {
              return expandShortUrl(expandedUrl, expandedUrl.href, true); // Give it the new URL obj, not the source element
            }
          } catch(err) { // Catch errors thrown by 'new URL()' if URL is malformed.
            console.error(err);
            return { isShort: true, toExpand: false, quickExpand: quickExpandUrl }; // TODO indicate an error
          }
          return { isShort: true, toExpand: true, quickExpand: sourceElem.dataset.expandedUrl };
        } else {
          return { isShort: true, toExpand: false, quickExpand: quickExpandUrl };
        }
    }
  }
  return { isShort: bRecursiveIsShort, toExpand: false, quickExpand: quickExpandUrl };
}

function receiveExpandedURL(response) {
  // Check if the source short URL is the same as the one currently being hovered over (i.e., tooltip still waiting for response)
  if(tooltip.data(dataParamNameSourceShortURL) === response.source.url) {
    if(response.ignore || response.result.error) {
      // Disable rotating loading image
      loadingIcon.css('display', 'none');
      notExpandableIcon.css('display', 'inline');
    } else {
      const tmpUrl = new URL(response.result.longUrl);
      urlText.html(formatDissectedURL(tmpUrl.href, tmpUrl.protocol, tmpUrl.username, tmpUrl.password, tmpUrl.hostname, tmpUrl.port, tmpUrl.pathname, tmpUrl.search, tmpUrl.hash));
      loadingIcon.css('display', 'none');
      // TODO - Re-check tooltip position to ensure it doesn't not exceed window bounds
    }
  }
}
