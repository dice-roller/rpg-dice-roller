import { MinModifier, Modifier } from '../../../src/modifiers';
import { StandardDice } from '../../../src/dice';
import RollResults from '../../../src/results/RollResults';
import { SingleResult } from "../../../src/types/Interfaces/Results/SingleResult";

describe('MinModifier', () => {
  let mod: MinModifier;

  beforeEach(() => {
    mod = new MinModifier(3);
  });

  describe('Initialisation', () => {
    test('model structure', () => {
      expect(mod).toBeInstanceOf(MinModifier);
      expect(mod).toBeInstanceOf(Modifier);

      expect(mod).toEqual(expect.objectContaining({
        min: 3,
        name: 'min',
        notation: 'min3',
        order: 1,
        run: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });

    test('constructor requires min', () => {
      expect(() => {
        // @ts-expect-error testing missing argument
        new MinModifier();
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new MinModifier(false);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new MinModifier(null);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new MinModifier(undefined);
      }).toThrow(TypeError);
    });
  });

  describe('Min', () => {
    test('can be changed', () => {
      expect(mod.min).toBe(3);
      expect(mod.notation).toBe('min3');

      mod.min = 1;
      expect(mod.min).toBe(1);
      expect(mod.notation).toBe('min1');

      mod.min = 23;
      expect(mod.min).toBe(23);
      expect(mod.notation).toBe('min23');
    });

    test('must be numeric', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        mod.min = 'foo';
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.min = [];
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.min = { min: 3 };
      }).toThrow(TypeError);
    });

    test('can be float', () => {
      mod.min = 4.5;
      expect(mod.min).toBeCloseTo(4.5);
      expect(mod.notation).toBe('min4.5');

      mod.min = 300.6579;
      expect(mod.min).toBeCloseTo(300.6579);
      expect(mod.notation).toBe('min300.6579');
    });

    test('can be negative', () => {
      mod.min = -10;
      expect(mod.min).toBe(-10);
      expect(mod.notation).toBe('min-10');

      mod.min = -46.2;
      expect(mod.min).toBeCloseTo(-46.2);
      expect(mod.notation).toBe('min-46.2');
    });
  });

  describe('Notation', () => {
    test('simple notation', () => {
      mod = new MinModifier(35);
      expect(mod.notation).toEqual('min35');

      mod = new MinModifier(90876684);
      expect(mod.notation).toEqual('min90876684');

      mod = new MinModifier(7986);
      expect(mod.notation).toEqual('min7986');

      mod = new MinModifier(2);
      expect(mod.notation).toEqual('min2');
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        min: 3,
        name: 'min',
        notation: 'min3',
        type: 'modifier',
      });
    });

    test('toString output is correct', () => {
      expect(mod.toString()).toEqual('min3');
    });
  });

  describe('Run', () => {
    let die: StandardDice;
    let results: RollResults;

    beforeEach(() => {
      results = new RollResults([
        1, 4, 2, 1, 6,
      ]);
      die = new StandardDice(10, 5);
    });

    test('returns RollResults object', () => {
      expect(mod.run(results, die)).toBe(results);
    });

    test('rolls lower than min are changed to min', () => {
      const modifiedResults = mod.run(results, die).rolls;

      expect(modifiedResults).toHaveLength(5);

      // check the first roll
      let result = modifiedResults[0] as SingleResult;
      expect(result.initialValue).toBe(1);
      expect(result.calculationValue).toBe(3);
      expect(result.value).toBe(3);
      expect(result.useInTotal).toBe(true);
      expect(result.modifierFlags).toEqual('^');
      expect(result.modifiers).toEqual(new Set(['min']));

      // check the second roll
      result = modifiedResults[1] as SingleResult;
      expect(result.initialValue).toBe(4);
      expect(result.calculationValue).toBe(4);
      expect(result.value).toBe(4);
      expect(result.useInTotal).toBe(true);
      expect(result.modifierFlags).toEqual('');
      expect(result.modifiers).toEqual(new Set());

      // check the third roll
      result = modifiedResults[2] as SingleResult;
      expect(result.initialValue).toBe(2);
      expect(result.calculationValue).toBe(3);
      expect(result.value).toBe(3);
      expect(result.useInTotal).toBe(true);
      expect(result.modifierFlags).toEqual('^');
      expect(result.modifiers).toEqual(new Set(['min']));

      // check the fourth roll
      result = modifiedResults[3] as SingleResult;
      expect(result.initialValue).toBe(1);
      expect(result.calculationValue).toBe(3);
      expect(result.value).toBe(3);
      expect(result.useInTotal).toBe(true);
      expect(result.modifierFlags).toEqual('^');
      expect(result.modifiers).toEqual(new Set(['min']));

      // check the fifth roll
      result = modifiedResults[4] as SingleResult;
      expect(result.initialValue).toBe(6);
      expect(result.calculationValue).toBe(6);
      expect(result.value).toBe(6);
      expect(result.useInTotal).toBe(true);
      expect(result.modifierFlags).toEqual('');
      expect(result.modifiers).toEqual(new Set());
    });
  });
});
