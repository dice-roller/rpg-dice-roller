import { diceUtils, exportFormats } from '../../src/utilities/utils.js';

describe('Export formats', () => {
  test('contains all formats', () => {
    expect(exportFormats).toBeInstanceOf(Object);

    expect(exportFormats).toEqual({
      BASE_64: expect.any(Number),
      JSON: expect.any(Number),
      OBJECT: expect.any(Number),
    });
  });
});

describe('Utilities', () => {
  test('model structure', () => {
    expect(diceUtils).toEqual(expect.objectContaining({
      compareNumbers: expect.any(Function),
      isBase64: expect.any(Function),
      isJson: expect.any(Function),
      isNumeric: expect.any(Function),
      sumArray: expect.any(Function),
      toFixed: expect.any(Function),
    }));
  });

  describe('isNumeric', () => {
    test('returns true for values of type number', () => {
      expect(diceUtils.isNumeric(1)).toBe(true);
      expect(diceUtils.isNumeric(0)).toBe(true);
      expect(diceUtils.isNumeric(54)).toBe(true);
      expect(diceUtils.isNumeric(3.56)).toBe(true);
      expect(diceUtils.isNumeric(-156)).toBe(true);
      expect(diceUtils.isNumeric(3890)).toBe(true);
    });

    test('returns true for numeric strings', () => {
      expect(diceUtils.isNumeric('1')).toBe(true);
      expect(diceUtils.isNumeric('0')).toBe(true);
      expect(diceUtils.isNumeric('54')).toBe(true);
      expect(diceUtils.isNumeric('3.56')).toBe(true);
      expect(diceUtils.isNumeric('-156')).toBe(true);
      expect(diceUtils.isNumeric('3890')).toBe(true);
    });

    test('returns false for non-numeric values', () => {
      expect(diceUtils.isNumeric(NaN)).toBe(false);
      expect(diceUtils.isNumeric('foo')).toBe(false);
      expect(diceUtils.isNumeric({})).toBe(false);
      expect(diceUtils.isNumeric([])).toBe(false);
      expect(diceUtils.isNumeric(true)).toBe(false);
      expect(diceUtils.isNumeric(false)).toBe(false);
      expect(diceUtils.isNumeric(null)).toBe(false);
      expect(diceUtils.isNumeric(undefined)).toBe(false);
    });

    test('returns false for string containing both numeric and non-numeric values', () => {
      expect(diceUtils.isNumeric('10foo')).toBe(false);
      expect(diceUtils.isNumeric('foo10')).toBe(false);
    });

    test('returns true for very large numbers', () => {
      expect(diceUtils.isNumeric(99 ** 99)).toBe(true);
      expect(diceUtils.isNumeric((99 ** 99).toString())).toBe(true);
    });

    test('returns false for `Infinity`', () => {
      expect(diceUtils.isNumeric(Infinity)).toBe(false);
    });
  });

  describe('isBase64', () => {
    test('returns true for base64 encoded string', () => {
      let encodedString = btoa('foo');
      expect(diceUtils.isBase64(encodedString)).toBe(true);

      encodedString = btoa('{"foo": "bar"}');
      expect(diceUtils.isBase64(encodedString)).toBe(true);

      encodedString = btoa(true);
      expect(diceUtils.isBase64(encodedString)).toBe(true);

      encodedString = btoa({});
      expect(diceUtils.isBase64(encodedString)).toBe(true);

      encodedString = btoa(['foo', 'bar']);
      expect(diceUtils.isBase64(encodedString)).toBe(true);
    });

    test('returns false for non-base64 encoded string', () => {
      expect(diceUtils.isBase64(156)).toBe(false);
      expect(diceUtils.isBase64('foo')).toBe(false);
      expect(diceUtils.isBase64({})).toBe(false);
      expect(diceUtils.isBase64([])).toBe(false);
      expect(diceUtils.isBase64(true)).toBe(false);
      expect(diceUtils.isBase64(false)).toBe(false);
      expect(diceUtils.isBase64(null)).toBe(false);
      expect(diceUtils.isBase64(undefined)).toBe(false);
      expect(diceUtils.isBase64(NaN)).toBe(false);
    });
  });

  describe('isJson', () => {
    test('returns true for JSON encoded strings', () => {
      expect(diceUtils.isJson(JSON.stringify({ foo: 'bar' }))).toBe(true);
      expect(diceUtils.isJson(JSON.stringify(['foo', 'bar']))).toBe(true);
      expect(diceUtils.isJson(JSON.stringify({}))).toBe(true);
      expect(diceUtils.isJson(JSON.stringify([]))).toBe(true);
    });

    test('returns false for invalid strings', () => {
      expect(diceUtils.isJson(JSON.stringify('foo'))).toBe(false);
      expect(diceUtils.isJson(JSON.stringify(124))).toBe(false);
      expect(diceUtils.isJson(JSON.stringify(true))).toBe(false);
      expect(diceUtils.isJson(JSON.stringify(false))).toBe(false);
    });

    test('returns false for invalid data', () => {
      expect(diceUtils.isJson()).toBe(false);
      expect(diceUtils.isJson('foo')).toBe(false);
      expect(diceUtils.isJson(124)).toBe(false);
      expect(diceUtils.isJson(true)).toBe(false);
      expect(diceUtils.isJson(false)).toBe(false);
      expect(diceUtils.isJson([])).toBe(false);
      expect(diceUtils.isJson({})).toBe(false);
    });
  });

  describe('isSafeNumber', () => {
    test('returns true for values within the "safe" range', () => {
      expect(diceUtils.isSafeNumber(1)).toBe(true);
      expect(diceUtils.isSafeNumber(567689584)).toBe(true);
      expect(diceUtils.isSafeNumber(721984.6432876523)).toBe(true);
      expect(diceUtils.isSafeNumber(Number.MIN_SAFE_INTEGER + 1)).toBe(true);
      expect(diceUtils.isSafeNumber(Number.MAX_SAFE_INTEGER - 1)).toBe(true);
    });

    test('returns true for the min', () => {
      expect(diceUtils.isSafeNumber(Number.MIN_SAFE_INTEGER)).toBe(true);
    });

    test('returns true for the max', () => {
      expect(diceUtils.isSafeNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    test('returns false for numbers under the min', () => {
      expect(diceUtils.isSafeNumber(Number.MIN_SAFE_INTEGER - 1)).toBe(false);
      expect(diceUtils.isSafeNumber(Number.MIN_SAFE_INTEGER - 500)).toBe(false);
      expect(diceUtils.isSafeNumber(Number.MIN_SAFE_INTEGER - 1564367.4325671)).toBe(false);
    });

    test('returns false for numbers over the max', () => {
      expect(diceUtils.isSafeNumber(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
      expect(diceUtils.isSafeNumber(Number.MAX_SAFE_INTEGER + 500)).toBe(false);
      expect(diceUtils.isSafeNumber(Number.MAX_SAFE_INTEGER + 1564367.432567)).toBe(false);
      expect(diceUtils.isSafeNumber(Infinity)).toBe(false);
    });

    test('returns false for non-numeric values', () => {
      expect(diceUtils.isSafeNumber('foo')).toBe(false);
      expect(diceUtils.isSafeNumber([])).toBe(false);
      expect(diceUtils.isSafeNumber({})).toBe(false);
      expect(diceUtils.isSafeNumber(true)).toBe(false);
      expect(diceUtils.isSafeNumber(false)).toBe(false);
      expect(diceUtils.isSafeNumber(null)).toBe(false);
      expect(diceUtils.isSafeNumber(undefined)).toBe(false);
    });
  });

  describe('sumArray', () => {
    test('Sums the values of an array', () => {
      expect(diceUtils.sumArray([4, 6, 234, 14.05, -4])).toBeCloseTo(254.05);
    });

    test('Sums the values of an array of numerical strings', () => {
      expect(diceUtils.sumArray(['4', '6', '234', '14.05', '-4'])).toBeCloseTo(254.05);
    });

    test('Non-numerical values are ignored / treated as zero', () => {
      expect(diceUtils.sumArray([4, 5, 'foo', {}, 6])).toBe(15);
    });

    test('returns 0 if not an array', () => {
      expect(diceUtils.sumArray('foo')).toBe(0);
    });
  });

  describe('compareNumbers', () => {
    test('returns false if no operator specified', () => {
      expect(diceUtils.compareNumbers(1, 1)).toBe(false);
      expect(diceUtils.compareNumbers(1, 45)).toBe(false);
      expect(diceUtils.compareNumbers(4, 67)).toBe(false);
      expect(diceUtils.compareNumbers(67, 67)).toBe(false);
    });

    test('returns false if operator is unrecognised', () => {
      expect(diceUtils.compareNumbers(1, 1, 'foo')).toBe(false);
      expect(diceUtils.compareNumbers(1, 45, {})).toBe(false);
      expect(diceUtils.compareNumbers(4, 67, true)).toBe(false);
      expect(diceUtils.compareNumbers(67, 67, false)).toBe(false);
    });

    test('returns false if values are not numeric', () => {
      expect(diceUtils.compareNumbers('foo', 'foo', '=')).toBe(false);
      expect(diceUtils.compareNumbers('foo', 'bar', '=')).toBe(false);
      expect(diceUtils.compareNumbers('foo', 3, '=')).toBe(false);
      expect(diceUtils.compareNumbers(3, 'foo', '=')).toBe(false);
    });

    describe('`=` and `==`', () => {
      test('returns true if `a = b`', () => {
        expect(diceUtils.compareNumbers(1, 1, '=')).toBe(true);
        expect(diceUtils.compareNumbers(45, 45, '=')).toBe(true);
        expect(diceUtils.compareNumbers(-1.03, -1.03, '=')).toBe(true);

        expect(diceUtils.compareNumbers(1, 1, '==')).toBe(true);
        expect(diceUtils.compareNumbers(45, 45, '==')).toBe(true);
        expect(diceUtils.compareNumbers(-1.03, -1.03, '==')).toBe(true);
      });

      test('returns false if `a != b`', () => {
        expect(diceUtils.compareNumbers(1, 4, '=')).toBe(false);
        expect(diceUtils.compareNumbers(643, 0.45, '=')).toBe(false);
        expect(diceUtils.compareNumbers(0, -1, '=')).toBe(false);

        expect(diceUtils.compareNumbers(1, 4, '==')).toBe(false);
        expect(diceUtils.compareNumbers(643, 0.45, '==')).toBe(false);
        expect(diceUtils.compareNumbers(0, -1, '==')).toBe(false);
      });
    });

    describe('`<`', () => {
      test('returns true if `a < b`', () => {
        expect(diceUtils.compareNumbers(1, 5, '<')).toBe(true);
        expect(diceUtils.compareNumbers(-5, -4, '<')).toBe(true);
        expect(diceUtils.compareNumbers(145.05, 145.06, '<')).toBe(true);
      });

      test('returns false if `a >= b`', () => {
        expect(diceUtils.compareNumbers(1, 0, '<')).toBe(false);
        expect(diceUtils.compareNumbers(-5, -16, '<')).toBe(false);
        expect(diceUtils.compareNumbers(145.05, 145.04, '<')).toBe(false);

        expect(diceUtils.compareNumbers(1, 1, '<')).toBe(false);
        expect(diceUtils.compareNumbers(-5, -5, '<')).toBe(false);
        expect(diceUtils.compareNumbers(145.05, 145.05, '<')).toBe(false);
      });
    });

    describe('`>', () => {
      test('returns true if `a > b`', () => {
        expect(diceUtils.compareNumbers(5, 1, '>')).toBe(true);
        expect(diceUtils.compareNumbers(-1, -5, '>')).toBe(true);
        expect(diceUtils.compareNumbers(145.06, 145.05, '>')).toBe(true);
      });

      test('returns false if `a <= b`', () => {
        expect(diceUtils.compareNumbers(0, 1, '>')).toBe(false);
        expect(diceUtils.compareNumbers(-16, -5, '>')).toBe(false);
        expect(diceUtils.compareNumbers(145.04, 145.05, '>')).toBe(false);

        expect(diceUtils.compareNumbers(1, 1, '>')).toBe(false);
        expect(diceUtils.compareNumbers(-5, -5, '>')).toBe(false);
        expect(diceUtils.compareNumbers(145.05, 145.05, '>')).toBe(false);
      });
    });

    describe('`<=', () => {
      test('returns true if `a < b`', () => {
        expect(diceUtils.compareNumbers(0, 1, '<=')).toBe(true);
        expect(diceUtils.compareNumbers(-16, -5, '<=')).toBe(true);
        expect(diceUtils.compareNumbers(145.04, 145.05, '<=')).toBe(true);
      });

      test('returns true if `a = b`', () => {
        expect(diceUtils.compareNumbers(1, 1, '<=')).toBe(true);
        expect(diceUtils.compareNumbers(-5, -5, '<=')).toBe(true);
        expect(diceUtils.compareNumbers(145.05, 145.05, '<=')).toBe(true);
      });

      test('returns false if `a > b`', () => {
        expect(diceUtils.compareNumbers(5, 1, '<=')).toBe(false);
        expect(diceUtils.compareNumbers(-1, -5, '<=')).toBe(false);
        expect(diceUtils.compareNumbers(145.06, 145.05, '<=')).toBe(false);
      });
    });

    describe('`>=', () => {
      test('returns true if `a > b`', () => {
        expect(diceUtils.compareNumbers(5, 1, '>=')).toBe(true);
        expect(diceUtils.compareNumbers(-1, -5, '>=')).toBe(true);
        expect(diceUtils.compareNumbers(145.06, 145.05, '>=')).toBe(true);
      });

      test('returns true if `a = b`', () => {
        expect(diceUtils.compareNumbers(1, 1, '>=')).toBe(true);
        expect(diceUtils.compareNumbers(-5, -5, '>=')).toBe(true);
        expect(diceUtils.compareNumbers(145.05, 145.05, '>=')).toBe(true);
      });

      test('returns false if `a < b`', () => {
        expect(diceUtils.compareNumbers(0, 1, '>=')).toBe(false);
        expect(diceUtils.compareNumbers(-16, -5, '>=')).toBe(false);
        expect(diceUtils.compareNumbers(145.04, 145.05, '>=')).toBe(false);
      });
    });

    describe('`!` and `!=`', () => {
      test('returns true if `a != b`', () => {
        expect(diceUtils.compareNumbers(1, 4, '!')).toBe(true);
        expect(diceUtils.compareNumbers(643, 0.45, '!')).toBe(true);
        expect(diceUtils.compareNumbers(0, -1, '!')).toBe(true);

        expect(diceUtils.compareNumbers(1, 4, '!=')).toBe(true);
        expect(diceUtils.compareNumbers(643, 0.45, '!=')).toBe(true);
        expect(diceUtils.compareNumbers(0, -1, '!=')).toBe(true);
      });

      test('returns false if `a = b`', () => {
        expect(diceUtils.compareNumbers(1, 1, '!')).toBe(false);
        expect(diceUtils.compareNumbers(45, 45, '!')).toBe(false);
        expect(diceUtils.compareNumbers(-1.03, -1.03, '!')).toBe(false);

        expect(diceUtils.compareNumbers(1, 1, '!=')).toBe(false);
        expect(diceUtils.compareNumbers(45, 45, '!=')).toBe(false);
        expect(diceUtils.compareNumbers(-1.03, -1.03, '!=')).toBe(false);
      });
    });

    describe('Very large numbers', () => {
      describe('Infinity', () => {
        test('can compare Infinity with itself', () => {
          expect(diceUtils.compareNumbers(Infinity, Infinity, '=')).toBe(true);
          expect(diceUtils.compareNumbers(Infinity, Infinity, '<=')).toBe(true);
          expect(diceUtils.compareNumbers(Infinity, Infinity, '>=')).toBe(true);

          expect(diceUtils.compareNumbers(Infinity, Infinity, '>')).toBe(false);
          expect(diceUtils.compareNumbers(Infinity, Infinity, '<')).toBe(false);
          expect(diceUtils.compareNumbers(Infinity, Infinity, '!')).toBe(false);
        });

        test('can compare Infinity with other numbers', () => {
          expect(diceUtils.compareNumbers(Infinity, 7, '>')).toBe(true);
          expect(diceUtils.compareNumbers(Infinity, 99 ** 99, '>')).toBe(true);

          expect(diceUtils.compareNumbers(Infinity, 7, '=')).toBe(false);
          expect(diceUtils.compareNumbers(Infinity, 1000000, '=')).toBe(false);
          expect(diceUtils.compareNumbers(Infinity, 99 ** 99, '=')).toBe(false);
          expect(diceUtils.compareNumbers(Infinity, 99 ** 99, '<')).toBe(false);
        });
      });

      describe('Unsafe integer `99^99`', () => {
        // this is an important test - calling `parseInt(99 ** 99)` will incorrectly return `3`
        test('does not get incorrectly rounded to `3`', () => {
          expect(diceUtils.compareNumbers(99 ** 99, 3, '>')).toBe(true);
          expect(diceUtils.compareNumbers(99 ** 99, Number.MAX_SAFE_INTEGER, '>')).toBe(true);

          expect(diceUtils.compareNumbers(99 ** 99, 3, '=')).toBe(false);
        });

        test('can compare `99^99` with itself', () => {
          expect(diceUtils.compareNumbers(99 ** 99, 99 ** 99, '=')).toBe(true);
          expect(diceUtils.compareNumbers(99 ** 99, 99 ** 99, '<=')).toBe(true);
          expect(diceUtils.compareNumbers(99 ** 99, 99 ** 99, '>=')).toBe(true);

          expect(diceUtils.compareNumbers(99 ** 99, 99 ** 99, '>')).toBe(false);
          expect(diceUtils.compareNumbers(99 ** 99, 99 ** 99, '<')).toBe(false);
          expect(diceUtils.compareNumbers(99 ** 99, 99 ** 99, '!')).toBe(false);
        });

        test('can compare `99^99` with other numbers', () => {
          expect(diceUtils.compareNumbers(99 ** 99, 900, '>')).toBe(true);
          expect(diceUtils.compareNumbers(99 ** 99, 2, '>=')).toBe(true);
          expect(diceUtils.compareNumbers(99 ** 99, 890, '!')).toBe(true);

          expect(diceUtils.compareNumbers(99 ** 99, 56468, '=')).toBe(false);
          expect(diceUtils.compareNumbers(99 ** 99, 0.45, '<')).toBe(false);
          expect(diceUtils.compareNumbers(99 ** 99, -67, '<=')).toBe(false);
        });
      });
    });
  });

  describe('toFixed', () => {
    test('`decPlaces` defaults to `0`', () => {
      expect(diceUtils.toFixed(345.27649047)).toBe(345);
    });

    test('rounds to decimal places', () => {
      expect(diceUtils.toFixed(345.27649047, 1)).toBeCloseTo(345.3);
      expect(diceUtils.toFixed(345.27649047, 2)).toBeCloseTo(345.28);
      expect(diceUtils.toFixed(345.27649047, 4)).toBeCloseTo(345.2764);
      expect(diceUtils.toFixed(345.27649047, 8)).toBeCloseTo(345.27649047);
    });

    test('removes trailing zeros after decimal point', () => {
      expect(diceUtils.toFixed(45.000, 4)).toBe(45);
    });

    test('nothing happens when rounding by more decimal places than number has', () => {
      expect(diceUtils.toFixed(345.27649047, 15)).toBeCloseTo(345.27649047, 15);
    });

    describe('very large numbers', () => {
      // this is because `99^99 == 3.697296376497263e+197`,
      // which is NOT "3 point ..." but a far greater number
      test('does not strip decimal place in very large numbers that is part of the number', () => {
        expect(diceUtils.toFixed(99 ** 99)).toBe(99 ** 99);
        expect(diceUtils.toFixed(99 ** 99, 1)).toBe(99 ** 99);
        expect(diceUtils.toFixed(99 ** 99, 5)).toBe(99 ** 99);
        expect(diceUtils.toFixed(99 ** 99, 7)).toBe(99 ** 99);
      });

      test('Infinity is unmodified', () => {
        expect(diceUtils.toFixed(Infinity)).toBe(Infinity);
        expect(diceUtils.toFixed(Infinity, 1)).toBe(Infinity);
        expect(diceUtils.toFixed(Infinity, 5)).toBe(Infinity);
      });
    });
  });
});
