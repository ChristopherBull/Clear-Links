# Copilot Instructions for Clear Links

## Architecture Overview

**Clear Links** is a Manifest V3 browser extension (Chrome/Firefox) that displays link destination tooltips. The architecture has three distinct execution contexts:

1. **Background Service Worker** ([src/background.js](../src/background.js)): Manages settings via `browser.storage.sync` (user preferences) and `browser.storage.local` (activation filters, OAuth tokens), handles URL expansion, and dynamically injects content scripts using `browser.scripting.executeScript`.

2. **Content Script (ISOLATED)** ([src/contentScriptSharedLib.js](../src/contentScriptSharedLib.js)): Runs in an isolated world with access to `browser.*` APIs but not the page's JavaScript. Acts as a message proxy between the MAIN world and background script using `window.postMessage()`.

3. **Content Script (MAIN)** ([src/contentScript.js](../src/contentScript.js)): Injected into `ExecutionWorld.MAIN`, has DOM access and page JavaScript context. Creates shadow DOM tooltip, handles mouse events, communicates with ISOLATED world via `window.postMessage()`.

**Why this design?** Manifest V3 forbids direct `browser.*` API access from MAIN world scripts. The ISOLATED script bridges this gap, enabling the MAIN script to interact with browser APIs indirectly.

## Critical Workflows

**Build**: `make` copies `src/` and `res/` to `dist/chrome/` and `dist/firefox/`, respecting separate manifests. No minification—source is shipped as-is for faster extension store reviews.

**Testing**:
- Unit tests (Mocha): `npm run test:unit:coverage` — tests in [test/specs/](../test/specs/)
- E2E tests (Playwright): `npm run test:e2e` — **must build first** (`make`). Uses fixtures in [test/e2e/fixtures/fixtures.js](../test/e2e/fixtures/fixtures.js) to load extension. Firefox uses RDP on port 12345 (no parallel tests). Chromium-only coverage via Monocart.
- Full suite: `npm run test` (lint + spell + unit + e2e)

**Linting**: `npm run lint` runs markdownlint, stylelint, eslint, and `web-ext lint` for Firefox. See [eslint.config.mjs](../eslint.config.mjs) for custom rules (e.g., SonarJS complexity checks).

## Project-Specific Conventions

**Commits**: [Conventional Commits](https://www.conventionalcommits.org/) enforced by Husky pre-commit hooks (e.g., `feat:`, `fix:`, `docs:`). See [CONTRIBUTING.md](../CONTRIBUTING.md).

**Settings Pattern**: 
- `defaultSettings` (synced): User preferences like `displayExternalDomainsOnly`, theme, animation timings
- `defaultSettingsLocal` (local): Activation filters (`domainWhitelist`, `domainBlacklist`), OAuth tokens, offline fallback (`syncOffline`)
- Always use `browser.storage.sync.get(defaultSettings)` with fallback to `browser.storage.local.get({ syncOffline: ... })` if sync unavailable

**Lazy Injection**: [src/contentScriptActivationFilter.js](../src/contentScriptActivationFilter.js) sends `activationHostname` to background on page load. Background checks allowlists/denylists before injecting via `browser.scripting.executeScript`. Pre-loaded tabs defer injection until focus event.

**Message Passing Example** ([src/contentScriptSharedLib.js](../src/contentScriptSharedLib.js)):
```javascript
// MAIN → ISOLATED: window.postMessage({ type: 'FROM_PAGE_SHORT_URL', message: {...} }, '*')
// ISOLATED → Background: browser.runtime.sendMessage(message)
// Background → ISOLATED: sendResponse(response)
// ISOLATED → MAIN: window.postMessage({ type: 'TO_PAGE_EXPANDED_SHORT_URL', message: response }, '*')
```

**Cross-Browser Polyfill**: Load `res/lib/browser-polyfill.min.js` (copied from `node_modules/webextension-polyfill/` during build) in background script and HTML pages.

## Key Files

- [src/defaultSettings.js](../src/defaultSettings.js): Single source of truth for all settings schemas
- [src/contentScript.js](../src/contentScript.js): Main extension logic, tooltip rendering, mouse events
- [src/background.js](../src/background.js): Background service worker, settings management, URL handling
- [src/contentScriptSharedLib.js](../src/contentScriptSharedLib.js): Message passing logic between worlds
- [test/e2e/fixtures/fixtures.js](../test/e2e/fixtures/fixtures.js): Playwright extension loading (RDP for Firefox)
- [Makefile](../Makefile): Build logic with Windows/Linux/macOS support
- [playwright.config.js](../playwright.config.js): Monocart coverage config, extension ID path mapping

## Quickstart

```bash
make                          # Build to dist/
npm run test:unit:coverage    # Unit tests
npm run test:e2e              # E2E tests (after build)
npm run lint                  # All linting
npm run test                  # Full CI suite
```

Load unpacked extension from `dist/chrome/` or `dist/firefox/` for manual testing.
