import { StandardDice } from '../../../src/dice';
import { Modifier, SortingModifier } from '../../../src/modifiers';
import ResultGroup from '../../../src/results/ResultGroup';
import RollResult from '../../../src/results/RollResult';
import RollResults from '../../../src/results/RollResults';
import RollGroup from '../../../src/RollGroup';
import { SortDirection } from "../../../src/types/Enums/SortDirection";
import { SingleResult } from "../../../src/types/Interfaces/Results/SingleResult";

describe('SortingModifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const mod = new SortingModifier();

      expect(mod).toBeInstanceOf(SortingModifier);
      expect(mod).toBeInstanceOf(Modifier);
      expect(mod).toEqual(expect.objectContaining({
        direction: SortDirection.Asc,
        name: 'sorting',
        notation: 'sa',
        order: 11,
        run: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });
  });

  describe('Direction', () => {
    test('gets set in constructor', () => {
      const mod = new SortingModifier(SortDirection.Desc);

      expect(mod.direction).toEqual(SortDirection.Desc);
      expect(mod.notation).toBe('sd');
    });

    test('can be changed', () => {
      const mod = new SortingModifier(SortDirection.Asc);

      expect(mod.direction).toEqual(SortDirection.Asc);
      expect(mod.notation).toBe('sa');

      mod.direction = SortDirection.Desc;

      expect(mod.direction).toEqual(SortDirection.Desc);
      expect(mod.notation).toBe('sd');
    });

    test('throws error if not set to `a` | `d`', () => {
      const mod = new SortingModifier();

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.direction = 'foo';
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.direction = '';
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.direction = ['a'];
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.direction = { direction: 'a' };
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.direction = true;
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.direction = false;
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.direction = 1;
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.direction = 0;
      }).toThrow(RangeError);
    });
  });

  describe('Notation', () => {
    test('ascending', () => {
      let mod = new SortingModifier();
      expect(mod.notation).toEqual('sa');

      mod = new SortingModifier(SortDirection.Asc);
      expect(mod.notation).toEqual('sa');
    });

    test('descending', () => {
      const mod = new SortingModifier(SortDirection.Desc);
      expect(mod.notation).toEqual('sd');
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const mod = new SortingModifier(SortDirection.Desc);

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        direction: SortDirection.Desc,
        name: 'sorting',
        notation: 'sd',
        type: 'modifier',
      });
    });

    test('toString output is correct', () => {
      const mod = new SortingModifier();

      expect(mod.toString()).toEqual('sa');
    });
  });

  describe('Run', () => {
    let mod: SortingModifier;
    let context: StandardDice|RollGroup;
    let results: RollResults|ResultGroup;

    beforeEach(() => {
      mod = new SortingModifier();
    });

    describe('basic', () => {
      beforeEach(() => {
        context = new StandardDice(10, 6);

        results = new RollResults([
          8, 4, 2, 1, 6, 10,
        ]);
      });

      test('returns `RollResults` object', () => {
        expect(mod.run(results, context)).toBeInstanceOf(RollResults);
      });

      test('sorts rolls ascending', () => {
        const modifiedResults = (mod.run(results, context) as RollResults).rolls;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(6);

        let result = modifiedResults[0] as SingleResult;
        expect(result.initialValue).toBe(1);
        expect(result.value).toBe(1);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[1] as SingleResult
        expect(result.initialValue).toBe(2);
        expect(result.value).toBe(2);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[2] as SingleResult
        expect(result.initialValue).toBe(4);
        expect(result.value).toBe(4);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[3] as SingleResult
        expect(result.initialValue).toBe(6);
        expect(result.value).toBe(6);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[4] as SingleResult
        expect(result.initialValue).toBe(8);
        expect(result.value).toBe(8);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[5] as SingleResult
        expect(result.initialValue).toBe(10);
        expect(result.value).toBe(10);
        expect(result.modifiers).toEqual(new Set());
      });

      test('sorts rolls descending', () => {
        mod.direction = SortDirection.Desc;

        const modifiedResults = (mod.run(results, context) as RollResults).rolls;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(6);

        let result = modifiedResults[0] as SingleResult;
        expect(result.initialValue).toBe(10);
        expect(result.value).toBe(10);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[1] as SingleResult;
        expect(result.initialValue).toBe(8);
        expect(result.value).toBe(8);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[2] as SingleResult;
        expect(result.initialValue).toBe(6);
        expect(result.value).toBe(6);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[3] as SingleResult;
        expect(result.initialValue).toBe(4);
        expect(result.value).toBe(4);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[4] as SingleResult;
        expect(result.initialValue).toBe(2);
        expect(result.value).toBe(2);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[5] as SingleResult;
        expect(result.initialValue).toBe(1);
        expect(result.value).toBe(1);
        expect(result.modifiers).toEqual(new Set());
      });
    });

    describe('Roll groups', () => {
      beforeEach(() => {
        // {4d6+2d8, 3d20+3, 5d10+1}
        context = new RollGroup([
          [
            new StandardDice(6, 4),
            '+',
            new StandardDice(8, 2),
          ],
          [
            new StandardDice(20, 3),
            '+',
            3,
          ],
          [
            new StandardDice(10, 5),
            '+',
            1,
          ],
        ]);

        results = new ResultGroup([
          // 23
          new ResultGroup([
            new RollResults([4, 3, 1, 5]),
            '+',
            new RollResults([7, 3]),
          ]),
          // 33
          new ResultGroup([
            new RollResults([18, 12]),
            '+',
            3,
          ]),
          // 27
          new ResultGroup([
            new RollResults([8, 5, 9, 1, 3]),
            '+',
            1,
          ]),
        ]);
      });

      test('returns `ResultGroup` object', () => {
        expect(mod.run(results, context)).toBeInstanceOf(ResultGroup);
      });

      test('sorts rolls ascending', () => {
        const modifiedResults = (mod.run(results, context) as ResultGroup).results;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(3);

        expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
        expect(modifiedResults[0]).toHaveLength(3);

        expect(modifiedResults[1]).toBeInstanceOf(ResultGroup);
        expect(modifiedResults[1]).toHaveLength(3);

        expect(modifiedResults[2]).toBeInstanceOf(ResultGroup);
        expect(modifiedResults[2]).toHaveLength(3);

        let subResults = (modifiedResults[0] as ResultGroup).results;
        expect(subResults).toBeInstanceOf(Array);
        expect(subResults).toHaveLength(3);

        let result = subResults[0] as RollResults;
        expect(result).toBeInstanceOf(RollResults);
        expect(result.rolls).toBeInstanceOf(Array);
        expect(result.rolls).toHaveLength(4);
        expect(result.rolls[0]).toBeInstanceOf(RollResult);
        expect(result.rolls[0]?.value).toBe(1);
        expect(result.rolls[1]).toBeInstanceOf(RollResult);
        expect(result.rolls[1]?.value).toBe(3);
        expect(result.rolls[2]).toBeInstanceOf(RollResult);
        expect(result.rolls[2]?.value).toBe(4);
        expect(result.rolls[3]).toBeInstanceOf(RollResult);
        expect(result.rolls[3]?.value).toBe(5);

        expect(subResults[1]).toEqual('+');

        result = subResults[2] as RollResults;
        expect(result).toBeInstanceOf(RollResults);
        expect(result.rolls).toHaveLength(2);
        expect(result.rolls[0]).toBeInstanceOf(RollResult);
        expect(result.rolls[0]?.value).toBe(3);
        expect(result.rolls[1]).toBeInstanceOf(RollResult);
        expect(result.rolls[1]?.value).toBe(7);

        subResults = (modifiedResults[1] as ResultGroup).results;
        expect(subResults).toBeInstanceOf(Array);
        expect(subResults).toHaveLength(3);

        result = subResults[0] as RollResults;
        expect(result).toBeInstanceOf(RollResults);
        expect(result.rolls).toBeInstanceOf(Array);
        expect(result.rolls).toHaveLength(5);
        expect(result.rolls[0]).toBeInstanceOf(RollResult);
        expect(result.rolls[0]?.value).toBe(1);
        expect(result.rolls[1]).toBeInstanceOf(RollResult);
        expect(result.rolls[1]?.value).toBe(3);
        expect(result.rolls[2]).toBeInstanceOf(RollResult);
        expect(result.rolls[2]?.value).toBe(5);
        expect(result.rolls[3]).toBeInstanceOf(RollResult);
        expect(result.rolls[3]?.value).toBe(8);
        expect(result.rolls[4]).toBeInstanceOf(RollResult);
        expect(result.rolls[4]?.value).toBe(9);

        expect(subResults[1]).toEqual('+');
        expect(subResults[2]).toBe(1);

        subResults = (modifiedResults[2] as ResultGroup).results;
        expect(subResults).toBeInstanceOf(Array);
        expect(subResults).toHaveLength(3);

        result = subResults[0] as RollResults;
        expect(result).toBeInstanceOf(RollResults);
        expect(result.rolls).toBeInstanceOf(Array);
        expect(result.rolls).toHaveLength(2);
        expect(result.rolls[0]).toBeInstanceOf(RollResult);
        expect(result.rolls[0]?.value).toBe(12);
        expect(result.rolls[1]).toBeInstanceOf(RollResult);
        expect(result.rolls[1]?.value).toBe(18);

        expect(subResults[1]).toEqual('+');
        expect(subResults[2]).toBe(3);
      });

      test('sorts rolls descending', () => {
        mod.direction = SortDirection.Desc;

        const modifiedResults = (mod.run(results, context) as ResultGroup).results;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(3);

        expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
        expect(modifiedResults[0]).toHaveLength(3);

        expect(modifiedResults[1]).toBeInstanceOf(ResultGroup);
        expect(modifiedResults[1]).toHaveLength(3);

        expect(modifiedResults[2]).toBeInstanceOf(ResultGroup);
        expect(modifiedResults[2]).toHaveLength(3);

        let subResults = (modifiedResults[0] as ResultGroup).results;
        expect(subResults).toBeInstanceOf(Array);
        expect(subResults).toHaveLength(3);

        let result = subResults[0] as RollResults;
        expect(result).toBeInstanceOf(RollResults);
        expect(result.rolls).toBeInstanceOf(Array);
        expect(result.rolls).toHaveLength(2);
        expect(result.rolls[0]).toBeInstanceOf(RollResult);
        expect(result.rolls[0]?.value).toBe(18);
        expect(result.rolls[1]).toBeInstanceOf(RollResult);
        expect(result.rolls[1]?.value).toBe(12);

        expect(subResults[1]).toEqual('+');
        expect(subResults[2]).toBe(3);

        subResults = (modifiedResults[1] as ResultGroup).results;
        expect(subResults).toBeInstanceOf(Array);
        expect(subResults).toHaveLength(3);

        result = subResults[0] as RollResults;
        expect(result).toBeInstanceOf(RollResults);
        expect(result.rolls).toBeInstanceOf(Array);
        expect(result.rolls).toHaveLength(5);
        expect(result.rolls[0]).toBeInstanceOf(RollResult);
        expect(result.rolls[0]?.value).toBe(9);
        expect(result.rolls[1]).toBeInstanceOf(RollResult);
        expect(result.rolls[1]?.value).toBe(8);
        expect(result.rolls[2]).toBeInstanceOf(RollResult);
        expect(result.rolls[2]?.value).toBe(5);
        expect(result.rolls[3]).toBeInstanceOf(RollResult);
        expect(result.rolls[3]?.value).toBe(3);
        expect(result.rolls[4]).toBeInstanceOf(RollResult);
        expect(result.rolls[4]?.value).toBe(1);

        expect(subResults[1]).toEqual('+');
        expect(subResults[2]).toBe(1);

        subResults = (modifiedResults[2] as ResultGroup).results;
        expect(subResults).toBeInstanceOf(Array);
        expect(subResults).toHaveLength(3);

        result = subResults[0] as RollResults;
        expect(result).toBeInstanceOf(RollResults);
        expect(result.rolls).toBeInstanceOf(Array);
        expect(result.rolls).toHaveLength(4);
        expect(result.rolls[0]).toBeInstanceOf(RollResult);
        expect(result.rolls[0]?.value).toBe(5);
        expect(result.rolls[1]).toBeInstanceOf(RollResult);
        expect(result.rolls[1]?.value).toBe(4);
        expect(result.rolls[2]).toBeInstanceOf(RollResult);
        expect(result.rolls[2]?.value).toBe(3);
        expect(result.rolls[3]).toBeInstanceOf(RollResult);
        expect(result.rolls[3]?.value).toBe(1);

        expect(subResults[1]).toEqual('+');

        result = subResults[2] as RollResults;
        expect(result).toBeInstanceOf(RollResults);
        expect(result.rolls).toBeInstanceOf(Array);
        expect(result.rolls).toHaveLength(2);
        expect(result.rolls[0]).toBeInstanceOf(RollResult);
        expect(result.rolls[0]?.value).toBe(7);
        expect(result.rolls[1]).toBeInstanceOf(RollResult);
        expect(result.rolls[1]?.value).toBe(3);
      });
    });
  });
});
