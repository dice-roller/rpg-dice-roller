import * as mathUtils from '../../src/utilities/math.js';

describe('Math utils', () => {
  test('model structure', () => {
    expect(mathUtils).toEqual(expect.objectContaining({
      evaluate: expect.any(Function),
      compareNumbers: expect.any(Function),
      isNumeric: expect.any(Function),
      sumArray: expect.any(Function),
      toFixed: expect.any(Function),
    }));
  });

  describe('isNumeric', () => {
    test('returns true for values of type number', () => {
      expect(mathUtils.isNumeric(1)).toBe(true);
      expect(mathUtils.isNumeric(0)).toBe(true);
      expect(mathUtils.isNumeric(54)).toBe(true);
      expect(mathUtils.isNumeric(3.56)).toBe(true);
      expect(mathUtils.isNumeric(-156)).toBe(true);
      expect(mathUtils.isNumeric(3890)).toBe(true);
    });

    test('returns true for numeric strings', () => {
      expect(mathUtils.isNumeric('1')).toBe(true);
      expect(mathUtils.isNumeric('0')).toBe(true);
      expect(mathUtils.isNumeric('54')).toBe(true);
      expect(mathUtils.isNumeric('3.56')).toBe(true);
      expect(mathUtils.isNumeric('-156')).toBe(true);
      expect(mathUtils.isNumeric('3890')).toBe(true);
    });

    test('returns false for non-numeric values', () => {
      expect(mathUtils.isNumeric(NaN)).toBe(false);
      expect(mathUtils.isNumeric('foo')).toBe(false);
      expect(mathUtils.isNumeric({})).toBe(false);
      expect(mathUtils.isNumeric([])).toBe(false);
      expect(mathUtils.isNumeric(true)).toBe(false);
      expect(mathUtils.isNumeric(false)).toBe(false);
      expect(mathUtils.isNumeric(null)).toBe(false);
      expect(mathUtils.isNumeric(undefined)).toBe(false);
    });

    test('returns false for string containing both numeric and non-numeric values', () => {
      expect(mathUtils.isNumeric('10foo')).toBe(false);
      expect(mathUtils.isNumeric('foo10')).toBe(false);
    });

    test('returns true for very large numbers', () => {
      expect(mathUtils.isNumeric(99 ** 99)).toBe(true);
      expect(mathUtils.isNumeric((99 ** 99).toString())).toBe(true);
    });

    test('returns false for `Infinity`', () => {
      expect(mathUtils.isNumeric(Infinity)).toBe(false);
    });
  });

  describe('isSafeNumber', () => {
    test('returns true for values within the "safe" range', () => {
      expect(mathUtils.isSafeNumber(1)).toBe(true);
      expect(mathUtils.isSafeNumber(567689584)).toBe(true);
      expect(mathUtils.isSafeNumber(721984.6432876523)).toBe(true);
      expect(mathUtils.isSafeNumber(Number.MIN_SAFE_INTEGER + 1)).toBe(true);
      expect(mathUtils.isSafeNumber(Number.MAX_SAFE_INTEGER - 1)).toBe(true);
    });

    test('returns true for the min', () => {
      expect(mathUtils.isSafeNumber(Number.MIN_SAFE_INTEGER)).toBe(true);
    });

    test('returns true for the max', () => {
      expect(mathUtils.isSafeNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    test('returns false for numbers under the min', () => {
      expect(mathUtils.isSafeNumber(Number.MIN_SAFE_INTEGER - 1)).toBe(false);
      expect(mathUtils.isSafeNumber(Number.MIN_SAFE_INTEGER - 500)).toBe(false);
      expect(mathUtils.isSafeNumber(Number.MIN_SAFE_INTEGER - 1564367.4325671)).toBe(false);
    });

    test('returns false for numbers over the max', () => {
      expect(mathUtils.isSafeNumber(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
      expect(mathUtils.isSafeNumber(Number.MAX_SAFE_INTEGER + 500)).toBe(false);
      expect(mathUtils.isSafeNumber(Number.MAX_SAFE_INTEGER + 1564367.432567)).toBe(false);
      expect(mathUtils.isSafeNumber(Infinity)).toBe(false);
    });

    test('returns false for non-numeric values', () => {
      expect(mathUtils.isSafeNumber('foo')).toBe(false);
      expect(mathUtils.isSafeNumber([])).toBe(false);
      expect(mathUtils.isSafeNumber({})).toBe(false);
      expect(mathUtils.isSafeNumber(true)).toBe(false);
      expect(mathUtils.isSafeNumber(false)).toBe(false);
      expect(mathUtils.isSafeNumber(null)).toBe(false);
      expect(mathUtils.isSafeNumber(undefined)).toBe(false);
    });
  });

  describe('compareNumbers', () => {
    test('returns false if no operator specified', () => {
      expect(mathUtils.compareNumbers(1, 1)).toBe(false);
      expect(mathUtils.compareNumbers(1, 45)).toBe(false);
      expect(mathUtils.compareNumbers(4, 67)).toBe(false);
      expect(mathUtils.compareNumbers(67, 67)).toBe(false);
    });

    test('returns false if operator is unrecognised', () => {
      expect(mathUtils.compareNumbers(1, 1, 'foo')).toBe(false);
      expect(mathUtils.compareNumbers(1, 45, {})).toBe(false);
      expect(mathUtils.compareNumbers(4, 67, true)).toBe(false);
      expect(mathUtils.compareNumbers(67, 67, false)).toBe(false);
    });

    test('returns false if values are not numeric', () => {
      expect(mathUtils.compareNumbers('foo', 'foo', '=')).toBe(false);
      expect(mathUtils.compareNumbers('foo', 'bar', '=')).toBe(false);
      expect(mathUtils.compareNumbers('foo', 3, '=')).toBe(false);
      expect(mathUtils.compareNumbers(3, 'foo', '=')).toBe(false);
    });

    describe('`=` and `==`', () => {
      test('returns true if `a = b`', () => {
        expect(mathUtils.compareNumbers(1, 1, '=')).toBe(true);
        expect(mathUtils.compareNumbers(45, 45, '=')).toBe(true);
        expect(mathUtils.compareNumbers(-1.03, -1.03, '=')).toBe(true);

        expect(mathUtils.compareNumbers(1, 1, '==')).toBe(true);
        expect(mathUtils.compareNumbers(45, 45, '==')).toBe(true);
        expect(mathUtils.compareNumbers(-1.03, -1.03, '==')).toBe(true);
      });

      test('returns false if `a != b`', () => {
        expect(mathUtils.compareNumbers(1, 4, '=')).toBe(false);
        expect(mathUtils.compareNumbers(643, 0.45, '=')).toBe(false);
        expect(mathUtils.compareNumbers(0, -1, '=')).toBe(false);

        expect(mathUtils.compareNumbers(1, 4, '==')).toBe(false);
        expect(mathUtils.compareNumbers(643, 0.45, '==')).toBe(false);
        expect(mathUtils.compareNumbers(0, -1, '==')).toBe(false);
      });
    });

    describe('`<`', () => {
      test('returns true if `a < b`', () => {
        expect(mathUtils.compareNumbers(1, 5, '<')).toBe(true);
        expect(mathUtils.compareNumbers(-5, -4, '<')).toBe(true);
        expect(mathUtils.compareNumbers(145.05, 145.06, '<')).toBe(true);
      });

      test('returns false if `a >= b`', () => {
        expect(mathUtils.compareNumbers(1, 0, '<')).toBe(false);
        expect(mathUtils.compareNumbers(-5, -16, '<')).toBe(false);
        expect(mathUtils.compareNumbers(145.05, 145.04, '<')).toBe(false);

        expect(mathUtils.compareNumbers(1, 1, '<')).toBe(false);
        expect(mathUtils.compareNumbers(-5, -5, '<')).toBe(false);
        expect(mathUtils.compareNumbers(145.05, 145.05, '<')).toBe(false);
      });
    });

    describe('`>', () => {
      test('returns true if `a > b`', () => {
        expect(mathUtils.compareNumbers(5, 1, '>')).toBe(true);
        expect(mathUtils.compareNumbers(-1, -5, '>')).toBe(true);
        expect(mathUtils.compareNumbers(145.06, 145.05, '>')).toBe(true);
      });

      test('returns false if `a <= b`', () => {
        expect(mathUtils.compareNumbers(0, 1, '>')).toBe(false);
        expect(mathUtils.compareNumbers(-16, -5, '>')).toBe(false);
        expect(mathUtils.compareNumbers(145.04, 145.05, '>')).toBe(false);

        expect(mathUtils.compareNumbers(1, 1, '>')).toBe(false);
        expect(mathUtils.compareNumbers(-5, -5, '>')).toBe(false);
        expect(mathUtils.compareNumbers(145.05, 145.05, '>')).toBe(false);
      });
    });

    describe('`<=', () => {
      test('returns true if `a < b`', () => {
        expect(mathUtils.compareNumbers(0, 1, '<=')).toBe(true);
        expect(mathUtils.compareNumbers(-16, -5, '<=')).toBe(true);
        expect(mathUtils.compareNumbers(145.04, 145.05, '<=')).toBe(true);
      });

      test('returns true if `a = b`', () => {
        expect(mathUtils.compareNumbers(1, 1, '<=')).toBe(true);
        expect(mathUtils.compareNumbers(-5, -5, '<=')).toBe(true);
        expect(mathUtils.compareNumbers(145.05, 145.05, '<=')).toBe(true);
      });

      test('returns false if `a > b`', () => {
        expect(mathUtils.compareNumbers(5, 1, '<=')).toBe(false);
        expect(mathUtils.compareNumbers(-1, -5, '<=')).toBe(false);
        expect(mathUtils.compareNumbers(145.06, 145.05, '<=')).toBe(false);
      });
    });

    describe('`>=', () => {
      test('returns true if `a > b`', () => {
        expect(mathUtils.compareNumbers(5, 1, '>=')).toBe(true);
        expect(mathUtils.compareNumbers(-1, -5, '>=')).toBe(true);
        expect(mathUtils.compareNumbers(145.06, 145.05, '>=')).toBe(true);
      });

      test('returns true if `a = b`', () => {
        expect(mathUtils.compareNumbers(1, 1, '>=')).toBe(true);
        expect(mathUtils.compareNumbers(-5, -5, '>=')).toBe(true);
        expect(mathUtils.compareNumbers(145.05, 145.05, '>=')).toBe(true);
      });

      test('returns false if `a < b`', () => {
        expect(mathUtils.compareNumbers(0, 1, '>=')).toBe(false);
        expect(mathUtils.compareNumbers(-16, -5, '>=')).toBe(false);
        expect(mathUtils.compareNumbers(145.04, 145.05, '>=')).toBe(false);
      });
    });

    describe('`!` and `!=`', () => {
      test('returns true if `a != b`', () => {
        expect(mathUtils.compareNumbers(1, 4, '!')).toBe(true);
        expect(mathUtils.compareNumbers(643, 0.45, '!')).toBe(true);
        expect(mathUtils.compareNumbers(0, -1, '!')).toBe(true);

        expect(mathUtils.compareNumbers(1, 4, '!=')).toBe(true);
        expect(mathUtils.compareNumbers(643, 0.45, '!=')).toBe(true);
        expect(mathUtils.compareNumbers(0, -1, '!=')).toBe(true);
      });

      test('returns false if `a = b`', () => {
        expect(mathUtils.compareNumbers(1, 1, '!')).toBe(false);
        expect(mathUtils.compareNumbers(45, 45, '!')).toBe(false);
        expect(mathUtils.compareNumbers(-1.03, -1.03, '!')).toBe(false);

        expect(mathUtils.compareNumbers(1, 1, '!=')).toBe(false);
        expect(mathUtils.compareNumbers(45, 45, '!=')).toBe(false);
        expect(mathUtils.compareNumbers(-1.03, -1.03, '!=')).toBe(false);
      });
    });

    describe('Very large numbers', () => {
      describe('Infinity', () => {
        test('can compare Infinity with itself', () => {
          expect(mathUtils.compareNumbers(Infinity, Infinity, '=')).toBe(true);
          expect(mathUtils.compareNumbers(Infinity, Infinity, '<=')).toBe(true);
          expect(mathUtils.compareNumbers(Infinity, Infinity, '>=')).toBe(true);

          expect(mathUtils.compareNumbers(Infinity, Infinity, '>')).toBe(false);
          expect(mathUtils.compareNumbers(Infinity, Infinity, '<')).toBe(false);
          expect(mathUtils.compareNumbers(Infinity, Infinity, '!')).toBe(false);
        });

        test('can compare Infinity with other numbers', () => {
          expect(mathUtils.compareNumbers(Infinity, 7, '>')).toBe(true);
          expect(mathUtils.compareNumbers(Infinity, 99 ** 99, '>')).toBe(true);

          expect(mathUtils.compareNumbers(Infinity, 7, '=')).toBe(false);
          expect(mathUtils.compareNumbers(Infinity, 1000000, '=')).toBe(false);
          expect(mathUtils.compareNumbers(Infinity, 99 ** 99, '=')).toBe(false);
          expect(mathUtils.compareNumbers(Infinity, 99 ** 99, '<')).toBe(false);
        });
      });

      describe('Unsafe integer `99^99`', () => {
        // this is an important test - calling `parseInt(99 ** 99)` will incorrectly return `3`
        test('does not get incorrectly rounded to `3`', () => {
          expect(mathUtils.compareNumbers(99 ** 99, 3, '>')).toBe(true);
          expect(mathUtils.compareNumbers(99 ** 99, Number.MAX_SAFE_INTEGER, '>')).toBe(true);

          expect(mathUtils.compareNumbers(99 ** 99, 3, '=')).toBe(false);
        });

        test('can compare `99^99` with itself', () => {
          expect(mathUtils.compareNumbers(99 ** 99, 99 ** 99, '=')).toBe(true);
          expect(mathUtils.compareNumbers(99 ** 99, 99 ** 99, '<=')).toBe(true);
          expect(mathUtils.compareNumbers(99 ** 99, 99 ** 99, '>=')).toBe(true);

          expect(mathUtils.compareNumbers(99 ** 99, 99 ** 99, '>')).toBe(false);
          expect(mathUtils.compareNumbers(99 ** 99, 99 ** 99, '<')).toBe(false);
          expect(mathUtils.compareNumbers(99 ** 99, 99 ** 99, '!')).toBe(false);
        });

        test('can compare `99^99` with other numbers', () => {
          expect(mathUtils.compareNumbers(99 ** 99, 900, '>')).toBe(true);
          expect(mathUtils.compareNumbers(99 ** 99, 2, '>=')).toBe(true);
          expect(mathUtils.compareNumbers(99 ** 99, 890, '!')).toBe(true);

          expect(mathUtils.compareNumbers(99 ** 99, 56468, '=')).toBe(false);
          expect(mathUtils.compareNumbers(99 ** 99, 0.45, '<')).toBe(false);
          expect(mathUtils.compareNumbers(99 ** 99, -67, '<=')).toBe(false);
        });
      });
    });
  });

  describe('sumArray', () => {
    test('Sums the values of an array', () => {
      expect(mathUtils.sumArray([4, 6, 234, 14.05, -4])).toBeCloseTo(254.05);
    });

    test('Sums the values of an array of numerical strings', () => {
      expect(mathUtils.sumArray(['4', '6', '234', '14.05', '-4'])).toBeCloseTo(254.05);
    });

    test('Non-numerical values are ignored / treated as zero', () => {
      expect(mathUtils.sumArray([4, 5, 'foo', {}, 6])).toBe(15);
    });

    test('returns 0 if not an array', () => {
      expect(mathUtils.sumArray('foo')).toBe(0);
    });
  });

  describe('toFixed', () => {
    test('`decPlaces` defaults to `0`', () => {
      expect(mathUtils.toFixed(345.27649047)).toBe(345);
    });

    test('rounds to decimal places', () => {
      expect(mathUtils.toFixed(345.27649047, 1)).toBeCloseTo(345.3);
      expect(mathUtils.toFixed(345.27649047, 2)).toBeCloseTo(345.28);
      expect(mathUtils.toFixed(345.27649047, 4)).toBeCloseTo(345.2764);
      expect(mathUtils.toFixed(345.27649047, 8)).toBeCloseTo(345.27649047);
    });

    test('removes trailing zeros after decimal point', () => {
      expect(mathUtils.toFixed(45.000, 4)).toBe(45);
    });

    test('nothing happens when rounding by more decimal places than number has', () => {
      expect(mathUtils.toFixed(345.27649047, 15)).toBeCloseTo(345.27649047, 15);
    });

    describe('very large numbers', () => {
      // this is because `99^99 == 3.697296376497263e+197`,
      // which is NOT "3 point ..." but a far greater number
      test('does not strip decimal place in very large numbers that is part of the number', () => {
        expect(mathUtils.toFixed(99 ** 99)).toBe(99 ** 99);
        expect(mathUtils.toFixed(99 ** 99, 1)).toBe(99 ** 99);
        expect(mathUtils.toFixed(99 ** 99, 5)).toBe(99 ** 99);
        expect(mathUtils.toFixed(99 ** 99, 7)).toBe(99 ** 99);
      });

      test('Infinity is unmodified', () => {
        expect(mathUtils.toFixed(Infinity)).toBe(Infinity);
        expect(mathUtils.toFixed(Infinity, 1)).toBe(Infinity);
        expect(mathUtils.toFixed(Infinity, 5)).toBe(Infinity);
      });
    });
  });
});
