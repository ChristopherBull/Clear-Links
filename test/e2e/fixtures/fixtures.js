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
        '--headless=new', // Force head-full mode
        `--disable-extensions-except=${extensionPath[browserName]}`,
        `--load-extension=${extensionPath[browserName]}`,
      ],
    },
    firefox: {
      headless: false,
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
  page: async ({ browserName }, use) => {
    const context = await getBrowserContextWithExtension(browserName);
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});
export const expect = test.expect;
