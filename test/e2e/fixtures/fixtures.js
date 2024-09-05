import { test as base, chromium } from '@playwright/test';
import path from 'path';

/**
 * Launches a browser context with an extension loaded.
 * @returns {Promise<import('@playwright/test').BrowserContext>} The browser context with the extension loaded.
 */
async function getBrowserContextWithExtension() {
  // Launch browser context with extension loaded
  const pathToExtension = path.join(import.meta.dirname, '..', '..', '..', 'dist', 'chrome');
  return await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      '--headless=new', // Override the headless parameter
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });
}

export const test = base.test.extend({
  context: async ({}, use) => {
    const context = await getBrowserContextWithExtension();
    await use(context);
    await context.close();
  },
  page: async ({}, use) => {
    const context = await getBrowserContextWithExtension();
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});
export const expect = test.expect;
