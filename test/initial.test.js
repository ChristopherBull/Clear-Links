import assert from 'assert';
// import { isUrlToBeFiltered } from '../src/background.js';

describe('Array', function () {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
  describe('test 2', function () {
    it('should pass', function () {
      assert.equal([1, 2, 3].indexOf(2), 1);
    });
  });
  // describe('test 3', function () {
  //   it('should pass I guess', function () {
  //     assert.equal(isUrlToBeFiltered('www.example.com', ['1', '2', 'www.example.com', '4']), true);
  //   });
  // });

});