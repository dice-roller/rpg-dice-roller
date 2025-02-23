import * as mathUtils from '../../../src/utilities/math';
import { ComparisonOperator } from "../../../src/types/Enums/ComparisonOperator";

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
      // @ts-expect-error testing missing argument
      expect(mathUtils.compareNumbers(1, 1)).toBe(false);
      // @ts-expect-error testing missing argument
      expect(mathUtils.compareNumbers(1, 45)).toBe(false);
      // @ts-expect-error testing missing argument
      expect(mathUtils.compareNumbers(4, 67)).toBe(false);
      // @ts-expect-error testing missing argument
      expect(mathUtils.compareNumbers(67, 67)).toBe(false);
    });

    test('returns false if operator is unrecognised', () => {
      // @ts-expect-error testing invalid value
      expect(mathUtils.compareNumbers(1, 1, 'foo')).toBe(false);
      // @ts-expect-error testing invalid value
      expect(mathUtils.compareNumbers(1, 45, {})).toBe(false);
      // @ts-expect-error testing invalid value
      expect(mathUtils.compareNumbers(4, 67, true)).toBe(false);
      // @ts-expect-error testing invalid value
      expect(mathUtils.compareNumbers(67, 67, false)).toBe(false);
    });

    test('returns false if values are not numeric', () => {
      // @ts-expect-error testing invalid value
      expect(mathUtils.compareNumbers('foo', 'foo', ComparisonOperator.Equal)).toBe(false);
      // @ts-expect-error testing invalid value
      expect(mathUtils.compareNumbers('foo', 'bar', ComparisonOperator.Equal)).toBe(false);
      // @ts-expect-error testing invalid value
      expect(mathUtils.compareNumbers('foo', 3, ComparisonOperator.Equal)).toBe(false);
      // @ts-expect-error testing invalid value
      expect(mathUtils.compareNumbers(3, 'foo', ComparisonOperator.Equal)).toBe(false);
    });

    describe('`=` and `==`', () => {
      test('returns true if `a = b`', () => {
        expect(mathUtils.compareNumbers(1, 1, ComparisonOperator.Equal)).toBe(true);
        expect(mathUtils.compareNumbers(45, 45, ComparisonOperator.Equal)).toBe(true);
        expect(mathUtils.compareNumbers(-1.03, -1.03, ComparisonOperator.Equal)).toBe(true);

        expect(mathUtils.compareNumbers(1, 1, ComparisonOperator.EqualDouble)).toBe(true);
        expect(mathUtils.compareNumbers(45, 45, ComparisonOperator.EqualDouble)).toBe(true);
        expect(mathUtils.compareNumbers(-1.03, -1.03, ComparisonOperator.EqualDouble)).toBe(true);
      });

      test('returns false if `a != b`', () => {
        expect(mathUtils.compareNumbers(1, 4, ComparisonOperator.Equal)).toBe(false);
        expect(mathUtils.compareNumbers(643, 0.45, ComparisonOperator.Equal)).toBe(false);
        expect(mathUtils.compareNumbers(0, -1, ComparisonOperator.Equal)).toBe(false);

        expect(mathUtils.compareNumbers(1, 4, ComparisonOperator.EqualDouble)).toBe(false);
        expect(mathUtils.compareNumbers(643, 0.45, ComparisonOperator.EqualDouble)).toBe(false);
        expect(mathUtils.compareNumbers(0, -1, ComparisonOperator.EqualDouble)).toBe(false);
      });
    });

    describe('`<`', () => {
      test('returns true if `a < b`', () => {
        expect(mathUtils.compareNumbers(1, 5, ComparisonOperator.LessThan)).toBe(true);
        expect(mathUtils.compareNumbers(-5, -4, ComparisonOperator.LessThan)).toBe(true);
        expect(mathUtils.compareNumbers(145.05, 145.06, ComparisonOperator.LessThan)).toBe(true);
      });

      test('returns false if `a >= b`', () => {
        expect(mathUtils.compareNumbers(1, 0, ComparisonOperator.LessThan)).toBe(false);
        expect(mathUtils.compareNumbers(-5, -16, ComparisonOperator.LessThan)).toBe(false);
        expect(mathUtils.compareNumbers(145.05, 145.04, ComparisonOperator.LessThan)).toBe(false);

        expect(mathUtils.compareNumbers(1, 1, ComparisonOperator.LessThan)).toBe(false);
        expect(mathUtils.compareNumbers(-5, -5, ComparisonOperator.LessThan)).toBe(false);
        expect(mathUtils.compareNumbers(145.05, 145.05, ComparisonOperator.LessThan)).toBe(false);
      });
    });

    describe('`>`', () => {
      test('returns true if `a > b`', () => {
        expect(mathUtils.compareNumbers(5, 1, ComparisonOperator.GreaterThan)).toBe(true);
        expect(mathUtils.compareNumbers(-1, -5, ComparisonOperator.GreaterThan)).toBe(true);
        expect(mathUtils.compareNumbers(145.06, 145.05, ComparisonOperator.GreaterThan)).toBe(true);
      });

      test('returns false if `a <= b`', () => {
        expect(mathUtils.compareNumbers(0, 1, ComparisonOperator.GreaterThan)).toBe(false);
        expect(mathUtils.compareNumbers(-16, -5, ComparisonOperator.GreaterThan)).toBe(false);
        expect(mathUtils.compareNumbers(145.04, 145.05, ComparisonOperator.GreaterThan)).toBe(false);

        expect(mathUtils.compareNumbers(1, 1, ComparisonOperator.GreaterThan)).toBe(false);
        expect(mathUtils.compareNumbers(-5, -5, ComparisonOperator.GreaterThan)).toBe(false);
        expect(mathUtils.compareNumbers(145.05, 145.05, ComparisonOperator.GreaterThan)).toBe(false);
      });
    });

    describe('`<=`', () => {
      test('returns true if `a < b`', () => {
        expect(mathUtils.compareNumbers(0, 1, ComparisonOperator.LessThanOrEqual)).toBe(true);
        expect(mathUtils.compareNumbers(-16, -5, ComparisonOperator.LessThanOrEqual)).toBe(true);
        expect(mathUtils.compareNumbers(145.04, 145.05, ComparisonOperator.LessThanOrEqual)).toBe(true);
      });

      test('returns true if `a = b`', () => {
        expect(mathUtils.compareNumbers(1, 1, ComparisonOperator.LessThanOrEqual)).toBe(true);
        expect(mathUtils.compareNumbers(-5, -5, ComparisonOperator.LessThanOrEqual)).toBe(true);
        expect(mathUtils.compareNumbers(145.05, 145.05, ComparisonOperator.LessThanOrEqual)).toBe(true);
      });

      test('returns false if `a > b`', () => {
        expect(mathUtils.compareNumbers(5, 1, ComparisonOperator.LessThanOrEqual)).toBe(false);
        expect(mathUtils.compareNumbers(-1, -5, ComparisonOperator.LessThanOrEqual)).toBe(false);
        expect(mathUtils.compareNumbers(145.06, 145.05, ComparisonOperator.LessThanOrEqual)).toBe(false);
      });
    });

    describe('`>=`', () => {
      test('returns true if `a > b`', () => {
        expect(mathUtils.compareNumbers(5, 1, ComparisonOperator.GreaterThanOrEqual)).toBe(true);
        expect(mathUtils.compareNumbers(-1, -5, ComparisonOperator.GreaterThanOrEqual)).toBe(true);
        expect(mathUtils.compareNumbers(145.06, 145.05, ComparisonOperator.GreaterThanOrEqual)).toBe(true);
      });

      test('returns true if `a = b`', () => {
        expect(mathUtils.compareNumbers(1, 1, ComparisonOperator.GreaterThanOrEqual)).toBe(true);
        expect(mathUtils.compareNumbers(-5, -5, ComparisonOperator.GreaterThanOrEqual)).toBe(true);
        expect(mathUtils.compareNumbers(145.05, 145.05, ComparisonOperator.GreaterThanOrEqual)).toBe(true);
      });

      test('returns false if `a < b`', () => {
        expect(mathUtils.compareNumbers(0, 1, ComparisonOperator.GreaterThanOrEqual)).toBe(false);
        expect(mathUtils.compareNumbers(-16, -5, ComparisonOperator.GreaterThanOrEqual)).toBe(false);
        expect(mathUtils.compareNumbers(145.04, 145.05, ComparisonOperator.GreaterThanOrEqual)).toBe(false);
      });
    });

    describe('`!` and `!=`', () => {
      test('returns true if `a != b`', () => {
        expect(mathUtils.compareNumbers(1, 4, ComparisonOperator.NotEqualSimple)).toBe(true);
        expect(mathUtils.compareNumbers(643, 0.45, ComparisonOperator.NotEqualSimple)).toBe(true);
        expect(mathUtils.compareNumbers(0, -1, ComparisonOperator.NotEqualSimple)).toBe(true);

        expect(mathUtils.compareNumbers(1, 4, ComparisonOperator.NotEqual)).toBe(true);
        expect(mathUtils.compareNumbers(643, 0.45, ComparisonOperator.NotEqual)).toBe(true);
        expect(mathUtils.compareNumbers(0, -1, ComparisonOperator.NotEqual)).toBe(true);
      });

      test('returns false if `a = b`', () => {
        expect(mathUtils.compareNumbers(1, 1, ComparisonOperator.NotEqualSimple)).toBe(false);
        expect(mathUtils.compareNumbers(45, 45, ComparisonOperator.NotEqualSimple)).toBe(false);
        expect(mathUtils.compareNumbers(-1.03, -1.03, ComparisonOperator.NotEqualSimple)).toBe(false);

        expect(mathUtils.compareNumbers(1, 1, ComparisonOperator.NotEqual)).toBe(false);
        expect(mathUtils.compareNumbers(45, 45, ComparisonOperator.NotEqual)).toBe(false);
        expect(mathUtils.compareNumbers(-1.03, -1.03, ComparisonOperator.NotEqual)).toBe(false);
      });
    });

    describe('`<>`', () => {
      test('returns true if `a <> b`', () => {
        expect(mathUtils.compareNumbers(1, 4, ComparisonOperator.NotEqualArrows)).toBe(true);
        expect(mathUtils.compareNumbers(643, 0.45, ComparisonOperator.NotEqualArrows)).toBe(true);
        expect(mathUtils.compareNumbers(0, -1, ComparisonOperator.NotEqualArrows)).toBe(true);
      });

      test('returns false if `a = b`', () => {
        expect(mathUtils.compareNumbers(1, 1, ComparisonOperator.NotEqualArrows)).toBe(false);
        expect(mathUtils.compareNumbers(45, 45, ComparisonOperator.NotEqualArrows)).toBe(false);
        expect(mathUtils.compareNumbers(-1.03, -1.03, ComparisonOperator.NotEqualArrows)).toBe(false);
      });
    });

    describe('Very large numbers', () => {
      describe('Infinity', () => {
        test('can compare Infinity with itself', () => {
          expect(mathUtils.compareNumbers(Infinity, Infinity, ComparisonOperator.Equal)).toBe(true);
          expect(mathUtils.compareNumbers(Infinity, Infinity, ComparisonOperator.LessThanOrEqual)).toBe(true);
          expect(mathUtils.compareNumbers(Infinity, Infinity, ComparisonOperator.GreaterThanOrEqual)).toBe(true);

          expect(mathUtils.compareNumbers(Infinity, Infinity, ComparisonOperator.GreaterThan)).toBe(false);
          expect(mathUtils.compareNumbers(Infinity, Infinity, ComparisonOperator.LessThan)).toBe(false);
          expect(mathUtils.compareNumbers(Infinity, Infinity, ComparisonOperator.NotEqualSimple)).toBe(false);
        });

        test('can compare Infinity with other numbers', () => {
          expect(mathUtils.compareNumbers(Infinity, 7, ComparisonOperator.GreaterThan)).toBe(true);
          expect(mathUtils.compareNumbers(Infinity, 99 ** 99, ComparisonOperator.GreaterThan)).toBe(true);

          expect(mathUtils.compareNumbers(Infinity, 7, ComparisonOperator.Equal)).toBe(false);
          expect(mathUtils.compareNumbers(Infinity, 1000000, ComparisonOperator.Equal)).toBe(false);
          expect(mathUtils.compareNumbers(Infinity, 99 ** 99, ComparisonOperator.Equal)).toBe(false);
          expect(mathUtils.compareNumbers(Infinity, 99 ** 99, ComparisonOperator.LessThan)).toBe(false);
        });
      });

      describe('Unsafe integer `99^99`', () => {
        // this is an important test - calling `parseInt(99 ** 99)` will incorrectly return `3`
        test('does not get incorrectly rounded to `3`', () => {
          expect(mathUtils.compareNumbers(99 ** 99, 3, ComparisonOperator.GreaterThan)).toBe(true);
          expect(mathUtils.compareNumbers(99 ** 99, Number.MAX_SAFE_INTEGER, ComparisonOperator.GreaterThan)).toBe(true);

          expect(mathUtils.compareNumbers(99 ** 99, 3, ComparisonOperator.Equal)).toBe(false);
        });

        test('can compare `99^99` with itself', () => {
          expect(mathUtils.compareNumbers(99 ** 99, 99 ** 99, ComparisonOperator.Equal)).toBe(true);
          expect(mathUtils.compareNumbers(99 ** 99, 99 ** 99, ComparisonOperator.LessThanOrEqual)).toBe(true);
          expect(mathUtils.compareNumbers(99 ** 99, 99 ** 99, ComparisonOperator.GreaterThanOrEqual)).toBe(true);

          expect(mathUtils.compareNumbers(99 ** 99, 99 ** 99, ComparisonOperator.GreaterThan)).toBe(false);
          expect(mathUtils.compareNumbers(99 ** 99, 99 ** 99, ComparisonOperator.LessThan)).toBe(false);
          expect(mathUtils.compareNumbers(99 ** 99, 99 ** 99, ComparisonOperator.NotEqualSimple)).toBe(false);
        });

        test('can compare `99^99` with other numbers', () => {
          expect(mathUtils.compareNumbers(99 ** 99, 900, ComparisonOperator.GreaterThan)).toBe(true);
          expect(mathUtils.compareNumbers(99 ** 99, 2, ComparisonOperator.GreaterThanOrEqual)).toBe(true);
          expect(mathUtils.compareNumbers(99 ** 99, 890, ComparisonOperator.NotEqualSimple)).toBe(true);

          expect(mathUtils.compareNumbers(99 ** 99, 56468, ComparisonOperator.Equal)).toBe(false);
          expect(mathUtils.compareNumbers(99 ** 99, 0.45, ComparisonOperator.LessThan)).toBe(false);
          expect(mathUtils.compareNumbers(99 ** 99, -67, ComparisonOperator.LessThanOrEqual)).toBe(false);
        });
      });
    });
  });

  describe('sumArray', () => {
    test('Sums the values of an array', () => {
      expect(mathUtils.sumArray([4, 6, 234, 14.05, -4])).toBeCloseTo(254.05);
    });

    test('Sums the values of an array of numerical strings', () => {
      // @ts-expect-error testing with numerical strings
      expect(mathUtils.sumArray(['4', '6', '234', '14.05', '-4'])).toBeCloseTo(254.05);
    });

    test('Non-numerical values are ignored / treated as zero', () => {
      // @ts-expect-error testing with invalid values
      expect(mathUtils.sumArray([4, 5, 'foo', {}, 6])).toBe(15);
    });

    test('returns 0 if not an array', () => {
      // @ts-expect-error testing with invalid value
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
