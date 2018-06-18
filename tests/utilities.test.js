/*global beforeEach, describe, DiceRoll, DiceRoller, expect, jasmine, it, utils */
;(function(){
  'use strict';

  describe('isNumeric utility', function(){
    it('should be numeric', function(){
      expect('isNumeric').toWorkAsUtility([1], true);

      expect('isNumeric').toWorkAsUtility([23], true);

      expect('isNumeric').toWorkAsUtility(['10'], true);

      expect('isNumeric').toWorkAsUtility(['-10'], true);
    });

    it('should not be numeric', function(){
      expect('isNumeric').toWorkAsUtility([undefined], false);

      expect('isNumeric').toWorkAsUtility([null], false);

      expect('isNumeric').toWorkAsUtility([true], false);

      expect('isNumeric').toWorkAsUtility([false], false);

      expect('isNumeric').toWorkAsUtility(['foo'], false);

      expect('isNumeric').toWorkAsUtility(['foo1'], false);

      expect('isNumeric').toWorkAsUtility([{}], false);

      expect('isNumeric').toWorkAsUtility([[]], false);

      expect('isNumeric').toWorkAsUtility([{foo: 1, bar: 2}], false);

      expect('isNumeric').toWorkAsUtility([[1,2]], false);
    });
  });
}());
