import { StandardDice } from '../../src/dice';
import { DieActionValueError } from '../../src/exceptions';
import { ComparisonModifier, ReRollModifier } from '../../src/modifiers';
import ComparePoint from '../../src/ComparePoint';
import RollResult from '../../src/results/RollResult';
import RollResults from '../../src/results/RollResults';

describe('ReRollModifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const mod = new ReRollModifier();

      expect(mod).toBeInstanceOf(ReRollModifier);
      expect(mod).toBeInstanceOf(ComparisonModifier);
      expect(mod).toEqual(expect.objectContaining({
        comparePoint: undefined,
        isComparePoint: expect.any(Function),
        name: 're-roll',
        notation: 'r',
        once: false,
        run: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });
  });

  describe('Compare Point', () => {
    test('gets set in constructor', () => {
      const cp = new ComparePoint('>', 8);
      const mod = new ReRollModifier(false, cp);

      expect(mod.comparePoint).toBe(cp);
      expect(mod.notation).toBe('r>8');
    });

    test('setting in constructor calls setter in parent', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'comparePoint', 'set');

      // create the ComparisonModifier
      new ReRollModifier(false, new ComparePoint('>', 8));

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });
  });

  describe('Matching', () => {
    test('isComparePoint uses parent', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'isComparePoint');
      const mod = new ReRollModifier(false, new ComparePoint('>', 8));

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
      const mod = new ReRollModifier(true);

      expect(mod.once).toBe(true);
      expect(mod.notation).toBe('ro');
    });

    test('can be changed', () => {
      const mod = new ReRollModifier(true);

      expect(mod.once).toBe(true);
      expect(mod.notation).toBe('ro');

      mod.once = false;

      expect(mod.once).toBe(false);
      expect(mod.notation).toBe('r');
    });

    test('cast to boolean', () => {
      expect((new ReRollModifier('foo')).once).toBe(true);
      expect((new ReRollModifier('')).once).toBe(false);
      expect((new ReRollModifier('0')).once).toBe(true);
      expect((new ReRollModifier(0)).once).toBe(false);
      expect((new ReRollModifier(1)).once).toBe(true);
      expect((new ReRollModifier([])).once).toBe(true);
      expect((new ReRollModifier({})).once).toBe(true);
      expect((new ReRollModifier(null)).once).toBe(false);
      expect((new ReRollModifier(undefined)).once).toBe(false);
    });
  });

  describe('Notation', () => {
    test('unlimited', () => {
      let mod = new ReRollModifier(false, new ComparePoint('>', 15));
      expect(mod.notation).toEqual('r>15');

      mod = new ReRollModifier(false, new ComparePoint('=', 6961));
      expect(mod.notation).toEqual('r=6961');

      mod = new ReRollModifier(false, new ComparePoint('<=', 189));
      expect(mod.notation).toEqual('r<=189');

      mod = new ReRollModifier(false, new ComparePoint('>=', 3));
      expect(mod.notation).toEqual('r>=3');
    });

    test('once', () => {
      let mod = new ReRollModifier(true, new ComparePoint('>', 15));
      expect(mod.notation).toEqual('ro>15');

      mod = new ReRollModifier(true, new ComparePoint('=', 6961));
      expect(mod.notation).toEqual('ro=6961');

      mod = new ReRollModifier(true, new ComparePoint('<=', 189));
      expect(mod.notation).toEqual('ro<=189');

      mod = new ReRollModifier(true, new ComparePoint('>=', 3));
      expect(mod.notation).toEqual('ro>=3');
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const cp = new ComparePoint('<=', 3);
      const mod = new ReRollModifier(true, cp);

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        comparePoint: cp.toJSON(),
        name: 're-roll',
        notation: 'ro<=3',
        once: true,
        type: 'modifier',
      });
    });

    test('toString output is correct', () => {
      const mod = new ReRollModifier(false, new ComparePoint('>', 5));

      expect(mod.toString()).toEqual('r>5');
    });
  });

  describe('Run', () => {
    let mod;
    let die;
    let results;
    let spy;

    beforeEach(() => {
      results = new RollResults([
        8, 4, 2, 1, 6, 10,
      ]);
      die = new StandardDice(10, 6);
      mod = new ReRollModifier();

      spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => new RollResult(10))
        .mockImplementationOnce(() => new RollResult(2))
        .mockImplementationOnce(() => new RollResult(5))
        .mockImplementationOnce(() => new RollResult(3))
        .mockImplementationOnce(() => new RollResult(8));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('returns RollResults object', () => {
      expect(mod.run(results, die)).toBe(results);
    });

    test('does not explode without compare point', () => {
      expect(mod.run(results, die).rolls).toEqual([
        expect.objectContaining({
          initialValue: 8,
          modifierFlags: '',
          modifiers: new Set(),
          value: 8,
        }),
        expect.objectContaining({
          initialValue: 4,
          modifierFlags: '',
          modifiers: new Set(),
          value: 4,
        }),
        expect.objectContaining({
          initialValue: 2,
          modifierFlags: '',
          modifiers: new Set(),
          value: 2,
        }),
        expect.objectContaining({
          initialValue: 1,
          modifierFlags: '',
          modifiers: new Set(),
          value: 1,
        }),
        expect.objectContaining({
          initialValue: 6,
          modifierFlags: '',
          modifiers: new Set(),
          value: 6,
        }),
        expect.objectContaining({
          initialValue: 10,
          modifierFlags: '',
          modifiers: new Set(),
          value: 10,
        }),
      ]);
    });

    test('can re-roll with compare point `<=4`', () => {
      mod.comparePoint = new ComparePoint('<=', 4);

      const { rolls } = mod.run(results, die);

      // assert that all the rolls exist, including the exploded ones
      expect(rolls.length).toEqual(6);
      expect(rolls).toEqual([
        expect.objectContaining({
          initialValue: 8,
          modifierFlags: '',
          modifiers: new Set(),
          value: 8,
        }),
        expect.objectContaining({
          initialValue: 4,
          modifierFlags: 'r',
          modifiers: new Set(['re-roll']),
          value: 10,
        }),
        expect.objectContaining({
          initialValue: 2,
          modifierFlags: 'r',
          modifiers: new Set(['re-roll']),
          value: 5,
        }),
        expect.objectContaining({
          initialValue: 1,
          modifierFlags: 'r',
          modifiers: new Set(['re-roll']),
          value: 8,
        }),
        expect.objectContaining({
          initialValue: 6,
          modifierFlags: '',
          modifiers: new Set(),
          value: 6,
        }),
        expect.objectContaining({
          initialValue: 10,
          modifierFlags: '',
          modifiers: new Set(),
          value: 10,
        }),
      ]);
    });

    test('can re-roll once with compare point `<=4`', () => {
      mod.comparePoint = new ComparePoint('<=', 4);
      mod.once = true;

      const { rolls } = mod.run(results, die);

      // assert that all the rolls exist, including the exploded ones
      expect(rolls.length).toEqual(6);
      expect(rolls).toEqual([
        expect.objectContaining({
          initialValue: 8,
          modifierFlags: '',
          modifiers: new Set(),
          value: 8,
        }),
        expect.objectContaining({
          initialValue: 4,
          modifierFlags: 'ro',
          modifiers: new Set(['re-roll-once']),
          value: 10,
        }),
        expect.objectContaining({
          initialValue: 2,
          modifierFlags: 'ro',
          modifiers: new Set(['re-roll-once']),
          value: 2,
        }),
        expect.objectContaining({
          initialValue: 1,
          modifierFlags: 'ro',
          modifiers: new Set(['re-roll-once']),
          value: 5,
        }),
        expect.objectContaining({
          initialValue: 6,
          modifierFlags: '',
          modifiers: new Set(),
          value: 6,
        }),
        expect.objectContaining({
          initialValue: 10,
          modifierFlags: '',
          modifiers: new Set(),
          value: 10,
        }),
      ]);
    });

    test('re-rolling with d1 throws an error', () => {
      // create a 1 sided die
      die = new StandardDice(1, 6);

      // set the modifier compare point
      mod.comparePoint = new ComparePoint('>=', 8);

      expect(() => {
        mod.run(results, die);
      }).toThrow(DieActionValueError);
    });

    describe('Iteration limit', () => {
      test('has iteration limit', () => {
        expect(mod.maxIterations).toBe(1000);
      });

      test('infinite re-roll stops at iteration limit `r>0`', () => {
        // re-rolling on greater than zero will always re-rolling, but shouldn't loop infinitely
        mod.comparePoint = new ComparePoint('>', 0);

        for (let qty = 1; qty < 2; qty++) {
          // create a results object with the correct number of rolls in it, filled with values of 1
          results = new RollResults(Array(qty).fill(1));

          // create the dice
          die = new StandardDice(10, qty);

          // apply modifiers
          const { rolls } = mod.run(results, die);

          // check that the roll length is correct (It shouldn't change)
          expect(rolls.length).toEqual(qty);

          // `StandardDice.rollOnce()` should be called once for each re-roll
          expect(spy).toHaveBeenCalledTimes(mod.maxIterations * qty);
        }
      });
    });
  });
});
