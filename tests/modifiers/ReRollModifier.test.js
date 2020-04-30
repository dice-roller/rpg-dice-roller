import ReRollModifier from '../../src/modifiers/ReRollModifier';
import ComparisonModifier from '../../src/modifiers/ComparisonModifier';
import ComparePoint from '../../src/ComparePoint';
import StandardDice from '../../src/dice/StandardDice';
import RollResults from '../../src/results/RollResults';
import RollResult from '../../src/results/RollResult';

describe('ReRollModifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const mod = new ReRollModifier('r');

      expect(mod).toBeInstanceOf(ReRollModifier);
      expect(mod).toBeInstanceOf(ComparisonModifier);
      expect(mod).toEqual(expect.objectContaining({
        comparePoint: undefined,
        isComparePoint: expect.any(Function),
        name: 'ReRollModifier',
        notation: 'r',
        once: false,
        run: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });

    test('constructor requires notation', () => {
      expect(() => {
        new ReRollModifier();
      }).toThrow('Notation is required');

      expect(() => {
        new ReRollModifier(false);
      }).toThrow('Notation is required');

      expect(() => {
        new ReRollModifier(null);
      }).toThrow('Notation is required');

      expect(() => {
        new ReRollModifier(undefined);
      }).toThrow('Notation is required');
    });
  });

  describe('Compare Point', () => {
    test('gets set in constructor', () => {
      const cp = new ComparePoint('>', 8);
      const mod = new ReRollModifier('r', false, cp);

      expect(mod.comparePoint).toBe(cp);
    });

    test('setting in constructor calls setter in parent', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'comparePoint', 'set');

      // create the ComparisonModifier
      new ReRollModifier('r', false, new ComparePoint('>', 8));

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });
  });

  describe('Matching', () => {
    test('isComparePoint uses parent', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'isComparePoint');
      const mod = new ReRollModifier('r', false, new ComparePoint('>', 8));

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
      const mod = new ReRollModifier('ro', true);

      expect(mod.once).toBe(true);
    });

    test('can be changed', () => {
      const mod = new ReRollModifier('ro', true);

      expect(mod.once).toBe(true);

      mod.once = false;

      expect(mod.once).toBe(false);
    });

    test('cast to boolean', () => {
      expect((new ReRollModifier('r', 'foo')).once).toBe(true);
      expect((new ReRollModifier('r', '')).once).toBe(false);
      expect((new ReRollModifier('r', '0')).once).toBe(true);
      expect((new ReRollModifier('r', 0)).once).toBe(false);
      expect((new ReRollModifier('r', 1)).once).toBe(true);
      expect((new ReRollModifier('r', [])).once).toBe(true);
      expect((new ReRollModifier('r', {})).once).toBe(true);
      expect((new ReRollModifier('r', null)).once).toBe(false);
      expect((new ReRollModifier('r', undefined)).once).toBe(false);
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const cp = new ComparePoint('<=', 3);
      const mod = new ReRollModifier('ro<=3', true, cp);

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        comparePoint: cp.toJSON(),
        name: 'ReRollModifier',
        notation: 'ro<=3',
        once: true,
        type: 'modifier',
      });
    });

    test('toString output is correct', () => {
      const mod = new ReRollModifier('r>5');

      expect(mod.toString()).toEqual('r>5');
    });
  });

  describe('Run', () => {
    let mod; let die; let
      results;

    beforeEach(() => {
      results = new RollResults([
        8, 4, 2, 1, 6, 10,
      ]);
      die = new StandardDice('6d10', 10, 6);
      mod = new ReRollModifier('r');

      jest.spyOn(StandardDice.prototype, 'rollOnce')
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
          modifiers: [],
          value: 8,
        }),
        expect.objectContaining({
          initialValue: 4,
          modifierFlags: '',
          modifiers: [],
          value: 4,
        }),
        expect.objectContaining({
          initialValue: 2,
          modifierFlags: '',
          modifiers: [],
          value: 2,
        }),
        expect.objectContaining({
          initialValue: 1,
          modifierFlags: '',
          modifiers: [],
          value: 1,
        }),
        expect.objectContaining({
          initialValue: 6,
          modifierFlags: '',
          modifiers: [],
          value: 6,
        }),
        expect.objectContaining({
          initialValue: 10,
          modifierFlags: '',
          modifiers: [],
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
          modifiers: [],
          value: 8,
        }),
        expect.objectContaining({
          initialValue: 4,
          modifierFlags: 'r',
          modifiers: ['re-roll'],
          value: 10,
        }),
        expect.objectContaining({
          initialValue: 2,
          modifierFlags: 'r',
          modifiers: ['re-roll'],
          value: 5,
        }),
        expect.objectContaining({
          initialValue: 1,
          modifierFlags: 'r',
          modifiers: ['re-roll'],
          value: 8,
        }),
        expect.objectContaining({
          initialValue: 6,
          modifierFlags: '',
          modifiers: [],
          value: 6,
        }),
        expect.objectContaining({
          initialValue: 10,
          modifierFlags: '',
          modifiers: [],
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
          modifiers: [],
          value: 8,
        }),
        expect.objectContaining({
          initialValue: 4,
          modifierFlags: 'ro',
          modifiers: ['re-roll-once'],
          value: 10,
        }),
        expect.objectContaining({
          initialValue: 2,
          modifierFlags: 'ro',
          modifiers: ['re-roll-once'],
          value: 2,
        }),
        expect.objectContaining({
          initialValue: 1,
          modifierFlags: 'ro',
          modifiers: ['re-roll-once'],
          value: 5,
        }),
        expect.objectContaining({
          initialValue: 6,
          modifierFlags: '',
          modifiers: [],
          value: 6,
        }),
        expect.objectContaining({
          initialValue: 10,
          modifierFlags: '',
          modifiers: [],
          value: 10,
        }),
      ]);
    });

    test('re-rolling with d1 throws an error', () => {
      // create a 1 sided die
      die = new StandardDice('6d1', 1, 6);

      // set the modifier compare point
      mod.comparePoint = new ComparePoint('>=', 8);

      expect(() => {
        mod.run(results, die);
      }).toThrow('Die must have more than 1 side to re-roll');
    });
  });
});
