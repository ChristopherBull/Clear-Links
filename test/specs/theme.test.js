/**
 * Tests the themes module.
 */
import './smoke.test.js'; // Forces smoke tests to run first
import assert from 'assert';
import { themes } from '../../src/themes.js';

/**
 * Checks if the given item is an object.
 * @param {*} item - The item to be checked.
 * @returns {boolean} - Returns true if the item is an object, false otherwise.
 */
function isObject(item) {
  return (typeof item === 'object' && !Array.isArray(item) && item !== null);
}

/**
 * Recursively retrieves all keys and structure of an object.
 * @param {object} obj - The object to retrieve keys and structure from.
 * @returns {object} - An object containing all keys and structure of the input object.
 */
function getAllRecursiveKeysAndStructure(obj) {
  const keysAndStructure = {};
  for (const property in obj) {
    if (isObject(obj[property])) {
      keysAndStructure[property] = getAllRecursiveKeysAndStructure(obj[property]);
    } else {
      keysAndStructure[property] = null; // `null` is a placeholder for any value, which allows theme values to be of different types
    }
  }
  return keysAndStructure;
}

describe('Themes', function() {
  it('should have nested objects for each theme', function() {
    for (const theme in themes) {
      assert.equal(isObject(themes[theme]), true);
    }
  });

  it('should have the same recursive object property keys and structure for all themes', function() {
    const referenceObject = themes.light;
    for (const theme in themes) {
      assert.deepStrictEqual(getAllRecursiveKeysAndStructure(themes[theme]), getAllRecursiveKeysAndStructure(referenceObject));
    }
  });
});
