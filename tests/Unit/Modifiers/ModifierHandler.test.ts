import ModifierHandler from "../../../src/Modifiers/ModifierHandler";
import { ExpressionResult } from "../../../src/Types/Interfaces/Results/ExpressionResult";
import { ResultCollection } from "../../../src/Types/Interfaces/Results/ResultCollection";
import { RollResults } from "../../../src/Results";

describe('ModifierHandler', () => {
  let initialResult: ExpressionResult | ResultCollection;
  let handler: ModifierHandler;
  const values = [1,4,2,6];

  beforeEach(() => {
    handler = new ModifierHandler();
    initialResult = new RollResults([...values]);
  });

  describe('isValidModifier', () => {
    test('Returns true if modifier is valid', () => {
      const result = handler.isValidModifier({
        apply: (v: unknown) => v,
      });

      expect(result).toBe(true);
    });

    test('Returns false if modifier is invalid', () => {
      let result = handler.isValidModifier({});
      expect(result).toBe(false);

      result = handler.isValidModifier(false);
      expect(result).toBe(false);

      result = handler.isValidModifier(true);
      expect(result).toBe(false);

      result = handler.isValidModifier(undefined);
      expect(result).toBe(false);

      result = handler.isValidModifier(null);
      expect(result).toBe(false);

      result = handler.isValidModifier(376);
      expect(result).toBe(false);

      result = handler.isValidModifier('foo');
      expect(result).toBe(false);
    });
  });

  describe('Apply modifiers', () => {
    test('Returns un-modified values if no modifiers are passed', () => {
      let result = handler.apply(initialResult, []) as RollResults;

      expect(result).toBeInstanceOf(RollResults);
      expect(result).toEqual(initialResult);
      expect(result.rolls.map((roll) => roll.value)).toEqual(values);

      // @ts-expect-error testing empty value
      result = handler.apply(initialResult, null);

      expect(result).toBeInstanceOf(RollResults);
      expect(result).toEqual(initialResult);
      expect(result.rolls.map((roll) => roll.value)).toEqual(values);

      // @ts-expect-error testing empty value
      result = handler.apply(initialResult, undefined);

      expect(result).toBeInstanceOf(RollResults);
      expect(result).toEqual(initialResult);
      expect(result.rolls.map((roll) => roll.value)).toEqual(values);

      // @ts-expect-error testing empty value
      result = handler.apply(initialResult, false);

      expect(result).toBeInstanceOf(RollResults);
      expect(result).toEqual(initialResult);
      expect(result.rolls.map((roll) => roll.value)).toEqual(values);
    });

    test('Throws exception if modifiers is not array', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        handler.apply(initialResult, 'foo');
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        handler.apply(initialResult, {});
      }).toThrow(TypeError);
    });

    test('Throws exception if not all modifiers are valid', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        handler.apply(initialResult, ['foo']);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        handler.apply(initialResult, [true]);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        handler.apply(initialResult, [{}]);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        handler.apply(initialResult, [null]);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        handler.apply(initialResult, [undefined]);
      }).toThrow(TypeError);
    });

    test('Run each modifier and returns the result', () => {
      const modifier = {
        apply: (v: unknown) => v,
      };
      const spy = jest.spyOn(modifier, 'apply');

      const result = handler.apply(initialResult, [modifier]);

      expect(spy).toHaveBeenCalledTimes(values.length);

      spy.mockRestore();
    });
  });
});
