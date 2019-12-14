import ComparisonModifier from '../../src/modifiers/ComparisonModifier.js';
import ComparePoint from '../../src/ComparePoint.js';
import StandardDice from '../../src/dice/StandardDice.js';
import RollResults from '../../src/results/RollResults.js';

describe('ComparisonModifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const mod = new ComparisonModifier('>8');

      expect(mod).toBeInstanceOf(ComparisonModifier);
      expect(mod).toEqual(expect.objectContaining({
        comparePoint: undefined,
        isComparePoint: expect.any(Function),
        name: 'ComparisonModifier',
        notation: '>8',
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });

    test('constructor requires notation', () => {
      expect(() => {
        new ComparisonModifier();
      }).toThrow('Notation is required');

      expect(() => {
        new ComparisonModifier(false);
      }).toThrow('Notation is required');

      expect(() => {
        new ComparisonModifier(null);
      }).toThrow('Notation is required');

      expect(() => {
        new ComparisonModifier(undefined);
      }).toThrow('Notation is required');
    });
  });

  describe('Compare point', () => {
    test('gets set in constructor', () => {
      const cp = new ComparePoint('>', 8);
      const mod = new ComparisonModifier('>8', cp);

      expect(mod.comparePoint).toBe(cp);
    });

    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'comparePoint', 'set');

      // create the ComparisonModifier
      new ComparisonModifier('>8', new ComparePoint('>', 8));

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('must be instance of ComparePoint', () => {
      const mod = new ComparisonModifier('>8');

      expect(() => {
        mod.comparePoint = 'foo';
      }).toThrow('comparePoint must be instance of ComparePoint');

      expect(() => {
        mod.comparePoint = 1;
      }).toThrow('comparePoint must be instance of ComparePoint');

      expect(() => {
        mod.comparePoint = 0;
      }).toThrow('comparePoint must be instance of ComparePoint');

      expect(() => {
        mod.comparePoint = true;
      }).toThrow('comparePoint must be instance of ComparePoint');

      expect(() => {
        mod.comparePoint = false;
      }).toThrow('comparePoint must be instance of ComparePoint');

      expect(() => {
        mod.comparePoint = [new ComparePoint('>', 8)];
      }).toThrow('comparePoint must be instance of ComparePoint');

      expect(() => {
        mod.comparePoint = {comparePoint: new ComparePoint('>', 8)};
      }).toThrow('comparePoint must be instance of ComparePoint');
    });

    test('cannot unset compare point', () => {
      const mod = new ComparisonModifier('>8');

      expect(() => {
        mod.comparePoint = null;
      }).toThrow('comparePoint must be instance of ComparePoint');

      expect(() => {
        mod.comparePoint = undefined;
      }).toThrow('comparePoint must be instance of ComparePoint');
    });
  });

  describe('Matching', () => {
    test('can match against values', () => {
      const spy = jest.spyOn(ComparePoint.prototype, 'isMatch');
      const mod = new ComparisonModifier('>8', new ComparePoint('>', 8));

      // attempt to match
      expect(mod.isComparePoint(9)).toBe(true);
      expect(mod.isComparePoint(8)).toBe(false);
      expect(mod.isComparePoint(7)).toBe(false);
      expect(mod.isComparePoint(0)).toBe(false);

      expect(spy).toHaveBeenCalledTimes(4);

      // remove the spy
      spy.mockRestore();
    });

    test('with no ComparePoint return false', () => {
      const mod = new ComparisonModifier('>8');

      expect(mod.isComparePoint(9)).toBe(false);
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const mod = new ComparisonModifier('=4', new ComparePoint('=', 4));

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        comparePoint: {
          operator: '=',
          type: 'compare-point',
          value: 4,
        },
        name: 'ComparisonModifier',
        notation: '=4',
        type: 'modifier',
      });
    });

    test('toString output is correct', () => {
      const mod = new ComparisonModifier('=4', new ComparePoint('=', 4));

      expect(mod.toString()).toEqual('=4');
    });
  });

  describe('Run', () => {
    test('returns RollResults object', () => {
      const results = new RollResults();
      const die = new StandardDice('2d6', 6, 2);
      const mod = new ComparisonModifier('=4', new ComparePoint('=', 4));

      expect(mod.run(results, die)).toBe(results);
    });
  });

  describe('Readonly properties', () => {
    test('cannot change name value', () => {
      const mod = new ComparisonModifier('=4');

      expect(() => {
        mod.name = 'Foo';
      }).toThrowError(TypeError);
    });
  });
});
