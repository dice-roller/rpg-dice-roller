import { ComparisonModifier, UniqueModifier } from '../../../src/modifiers';
import { StandardDice } from '../../../src/dice';
import { DieActionValueError } from '../../../src/exceptions';
import ComparePoint from '../../../src/ComparePoint';
import RollResults from '../../../src/results/RollResults';
import RollResult from '../../../src/results/RollResult';

describe('UniqueModifier', () => {
  describe('Initialisation', () => {
    test('Model structure', () => {
      const mod = new UniqueModifier();

      expect(mod).toBeInstanceOf(UniqueModifier);
      expect(mod).toBeInstanceOf(ComparisonModifier);

      expect(mod).toHaveProperty('comparePoint', null);
      expect(mod).toHaveProperty('isComparePoint', expect.any(Function));
      expect(mod).toHaveProperty('name', 'unique');
      expect(mod).toHaveProperty('notation', 'u');
      expect(mod).toHaveProperty('once', false);
      expect(mod).toHaveProperty('run', expect.any(Function));
      expect(mod).toHaveProperty('toJSON', expect.any(Function));
      expect(mod).toHaveProperty('toString', expect.any(Function));
    });
  });

  describe('Compare Point', () => {
    test('Gets set in constructor', () => {
      const cp = new ComparePoint('>', 8);
      const mod = new UniqueModifier(false, cp);

      expect(mod.comparePoint).toBe(cp);
      expect(mod.notation).toBe('u>8');
    });

    test('setting in constructor calls setter in parent', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'comparePoint', 'set');

      new UniqueModifier(false, new ComparePoint('>', 8));

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });
  });

  describe('Matching', () => {
    test('isComparePoint uses parent', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'isComparePoint');
      const mod = new UniqueModifier(false, new ComparePoint('>', 8));

      // attempt to match
      expect(mod.isComparePoint(9)).toBe(true);
      expect(mod.isComparePoint(8)).toBe(false);
      expect(mod.isComparePoint(7)).toBe(false);
      expect(mod.isComparePoint(0)).toBe(false);

      expect(spy).toHaveBeenCalledTimes(4);

      // remove the spy
      spy.mockRestore();
    });
  });

  describe('Once', () => {
    test('gets set in constructor', () => {
      const mod = new UniqueModifier(true);

      expect(mod.once).toBe(true);
      expect(mod.notation).toBe('uo');
    });

    test('can be changed', () => {
      const mod = new UniqueModifier(true);

      expect(mod.once).toBe(true);
      expect(mod.notation).toBe('uo');

      mod.once = false;

      expect(mod.once).toBe(false);
      expect(mod.notation).toBe('u');
    });

    test('cast to boolean', () => {
      // @ts-expect-error testing invalid value
      expect((new UniqueModifier('foo')).once).toBe(true);
      // @ts-expect-error testing invalid value
      expect((new UniqueModifier('')).once).toBe(false);
      // @ts-expect-error testing invalid value
      expect((new UniqueModifier('0')).once).toBe(true);
      // @ts-expect-error testing invalid value
      expect((new UniqueModifier(0)).once).toBe(false);
      // @ts-expect-error testing invalid value
      expect((new UniqueModifier(1)).once).toBe(true);
      // @ts-expect-error testing invalid value
      expect((new UniqueModifier([])).once).toBe(true);
      // @ts-expect-error testing invalid value
      expect((new UniqueModifier({})).once).toBe(true);
      // @ts-expect-error testing invalid value
      expect((new UniqueModifier(null)).once).toBe(false);
      expect((new UniqueModifier(undefined)).once).toBe(false);
    });
  });

  describe('Notation', () => {
    test('Unlimited', () => {
      let mod = new UniqueModifier(false, new ComparePoint('>', 15));
      expect(mod.notation).toEqual('u>15');

      mod = new UniqueModifier(false, new ComparePoint('=', 6961));
      expect(mod.notation).toEqual('u=6961');

      mod = new UniqueModifier(false, new ComparePoint('<=', 189));
      expect(mod.notation).toEqual('u<=189');

      mod = new UniqueModifier(false, new ComparePoint('>=', 3));
      expect(mod.notation).toEqual('u>=3');
    });

    test('once', () => {
      let mod = new UniqueModifier(true, new ComparePoint('>', 15));
      expect(mod.notation).toEqual('uo>15');

      mod = new UniqueModifier(true, new ComparePoint('=', 6961));
      expect(mod.notation).toEqual('uo=6961');

      mod = new UniqueModifier(true, new ComparePoint('<=', 189));
      expect(mod.notation).toEqual('uo<=189');

      mod = new UniqueModifier(true, new ComparePoint('>=', 3));
      expect(mod.notation).toEqual('uo>=3');
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const cp = new ComparePoint('<=', 3);
      const mod = new UniqueModifier(true, cp);

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        comparePoint: cp.toJSON(),
        name: 'unique',
        notation: 'uo<=3',
        once: true,
        type: 'modifier',
      });
    });

    test('toString output is correct', () => {
      const mod = new UniqueModifier(false, new ComparePoint('>', 5));

      expect(mod.toString()).toEqual('u>5');
    });
  });

  describe('Run', () => {
    let mod: UniqueModifier;
    let die: StandardDice;
    let results: RollResults;
    let spy: jest.SpyInstance;

    beforeEach(() => {
      results = new RollResults([
        8, 4, 8, 1, 1, 8,
      ]);
      die = new StandardDice(10, 6);
      mod = new UniqueModifier();

      spy = jest.spyOn(StandardDice.prototype, 'rollOnce');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('Without compare point', () => {
      test('Re-rolls all duplicates', () => {
        spy.mockImplementationOnce(() => new RollResult(8))
          .mockImplementationOnce(() => new RollResult(10))
          .mockImplementationOnce(() => new RollResult(1))
          .mockImplementationOnce(() => new RollResult(1))
          .mockImplementationOnce(() => new RollResult(4))
          .mockImplementationOnce(() => new RollResult(2))
          .mockImplementationOnce(() => new RollResult(1))
          .mockImplementationOnce(() => new RollResult(8))
          .mockImplementationOnce(() => new RollResult(4))
          .mockImplementationOnce(() => new RollResult(3));

        const modifiedResults = mod.run(results, die).rolls;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(6);

        let result = modifiedResults[0] as RollResult;
        expect(result.initialValue).toBe(8);
        expect(result.value).toBe(8);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[1] as RollResult;
        expect(result.initialValue).toBe(4);
        expect(result.value).toBe(4);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[2] as RollResult;
        expect(result.initialValue).toBe(8);
        expect(result.value).toBe(10);
        expect(result.modifiers).toEqual(new Set(['unique']));

        result = modifiedResults[3] as RollResult;
        expect(result.initialValue).toBe(1);
        expect(result.value).toBe(1);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[4] as RollResult;
        expect(result.initialValue).toBe(1);
        expect(result.value).toBe(2);
        expect(result.modifiers).toEqual(new Set(['unique']));

        result = modifiedResults[5] as RollResult;
        expect(result.initialValue).toBe(8);
        expect(result.value).toBe(3);
        expect(result.modifiers).toEqual(new Set(['unique']));
      });

      test('Re-rolls duplicates once', () => {
        spy.mockImplementationOnce(() => new RollResult(8))
          .mockImplementationOnce(() => new RollResult(3))
          .mockImplementationOnce(() => new RollResult(4));

        mod.once = true;

        const modifiedResults = mod.run(results, die).rolls;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(6);

        let result = modifiedResults[0] as RollResult;
        expect(result.initialValue).toBe(8);
        expect(result.value).toBe(8);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[1] as RollResult;
        expect(result.initialValue).toBe(4);
        expect(result.value).toBe(4);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[2] as RollResult;
        expect(result.initialValue).toBe(8);
        expect(result.value).toBe(8);
        expect(result.modifiers).toEqual(new Set(['unique-once']));

        result = modifiedResults[3] as RollResult;
        expect(result.initialValue).toBe(1);
        expect(result.value).toBe(1);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[4] as RollResult;
        expect(result.initialValue).toBe(1);
        expect(result.value).toBe(3);
        expect(result.modifiers).toEqual(new Set(['unique-once']));

        result = modifiedResults[5] as RollResult;
        expect(result.initialValue).toBe(8);
        expect(result.value).toBe(4);
        expect(result.modifiers).toEqual(new Set(['unique-once']));
      });
    });

    describe('With compare point', () => {
      test('Re-rolls all duplicates matching compare point', () => {
        spy.mockImplementationOnce(() => new RollResult(8))
          .mockImplementationOnce(() => new RollResult(4));

        mod.comparePoint = new ComparePoint('<=', 4);

        const modifiedResults = mod.run(results, die).rolls;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(6);

        let result = modifiedResults[0] as RollResult;
        expect(result.initialValue).toBe(8);
        expect(result.value).toBe(8);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[1] as RollResult;
        expect(result.initialValue).toBe(4);
        expect(result.value).toBe(4);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[2] as RollResult;
        expect(result.initialValue).toBe(8);
        expect(result.value).toBe(8);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[3] as RollResult;
        expect(result.initialValue).toBe(1);
        expect(result.value).toBe(1);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[4] as RollResult;
        expect(result.initialValue).toBe(1);
        expect(result.value).toBe(8);
        expect(result.modifiers).toEqual(new Set(['unique']));

        result = modifiedResults[5] as RollResult;
        expect(result.initialValue).toBe(8);
        expect(result.value).toBe(8);
        expect(result.modifiers).toEqual(new Set());
      });

      test('Re-rolls duplicates matching compare point once', () => {
        spy.mockImplementationOnce(() => new RollResult(8));

        mod.comparePoint = new ComparePoint('<=', 4);
        mod.once = true;

        const modifiedResults = mod.run(results, die).rolls;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(6);

        let result = modifiedResults[0] as RollResult;
        expect(result.initialValue).toBe(8);
        expect(result.value).toBe(8);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[1] as RollResult;
        expect(result.initialValue).toBe(4);
        expect(result.value).toBe(4);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[2] as RollResult;
        expect(result.initialValue).toBe(8);
        expect(result.value).toBe(8);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[3] as RollResult;
        expect(result.initialValue).toBe(1);
        expect(result.value).toBe(1);
        expect(result.modifiers).toEqual(new Set());

        result = modifiedResults[4] as RollResult;
        expect(result.initialValue).toBe(1);
        expect(result.value).toBe(8);
        expect(result.modifiers).toEqual(new Set(['unique-once']));

        result = modifiedResults[5] as RollResult;
        expect(result.initialValue).toBe(8);
        expect(result.value).toBe(8);
        expect(result.modifiers).toEqual(new Set());
      });
    });

    test('Unique re-rolling with d1 throws an error', () => {
      // create a 1 sided die
      die = new StandardDice(1, 6);

      expect(() => {
        mod.run(results, die);
      }).toThrow(DieActionValueError);
    });

    test('returns RollResults object', () => {
      expect(mod.run(results, die)).toBe(results);
    });

    describe('Iteration limit', () => {
      test('Has iteration limit', () => {
        expect(mod.maxIterations).toBe(1000);
      });

      test('Infinite unique re-roll stops at iteration limit', () => {
        const value = 2;
        spy.mockImplementation(() => new RollResult(value));

        for (let qty = 2; qty < 5; qty++) {
          results = new RollResults(Array(qty).fill(value) as number[]);
          die = new StandardDice(8, qty);

          const modifiedResults = mod.run(results, die).rolls;

          // check that the roll length is correct (It shouldn't change)
          expect(modifiedResults).toHaveLength(qty);

          // `StandardDice.rollOnce()` should be called once for each re-roll
          expect(spy).toHaveBeenCalledTimes(mod.maxIterations * (qty - 1));
          spy.mockClear();
        }
      });
    });
  });
});
