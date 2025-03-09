import RollEngine from '../../../src/Rolling/RollEngine';
import { RequiredArgumentError } from '../../../src/Exceptions';
import StandardDice from "../../../src/Dice/StandardDice";
import { RollResult, RollResults } from "../../../src/Results";
import Generator from "../../../src/NumberGenerator/Generator";

describe('RollEngine', () => {
  let rollEngine: RollEngine;
  let spy: jest.SpyInstance|undefined;

  beforeEach(() => {
    rollEngine = new RollEngine();

    if (spy) {
      spy.mockRestore();
    }
  });

  describe('Roll Table building', () => {
    test('Can create roll table', () => {
      const table = rollEngine.buildTable(2, 8);

      expect(table).toBeInstanceOf(Array);
      expect(table).toHaveLength(8-2+1);

      for (let i = 0; i < table.length; i++) {
        expect(table[i]).toBeInstanceOf(Object);
        expect(table[i]?.value).toBe(i+2);
        expect(table[i]?.weight).toBe(1);
      }
    });

    test('Defaults `max`to `min`', () => {
      const table = rollEngine.buildTable(6);

      expect(table).toBeInstanceOf(Array);
      expect(table).toHaveLength(1);

      expect(table[0]).toBeInstanceOf(Object);
      expect(table[0]?.value).toBe(6);
      expect(table[0]?.weight).toBe(1);
    });

    test('Works if `min` is zero', () => {
      const table = rollEngine.buildTable(0);

      expect(table).toBeInstanceOf(Array);
      expect(table).toHaveLength(1);

      expect(table[0]).toBeInstanceOf(Object);
      expect(table[0]?.value).toBe(0);
      expect(table[0]?.weight).toBe(1);
    });

    test('Works if `min` is negative', () => {
      const table = rollEngine.buildTable(-300);

      expect(table).toBeInstanceOf(Array);
      expect(table).toHaveLength(1);

      expect(table[0]).toBeInstanceOf(Object);
      expect(table[0]?.value).toBe(-300);
      expect(table[0]?.weight).toBe(1);
    });

    test('Works if `max` is zero', () => {
      const table = rollEngine.buildTable(-2, 0);

      expect(table).toBeInstanceOf(Array);
      expect(table).toHaveLength(3);

      expect(table[0]).toBeInstanceOf(Object);
      expect(table[0]?.value).toBe(-2);
      expect(table[0]?.weight).toBe(1);

      expect(table[1]).toBeInstanceOf(Object);
      expect(table[1]?.value).toBe(-1);
      expect(table[1]?.weight).toBe(1);

      expect(table[2]).toBeInstanceOf(Object);
      expect(table[2]?.value).toBe(0);
      expect(table[2]?.weight).toBe(1);
    });

    test('Works if `max` is negative', () => {
      const table = rollEngine.buildTable(-24, -12);

      expect(table).toBeInstanceOf(Array);
      expect(table).toHaveLength(24-12+1);

      for (let i = 0; i < table.length; i++) {
        expect(table[i]).toBeInstanceOf(Object);
        expect(table[i]?.value).toBe(i-24);
        expect(table[i]?.weight).toBe(1);}
    });

    test('Works if `max`and `min` are both zero', () => {
      const table = rollEngine.buildTable(0, 0);

      expect(table).toBeInstanceOf(Array);
      expect(table).toHaveLength(1);

      expect(table[0]).toBeInstanceOf(Object);
      expect(table[0]?.value).toBe(0);
      expect(table[0]?.weight).toBe(1);
    });

    test('Works if `max` and `min` are both negative', () => {
      const table = rollEngine.buildTable(-156, -1);

      expect(table).toBeInstanceOf(Array);
      expect(table).toHaveLength(156);

      console.log(table);

      for (let i = 0; i < table.length; i++) {
        expect(table[i]).toBeInstanceOf(Object);
        expect(table[i]?.value).toBe(i-156);
        expect(table[i]?.weight).toBe(1);
      }
    });

    test('Returns empty array if `min` is greater than `max`', () => {
      const table = rollEngine.buildTable(45, 12);

      expect(table).toBeInstanceOf(Array);
      expect(table).toHaveLength(0);
    });
  });

  describe('Roll Once', () => {
    test('Throws exception if no die is provided', () => {
      expect(() => {
        // @ts-expect-error testing missing argument
        rollEngine.rollOnce();
      }).toThrow(RequiredArgumentError);

      expect(() => {
        // @ts-expect-error testing invalid argument
        rollEngine.rollOnce(false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        // @ts-expect-error testing invalid argument
        rollEngine.rollOnce(undefined);
      }).toThrow(RequiredArgumentError);
    });

    test('Returns a Single Result', () => {
      spy = jest
        .spyOn(Generator.prototype, 'real');

      const result = rollEngine.rollOnce({
        rollTable: [{ value: 6, weight: 1 }],
      });

      expect(spy).toHaveBeenCalledTimes(1);

      expect(result).toBeInstanceOf(RollResult);
      expect(result.value).toBe(6);
    });

    describe('Weighted rolls', () => {
      test('Can roll weighted values', () => {
        spy = jest
          .spyOn(Generator.prototype, 'real')
          .mockImplementationOnce(() => 2.45);

        const dice = {
          rollTable: [
            { value: 2, weight: 1 },
            { value: 5, weight: 3 },
            { value: 10, weight: 2 },
          ],
        };

        const result = rollEngine.rollOnce(dice);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(0, 6, true);

        expect(result).toBeInstanceOf(RollResult);
        expect(result.value).toBe(5);
      });

      test('Throws exception if any weights are negative', () => {
        const dice = {
          rollTable: [
            { value: 2, weight: 4 },
            { value: 5, weight: -2 },
            { value: 1, weight: 8 },
          ],
        };

        expect(() => {
          rollEngine.rollOnce(dice);
        }).toThrow(RangeError);
      });

      test('Throws exception if all weights are 0', () => {
        const dice = {
          rollTable: [
            { value: 5, weight: 0 },
            { value: 7, weight: 0 },
            { value: 9, weight: 0 },
          ],
        };

        expect(() => {
          rollEngine.rollOnce(dice);
        }).toThrow(RangeError);
      });

      test('Can roll with some 0 weights', () => {
        spy = jest
          .spyOn(Generator.prototype, 'real')
          .mockImplementationOnce(() => 1.234);

        const dice = {
          rollTable: [
            { value: 5, weight: 0 },
            { value: 7, weight: 1 },
            { value: 9, weight: 0 },
            { value: 12, weight: 3 },
          ],
        };

        const result = rollEngine.rollOnce(dice);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(0, 4, true);

        expect(result).toBeInstanceOf(RollResult);
        expect(result.value).toBe(12);
      });

      test('Numerical entries defaults weight to 1', () => {
        spy = jest
          .spyOn(Generator.prototype, 'real')
          .mockImplementationOnce(() => 0.67);

        const dice = {
          rollTable: [3, 5, 6, 12, 18],
        };

        const result = rollEngine.rollOnce(dice);

        expect(spy).toHaveBeenCalledTimes(1);
        // ensures weight gets set to 5, which is 1 per value
        expect(spy).toHaveBeenCalledWith(0, 5, true);

        expect(result).toBeInstanceOf(RollResult);
        expect(result.value).toBe(3);
      });

      test('Numerical entries defaults weight to 1', () => {
        spy = jest
          .spyOn(Generator.prototype, 'real')
          .mockImplementationOnce(() => 0.5);

        const dice = {
          rollTable: [
            { value: 3, weight: undefined },
            { value: 6 },
          ],
        };

        const result = rollEngine.rollOnce(dice);

        expect(spy).toHaveBeenCalledTimes(1);
        // ensures weight gets set to 2, which is 1 per value
        expect(spy).toHaveBeenCalledWith(0, 2, true);

        expect(result).toBeInstanceOf(RollResult);
        expect(result.value).toBe(3);
      });

      test('Returns last result if random weight does not match', () => {
        spy = jest
          .spyOn(Generator.prototype, 'real')
          .mockImplementationOnce(() => 15);

        const dice = {
          rollTable: [
            { value: 3, weight: 1 },
            { value: 6, weight: 4 },
            { value: 8, weight: 7 },
          ],
        };

        const result = rollEngine.rollOnce(dice);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(0, 12, true);

        expect(result).toBeInstanceOf(RollResult);
        expect(result.value).toBe(8);
      });

      test('Returns correct value when randomWeight is on boundary', () => {
        spy = jest
          .spyOn(Generator.prototype, 'real')
          .mockImplementationOnce(() => 1)
          .mockImplementationOnce(() => 7)
          .mockImplementationOnce(() => 4);

        const dice = {
          rollTable: [
            { value: 3, weight: 1 },
            { value: 6, weight: 4 },
            { value: 8, weight: 7 },
          ],
        };

        let result = rollEngine.rollOnce(dice);
        expect(result).toBeInstanceOf(RollResult);
        expect(result.value).toBe(3);

        result = rollEngine.rollOnce(dice);
        expect(result).toBeInstanceOf(RollResult);
        expect(result.value).toBe(8);

        result = rollEngine.rollOnce(dice);
        expect(result).toBeInstanceOf(RollResult);
        expect(result.value).toBe(6);

        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy).toHaveBeenNthCalledWith(1, 0, 12, true);
        expect(spy).toHaveBeenNthCalledWith(2, 0, 12, true);
        expect(spy).toHaveBeenNthCalledWith(3, 0, 12, true);
      });
    });

    describe('Min / max', () => {
      test('Uses `min` and `max` if no roll table is provided', () => {
        spy = jest
          .spyOn(Generator.prototype, 'real');

        const dice = new StandardDice(10, 1);
        rollEngine.rollOnce(dice);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(dice.min-1, dice.max, true);
      });

      test('Throws exception if no `min` and `max` are provided', () => {
        expect(() => {
          rollEngine.rollOnce({});
        }).toThrow(TypeError);

        expect(() => {
          rollEngine.rollOnce({min: 6});
        }).toThrow(TypeError);

        expect(() => {
          rollEngine.rollOnce({max: 20});
        }).toThrow(TypeError);
      });

      test('Min and max can be set to 0', () => {
        spy = jest
          .spyOn(Generator.prototype, 'real');

        const result = rollEngine.rollOnce({
          min: 0,
          max: 0,
        });

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(0, 1, true);

        expect(result).toBeInstanceOf(RollResult);
        expect(result.value).toBe(0);
      });

      test('Min and max can be negative', () => {
        spy = jest
          .spyOn(Generator.prototype, 'real')
          .mockImplementationOnce(() => 45);

        const result = rollEngine.rollOnce({
          min: -156,
          max: -1,
        });

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(0, 156, true);

        expect(result).toBeInstanceOf(RollResult);
        expect(result.value).toBe(-112);
      });
    });
  });

  describe('Rolling', () => {
    test('Throws exception if no dice is provided', () => {
      expect(() => {
        // @ts-expect-error testing missing argument
        rollEngine.roll();
      }).toThrow(RequiredArgumentError);

      expect(() => {
        // @ts-expect-error testing invalid argument
        rollEngine.roll(false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        // @ts-expect-error testing invalid argument
        rollEngine.roll(undefined);
      }).toThrow(RequiredArgumentError);
    });

    test('Returns a Result Collection', () => {
      spy = jest
        .spyOn(Generator.prototype, 'real')
        .mockImplementationOnce(() => 3);

      const result = rollEngine.roll(
        {
          rollTable: [1, 2, 3, 4, 5, 6],
        },
        1
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(0, 6, true);

      expect(result).toBeInstanceOf(RollResults);
      expect(result).toHaveLength(1);

      expect(result.rolls[0]).toBeInstanceOf(RollResult);
      expect(result.rolls[0]?.value).toBe(3);
    });

    test('Can roll multiple times', () => {
      const results = [3, 5, 1, 5];

      spy = jest.spyOn(Generator.prototype, 'real');

      results.forEach((result) => {
        (spy as jest.SpyInstance).mockImplementationOnce(() => result)
      });

      const result = rollEngine.roll(
        {
          rollTable: [1, 2, 3, 4, 5, 6],
        },
        results.length
      );

      expect(spy).toHaveBeenCalledTimes(results.length);
      expect(spy).toHaveBeenCalledWith(0, 6, true);

      expect(result).toBeInstanceOf(RollResults);
      expect(result).toHaveLength(results.length);

      results.forEach((value, index) => {
        expect(result.rolls[index]).toBeInstanceOf(RollResult);
        expect(result.rolls[index]?.value).toBe(value);
      });
    });

    test('Times defaults to 1', () => {
      spy = jest
        .spyOn(Generator.prototype, 'real')
        .mockImplementationOnce(() => 5.7);

      const result = rollEngine.roll(
        {
          rollTable: [1, 2, 3, 4, 5, 6],
        }
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(0, 6, true);

      expect(result).toBeInstanceOf(RollResults);
      expect(result).toHaveLength(1);

      expect(result.rolls[0]).toBeInstanceOf(RollResult);
      expect(result.rolls[0]?.value).toBe(6);
    });

    test('Returns empty if `times` is zero', () => {
      const result = rollEngine.roll(
        {
          rollTable: [1, 2, 3, 4, 5, 6],
        },
        0
      );

      expect(result).toBeInstanceOf(RollResults);
      expect(result).toHaveLength(0);
    });

    test('Returns empty if `times` is negative', () => {
      const result = rollEngine.roll(
        {
          rollTable: [1, 2, 3, 4, 5, 6],
        },
        -45
      );

      expect(result).toBeInstanceOf(RollResults);
      expect(result).toHaveLength(0);
    });
  });
});
