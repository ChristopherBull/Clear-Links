/**
 * This file contains tests for the manifest file.
 */
import './smoke.test.js'; // Forces smoke tests to run first
import assert from 'assert';
import fs from 'fs';

const manifestPath = './dist/chrome/manifest.json';

describe('Manifest File', function() {
  it('should pass if the manifest file exists', function() {
    const manifestExists = fs.existsSync(manifestPath);
    assert.equal(manifestExists, true);
  });

  it('should pass if the manifest file is valid JSON', function() {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    let manifest;
    try {
      manifest = JSON.parse(manifestContent);
    } catch (error) {
      assert.fail(`Invalid JSON format: ${error.message}`);
    }
    assert.ok(manifest);
  });

  it('should pass if the manifest file has required fields', function() {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    const requiredFields = [ 'name', 'version', 'manifest_version', 'description', 'icons' ];
    const missingFields = requiredFields.filter(field => !(field in manifest));
    assert.equal(missingFields.length, 0, `Missing required fields: ${missingFields.join(', ')}`);
  });

  it('should pass if the manifest file has valid content_scripts', function() {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    const contentScripts = manifest.content_scripts;
    assert.ok(Array.isArray(contentScripts), 'content_scripts should be an array');
    assert.ok(contentScripts.length > 0, 'content_scripts should not be empty');
    contentScripts.forEach((script) => {
      assert.ok(Array.isArray(script.js), 'content_scripts.js should be an array');
      assert.ok(script.js.length > 0, 'content_scripts.js should not be empty');
    });
  });

  it('should pass if the manifest file has valid permissions', function() {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    const permissions = manifest.permissions;
    assert.ok(Array.isArray(permissions), 'permissions should be an array');
    assert.ok(permissions.length > 0, 'permissions should not be empty');
  });

  it('should pass if the manifest file has valid background script', function() {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    const background = manifest.background;
    assert.ok(background, 'background should exist');
    assert.ok(background.service_worker, 'background.service_worker should exist');
  });
});
