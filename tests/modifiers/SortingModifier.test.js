import { StandardDice } from '../../src/dice/index.js';
import { Modifier, SortingModifier } from '../../src/modifiers/index.js';
import ResultGroup from '../../src/results/ResultGroup.js';
import RollResult from '../../src/results/RollResult.js';
import RollResults from '../../src/results/RollResults.js';
import RollGroup from '../../src/RollGroup.js';

describe('SortingModifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const mod = new SortingModifier();

      expect(mod).toBeInstanceOf(SortingModifier);
      expect(mod).toBeInstanceOf(Modifier);
      expect(mod).toEqual(expect.objectContaining({
        direction: 'a',
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
      const mod = new SortingModifier('d');

      expect(mod.direction).toEqual('d');
      expect(mod.notation).toBe('sd');
    });

    test('can be changed', () => {
      const mod = new SortingModifier('a');

      expect(mod.direction).toEqual('a');
      expect(mod.notation).toBe('sa');

      mod.direction = 'd';

      expect(mod.direction).toEqual('d');
      expect(mod.notation).toBe('sd');
    });

    test('throws error if not set to `a` | `d`', () => {
      const mod = new SortingModifier();

      expect(() => {
        mod.direction = 'foo';
      }).toThrow(RangeError);

      expect(() => {
        mod.direction = '';
      }).toThrow(RangeError);

      expect(() => {
        mod.direction = ['a'];
      }).toThrow(RangeError);

      expect(() => {
        mod.direction = { direction: 'a' };
      }).toThrow(RangeError);

      expect(() => {
        mod.direction = true;
      }).toThrow(RangeError);

      expect(() => {
        mod.direction = false;
      }).toThrow(RangeError);

      expect(() => {
        mod.direction = 1;
      }).toThrow(RangeError);

      expect(() => {
        mod.direction = 0;
      }).toThrow(RangeError);
    });
  });

  describe('Notation', () => {
    test('ascending', () => {
      let mod = new SortingModifier();
      expect(mod.notation).toEqual('sa');

      mod = new SortingModifier('a');
      expect(mod.notation).toEqual('sa');
    });

    test('descending', () => {
      const mod = new SortingModifier('d');
      expect(mod.notation).toEqual('sd');
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const mod = new SortingModifier('d');

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        direction: 'd',
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
    let mod;
    let context;
    let results;

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
        const modifiedResults = mod.run(results, context).rolls;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(6);

        expect(modifiedResults[0].initialValue).toBe(1);
        expect(modifiedResults[0].value).toBe(1);
        expect(modifiedResults[0].modifiers).toEqual(new Set());

        expect(modifiedResults[1].initialValue).toBe(2);
        expect(modifiedResults[1].value).toBe(2);
        expect(modifiedResults[1].modifiers).toEqual(new Set());

        expect(modifiedResults[2].initialValue).toBe(4);
        expect(modifiedResults[2].value).toBe(4);
        expect(modifiedResults[2].modifiers).toEqual(new Set());

        expect(modifiedResults[3].initialValue).toBe(6);
        expect(modifiedResults[3].value).toBe(6);
        expect(modifiedResults[3].modifiers).toEqual(new Set());

        expect(modifiedResults[4].initialValue).toBe(8);
        expect(modifiedResults[4].value).toBe(8);
        expect(modifiedResults[4].modifiers).toEqual(new Set());

        expect(modifiedResults[5].initialValue).toBe(10);
        expect(modifiedResults[5].value).toBe(10);
        expect(modifiedResults[5].modifiers).toEqual(new Set());
      });

      test('sorts rolls descending', () => {
        mod.direction = 'd';

        const modifiedResults = mod.run(results, context).rolls;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(6);

        expect(modifiedResults[0].initialValue).toBe(10);
        expect(modifiedResults[0].value).toBe(10);
        expect(modifiedResults[0].modifiers).toEqual(new Set());

        expect(modifiedResults[1].initialValue).toBe(8);
        expect(modifiedResults[1].value).toBe(8);
        expect(modifiedResults[1].modifiers).toEqual(new Set());

        expect(modifiedResults[2].initialValue).toBe(6);
        expect(modifiedResults[2].value).toBe(6);
        expect(modifiedResults[2].modifiers).toEqual(new Set());

        expect(modifiedResults[3].initialValue).toBe(4);
        expect(modifiedResults[3].value).toBe(4);
        expect(modifiedResults[3].modifiers).toEqual(new Set());

        expect(modifiedResults[4].initialValue).toBe(2);
        expect(modifiedResults[4].value).toBe(2);
        expect(modifiedResults[4].modifiers).toEqual(new Set());

        expect(modifiedResults[5].initialValue).toBe(1);
        expect(modifiedResults[5].value).toBe(1);
        expect(modifiedResults[5].modifiers).toEqual(new Set());
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
        const modifiedResults = mod.run(results, context).results;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(3);

        expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
        expect(modifiedResults[0]).toHaveLength(3);

        expect(modifiedResults[1]).toBeInstanceOf(ResultGroup);
        expect(modifiedResults[1]).toHaveLength(3);

        expect(modifiedResults[2]).toBeInstanceOf(ResultGroup);
        expect(modifiedResults[2]).toHaveLength(3);

        let subResults = modifiedResults[0].results;
        expect(subResults).toBeInstanceOf(Array);
        expect(subResults).toHaveLength(3);

        expect(subResults[0]).toBeInstanceOf(RollResults);
        expect(subResults[0].rolls).toBeInstanceOf(Array);
        expect(subResults[0].rolls).toHaveLength(4);
        expect(subResults[0].rolls[0]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[0].value).toBe(1);
        expect(subResults[0].rolls[1]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[1].value).toBe(3);
        expect(subResults[0].rolls[2]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[2].value).toBe(4);
        expect(subResults[0].rolls[3]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[3].value).toBe(5);

        expect(subResults[1]).toEqual('+');

        expect(subResults[2]).toBeInstanceOf(RollResults);
        expect(subResults[2].rolls).toHaveLength(2);
        expect(subResults[2].rolls[0]).toBeInstanceOf(RollResult);
        expect(subResults[2].rolls[0].value).toBe(3);
        expect(subResults[2].rolls[1]).toBeInstanceOf(RollResult);
        expect(subResults[2].rolls[1].value).toBe(7);

        subResults = modifiedResults[1].results;
        expect(subResults).toBeInstanceOf(Array);
        expect(subResults).toHaveLength(3);

        expect(subResults[0]).toBeInstanceOf(RollResults);
        expect(subResults[0].rolls).toBeInstanceOf(Array);
        expect(subResults[0].rolls).toHaveLength(5);
        expect(subResults[0].rolls[0]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[0].value).toBe(1);
        expect(subResults[0].rolls[1]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[1].value).toBe(3);
        expect(subResults[0].rolls[2]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[2].value).toBe(5);
        expect(subResults[0].rolls[3]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[3].value).toBe(8);
        expect(subResults[0].rolls[4]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[4].value).toBe(9);

        expect(subResults[1]).toEqual('+');
        expect(subResults[2]).toBe(1);

        subResults = modifiedResults[2].results;
        expect(subResults).toBeInstanceOf(Array);
        expect(subResults).toHaveLength(3);

        expect(subResults[0]).toBeInstanceOf(RollResults);
        expect(subResults[0].rolls).toBeInstanceOf(Array);
        expect(subResults[0].rolls).toHaveLength(2);
        expect(subResults[0].rolls[0]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[0].value).toBe(12);
        expect(subResults[0].rolls[1]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[1].value).toBe(18);

        expect(subResults[1]).toEqual('+');
        expect(subResults[2]).toBe(3);
      });

      test('sorts rolls descending', () => {
        mod.direction = 'd';

        const modifiedResults = mod.run(results, context).results;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(3);

        expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
        expect(modifiedResults[0]).toHaveLength(3);

        expect(modifiedResults[1]).toBeInstanceOf(ResultGroup);
        expect(modifiedResults[1]).toHaveLength(3);

        expect(modifiedResults[2]).toBeInstanceOf(ResultGroup);
        expect(modifiedResults[2]).toHaveLength(3);

        let subResults = modifiedResults[0].results;
        expect(subResults).toBeInstanceOf(Array);
        expect(subResults).toHaveLength(3);

        expect(subResults[0]).toBeInstanceOf(RollResults);
        expect(subResults[0].rolls).toBeInstanceOf(Array);
        expect(subResults[0].rolls).toHaveLength(2);
        expect(subResults[0].rolls[0]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[0].value).toBe(18);
        expect(subResults[0].rolls[1]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[1].value).toBe(12);

        expect(subResults[1]).toEqual('+');
        expect(subResults[2]).toBe(3);

        subResults = modifiedResults[1].results;
        expect(subResults).toBeInstanceOf(Array);
        expect(subResults).toHaveLength(3);

        expect(subResults[0]).toBeInstanceOf(RollResults);
        expect(subResults[0].rolls).toBeInstanceOf(Array);
        expect(subResults[0].rolls).toHaveLength(5);
        expect(subResults[0].rolls[0]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[0].value).toBe(9);
        expect(subResults[0].rolls[1]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[1].value).toBe(8);
        expect(subResults[0].rolls[2]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[2].value).toBe(5);
        expect(subResults[0].rolls[3]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[3].value).toBe(3);
        expect(subResults[0].rolls[4]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[4].value).toBe(1);

        expect(subResults[1]).toEqual('+');
        expect(subResults[2]).toBe(1);

        subResults = modifiedResults[2].results;
        expect(subResults).toBeInstanceOf(Array);
        expect(subResults).toHaveLength(3);

        expect(subResults[0]).toBeInstanceOf(RollResults);
        expect(subResults[0].rolls).toBeInstanceOf(Array);
        expect(subResults[0].rolls).toHaveLength(4);
        expect(subResults[0].rolls[0]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[0].value).toBe(5);
        expect(subResults[0].rolls[1]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[1].value).toBe(4);
        expect(subResults[0].rolls[2]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[2].value).toBe(3);
        expect(subResults[0].rolls[3]).toBeInstanceOf(RollResult);
        expect(subResults[0].rolls[3].value).toBe(1);

        expect(subResults[1]).toEqual('+');

        expect(subResults[2]).toBeInstanceOf(RollResults);
        expect(subResults[2].rolls).toBeInstanceOf(Array);
        expect(subResults[2].rolls).toHaveLength(2);
        expect(subResults[2].rolls[0]).toBeInstanceOf(RollResult);
        expect(subResults[2].rolls[0].value).toBe(7);
        expect(subResults[2].rolls[1]).toBeInstanceOf(RollResult);
        expect(subResults[2].rolls[1].value).toBe(3);
      });
    });
  });
});
