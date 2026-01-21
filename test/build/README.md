# Test Helpers Build System

## Overview

This directory contains test helper modules that are **optionally injected** into extension builds to enable E2E testing in a browser. By default, production builds are clean and test-free.

## Why Test Helpers

Code that must run inside the background service worker (for example modules that call `browser.*`, use storage, permissions, or `browser.scripting`) cannot be imported directly from external test runners because that context is isolated. The optional helpers are injected into test builds and expose only the specific functions tests need on `globalThis`:

```javascript
// Without helpers: ReferenceError - ActionBadge is not defined
await backgroundPage.evaluate(() => ActionBadge.setErrorStatus());

// With helpers: Works! ActionBadge is exposed globally
await backgroundPage.evaluate(() => ActionBadge.setErrorStatus());
```

## Build Instructions

### Production Build (Default)

```bash
make
```

Creates a clean, production-ready extension with **zero test code**.

### Test Build with Helpers

```bash
make TEST_HELPERS=1
```

Injects test helpers into the extension build, giving test runners access to isolated modules and APIs.

Then run E2E tests:

```bash
npm run test:e2e
```

## How It Works

When `TEST_HELPERS=1`:

1. The Makefile copies [background-test-helpers.js](background-test-helpers.js) to `dist/chrome/` and `dist/firefox/`
2. Prepends an ES `import` statement to `background.js`:

   ```javascript
   import './background-test-helpers.js';
   // ... rest of original background.js
   ```

3. `background-test-helpers.js` runs at startup and exposes attaches modules/code, which require the runtime context of a Service Worker, to `globalThis`
