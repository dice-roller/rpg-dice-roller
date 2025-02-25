import RollResults from '../../../src/results/RollResults';
import RollResult from '../../../src/results/RollResult';
import { ModelType } from "../../../src/types/Enums/ModelType";

describe('RollResults', () => {
  let rolls: RollResult[];
  let results: RollResults;

  beforeEach(() => {
    rolls = [
      new RollResult(8),
      new RollResult(4),
      new RollResult(2),
      new RollResult(1),
      new RollResult(6),
      new RollResult(10),
    ];

    results = new RollResults(rolls);
  });

  describe('Initialisation', () => {
    test('model structure', () => {
      expect(results).toBeInstanceOf(RollResults);

      expect(typeof results.addRoll).toBe('function');
      expect(results).toHaveLength(6);
      expect(results.rolls).toEqual(rolls);
      expect(results.value).toBe(31);
      expect(typeof results.toJSON).toBe('function');
      expect(typeof results.toString).toBe('function');
    });
  });

  describe('rolls', () => {
    test('can set in constructor', () => {
      expect(results.rolls).toEqual(rolls);
    });

    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(RollResults.prototype, 'rolls', 'set');

      // create the modifier
      new RollResults(rolls);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(rolls);

      // remove the spy
      spy.mockRestore();
    });

    test('defaults to empty array', () => {
      results = new RollResults();

      expect(results.rolls).toEqual([]);
    });

    test('must be array', () => {
      results = new RollResults();

      expect(() => {
        // @ts-expect-error testing invalid value
        results.rolls = 'Foo';
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        results.rolls = {};
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        results.rolls = true;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        results.rolls = false;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        results.rolls = null;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        results.rolls = undefined;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        results.rolls = 0;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        results.rolls = 1;
      }).toThrow(TypeError);
    });

    test('accepts `RollResult` objects', () => {
      results = new RollResults();

      results.rolls = rolls;

      expect(results.rolls).toEqual(rolls);
    });

    test('casts numbers to RollResult objects', () => {
      results = new RollResults();

      results.rolls = [5, 2, 0, 6];

      expect(results.rolls).toEqual([
        new RollResult(5),
        new RollResult(2),
        new RollResult(0),
        new RollResult(6),
      ]);
    });

    test('throws error on invalid roll values', () => {
      results = new RollResults();

      expect(() => {
        // @ts-expect-error testing invalid value
        results.rolls = [34, 'foo'];
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        results.rolls = [{ foo: 'bar' }];
      }).toThrow(TypeError);
    });

    test('can append to rolls', () => {
      results.addRoll(4);

      expect(results.rolls).toEqual([
        ...rolls,
        new RollResult(4),
      ]);
    });
  });

  describe('length', () => {
    test('length returns number of rolls', () => {
      results = new RollResults();

      expect(results).toHaveLength(0);

      results.addRoll(4);
      expect(results).toHaveLength(1);

      results.rolls = rolls;
      expect(results).toHaveLength(6);

      results.rolls = [];
      expect(results).toHaveLength(0);
    });

    test('cannot set length', () => {
      results = new RollResults();

      expect(() => {
        // @ts-expect-error testing invalid value
        results.length = 3;
      }).toThrow(TypeError);
    });
  });

  describe('value', () => {
    test('is total of rolls', () => {
      results = new RollResults();

      expect(results.value).toEqual(0);

      results.rolls = rolls;
      expect(results.value).toEqual(31);

      results.addRoll(6);
      expect(results.value).toEqual(37);
    });

    test('ignores rolls flagged as `useInTotal = false`', () => {
      results = new RollResults();

      // flag a roll as ignored
      (rolls[0] as RollResult).useInTotal = false;

      results.rolls = rolls;

      expect(results.value).toEqual(23);
    });

    test('uses `RollResult` `calculationValue`', () => {
      results = new RollResults();

      // store the current value as the calculation value
      const roll = rolls[0] as RollResult
      roll.calculationValue = roll.value;
      // now change the value
      roll.value = 23;

      results.rolls = rolls;

      expect(results.value).toEqual(31);

      // increment the second roll's calc value by 7
      (rolls[1] as RollResult).calculationValue += 7;

      results.rolls = rolls;

      expect(results.value).toEqual(38);
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(results))).toEqual({
        rolls: [
          expect.objectContaining({
            calculationValue: 8,
            initialValue: 8,
            value: 8,
          }),
          expect.objectContaining({
            calculationValue: 4,
            initialValue: 4,
            value: 4,
          }),
          expect.objectContaining({
            calculationValue: 2,
            initialValue: 2,
            value: 2,
          }),
          expect.objectContaining({
            calculationValue: 1,
            initialValue: 1,
            value: 1,
          }),
          expect.objectContaining({
            calculationValue: 6,
            initialValue: 6,
            value: 6,
          }),
          expect.objectContaining({
            calculationValue: 10,
            initialValue: 10,
            value: 10,
          }),
        ],
        type: ModelType.ResultCollection,
        value: 31,
      });
    });

    test('toString output is correct', () => {
      expect(results.toString()).toEqual('[8, 4, 2, 1, 6, 10]');
    });

    test('toString calls `RollResult` toString method', () => {
      const spy = jest.spyOn(RollResult.prototype, 'toString');

      results.toString();

      expect(spy).toHaveBeenCalledTimes(6);

      // remove the spy
      spy.mockRestore();
    });

    test('toString outputs modifiers', () => {
      (rolls[0] as RollResult).modifiers = ['explode'];
      (rolls[1] as RollResult).modifiers = ['drop'];
      (rolls[2] as RollResult).modifiers = ['penetrate', 'critical-success'];
      (rolls[3] as RollResult).modifiers = ['re-roll', 'critical-failure'];

      results.rolls = rolls;

      expect(results.toString()).toEqual('[8!, 4d, 2p**, 1r__, 6, 10]');
    });
  });
});
