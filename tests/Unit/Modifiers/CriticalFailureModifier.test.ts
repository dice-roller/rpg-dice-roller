import { StandardDice } from '../../../src/dice';
import { ComparisonModifier, CriticalFailureModifier } from '../../../src/modifiers';
import ComparePoint from '../../../src/ComparePoint';
import RollResults from '../../../src/results/RollResults';
import { ComparisonOperator } from "../../../src/types/Enums/ComparisonOperator";
import { ModelType } from "../../../src/types/Enums/ModelType";
import { SingleResult } from "../../../src/types/Interfaces/Results/SingleResult";

describe('CriticalFailureModifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const cp = new ComparePoint(ComparisonOperator.Equal, 6);
      const mod = new CriticalFailureModifier(cp);

      expect(mod).toBeInstanceOf(CriticalFailureModifier);
      expect(mod).toBeInstanceOf(ComparisonModifier);

      expect(mod).toHaveProperty('comparePoint', cp);
      expect(mod).toHaveProperty('isComparePoint', expect.any(Function));
      expect(mod).toHaveProperty('name', 'critical-failure');
      expect(mod).toHaveProperty('notation', 'cf=6');
      expect(mod).toHaveProperty('order', 10);
      expect(mod).toHaveProperty('run', expect.any(Function));
      expect(mod).toHaveProperty('toJSON', expect.any(Function));
      expect(mod).toHaveProperty('toString', expect.any(Function));
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
      const mod = new CriticalFailureModifier(
        new ComparePoint(ComparisonOperator.Equal, 4)
      );

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.comparePoint = 'foo';
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.comparePoint = 1;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.comparePoint = 0;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.comparePoint = true;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.comparePoint = false;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.comparePoint = [new ComparePoint('>', 8)];
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.comparePoint = { comparePoint: new ComparePoint('>', 8) };
      }).toThrow(TypeError);
    });

    test('cannot unset compare point', () => {
      const mod = new CriticalFailureModifier(
        new ComparePoint(ComparisonOperator.Equal, 4)
      );

      expect(() => {
        mod.comparePoint = null;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.comparePoint = undefined;
      }).toThrow(TypeError);
    });
  });

  describe('Matching', () => {
    test('can match against values', () => {
      const spy = jest.spyOn(ComparePoint.prototype, 'isMatch');
      const mod = new CriticalFailureModifier(
        new ComparePoint(ComparisonOperator.GreaterThan, 8)
      );

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
      // @ts-expect-error testing missing argument
      const mod = new CriticalFailureModifier();

      expect(mod.isComparePoint(9)).toBe(false);
    });
  });

  describe('Notation', () => {
    test('simple notation', () => {
      let mod = new CriticalFailureModifier(
        new ComparePoint(ComparisonOperator.LessThan, Number.MAX_SAFE_INTEGER)
      );
      expect(mod.notation).toEqual(`cf<${Number.MAX_SAFE_INTEGER}`);

      mod = new CriticalFailureModifier(
        new ComparePoint(ComparisonOperator.GreaterThanOrEqual, -12.5676)
      );
      expect(mod.notation).toEqual('cf>=-12.5676');

      mod = new CriticalFailureModifier(
        new ComparePoint(ComparisonOperator.LessThanOrEqual, 568)
      );
      expect(mod.notation).toEqual('cf<=568');
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const mod = new CriticalFailureModifier(
        new ComparePoint(ComparisonOperator.Equal, 4)
      );

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        comparePoint: {
          name: 'compare-point',
          operator: ComparisonOperator.Equal,
          type: ModelType.ComparePoint,
          value: 4,
        },
        name: 'critical-failure',
        notation: 'cf=4',
        type: ModelType.Modifier,
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
      const mod = new CriticalFailureModifier(
        new ComparePoint(ComparisonOperator.LessThanOrEqual, 2)
      );
      const modifiedResults = mod.run(results, new StandardDice(6, 5)).rolls;

      expect(modifiedResults).toBeInstanceOf(Array);
      expect(modifiedResults).toHaveLength(5);

      let result = modifiedResults[0] as SingleResult;
      expect(result.calculationValue).toBe(1);
      expect(result.value).toBe(1);
      expect(result.useInTotal).toBe(true);
      expect(result.modifiers).toEqual(new Set(['critical-failure']));

      result = modifiedResults[1] as SingleResult;
      expect(result.calculationValue).toBe(2);
      expect(result.value).toBe(2);
      expect(result.useInTotal).toBe(true);
      expect(result.modifiers).toEqual(new Set(['critical-failure']));

      result = modifiedResults[2] as SingleResult;
      expect(result.calculationValue).toBe(4);
      expect(result.value).toBe(4);
      expect(result.useInTotal).toBe(true);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[3] as SingleResult;
      expect(result.calculationValue).toBe(8);
      expect(result.value).toBe(8);
      expect(result.useInTotal).toBe(true);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[4] as SingleResult;
      expect(result.calculationValue).toBe(6);
      expect(result.value).toBe(6);
      expect(result.useInTotal).toBe(true);
      expect(result.modifiers).toEqual(new Set());
    });
  });
});
