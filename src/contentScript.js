import { defaultSettings } from './defaultSettings.js';

let useShortUrlCache = true;
let linkSelector = 'a';

export function initialise(contentScriptSettings = defaultSettings, cacheShortUrls = true, overrideLinkSelector) {
  settings = contentScriptSettings;
  useShortUrlCache = cacheShortUrls; // TODO - migrate to settings object (synced storage)
  if (overrideLinkSelector) {
    linkSelector = overrideLinkSelector;
  }

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

  // Attach mouse enter listeners
  // NB: Should be done after overrideLinkSelector is set, so we can use the correct selector.
  attachMouseEnterListeners();

  // Attach tooltip to DOM (reducing any future mouseover delays, as the tooltip will already be attached to the DOM)
  document.body.appendChild(tooltip); // TODO refactor into a shared function (shares with `showTooltip()`)
}

// Cache settings
let settings;
let winDimensions;
// Init the tooltip
const tooltipContainerID = 'cl-container';
// TODO migrate to a single image element with multiple classes. Will need a map of alt text to class name.
const tooltip = new DOMParser().parseFromString(`
  <div id="${tooltipContainerID}">
    <span role="img" aria-label="Secure protocol used in link" class="cl-icon cl-icon-padlock-locked"></span>
    <span role="img" aria-label="This is a Mailto link" class="cl-icon cl-icon-email"></span>
    <span role="img" aria-label="This link uses Javascript" class="cl-icon cl-icon-js"></span>
    <span role="img" aria-label="Requesting Full URL" class="cl-icon cl-loading cl-icon-hourglass"></span>
    <span role="img" aria-label="Short URL is not expandable" class="cl-icon cl-icon-link-not-expandable"></span>
    <p class="cl-url"></p>
  </div>`, 'text/html').body.firstElementChild;
const secureIcon = tooltip.querySelector('.cl-icon-padlock-locked');
const emailIcon = tooltip.querySelector('.cl-icon-email');
const jsIcon = tooltip.querySelector('.cl-icon-js');
const loadingIcon = tooltip.querySelector('.cl-icon-hourglass');
const notExpandableIcon = tooltip.querySelector('.cl-icon-link-not-expandable');
const urlText = tooltip.querySelector('.cl-url');
// Timers
let resizeEndTimer; // No native resize end event, so timing our own.

/*
 * Document ready function.
 * `DOMContentLoaded` may fire before script/module has a chance to run, so check before adding a listener.
 * @see https://youmightnotneedjquery.com/#ready
 * @param {function} fn - The function to be executed when the document is ready.
 */
function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  }
}

/*
 * Add an event listener to an element. Allows event delegation of a `selector`
 * element to a parent element, which enables event listening for
 * future/dynamic elements, and is more performant than adding an event
 * listener to each element.
 * @param {string} el - The element to attach the event listener to.
 * @param {string} eventName - The name of the event to listen for.
 * @param {string} selector - The element selector to filter the event target by.
 * @param {function} eventHandler - The function to be executed when the event is fired.
 * @returns {function} The wrapped event handler.
 * @see https://youmightnotneedjquery.com/#on
 * @see https://gomakethings.com/why-event-delegation-is-a-better-way-to-listen-for-events-in-vanilla-js/
 */
function addDelegatedEventListener(el, eventName, selector, eventHandler) {
  const wrappedHandler = (e) => {
    if (!e.target) return;
    const targetElement = e.target.closest(selector);
    if (targetElement) {
      eventHandler.call(targetElement, e);
    }
  };
  // Add the wrapped event handler to the element
  // Note: useCapture is set to true otherwise the
  // event will not be appropriately delegated.
  el.addEventListener(eventName, wrappedHandler, true);
  return wrappedHandler;
}

/*
 * Add a delegated event listener to an element and pass additional parameters
 * to the event handler. This is done by wrapping the provided eventHandler.
 * Enables clean removal of event listener in the future by returning the
 * wrapped event handler.
 * @param {string} el - The element to attach the event listener to.
 * @param {string} eventName - The name of the event to listen for.
 * @param {string} selector - The element selector to filter the event target by.
 * @param {function} eventHandler - The function to be executed when the event is fired.
 * @param {object} params - The parameters to be passed to the event handler.
 * @returns {function} The wrapped event handler. Useful for tracking removal of event listeners.
 */
