import { StandardDice } from '../../src/dice/index.ts';
import { ComparisonModifier, CriticalFailureModifier } from '../../src/modifiers/index.ts';
import ComparePoint from '../../src/ComparePoint.ts';
import RollResults from '../../src/results/RollResults.ts';

describe('CriticalFailureModifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const mod = new CriticalFailureModifier();

      expect(mod).toBeInstanceOf(CriticalFailureModifier);
      expect(mod).toBeInstanceOf(ComparisonModifier);
      expect(mod).toEqual(expect.objectContaining({
        comparePoint: undefined,
        isComparePoint: expect.any(Function),
        name: 'critical-failure',
        notation: 'cf',
        order: 10,
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });
  });

  describe('Compare point', () => {
    test('gets set in constructor', () => {
      const cp = new ComparePoint('>', 8);
      const mod = new CriticalFailureModifier(cp);

      expect(mod.comparePoint).toBe(cp);
      expect(mod.notation).toEqual('cf>8');
    });

    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(CriticalFailureModifier.prototype, 'comparePoint', 'set');

      // create the modifier
      new CriticalFailureModifier(new ComparePoint('>', 8));

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('must be instance of ComparePoint', () => {
      const mod = new CriticalFailureModifier();

      expect(() => {
        mod.comparePoint = 'foo';
      }).toThrow(TypeError);

      expect(() => {
        mod.comparePoint = 1;
      }).toThrow(TypeError);

      expect(() => {
        mod.comparePoint = 0;
      }).toThrow(TypeError);

      expect(() => {
        mod.comparePoint = true;
      }).toThrow(TypeError);

      expect(() => {
        mod.comparePoint = false;
      }).toThrow(TypeError);

      expect(() => {
        mod.comparePoint = [new ComparePoint('>', 8)];
      }).toThrow(TypeError);

      expect(() => {
        mod.comparePoint = { comparePoint: new ComparePoint('>', 8) };
      }).toThrow(TypeError);
    });

    test('cannot unset compare point', () => {
      const mod = new CriticalFailureModifier();

      expect(() => {
        mod.comparePoint = null;
      }).toThrow(TypeError);

      expect(() => {
        mod.comparePoint = undefined;
      }).toThrow(TypeError);
    });
  });

  describe('Matching', () => {
    test('can match against values', () => {
      const spy = jest.spyOn(ComparePoint.prototype, 'isMatch');
      const mod = new CriticalFailureModifier(new ComparePoint('>', 8));

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
      const mod = new CriticalFailureModifier();

      expect(mod.isComparePoint(9)).toBe(false);
    });
  });

  describe('Notation', () => {
    test('simple notation', () => {
      let mod = new CriticalFailureModifier(new ComparePoint('<', Number.MAX_SAFE_INTEGER));
      expect(mod.notation).toEqual(`cf<${Number.MAX_SAFE_INTEGER}`);

      mod = new CriticalFailureModifier(new ComparePoint('>=', -12.5676));
      expect(mod.notation).toEqual('cf>=-12.5676');

      mod = new CriticalFailureModifier(new ComparePoint('<=', 568));
      expect(mod.notation).toEqual('cf<=568');
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const mod = new CriticalFailureModifier(new ComparePoint('=', 4));

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        comparePoint: {
          operator: '=',
          type: 'compare-point',
          value: 4,
        },
        name: 'critical-failure',
        notation: 'cf=4',
        type: 'modifier',
      });
    });

    test('toString output is correct', () => {
      const mod = new CriticalFailureModifier(new ComparePoint('>', 9));

      expect(mod.toString()).toEqual('cf>9');
    });
  });

  describe('Run', () => {
    test('returns RollResults object', () => {
      const results = new RollResults();
      const die = new StandardDice(6, 2);
      const mod = new CriticalFailureModifier(new ComparePoint('=', 4));

      expect(mod.run(results, die)).toBe(results);
    });

    test('checks roll value against compare point', () => {
      const spy = jest.spyOn(CriticalFailureModifier.prototype, 'isComparePoint');
      const results = new RollResults([
        1, 2, 4, 8, 6,
      ]);
      const mod = new CriticalFailureModifier(new ComparePoint('<=', 2));

      mod.run(results, new StandardDice(6, 5));

      expect(spy).toHaveBeenCalledTimes(5);

      // remove the spy
      spy.mockRestore();
    });

    test('flags failure rolls', () => {
      const results = new RollResults([
        1, 2, 4, 8, 6,
      ]);
      const mod = new CriticalFailureModifier(new ComparePoint('<=', 2));
      const modifiedResults = mod.run(results, new StandardDice(6, 5)).rolls;

      expect(modifiedResults).toBeInstanceOf(Array);
      expect(modifiedResults).toHaveLength(5);

      expect(modifiedResults[0].calculationValue).toBe(1);
      expect(modifiedResults[0].value).toBe(1);
      expect(modifiedResults[0].useInTotal).toBe(true);
      expect(modifiedResults[0].modifiers).toEqual(new Set(['critical-failure']));

      expect(modifiedResults[1].calculationValue).toBe(2);
      expect(modifiedResults[1].value).toBe(2);
      expect(modifiedResults[1].useInTotal).toBe(true);
      expect(modifiedResults[1].modifiers).toEqual(new Set(['critical-failure']));

      expect(modifiedResults[2].calculationValue).toBe(4);
      expect(modifiedResults[2].value).toBe(4);
      expect(modifiedResults[2].useInTotal).toBe(true);
      expect(modifiedResults[2].modifiers).toEqual(new Set());

      expect(modifiedResults[3].calculationValue).toBe(8);
      expect(modifiedResults[3].value).toBe(8);
      expect(modifiedResults[3].useInTotal).toBe(true);
      expect(modifiedResults[3].modifiers).toEqual(new Set());

      expect(modifiedResults[4].calculationValue).toBe(6);
      expect(modifiedResults[4].value).toBe(6);
      expect(modifiedResults[4].useInTotal).toBe(true);
      expect(modifiedResults[4].modifiers).toEqual(new Set());
    });
  });

  describe('Readonly properties', () => {
    test('cannot change name value', () => {
      const mod = new CriticalFailureModifier();

      expect(() => {
        mod.name = 'Foo';
      }).toThrow(TypeError);
    });
  });
});
