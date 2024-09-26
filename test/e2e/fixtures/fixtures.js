import { test as base, chromium, firefox } from '@playwright/test';
import { connect } from '../../../node_modules/web-ext/lib/firefox/remote.js';
import path from 'path';

const RDP_PORT = 12345;

const extensionPath = {
  // NOTE: chromimum and firefox browserName defined by Playwright. Do not change.
  chromium: path.join(import.meta.dirname, '..', '..', '..', 'dist', 'chrome'),
  firefox: path.join(import.meta.dirname, '..', '..', '..', 'dist', 'firefox'),
};

/**
 * Launches a browser context with an extension loaded.
 * @param {string} browserName The name of the browser to launch.
 * @returns {Promise<import('@playwright/test').BrowserContext>} The browser context with the extension loaded.
 */
async function getBrowserContextWithExtension(browserName) {
  const browserTypes = { chromium, firefox };
  const launchOptions = {
    chromium: {
      headless: false,
      args: [
        // Browser-specific flags
        '--headless=new', // Force headless mode which is compatible with extensions
        `--disable-extensions-except=${extensionPath[browserName]}`,
        `--load-extension=${extensionPath[browserName]}`,
      ],
    },
    firefox: {
      headless: true,
      args: [ '-start-debugger-server', String(RDP_PORT) ],
      firefoxUserPrefs: {
        'devtools.debugger.remote-enabled': true,
        'devtools.debugger.prompt-connection': false,
      },
    },
  };
  // Launch the browsers
  let browserContext;
  if (browserName === 'chromium') {
    // Note: Extensions only work in Chrome / Chromium launched with a persistent context
    browserContext = await browserTypes[browserName].launchPersistentContext(
      '',
      launchOptions[browserName],
    );
  } else if (browserName === 'firefox') {
    browserContext = await browserTypes[browserName].launch(
      launchOptions[browserName],
    );
    // Install the extension into Firefox using the remote debugging protocol (RDP)
    // This is a temporary workaround for Firefox, as Playwright does not yet
    // support installing Firefox extensions:
    // https://github.com/microsoft/playwright/issues/7297#issuecomment-1201240331
    // NOTE: Using RDP ports means only 1 browser instance can listen/connect
    // at a time, so parallel tests are disabled for Firefox only in the
    // playwright config (`fullyParallel: false`).
    const client = await connect(RDP_PORT);
    await client.installTemporaryAddon(extensionPath.firefox);
  }
  return browserContext;
}

export const test = base.test.extend({
  context: async ({ browserName }, use) => {
    const context = await getBrowserContextWithExtension(browserName);
    await use(context);
    await context.close();
  },
  extensionId: async ({ backgroundPage }, use) => {
    // Get extension ID from chromium extension
    // NOTE: other browser's service workers not yet supported by Playwright
    const extensionId = backgroundPage.url().split('/')[2];
    await use(extensionId);
  },
  // Extension's background page, a.k.a. Service Worker (MV3 replaced background pages with Service Workers)
  backgroundPage: async ({ context }, use) => {
    // Get the service worker
    let [ background ] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }
    await use(background);
  },
  optionsPage: async ({ page, extensionId }, use) => {
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await use(page);
  },
});
export const expect = test.expect;
