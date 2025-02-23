import { StandardDice } from '../../../src/dice';
import { MaxModifier, Modifier } from '../../../src/modifiers';
import RollResults from '../../../src/results/RollResults';
import { SingleResult } from "../../../src/types/Interfaces/Results/SingleResult";

describe('MaxModifier', () => {
  let mod: MaxModifier;

  beforeEach(() => {
    mod = new MaxModifier(3);
  });

  describe('Initialisation', () => {
    test('model structure', () => {
      expect(mod).toBeInstanceOf(MaxModifier);
      expect(mod).toBeInstanceOf(Modifier);

      expect(mod).toEqual(expect.objectContaining({
        max: 3,
        name: 'max',
        notation: 'max3',
        order: 2,
        run: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });

    test('constructor requires max', () => {
      expect(() => {
        // @ts-expect-error testing missing argument
        new MaxModifier();
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new MaxModifier(false);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new MaxModifier(null);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new MaxModifier(undefined);
      }).toThrow(TypeError);
    });
  });

  describe('Max', () => {
    test('can be changed', () => {
      expect(mod.max).toBe(3);
      expect(mod.notation).toBe('max3');

      mod.max = 1;
      expect(mod.max).toBe(1);
      expect(mod.notation).toBe('max1');

      mod.max = 23;
      expect(mod.max).toBe(23);
      expect(mod.notation).toBe('max23');
    });

    test('must be numeric', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        mod.max = 'foo';
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.max = [];
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.max = { max: 3 };
      }).toThrow(TypeError);
    });

    test('can be float', () => {
      mod.max = 4.5;
      expect(mod.max).toBeCloseTo(4.5);
      expect(mod.notation).toBe('max4.5');

      mod.max = 300.6579;
      expect(mod.max).toBeCloseTo(300.6579);
      expect(mod.notation).toBe('max300.6579');
    });

    test('can be negative', () => {
      mod.max = -10;
      expect(mod.max).toBe(-10);
      expect(mod.notation).toBe('max-10');

      mod.max = -46.2;
      expect(mod.max).toBeCloseTo(-46.2);
      expect(mod.notation).toBe('max-46.2');
    });
  });

  describe('Notation', () => {
    test('simple notation', () => {
      mod = new MaxModifier(35);
      expect(mod.notation).toEqual('max35');

      mod = new MaxModifier(90876684);
      expect(mod.notation).toEqual('max90876684');

      mod = new MaxModifier(7986);
      expect(mod.notation).toEqual('max7986');

      mod = new MaxModifier(2);
      expect(mod.notation).toEqual('max2');
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        max: 3,
        name: 'max',
        notation: 'max3',
        type: 'modifier',
      });
    });

    test('toString output is correct', () => {
      expect(mod.toString()).toEqual('max3');
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

    test('rolls lower than max are changed to max', () => {
      const modifiedResults = mod.run(results, die).rolls;

      expect(modifiedResults).toHaveLength(5);

      // check the first roll
      let result = modifiedResults[0] as SingleResult;
      expect(result.initialValue).toBe(1);
      expect(result.calculationValue).toBe(1);
      expect(result.value).toBe(1);
      expect(result.useInTotal).toBe(true);
      expect(result.modifierFlags).toEqual('');
      expect(result.modifiers).toEqual(new Set());

      // check the second roll
      result = modifiedResults[1] as SingleResult;
      expect(result.initialValue).toBe(4);
      expect(result.calculationValue).toBe(3);
      expect(result.value).toBe(3);
      expect(result.useInTotal).toBe(true);
      expect(result.modifierFlags).toEqual('v');
      expect(result.modifiers).toEqual(new Set(['max']));

      // check the third roll
      result = modifiedResults[2] as SingleResult;
      expect(result.initialValue).toBe(2);
      expect(result.calculationValue).toBe(2);
      expect(result.value).toBe(2);
      expect(result.useInTotal).toBe(true);
      expect(result.modifierFlags).toEqual('');
      expect(result.modifiers).toEqual(new Set());

      // check the fourth roll
      result = modifiedResults[3] as SingleResult;
      expect(result.initialValue).toBe(1);
      expect(result.calculationValue).toBe(1);
      expect(result.value).toBe(1);
      expect(result.useInTotal).toBe(true);
      expect(result.modifierFlags).toEqual('');
      expect(result.modifiers).toEqual(new Set());

      // check the fifth roll
      result = modifiedResults[4] as SingleResult;
      expect(result.initialValue).toBe(6);
      expect(result.calculationValue).toBe(3);
      expect(result.value).toBe(3);
      expect(result.useInTotal).toBe(true);
      expect(result.modifierFlags).toEqual('v');
      expect(result.modifiers).toEqual(new Set(['max']));
    });
  });
});
