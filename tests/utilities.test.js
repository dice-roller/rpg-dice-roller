/*global beforeEach, describe, DiceRoll, DiceRoller, expect, jasmine, it, utils */
;(() => {
  'use strict';

  const loopCount = 1000;

  describe('isNumeric utility', () => {
    it('should be numeric', () => {
      expect('isNumeric').toWorkAsUtility([1], true);

      expect('isNumeric').toWorkAsUtility([23], true);

      expect('isNumeric').toWorkAsUtility(['10'], true);

      expect('isNumeric').toWorkAsUtility(['-10'], true);
    });

    it('should not be numeric', () => {
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

      expect('isNumeric').toWorkAsUtility(['e'], false);
    });
  });

  describe('isBase64 utility', () => {
    it('should be base 64', () => {
      expect('isBase64').toWorkAsUtility([btoa('foo')], true);

      expect('isBase64').toWorkAsUtility([btoa(['foo', 'bar'])], true);

      expect('isBase64').toWorkAsUtility(['YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXo='], true);
    });

    it('should not be base 64', () => {
      expect('isBase64').toWorkAsUtility([undefined], false);

      expect('isBase64').toWorkAsUtility([null], false);

      expect('isBase64').toWorkAsUtility([true], false);

      expect('isBase64').toWorkAsUtility([false], false);

      expect('isBase64').toWorkAsUtility([{}], false);

      expect('isBase64').toWorkAsUtility([[]], false);

      expect('isBase64').toWorkAsUtility(['foo'], false);

      expect('isBase64').toWorkAsUtility(['foo', 'bar'], false);

      expect('isBase64').toWorkAsUtility([1], false);

      expect('isBase64').toWorkAsUtility([['YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXo=', 'Zm9vLGJhcg==']], false);

      expect('isBase64').toWorkAsUtility([atob(btoa('foo'))], false);

      expect('isBase64').toWorkAsUtility([atob('YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXo=')], false);
    });
  });

  describe('isJson utility', () => {
    it('should be JSON', () => {
      expect('isJson').toWorkAsUtility([JSON.stringify({})], true);

      expect('isJson').toWorkAsUtility([JSON.stringify([])], true);

      expect('isJson').toWorkAsUtility([JSON.stringify([undefined])], true);

      expect('isJson').toWorkAsUtility([JSON.stringify([null])], true);

      expect('isJson').toWorkAsUtility([JSON.stringify([true])], true);

      expect('isJson').toWorkAsUtility([JSON.stringify([false])], true);

      expect('isJson').toWorkAsUtility([JSON.stringify([1, 2])], true);

      expect('isJson').toWorkAsUtility([JSON.stringify(['foo', 'bar'])], true);

      expect('isJson').toWorkAsUtility([JSON.stringify({foo: 'bar', baz: 'boz'})], true);
    });

    it('should not be JSON', () => {
      expect('isJson').toWorkAsUtility([undefined], false);

      expect('isJson').toWorkAsUtility([null], false);

      expect('isJson').toWorkAsUtility([true], false);

      expect('isJson').toWorkAsUtility([false], false);

      expect('isJson').toWorkAsUtility([{}], false);

      expect('isJson').toWorkAsUtility([[]], false);

      expect('isJson').toWorkAsUtility(['foo'], false);

      expect('isJson').toWorkAsUtility([['foo', 'bar']], false);

      expect('isJson').toWorkAsUtility([{foo: 'bar', baz: 'boz'}], false);

      expect('isJson').toWorkAsUtility([1], false);

      expect('isJson').toWorkAsUtility([JSON.stringify(undefined)], false);

      expect('isJson').toWorkAsUtility([JSON.stringify(null)], false);

      expect('isJson').toWorkAsUtility([JSON.stringify(true)], false);

      expect('isJson').toWorkAsUtility([JSON.stringify(false)], false);

      expect('isJson').toWorkAsUtility([JSON.stringify('foo')], false);

      expect('isJson').toWorkAsUtility([JSON.stringify(99)], false);
    });
  });

  describe('generateNumber utility', () => {
    it('should return between 1 and 5', () => {
      // run the tests multiple times for consistency
      for(let i = 0; i < loopCount; i++){
        const value = diceUtils.generateNumber(1, 5);

        expect(value).toBeWithinRange({min: 1, max: 5});
      }
    });

    it('should return between -100 and 10', () => {
      // run the tests multiple times for consistency
      for(let i = 0; i < loopCount; i++){
        const value = diceUtils.generateNumber(-100, 10);

        expect(value).toBeWithinRange({min: -100, max: 10});
      }
    });

    it('should return min value if greater than max', () => {
      // run the tests multiple times for consistency
      for(let i = 0; i < loopCount; i++){
        const value = diceUtils.generateNumber(2, 1);

        expect(value).toEqual(2);
      }
    });

    it('should return min value if equal to max', () => {
      // run the tests multiple times for consistency
      for(let i = 0; i < loopCount; i++){
        const value = diceUtils.generateNumber(2, 2);

        expect(value).toEqual(2);
      }
    });

    it('should return 1 if no min or max defined', () => {
      // run the tests multiple times for consistency
      for(let i = 0; i < loopCount; i++){
        const value = diceUtils.generateNumber();

        expect(value).toEqual(1);
      }
    });

    it('should return min if no max defined', () => {
      // run the tests multiple times for consistency
      for(let i = 0; i < loopCount; i++){
        const value = diceUtils.generateNumber(5);

        expect(value).toEqual(5);
      }
    });
  });

  describe('sumArray utility', () => {
    it('should sum the array values', () => {
      expect('sumArray').toWorkAsUtility(
        [[
          1, 2, 3, 4, 5,
        ]],
        15
      );

      expect('sumArray').toWorkAsUtility(
        [[
          0,0,0,0,0,
        ]],
        0
      );
    });

    it('should ignore "empty" values (null, false, undefined, etc.)', () => {
      expect('sumArray').toWorkAsUtility(
        [[
          10, null, false, undefined, 20
        ]],
        30
      );
    });

    it('should ignore non-numeric values', () => {
      expect('sumArray').toWorkAsUtility(
        [[
          10, 'e', 'foo', {foo: 'bar'}, [1, 2], true, 20
        ]],
        30
      );
    });
  });

  describe('equateNumbers utility', () => {
    it('should add numbers', () => {
      expect('equateNumbers').toWorkAsUtility(
        [
          10, 20, '+'
        ],
        30
      );

      expect('equateNumbers').toWorkAsUtility(
        [
          4.5, 23.2, '+'
        ],
        27.7
      );

      expect('equateNumbers').toWorkAsUtility(
        [
          -30, 20, '+'
        ],
        -10
      );
    });

    it('should multiply numbers', () => {
      expect('equateNumbers').toWorkAsUtility(
        [
          10, 20, '*'
        ],
        200
      );

      expect('equateNumbers').toWorkAsUtility(
        [
          4.5, 23, '*'
        ],
        103.5
      );

      expect('equateNumbers').toWorkAsUtility(
        [
          -30, 20, '*'
        ],
        -600
      );
    });

    it('should divide numbers', () => {
      expect('equateNumbers').toWorkAsUtility(
        [
          10, 20, '/'
        ],
        0.5
      );

      expect('equateNumbers').toWorkAsUtility(
        [
          4.5, 23.2, '/'
        ],
        0.1939655172413793
      );

      expect('equateNumbers').toWorkAsUtility(
        [
          -30, 20, '/'
        ],
        -1.5
      );

      expect('equateNumbers').toWorkAsUtility(
        [
          20, 10, '/'
        ],
        2
      );

      expect('equateNumbers').toWorkAsUtility(
        [
          23.2, 4.5, '/'
        ],
        5.155555555555555
      );

      expect('equateNumbers').toWorkAsUtility(
        [
          20, -30, '/'
        ],
        -0.6666666666666666
      );
    });

    it('should subtract numbers', () => {
      expect('equateNumbers').toWorkAsUtility(
        [
          10, 20, '-'
        ],
        -10
      );

      expect('equateNumbers').toWorkAsUtility(
        [
          4.5, 23.2, '-'
        ],
        -18.7
      );

      expect('equateNumbers').toWorkAsUtility(
        [
          -30, 20, '-'
        ],
        -50
      );

      expect('equateNumbers').toWorkAsUtility(
        [
          20, 10, '-'
        ],
        10
      );

      expect('equateNumbers').toWorkAsUtility(
        [
          23.2, 4.5, '-'
        ],
        18.7
      );

      expect('equateNumbers').toWorkAsUtility(
        [
          20, -30, '-'
        ],
        50
      );
    });

    it('should add numbers by default', () => {
      expect('equateNumbers').toWorkAsUtility(
        [
          10, 20
        ],
        30
      );

      expect('equateNumbers').toWorkAsUtility(
        [
          4.5, 23.2
        ],
        27.7
      );

      expect('equateNumbers').toWorkAsUtility(
        [
          -30, 20
        ],
        -10
      );
    });

    it('should return zero if numbers are invalid', () => {
      expect('equateNumbers').toWorkAsUtility(['foo', 'bar'], 0);
    });

    it('should work if first number is 0', () => {
      expect('equateNumbers').toWorkAsUtility([0, 20], 20);

      expect('equateNumbers').toWorkAsUtility([0, 20, '-'], -20);

      expect('equateNumbers').toWorkAsUtility([0, 20, '*'], 0);

      expect('equateNumbers').toWorkAsUtility([0, 20, '/'], 0);
    });

    it('should work if second number is 0', () => {
      expect('equateNumbers').toWorkAsUtility([10, 0], 10);

      expect('equateNumbers').toWorkAsUtility([10, 0, '-'], 10);

      expect('equateNumbers').toWorkAsUtility([10, 0, '*'], 0);

      expect('equateNumbers').toWorkAsUtility([10, 0, '/'], 0);
    });

    it('should work if first number is invalid', () => {
      expect('equateNumbers').toWorkAsUtility(['foo', 20], 20);

      expect('equateNumbers').toWorkAsUtility(['foo', 20, '-'], -20);

      expect('equateNumbers').toWorkAsUtility(['foo', 20, '*'], 0);

      expect('equateNumbers').toWorkAsUtility(['foo', 20, '/'], 0);
    });

    it('should work if second number is invalid', () => {
      expect('equateNumbers').toWorkAsUtility([10, 'bar'], 10);

      expect('equateNumbers').toWorkAsUtility([10, 'bar', '-'], 10);

      expect('equateNumbers').toWorkAsUtility([10, 'bar', '*'], 0);

      expect('equateNumbers').toWorkAsUtility([10, 'bar', '/'], 0);
    });
  });

  describe('compareNumbers utility', () => {
    describe('= and ==', () => {
      it('should be equal', () => {
        expect('compareNumbers').toWorkAsUtility([1, 1, '='], true);

        expect('compareNumbers').toWorkAsUtility([1, 1, '=='], true);

        expect('compareNumbers').toWorkAsUtility([10, 10, '='], true);

        expect('compareNumbers').toWorkAsUtility([346, 346, '='], true);

        expect('compareNumbers').toWorkAsUtility([10, 10.00, '='], true);

        expect('compareNumbers').toWorkAsUtility(['1', '1', '='], true);

        expect('compareNumbers').toWorkAsUtility([1, '1', '='], true);
      });

      it('should not be equal', () => {
        expect('compareNumbers').toWorkAsUtility([1, 2, '='], false);

        expect('compareNumbers').toWorkAsUtility([1, 1.01, '='], false);

        expect('compareNumbers').toWorkAsUtility([1.01, 1.02, '='], false);

        expect('compareNumbers').toWorkAsUtility(['h', 'h', '='], false);

        expect('compareNumbers').toWorkAsUtility([{}, {}, '='], false);

        expect('compareNumbers').toWorkAsUtility([{}, [], '='], false);

        expect('compareNumbers').toWorkAsUtility([[], [], '='], false);

        expect('compareNumbers').toWorkAsUtility([null, null, '='], false);

        expect('compareNumbers').toWorkAsUtility([false, false, '='], false);

        expect('compareNumbers').toWorkAsUtility([null, false, '='], false);

        expect('compareNumbers').toWorkAsUtility([true, true, '='], false);

        expect('compareNumbers').toWorkAsUtility([NaN, NaN, '='], false);
      });
    });

    describe('<', () => {
      it('should be less than', () => {
        expect('compareNumbers').toWorkAsUtility([1, 2, '<'], true);

        expect('compareNumbers').toWorkAsUtility([1, 1.01, '<'], true);

        expect('compareNumbers').toWorkAsUtility(['1', '2', '<'], true);
      });

      it('should not be less than', () => {
        expect('compareNumbers').toWorkAsUtility([1, 1, '<'], false);

        expect('compareNumbers').toWorkAsUtility([2, 1, '<'], false);

        expect('compareNumbers').toWorkAsUtility([1.01, 1, '<'], false);

        expect('compareNumbers').toWorkAsUtility(['2', '2', '<'], false);
      });
    });

    describe('>', () => {
      it('should be greater than', () => {
        expect('compareNumbers').toWorkAsUtility([2, 1, '>'], true);

        expect('compareNumbers').toWorkAsUtility([1.01, 1, '>'], true);

        expect('compareNumbers').toWorkAsUtility(['2', '1', '>'], true);
      });

      it('should not be greater than', () => {
        expect('compareNumbers').toWorkAsUtility([1, 1, '>'], false);

        expect('compareNumbers').toWorkAsUtility([1, 2, '>'], false);

        expect('compareNumbers').toWorkAsUtility([1, 1.01, '>'], false);

        expect('compareNumbers').toWorkAsUtility(['1', '2', '>'], false);

        expect('compareNumbers').toWorkAsUtility(['2', '2', '>'], false);
      });
    });

    describe('<=', () => {
      it('should be less than or equal to', () => {
        expect('compareNumbers').toWorkAsUtility([1, 2, '<='], true);

        expect('compareNumbers').toWorkAsUtility([1, 1.01, '<='], true);

        expect('compareNumbers').toWorkAsUtility(['1', '2', '<='], true);

        expect('compareNumbers').toWorkAsUtility([1, 1, '<='], true);

        expect('compareNumbers').toWorkAsUtility(['2', '2', '<='], true);
      });

      it('should not be less than or equal to', () => {
        expect('compareNumbers').toWorkAsUtility([2, 1, '<='], false);

        expect('compareNumbers').toWorkAsUtility([1.01, 1, '<='], false);

        expect('compareNumbers').toWorkAsUtility(['2', '1', '<='], false);
      });
    });

    describe('>=', () => {
      it('should be greater than', () => {
        expect('compareNumbers').toWorkAsUtility([1, 1, '>='], true);

        expect('compareNumbers').toWorkAsUtility([2, 1, '>='], true);

        expect('compareNumbers').toWorkAsUtility([1.01, 1, '>='], true);

        expect('compareNumbers').toWorkAsUtility(['2', '1', '>='], true);

        expect('compareNumbers').toWorkAsUtility(['2', '2', '>='], true);
      });

      it('should not be greater than', () => {
        expect('compareNumbers').toWorkAsUtility([1, 2, '>='], false);

        expect('compareNumbers').toWorkAsUtility([1, 1.01, '>='], false);

        expect('compareNumbers').toWorkAsUtility(['1', '2', '>='], false);
      });
    });

    describe('! and !=', () => {
      it('should not be equal', () => {
        expect('compareNumbers').toWorkAsUtility([1, 2, '!'], true);

        expect('compareNumbers').toWorkAsUtility([1, 1.01, '!='], true);

        expect('compareNumbers').toWorkAsUtility([1.01, 1.02, '!'], true);

        expect('compareNumbers').toWorkAsUtility(['h', 'h', '!'], true);

        expect('compareNumbers').toWorkAsUtility([{}, {}, '!'], true);

        expect('compareNumbers').toWorkAsUtility([{}, [], '!'], true);

        expect('compareNumbers').toWorkAsUtility([[], [], '!'], true);

        expect('compareNumbers').toWorkAsUtility([null, null, '!'], true);

        expect('compareNumbers').toWorkAsUtility([false, false, '!'], true);

        expect('compareNumbers').toWorkAsUtility([null, false, '!'], true);

        expect('compareNumbers').toWorkAsUtility([true, true, '!'], true);
      });

      it('should be equal', () => {
        expect('compareNumbers').toWorkAsUtility([1, 1, '!'], false);

        expect('compareNumbers').toWorkAsUtility([1, 1, '!='], false);

        expect('compareNumbers').toWorkAsUtility([10, 10, '!'], false);

        expect('compareNumbers').toWorkAsUtility([346, 346, '!'], false);

        expect('compareNumbers').toWorkAsUtility([10, 10.00, '!'], false);

        expect('compareNumbers').toWorkAsUtility(['1', '1', '!'], false);

        expect('compareNumbers').toWorkAsUtility([1, '1', '!'], false);
      });
    });

    it('should return false if no operator defined', () => {
      expect('compareNumbers').toWorkAsUtility([1, 1], false);

      expect('compareNumbers').toWorkAsUtility([1, 2], false);

      expect('compareNumbers').toWorkAsUtility([2, 1], false);
    });
  });
})();
