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

import * as ActionBadge from './action-badge.js';
import * as Permissions from './permissions.js';

// Expose test helpers globally
if (typeof globalThis !== 'undefined') {
  // E2E test runners can check for this flag to confirm they are running
  // in a test build. Supports smoke test scenarios by allowing E2E tests to
  // abort fast if a production build is loaded, rather than a test build.
  globalThis.isTestBuild = true;

  // Expose isolated modules for test runners
  globalThis.ActionBadge = ActionBadge;
  globalThis.Permissions = Permissions;
}
