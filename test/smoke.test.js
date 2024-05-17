import assert from 'assert';
import fs from 'fs';

describe('Smoke Tests', function () {

  describe('Test Suite', function () {
    // Smoke tests used to quickly pass/fail before other tests.
    it('should pass, demonstrating the test suite is working', function () {
      assert.equal(true, true);
    });
  });

  describe('Build Test', function () {
    // Check if a build has happened before continuing with other tests.
    it('should check if the dist folder exists', function () {
      const distPath = './dist';
      const distFolderExists = fs.existsSync(distPath);
      assert.equal(distFolderExists, true);
    });

    it('should check if files have been copied into the dist folder', function () {
      const distPath = './dist';
      const filesInDist = fs.readdirSync(distPath);
      assert.notEqual(filesInDist.length, 0);
    });
  });
});
