import { StandardDice } from '../../../src/dice';
import { ComparisonModifier } from '../../../src/modifiers';
import ComparePoint from '../../../src/ComparePoint';
import RollResults from '../../../src/results/RollResults';
import { ComparisonOperator } from "../../../src/types/Enums/ComparisonOperator";
import { ModelType } from "../../../src/types/Enums/ModelType";

describe('ComparisonModifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const mod = new ComparisonModifier();

      expect(mod).toBeInstanceOf(ComparisonModifier);

      expect(mod).toHaveProperty('comparePoint', null);
      expect(mod).toHaveProperty('isComparePoint', expect.any(Function));
      expect(mod).toHaveProperty('name', 'comparison');
      expect(mod).toHaveProperty('notation', '');
      expect(mod).toHaveProperty('order', expect.any(Number));
      expect(mod).toHaveProperty('run', expect.any(Function));
      expect(mod).toHaveProperty('toJSON', expect.any(Function));
      expect(mod).toHaveProperty('toString', expect.any(Function));
    });
  });

  describe('Compare point', () => {
    test('gets set in constructor', () => {
      const cp = new ComparePoint('>', 8);
      const mod = new ComparisonModifier(cp);

      expect(mod.comparePoint).toBe(cp);
      expect(mod.notation).toEqual('>8');
    });

    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'comparePoint', 'set');

      // create the ComparisonModifier
      new ComparisonModifier(new ComparePoint('>', 8));

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('must be instance of ComparePoint', () => {
      const mod = new ComparisonModifier();

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
      const mod = new ComparisonModifier();

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
      const mod = new ComparisonModifier(new ComparePoint('>', 8));

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
      const mod = new ComparisonModifier();

      expect(mod.isComparePoint(9)).toBe(false);
    });
  });

  describe('Notation', () => {
    test('simple notation', () => {
      let mod = new ComparisonModifier(new ComparePoint('=', 45));
      expect(mod.notation).toEqual('=45');

      mod = new ComparisonModifier(new ComparePoint('!=', 4.78));
      expect(mod.notation).toEqual('!=4.78');

      mod = new ComparisonModifier(new ComparePoint('<>', -76));
      expect(mod.notation).toEqual('<>-76');

      mod = new ComparisonModifier(new ComparePoint('<=', 568));
      expect(mod.notation).toEqual('<=568');
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const mod = new ComparisonModifier(new ComparePoint('=', 4));

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
        name: 'comparison',
        notation: '=4',
        type: ModelType.Modifier,
      });
    });

    test('toString output is correct', () => {
      const mod = new ComparisonModifier(new ComparePoint('=', 4));

      expect(mod.toString()).toEqual('=4');
    });
  });

  describe('Run', () => {
    const results: RollResults = new RollResults();
    const die: StandardDice = new StandardDice(6, 2);
    let mod: ComparisonModifier;

    beforeEach(() => {
      mod = new ComparisonModifier();
    });

    test('returns RollResults object', () => {
      mod.comparePoint = new ComparePoint('=', 4);

      expect(mod.run(results, die)).toBe(results);
    });

    describe('Defaults', () => {
      const testOperator = ComparisonOperator.Equal;
      const testValue = 6;

      beforeEach(() => {
        // @ts-expect-error mocking method
        mod.defaultComparePoint = () => [testOperator, testValue];
      });

      test('uses default comparison modifier', () => {
        expect(mod.comparePoint).toBeNull();

        mod.run(results, die);

        expect(mod.comparePoint?.operator).toEqual(testOperator);
        expect(mod.comparePoint?.value).toEqual(testValue);
      });

      test('does not set default comparison modifier if value was provided', () => {
        const comparePoint = new ComparePoint('=', 4);
        mod.comparePoint = comparePoint;

        expect(mod.comparePoint).toBe(comparePoint);

        mod.run(results, die);

        expect(mod.comparePoint).toBe(comparePoint);
      });
    });
  });
});
