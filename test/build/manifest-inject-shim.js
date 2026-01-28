#!/usr/bin/env node
// Adds the coverage shim page to web_accessible_resources in the extension
// manifest at build time. This lets V8 instrument background.js via the
// shim page for tests without shipping test-only changes to production.
import fs from 'node:fs';

const manifestPath = process.argv[2];
if (!manifestPath) {
  console.error('manifest path is required');
  process.exit(1);
}

const text = fs.readFileSync(manifestPath, 'utf8');
const pattern = /("resources"\s*:\s*\[\s*)/;
const insert = '"background-with-coverage-shim.html",\n\t\t\t';
const updated = text.replace(pattern, `$1${insert}`);
if (updated === text) {
  console.error('resources array not found in manifest');
  process.exit(1);
}
fs.writeFileSync(manifestPath, updated);