function addDelegatedEventListenerWithParams(el, eventName, selector, eventHandler, params) {
  const wrappedHandler = (e) => {
    eventHandler(e, params);
  };
  addDelegatedEventListener(el, eventName, selector, wrappedHandler);
  return wrappedHandler;
}

// Main - Document ready
ready(function() {
  // Listen for window size changes
  addEventListener('resize', () => {
    clearTimeout(resizeEndTimer);
    resizeEndTimer = setTimeout(cacheWinDimensions, 250);
  });
  // Store initial window dimensions
  cacheWinDimensions();
});

function attachMouseEnterListeners() {
  // Attach and detach the tooltip -- this works for current and dynamically (future) created elements
  addDelegatedEventListener(document.body, 'mouseenter', linkSelector, function() {
    if (!this.href) {
      return; // Ignore elements with no href attr (empty href still report a URL though)
    }
    switch (this.protocol) {
      // eslint-disable-next-line no-script-url
      case 'javascript:':
        if (settings.displayJavascriptLinks) {
          showTooltip(this, '&#x200B;', false, true, false);
        }
        break;
      case 'mailto:':
        if (settings.displayMailtoLinks) {
          showTooltip(this, buildStringHtmlColouredHostname(settings.cssColorMailto, this.href.substring(7, this.href.length)), false, false, true);
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
        if (displayingExternalDomainsOnly(this.hostname)) {
          let urlToDisplay = '';
          // TODO (?) - move to more appropriate position (does this need to be before, during , or after URL dissection? If a short URL is detected, do we cancel URL dissection below until we receive the full long URL from any APIs?
          const isShortAndExpandable = expandShortUrl(this);
          if (isShortAndExpandable.isShort) {
            if (typeof isShortAndExpandable.quickExpand !== 'undefined' && isShortAndExpandable.quickExpand !== '') {
              loadingIcon.style.display = 'none';
              notExpandableIcon.style.display = 'none';
              let tmpUrl;
              try {
                tmpUrl = new URL(isShortAndExpandable.quickExpand);
              } catch (err) {
                break;
              }
              urlToDisplay = formatDissectedURL(tmpUrl.href, tmpUrl.protocol, tmpUrl.username, tmpUrl.password, tmpUrl.hostname, tmpUrl.port, tmpUrl.pathname, tmpUrl.search, tmpUrl.hash);
            } else if (isShortAndExpandable.toExpand) {
              loadingIcon.style.display = 'inline';
              notExpandableIcon.style.display = 'none';
            } else {
              loadingIcon.style.display = 'none';
              notExpandableIcon.style.display = 'inline';
            }
          } else if (!settings.displayOnKnownShortUrlDomainsOnly) {
            loadingIcon.style.display = 'none';
            notExpandableIcon.style.display = 'none';
          } else {
            break;
          }

          if (!urlToDisplay) {
            urlToDisplay = formatDissectedURL(this.href, this.protocol, this.username, this.password, this.hostname, this.port, this.pathname, this.search, this.hash);
          }

          // TODO - check if link uses JS (in addition to the href attr), and if the user has set the option to show it
          let isSecureIcon = false;
          if (this.protocol && this.protocol === 'https:') {
            isSecureIcon = true;
          } else {
            isSecureIcon = false;
          }

          showTooltip(this, urlToDisplay, isSecureIcon, false, false);
        }
        break;
    }
  });
}

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
  if (settings.displayDomainOnly) {
    if (hostname) {
      urlToDisplay += buildStringHtmlColouredHostname(settings.cssColorDomainText, hostname);
    }
  } else {
    if (settings.displayUrlScheme && protocol) {
      urlToDisplay += protocol + (href.startsWith(protocol + '//') ? '//' : '');
    }
    if (settings.displayUrlAuth >= 1 && username) {
      urlToDisplay += username;
      if (settings.displayUrlAuth >= 2 && password) {
        if (settings.displayUrlAuth >= 3) {
          urlToDisplay += ':' + password.replace(/./g, '*');
        } else {
          urlToDisplay += ':' + password;
        }
      }
      urlToDisplay += '@';
    }
    if (settings.displayUrlHostname && hostname) {
      urlToDisplay += buildStringHtmlColouredHostname(settings.cssColorDomainText, hostname);
    }
    if (settings.displayUrlPort && port && port !== '') {
      urlToDisplay += ':' + port;
    }
    if (settings.displayUrlPath && pathname) {
      urlToDisplay += pathname;
    }
    if (settings.displayUrlQuery && search) {
      urlToDisplay += search;
    }
    if (settings.displayUrlFragment && hash) {
      urlToDisplay += hash;
    }
  }
  return urlToDisplay;
}

