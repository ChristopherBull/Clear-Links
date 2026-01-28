/**
 * Test Helpers for Background Service Worker
 *
 * This module is only included in test builds.
 * It exposes internal modules on globalThis to enable E2E test runners to
 * interact with service worker code that cannot be imported directly due to
 * context isolation.
 *
 * Not for inclusion in production builds.
 * @see ./README.md for more information.
 */

// Expose test helpers globally
if (typeof globalThis !== 'undefined') {
  // E2E test runners can check for this flag to confirm they are running
  // in a test build. Supports smoke test scenarios by allowing E2E tests to
  // abort fast if a production build is loaded, rather than a test build.
  globalThis.isTestBuild = true;

  // This code captures the message handler registered by background.js via
  // browser.runtime.onMessage.addListener, allowing E2E tests to invoke the
  // handler directly (simulating browser.runtime.sendMessage) without needing
  // to send real extension messages, thus enabling isolated and controlled testing.
  // This also then allows background/service workers to be correctly
  // instrumented for coverage reports.
  (() => {
    if (!globalThis.browser?.runtime?.onMessage?.addListener) return;

    const originalAddListener = globalThis.browser.runtime.onMessage.addListener;
    let capturedHandler;

    globalThis.browser.runtime.onMessage.addListener = (fn, ...rest) => {
      capturedHandler = fn;
      return originalAddListener.call(globalThis.browser.runtime.onMessage, fn, ...rest);
    };

    globalThis.clearLinksTestHooks = {
      get runtimeMessageHandler() {
        return capturedHandler;
      },
      async sendRuntimeMessage(request, sender) {
        if (!capturedHandler) {
          throw new Error('runtime handler not registered');
        }
        return await new Promise((resolve) => {
          capturedHandler(request, sender, resolve);
        });
      },
    };
  })();
}
