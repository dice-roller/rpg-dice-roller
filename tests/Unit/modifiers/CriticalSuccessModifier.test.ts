import { ComparisonModifier, CriticalSuccessModifier } from '../../../src/modifiers';
import { StandardDice } from '../../../src/dice';
import ComparePoint from '../../../src/ComparePoint';
import RollResults from '../../../src/results/RollResults';
import { ComparisonOperator } from "../../../src/types/Enums/ComparisonOperator";
import { SingleResult } from "../../../src/types/Interfaces/Results/SingleResult";
import { ModelType } from "../../../src/types/Enums/ModelType";

describe('CriticalSuccessModifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const cp = new ComparePoint(ComparisonOperator.Equal, 6);
      const mod = new CriticalSuccessModifier(cp);

      expect(mod).toBeInstanceOf(CriticalSuccessModifier);
      expect(mod).toBeInstanceOf(ComparisonModifier);

      expect(mod).toHaveProperty('comparePoint', cp);
      expect(mod).toHaveProperty('isComparePoint', expect.any(Function));
      expect(mod).toHaveProperty('name', 'critical-success');
      expect(mod).toHaveProperty('notation', 'cs=6');
      expect(mod).toHaveProperty('order', 9);
      expect(mod).toHaveProperty('run', expect.any(Function));
      expect(mod).toHaveProperty('toJSON', expect.any(Function));
      expect(mod).toHaveProperty('toString', expect.any(Function));
    });
  });

  describe('Compare point', () => {
    test('gets set in constructor', () => {
      const cp = new ComparePoint(ComparisonOperator.GreaterThan, 8);
      const mod = new CriticalSuccessModifier(cp);

      expect(mod.comparePoint).toBe(cp);
      expect(mod.notation).toEqual('cs>8');
    });

    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(CriticalSuccessModifier.prototype, 'comparePoint', 'set');

      // create the ComparisonModifier
      new CriticalSuccessModifier(new ComparePoint(ComparisonOperator.GreaterThan, 8));

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('must be instance of ComparePoint', () => {
      const mod = new CriticalSuccessModifier(
        new ComparePoint(ComparisonOperator.Equal, 6)
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
      const mod = new CriticalSuccessModifier(
        new ComparePoint(ComparisonOperator.Equal, 6)
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
      const mod = new CriticalSuccessModifier(
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
      // @ts-expect-error testing with no compare point
      const mod = new CriticalSuccessModifier();

      expect(mod.isComparePoint(9)).toBe(false);
    });
  });

  describe('Notation', () => {
    test('simple notation', () => {
      let mod = new CriticalSuccessModifier(new ComparePoint(ComparisonOperator.GreaterThan, 57636.6457));
      expect(mod.notation).toEqual('cs>57636.6457');

      mod = new CriticalSuccessModifier(new ComparePoint(ComparisonOperator.NotEqual, 3));
      expect(mod.notation).toEqual('cs!=3');

      mod = new CriticalSuccessModifier(new ComparePoint(ComparisonOperator.NotEqualArrows, 7));
      expect(mod.notation).toEqual('cs<>7');

      mod = new CriticalSuccessModifier(new ComparePoint(ComparisonOperator.Equal, 157));
      expect(mod.notation).toEqual('cs=157');
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const mod = new CriticalSuccessModifier(
        new ComparePoint(ComparisonOperator.Equal, 4)
      );

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        comparePoint: {
          name: 'compare-point',
          operator: '=',
          type: ModelType.ComparePoint,
          value: 4,
        },
        name: 'critical-success',
        notation: 'cs=4',
        type: 'modifier',
      });
    });

    test('toString output is correct', () => {
      const mod = new CriticalSuccessModifier(new ComparePoint(ComparisonOperator.Equal, 4));

      expect(mod.toString()).toEqual('cs=4');
    });
  });

  describe('Run', () => {
    test('returns RollResults object', () => {
      const results = new RollResults();
      const die = new StandardDice(6, 2);
      const mod = new CriticalSuccessModifier(new ComparePoint(ComparisonOperator.Equal, 4));

      expect(mod.run(results, die)).toBe(results);
    });

    test('checks roll value against compare point', () => {
      const spy = jest.spyOn(CriticalSuccessModifier.prototype, 'isComparePoint');
      const results = new RollResults([
        1, 2, 4, 8, 6,
      ]);
      const mod = new CriticalSuccessModifier(new ComparePoint(ComparisonOperator.GreaterThanOrEqual, 6));

      mod.run(results, new StandardDice(6, 5));

      expect(spy).toHaveBeenCalledTimes(5);

      // remove the spy
      spy.mockRestore();
    });

    test('flags failure rolls', () => {
      const results = new RollResults([
        1, 2, 4, 8, 6,
      ]);
      const mod = new CriticalSuccessModifier(new ComparePoint(ComparisonOperator.GreaterThanOrEqual, 6));
      const modifiedRolls = mod.run(results, new StandardDice(6, 5)).rolls;

      expect(modifiedRolls).toBeInstanceOf(Array);
      expect(modifiedRolls).toHaveLength(5);

      let result = modifiedRolls[0] as SingleResult;
      expect(result.calculationValue).toBe(1);
      expect(result.modifiers).toEqual(new Set());
      expect(result.useInTotal).toBe(true);
      expect(result.value).toBe(1);

      result = modifiedRolls[1] as SingleResult;
      expect(result.calculationValue).toBe(2);
      expect(result.modifiers).toEqual(new Set());
      expect(result.useInTotal).toBe(true);
      expect(result.value).toBe(2);

      result = modifiedRolls[2] as SingleResult;
      expect(result.calculationValue).toBe(4);
      expect(result.modifiers).toEqual(new Set());
      expect(result.useInTotal).toBe(true);
      expect(result.value).toBe(4);

      result = modifiedRolls[3] as SingleResult;
      expect(result.calculationValue).toBe(8);
      expect(result.modifiers).toEqual(new Set(['critical-success']));
      expect(result.useInTotal).toBe(true);
      expect(result.value).toBe(8);

      result = modifiedRolls[4] as SingleResult;
      expect(result.calculationValue).toBe(6);
      expect(result.modifiers).toEqual(new Set(['critical-success']));
      expect(result.useInTotal).toBe(true);
      expect(result.value).toBe(6);
    });
  });
});