function showTooltip(elem, urlToDisplay, isSecureIcon, isJS, isMailto) {
  // When compiling the urlToDisplay sent to this function (for https, http, file), some HREFs (in combination with user options) may return an empty string.
  if (urlToDisplay === undefined || urlToDisplay.trim() === '') {
    return;
  }

  // Attach mouse move event to track cursor position (for tooltip positioning)
  const hasTooltipAttr = elem.title !== undefined && elem.title !== '';
  // TODO - not necessary if using absolute corner positioning in options
  const wrappedMouseRelativeCursorPosition = addDelegatedEventListenerWithParams(window, 'mousemove', linkSelector, mouseRelativeCursorPosition, {
    hasTooltipAttr,
  });
  // Show the tooltip - check if already attached to document, then attach if not.
  if (document.getElementById(tooltipContainerID) === null) {
    // Initial attach/Re-attach element - lazily attach element upon mouse-over of link.
    // Some sites detach this element dynamically (i.e. after page load), so check on each mouseover.
    // Attaching at bottom of document reduces chance of CSS inheritance issues, and stops need to attach/detach after each event.
    document.body.appendChild(tooltip);
  }
  // Update tooltip content
  urlText.innerHTML = urlToDisplay;
  secureIcon.style.display = isSecureIcon ? 'inline-block' : 'none';
  emailIcon.style.display = isMailto ? 'inline' : 'none';
  if (isJS) {
    jsIcon.style.display = 'inline';
    if (urlToDisplay === '&#x200B;') {
      jsIcon.style.marginRight = '-2px';
    } else {
      jsIcon.style.marginRight = '3px';
    }
  } else {
    jsIcon.style.display = 'none';
  }

  // Show the Tooltip
  tooltip.clientHeight; // Forces the browser to "reflow"
  tooltip.style.transitionDuration = settings.durationFadeIn + 'ms';
  tooltip.style.opacity = 1; // Transition to new opacity value

  // Hide the Tooltip when mouse leaves link.
  // Add a one-time mouseleave event to the link, to cancel additional mousemove tracking when not over a link.
  elem.addEventListener('mouseleave', () => {
    // Cancel additional mousemove tracking when not over a link.
    window.removeEventListener('mousemove', wrappedMouseRelativeCursorPosition);
    // Hide the Tooltip.
    tooltip.clientHeight; // Forces the browser to "reflow" (redraw)
    tooltip.style.transitionDuration = settings.durationFadeOut + 'ms';
    tooltip.style.opacity = 0; // Transition to new opacity value
  }, { once: true });
}

/**
  *
  * @param {object} settings - All settings to be applied to the tooltip.
  */
function applyAllSettingToTooltip(allSettings) {
  for (const key in allSettings) {
    if (Object.hasOwn(allSettings, key)) {
      applySettingToTooltip(key, allSettings[key]);
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
      applySettingToTooltip(key, changes[key].newValue);
    }
  }
}

function applySettingToTooltip(param, value) {
  switch (param) {
    case 'background':
    case 'border':
    case 'border-radius':
      tooltip.style[param] = value;
      break;
    case 'durationDelay':
      tooltip.style['transition-delay'] = value + 'ms';
      break;
    case 'font-family':
    case 'font-size':
      urlText.style[param] = value;
      break;
    case 'cssColorBorder':
      tooltip.style.borderColor = value;
      break;
    case 'cssColorGeneralURLText':
      urlText.style.color = value;
      break;
  }
}

function cacheWinDimensions() {
  winDimensions = {
    h: window.innerHeight,
    w: window.innerWidth,
  };
}

