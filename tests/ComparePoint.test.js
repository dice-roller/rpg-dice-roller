import { CompareOperatorError, RequiredArgumentError } from '../src/exceptions/index.ts';
import ComparePoint from '../src/ComparePoint.ts';

describe('ComparePoint', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const cp = new ComparePoint('=', 4);

      expect(cp).toEqual(expect.objectContaining({
        operator: '=',
        value: 4,
        isMatch: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));

      expect(ComparePoint.isValidOperator).toBeInstanceOf(Function);
    });

    test('constructor requires operator', () => {
      expect(() => {
        new ComparePoint();
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new ComparePoint(false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new ComparePoint(null);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new ComparePoint(undefined);
      }).toThrow(RequiredArgumentError);
    });

    test('constructor requires value', () => {
      expect(() => {
        new ComparePoint('=');
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new ComparePoint('=', false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new ComparePoint('=', null);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new ComparePoint('=', undefined);
      }).toThrow(RequiredArgumentError);
    });
  });

  describe('Property Validation', () => {
    test('can validate operator', () => {
      expect(ComparePoint.isValidOperator('=')).toBe(true);
      expect(ComparePoint.isValidOperator('>')).toBe(true);
      expect(ComparePoint.isValidOperator('>=')).toBe(true);
      expect(ComparePoint.isValidOperator('<')).toBe(true);
      expect(ComparePoint.isValidOperator('<=')).toBe(true);
      expect(ComparePoint.isValidOperator('!=')).toBe(true);
      expect(ComparePoint.isValidOperator('<>')).toBe(true);

      expect(ComparePoint.isValidOperator(0)).toBe(false);
      expect(ComparePoint.isValidOperator([])).toBe(false);
      expect(ComparePoint.isValidOperator(['='])).toBe(false);
      expect(ComparePoint.isValidOperator({})).toBe(false);
      expect(ComparePoint.isValidOperator({ operator: '=' })).toBe(false);
      expect(ComparePoint.isValidOperator('==')).toBe(false);
      expect(ComparePoint.isValidOperator('*')).toBe(false);
      expect(ComparePoint.isValidOperator('4')).toBe(false);
    });

    test('sets operator when valid', () => {
      // create a spy to listen for the ComparePoint.isValidOperator method to have been triggered
      const spy = jest.spyOn(ComparePoint, 'isValidOperator');

      let cp = new ComparePoint('=', 1);
      expect(cp.operator).toEqual('=');
      expect(spy).toHaveBeenCalledWith('=');

      cp = new ComparePoint('>', 1);
      expect(cp.operator).toEqual('>');
      expect(spy).toHaveBeenCalledWith('>');

      cp = new ComparePoint('>=', 1);
      expect(cp.operator).toEqual('>=');
      expect(spy).toHaveBeenCalledWith('>=');

      cp = new ComparePoint('<', 1);
      expect(cp.operator).toEqual('<');
      expect(spy).toHaveBeenCalledWith('<');

      cp = new ComparePoint('<=', 1);
      expect(cp.operator).toEqual('<=');
      expect(spy).toHaveBeenCalledWith('<=');

      cp = new ComparePoint('!=', 1);
      expect(cp.operator).toEqual('!=');
      expect(spy).toHaveBeenCalledWith('!=');

      cp = new ComparePoint('<>', 1);
      expect(cp.operator).toEqual('<>');
      expect(spy).toHaveBeenCalledWith('<>');

      expect(spy).toHaveBeenCalledTimes(7);
      // remove the spy
      spy.mockRestore();
    });

    test('throws error if operator is invalid', () => {
      // create a spy to listen for the ComparePoint.isValidOperator method to have been triggered
      const spy = jest.spyOn(ComparePoint, 'isValidOperator');

      expect(() => {
        new ComparePoint(0);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new ComparePoint([], 2);
      }).toThrow(CompareOperatorError);

      expect(() => {
        new ComparePoint({ operator: '=' }, 2);
      }).toThrow(CompareOperatorError);

      expect(() => {
        new ComparePoint('==', 2);
      }).toThrow(CompareOperatorError);

      expect(() => {
        new ComparePoint('*', 2);
      }).toThrow(CompareOperatorError);

      expect(() => {
        new ComparePoint(4, 2);
      }).toThrow(CompareOperatorError);

      expect(spy).toHaveBeenCalledTimes(5);
      // remove the spy
      spy.mockRestore();
    });

    test('value must be numeric', () => {
      let cp = new ComparePoint('=', 0);
      expect(cp.value).toBe(0);

      cp = new ComparePoint('=', 1);
      expect(cp.value).toBe(1);

      cp = new ComparePoint('=', '345');
      expect(cp.value).toBe(345);

      expect(() => {
        new ComparePoint('=', [4]);
      }).toThrow(TypeError);

      expect(() => {
        new ComparePoint('=', 'foo');
      }).toThrow(TypeError);

      expect(() => {
        new ComparePoint('=', true);
      }).toThrow(TypeError);
    });

    test('value can be negative', () => {
      let cp = new ComparePoint('=', -1);
      expect(cp.value).toBe(-1);

      cp = new ComparePoint('=', -457);
      expect(cp.value).toBe(-457);
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const cp = new ComparePoint('=', 5);

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(cp))).toEqual({
        operator: '=',
        type: 'compare-point',
        value: 5,
      });
    });

    test('String out is correct', () => {
      const cp = new ComparePoint('=', 5);

      expect(cp.toString()).toEqual('=5');
    });
  });

  describe('Modifying', () => {
    test('can change operator', () => {
      const cp = new ComparePoint('=', 5);

      // change the operator
      cp.operator = '>';

      expect(cp.operator).toEqual('>');
      expect(JSON.parse(JSON.stringify(cp))).toEqual(expect.objectContaining({
        operator: '>',
      }));

      expect(cp.toString()).toEqual('>5');
    });

    test('can change compare value', () => {
      const cp = new ComparePoint('=', 5);

      // change the compare value
      cp.value = 10;

      expect(cp.value).toBe(10);
      expect(JSON.parse(JSON.stringify(cp))).toEqual(expect.objectContaining({
        value: 10,
      }));

      expect(cp.toString()).toEqual('=10');
    });
  });

  describe('Matching', () => {
    test('can match exact values', () => {
      const cp = new ComparePoint('=', 5);

      expect(cp.isMatch(5)).toBe(true);
      expect(cp.isMatch(4)).toBe(false);
      expect(cp.isMatch(6)).toBe(false);
      expect(cp.isMatch(0)).toBe(false);
      expect(cp.isMatch(true)).toBe(false);
      expect(cp.isMatch([])).toBe(false);
      expect(cp.isMatch(null)).toBe(false);
      expect(cp.isMatch(undefined)).toBe(false);
    });

    test('can match greater than', () => {
      const cp = new ComparePoint('>', 5);

      expect(cp.isMatch(6)).toBe(true);
      expect(cp.isMatch(5)).toBe(false);
      expect(cp.isMatch(4)).toBe(false);
      expect(cp.isMatch(10)).toBe(true);
    });

    test('can match less than', () => {
      const cp = new ComparePoint('<', 5);

      expect(cp.isMatch(4)).toBe(true);
      expect(cp.isMatch(5)).toBe(false);
      expect(cp.isMatch(6)).toBe(false);
      expect(cp.isMatch(1)).toBe(true);
    });

    test('can match greater than or equal to', () => {
      const cp = new ComparePoint('>=', 5);

      expect(cp.isMatch(6)).toBe(true);
      expect(cp.isMatch(5)).toBe(true);
      expect(cp.isMatch(4)).toBe(false);
      expect(cp.isMatch(10)).toBe(true);
    });

    test('can match less than or equal to', () => {
      const cp = new ComparePoint('<=', 5);

      expect(cp.isMatch(4)).toBe(true);
      expect(cp.isMatch(5)).toBe(true);
      expect(cp.isMatch(6)).toBe(false);
      expect(cp.isMatch(1)).toBe(true);
    });

    describe('can match not equal to', () => {
      test('!=', () => {
        const cp = new ComparePoint('!=', 5);

        expect(cp.isMatch(4)).toBe(true);
        expect(cp.isMatch(5)).toBe(false);
        expect(cp.isMatch(6)).toBe(true);
        expect(cp.isMatch(1)).toBe(true);
      });

      test('<>', () => {
        const cp = new ComparePoint('<>', 5);

        expect(cp.isMatch(4)).toBe(true);
        expect(cp.isMatch(5)).toBe(false);
        expect(cp.isMatch(6)).toBe(true);
        expect(cp.isMatch(1)).toBe(true);
      });
    });

    test('can match exact numeric strings', () => {
      const cp = new ComparePoint('=', 5);

      expect(cp.isMatch('5')).toBe(true);
      expect(cp.isMatch('4')).toBe(false);
    });

    test('truthy values match against 1', () => {
      const cp = new ComparePoint('=', 1);

      expect(cp.isMatch(1)).toBe(true);
      expect(cp.isMatch(true)).toBe(true);
    });

    test('falsey values match against zero', () => {
      const cp = new ComparePoint('=', 0);

      expect(cp.isMatch(0)).toBe(true);
      expect(cp.isMatch(null)).toBe(true);
    });

    test('undefined does not match against zero', () => {
      const cp = new ComparePoint('=', 0);
      expect(cp.isMatch(undefined)).toBe(false);
    });

    describe('Very large numbers', () => {
      test('can compare very large numbers as numbers', () => {
        const cp = new ComparePoint('=', 99 ** 99);

        expect(cp.isMatch(99 ** 99)).toBe(true);
        expect(cp.isMatch(4)).toBe(false);
      });

      test('can compare very large numbers as strings', () => {
        const cp = new ComparePoint('=', (99 ** 99).toString());
        expect(cp.isMatch((99 ** 99).toString())).toBe(true);
        expect(cp.isMatch('4')).toBe(false);
      });

      test('comparing very large numbers does not incorrectly round them', () => {
        // check if 99^99 is greater than 4, because if incorrectly
        // rounding (e.g parseInt) it converts it to `3`
        const cp = new ComparePoint('>', 4);
        expect(cp.isMatch(99 ** 99)).toBe(true);
      });

      test('comparing infinity throws error', () => {
        expect(() => {
          new ComparePoint('=', Infinity);
        }).toThrow(TypeError);
      });
    });
  });
});
