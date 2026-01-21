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

// Expose ActionBadge for test runner evaluations in the service worker context
if (typeof globalThis !== 'undefined') {
  globalThis.ActionBadge = ActionBadge;
}