function mouseRelativeCursorPosition(e, params) {
  // Determine if tooltip breaches the window
  let top;
  if ((e.clientY + tooltip.offsetHeight + 50) <= winDimensions.h) {
    // Elements with existing default tooltips will cover ours, so adjust position.
    if (params.hasTooltipAttr) {
      top = (e.clientY - (tooltip.offsetHeight / 2)); // Avoid "real" tooltips obscuring my tooltip
    } else {
      top = (e.clientY + 20);
    }
  } else {
    top = (e.clientY - tooltip.offsetHeight - 20);
  }
  let left;
  if ((e.clientX + tooltip.offsetWidth + 50) <= winDimensions.w) {
    left = (e.clientX + 20);
  } else {
    left = (e.clientX - tooltip.offsetWidth - 20);
  }
  // Set position
  tooltip.style.top = top + 'px';
  tooltip.style.left = left + 'px';
}

const dataParamNameSourceShortURL = 'sourceShortUrl';

function expandShortUrl(sourceElem, quickExpandUrl = '', bRecursiveIsShort = false) {
  if (sourceElem.pathname && sourceElem.pathname !== '/') { // No need to request full URL if no pathname (or just '/') present.
    // Cache the original short URL, so we can check if the user has moved on to another link before we receive the response.
    const tooltipDataShortUrl = tooltip.dataset[dataParamNameSourceShortURL];
    if (tooltipDataShortUrl !== sourceElem.href) {
      tooltip.dataset[dataParamNameSourceShortURL] = sourceElem.href;
    }
    // Determine short URL service
    switch (sourceElem.hostname) {
      case 'bit.ly':
      case 'j.mp':
      case 'goo.gl':
        // Request URL Expansion
        window.postMessage({ type: 'FROM_PAGE_SHORT_URL', message: { shortURL: sourceElem.href, checkCache: useShortUrlCache } }, '*');
        return { isShort: true, toExpand: true, quickExpand: quickExpandUrl };
      case 't.co':
        if (window.location.hostname === 'twitter.com') { // only guarantee correct URL if on Twitter.com
          try {
            // Attempt to expand the source behind the t.co link (unless it is a further 't.co' link; avoids indefinite recursive loops).
            let expandedUrl;
            if (sourceElem.dataset && sourceElem.dataset.expandedUrl) {
              expandedUrl = new URL(sourceElem.dataset.expandedUrl);
            } else { // Some t.co links do not have a expandedUrl attr, but may have URL in 'title' attr.
              expandedUrl = new URL(sourceElem.title);
            }
            // Avoid recursive t.co expansions.
            if (expandedUrl.hostname !== 't.co') {
              return expandShortUrl(expandedUrl, expandedUrl.href, true); // Give it the new URL obj, not the source element
            }
          } catch (err) { // Catch errors thrown by 'new URL()' if URL is malformed.
            console.error(err);
            return { isShort: true, toExpand: false, quickExpand: quickExpandUrl }; // TODO indicate an error
          }
          return { isShort: true, toExpand: true, quickExpand: sourceElem.dataset.expandedUrl };
        }
        return { isShort: true, toExpand: false, quickExpand: quickExpandUrl };
    }
  }
  return { isShort: bRecursiveIsShort, toExpand: false, quickExpand: quickExpandUrl };
}

function receiveExpandedURL(response) {
  // Check if the source short URL is the same as the one currently being hovered over (i.e., tooltip still waiting for response)
  if (tooltip.dataset[dataParamNameSourceShortURL] === response.source.url) {
    if (response.ignore || response.result.error) {
      // Disable rotating loading image
      loadingIcon.style.display = 'none';
      notExpandableIcon.style.display = 'inline';
    } else {
      const tmpUrl = new URL(response.result.longUrl);
      urlText.innerHTML = formatDissectedURL(tmpUrl.href, tmpUrl.protocol, tmpUrl.username, tmpUrl.password, tmpUrl.hostname, tmpUrl.port, tmpUrl.pathname, tmpUrl.search, tmpUrl.hash);
      loadingIcon.style.display = 'none';
      // TODO - Re-check tooltip position to ensure it doesn't not exceed window bounds
    }
  }
}
