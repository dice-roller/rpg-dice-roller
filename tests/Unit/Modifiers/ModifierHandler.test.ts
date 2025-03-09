import ModifierHandler from "../../../src/Modifiers/ModifierHandler";
import { ExpressionResult } from "../../../src/Types/Interfaces/Results/ExpressionResult";
import { ResultCollection } from "../../../src/Types/Interfaces/Results/ResultCollection";
import { RollResults } from "../../../src/Results";
import { CanModify } from "../../../src/Types/Interfaces/CanModify";
import { Modifiable } from "../../../src/Types/Interfaces/Modifiable";

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
        run: (v: unknown) => v,
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

  describe('Run modifiers', () => {
    test('Returns un-modified values if no modifiers are passed', () => {
      let result = handler.run(initialResult, []) as RollResults;

      expect(result).toBeInstanceOf(RollResults);
      expect(result).toEqual(initialResult);
      expect(result.rolls.map((roll) => roll.value)).toEqual(values);

      // @ts-expect-error testing empty value
      result = handler.run(initialResult, null);

      expect(result).toBeInstanceOf(RollResults);
      expect(result).toEqual(initialResult);
      expect(result.rolls.map((roll) => roll.value)).toEqual(values);

      // @ts-expect-error testing empty value
      result = handler.run(initialResult, undefined);

      expect(result).toBeInstanceOf(RollResults);
      expect(result).toEqual(initialResult);
      expect(result.rolls.map((roll) => roll.value)).toEqual(values);

      // @ts-expect-error testing empty value
      result = handler.run(initialResult, false);

      expect(result).toBeInstanceOf(RollResults);
      expect(result).toEqual(initialResult);
      expect(result.rolls.map((roll) => roll.value)).toEqual(values);
    });

    test('Throws exception if modifiers is not array', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        handler.run(initialResult, 'foo');
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        handler.run(initialResult, {});
      }).toThrow(TypeError);
    });

    test('Throws exception if not all modifiers are valid', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        handler.run(initialResult, ['foo']);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        handler.run(initialResult, [true]);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        handler.run(initialResult, [{}]);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        handler.run(initialResult, [null]);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        handler.run(initialResult, [undefined]);
      }).toThrow(TypeError);
    });

    test('Run modifier and returns the result', () => {
      const context: Modifiable = {
        modifiers: new Map,
      };
      const modifier = {
        run: () => 2,
      };
      const spy = jest.spyOn(modifier, 'run');

      const result = handler.run(
        initialResult,
        [modifier as CanModify],
        context,
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(initialResult, context);

      expect(result).toBe(2);

      spy.mockRestore();
    });

    test('Runs modifiers in correct order', () => {
      const context: Modifiable = {
        modifiers: new Map,
      };
      const modifiers = [
        {
          run: () => 'last',
          order: 2,
        },
        {
          run: () => 'first',
          order: 1,
        }
      ];
      const spies: jest.SpyInstance[] = [
        jest.spyOn(modifiers[1] as CanModify, 'run'),
        jest.spyOn(modifiers[0] as CanModify, 'run'),
      ];

      const result = handler.run(
        initialResult,
        modifiers as CanModify[],
        context,
      );

      expect(spies[0]).toHaveBeenCalledTimes(1);
      expect(spies[0]).toHaveBeenCalledWith(initialResult, context);
      spies[0]?.mockRestore();

      expect(spies[1]).toHaveBeenCalledTimes(1);
      expect(spies[1]).toHaveBeenCalledWith('first', context);
      spies[1]?.mockRestore();

      expect(result).toEqual('last');
    });
  });
});
