import ExplodeModifier from '../../src/modifiers/ExplodeModifier';
import ComparePoint from '../../src/ComparePoint';
import ComparisonModifier from '../../src/modifiers/ComparisonModifier';
import RollResults from '../../src/results/RollResults';
import StandardDice from '../../src/dice/StandardDice';
import RollResult from '../../src/results/RollResult';
import DieActionValueError from '../../src/exceptions/DieActionValueError';
import RequiredArgumentError from '../../src/exceptions/RequiredArgumentErrorError';

describe('ExplodeModifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const mod = new ExplodeModifier('!');

      expect(mod).toBeInstanceOf(ExplodeModifier);
      expect(mod).toBeInstanceOf(ComparisonModifier);
      expect(mod).toEqual(expect.objectContaining({
        comparePoint: undefined,
        compound: false,
        isComparePoint: expect.any(Function),
        penetrate: false,
        name: 'ExplodeModifier',
        notation: '!',
        run: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });

    test('constructor requires notation', () => {
      expect(() => {
        new ExplodeModifier();
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new ExplodeModifier(false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new ExplodeModifier(null);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new ExplodeModifier(undefined);
      }).toThrow(RequiredArgumentError);
    });
  });

  describe('Compare Point', () => {
    test('gets set in constructor', () => {
      const cp = new ComparePoint('>', 8);
      const mod = new ExplodeModifier('!>8', cp);

      expect(mod.comparePoint).toBe(cp);
    });

    test('setting in constructor calls setter in parent', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'comparePoint', 'set');

      // create the ComparisonModifier
      new ExplodeModifier('!>8', new ComparePoint('>', 8));

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });
  });

  describe('Matching', () => {
    test('isComparePoint uses parent', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'isComparePoint');
      const mod = new ExplodeModifier('!>8', new ComparePoint('>', 8));

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

  describe('Compound', () => {
    test('gets set in constructor', () => {
      const mod = new ExplodeModifier('!>8', null, true);

      expect(mod.compound).toBe(true);
    });

    test('cast to boolean', () => {
      expect((new ExplodeModifier('!>8', null, false)).compound).toBe(false);
      expect((new ExplodeModifier('!>8', null, 'foo')).compound).toBe(true);
      expect((new ExplodeModifier('!>8', null, '')).compound).toBe(false);
      expect((new ExplodeModifier('!>8', null, '0')).compound).toBe(true);
      expect((new ExplodeModifier('!>8', null, 0)).compound).toBe(false);
      expect((new ExplodeModifier('!>8', null, 1)).compound).toBe(true);
      expect((new ExplodeModifier('!>8', null, [])).compound).toBe(true);
      expect((new ExplodeModifier('!>8', null, {})).compound).toBe(true);
      expect((new ExplodeModifier('!>8', null, null)).compound).toBe(false);
      expect((new ExplodeModifier('!>8', null, undefined)).compound).toBe(false);
    });
  });

  describe('Penetrate', () => {
    test('gets set in constructor', () => {
      const mod = new ExplodeModifier('!>8', null, null, true);

      expect(mod.penetrate).toBe(true);
    });

    test('cast to boolean', () => {
      expect((new ExplodeModifier('!>8', null, null, false)).penetrate).toBe(false);
      expect((new ExplodeModifier('!>8', null, null, 'foo')).penetrate).toBe(true);
      expect((new ExplodeModifier('!>8', null, null, '')).penetrate).toBe(false);
      expect((new ExplodeModifier('!>8', null, null, '0')).penetrate).toBe(true);
      expect((new ExplodeModifier('!>8', null, null, 0)).penetrate).toBe(false);
      expect((new ExplodeModifier('!>8', null, null, 1)).penetrate).toBe(true);
      expect((new ExplodeModifier('!>8', null, null, [])).penetrate).toBe(true);
      expect((new ExplodeModifier('!>8', null, null, {})).penetrate).toBe(true);
      expect((new ExplodeModifier('!>8', null, null, null)).penetrate).toBe(false);
      expect((new ExplodeModifier('!>8', null, null, undefined)).penetrate).toBe(false);
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const cp = new ComparePoint('<=', 3);
      const mod = new ExplodeModifier('!!p<=3', cp, true, true);

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        comparePoint: cp.toJSON(),
        compound: true,
        penetrate: true,
        name: 'ExplodeModifier',
        notation: '!!p<=3',
        type: 'modifier',
      });
    });

    test('toString output is correct', () => {
      const mod = new ExplodeModifier('!>5');

      expect(mod.toString()).toEqual('!>5');
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
      mod = new ExplodeModifier('!');

      jest.spyOn(StandardDice.prototype, 'rollOnce')
        // .mockResolvedValue(new RollResult(1));
        .mockImplementationOnce(() => new RollResult(10))
        .mockImplementationOnce(() => new RollResult(2))
        .mockImplementationOnce(() => new RollResult(5))
        .mockImplementationOnce(() => new RollResult(8))
        .mockImplementationOnce(() => new RollResult(3));
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

    test('can explode with compare point `>=8`', () => {
      mod.comparePoint = new ComparePoint('>=', 8);

      const { rolls } = mod.run(results, die);

      // assert that all the rolls exist, including the exploded ones
      expect(rolls.length).toEqual(9);
      expect(rolls).toEqual([
        expect.objectContaining({
          initialValue: 8,
          modifierFlags: '!',
          modifiers: ['explode'],
          value: 8,
        }),
        expect.objectContaining({
          initialValue: 10,
          modifierFlags: '!',
          modifiers: ['explode'],
          value: 10,
        }),
        expect.objectContaining({
          initialValue: 2,
          modifierFlags: '',
          modifiers: [],
          value: 2,
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
          modifierFlags: '!',
          modifiers: ['explode'],
          value: 10,
        }),
        expect.objectContaining({
          initialValue: 5,
          modifierFlags: '',
          modifiers: [],
          value: 5,
        }),
      ]);
    });

    test('can explode with compare point `<3`', () => {
      mod.comparePoint = new ComparePoint('<', 3);

      const { rolls } = mod.run(results, die);

      // assert that all the rolls exist, including the exploded ones
      expect(rolls.length).toEqual(9);
      expect(rolls).toEqual([
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
          modifierFlags: '!',
          modifiers: ['explode'],
          value: 2,
        }),
        expect.objectContaining({
          initialValue: 10,
          modifierFlags: '',
          modifiers: [],
          value: 10,
        }),
        expect.objectContaining({
          initialValue: 1,
          modifierFlags: '!',
          modifiers: ['explode'],
          value: 1,
        }),
        expect.objectContaining({
          initialValue: 2,
          modifierFlags: '!',
          modifiers: ['explode'],
          value: 2,
        }),
        expect.objectContaining({
          initialValue: 5,
          modifierFlags: '',
          modifiers: [],
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

    test('can compound with compare point `>5`', () => {
      mod = new ExplodeModifier('!!', new ComparePoint('>', 5), true);

      const { rolls } = mod.run(results, die);

      // assert that all the rolls exist
      expect(rolls.length).toEqual(6);
      expect(rolls).toEqual([
        expect.objectContaining({
          initialValue: 8,
          modifierFlags: '!!',
          modifiers: ['explode', 'compound'],
          value: 20,
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
          modifierFlags: '!!',
          modifiers: ['explode', 'compound'],
          value: 11,
        }),
        expect.objectContaining({
          initialValue: 10,
          modifierFlags: '!!',
          modifiers: ['explode', 'compound'],
          value: 21,
        }),
      ]);
    });

    test('can penetrate with compare point `<=4`', () => {
      mod = new ExplodeModifier('!p', new ComparePoint('<=', 4), false, true);

      const { rolls } = mod.run(results, die);

      // assert that all the rolls exist, including the exploded ones
      expect(rolls.length).toEqual(10);
      expect(rolls).toEqual([
        expect.objectContaining({
          initialValue: 8,
          modifierFlags: '',
          modifiers: [],
          value: 8,
        }),
        expect.objectContaining({
          initialValue: 4,
          modifierFlags: '!p',
          modifiers: ['explode', 'penetrate'],
          value: 4,
        }),
        expect.objectContaining({
          initialValue: 10,
          modifierFlags: '',
          modifiers: [],
          value: 9,
        }),
        expect.objectContaining({
          initialValue: 2,
          modifierFlags: '!p',
          modifiers: ['explode', 'penetrate'],
          value: 2,
        }),
        expect.objectContaining({
          initialValue: 2,
          modifierFlags: '!p',
          modifiers: ['explode', 'penetrate'],
          value: 1,
        }),
        expect.objectContaining({
          initialValue: 5,
          modifierFlags: '',
          modifiers: [],
          value: 4,
        }),
        expect.objectContaining({
          initialValue: 1,
          modifierFlags: '!p',
          modifiers: ['explode', 'penetrate'],
          value: 1,
        }),
        expect.objectContaining({
          initialValue: 8,
          modifierFlags: '',
          modifiers: [],
          value: 7,
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

    test('can compound and penetrate with compare point >6', () => {
      mod = new ExplodeModifier('!!p', new ComparePoint('>', 6), true, true);

      const { rolls } = mod.run(results, die);

      // assert that all the rolls exist
      expect(rolls.length).toEqual(6);
      expect(rolls).toEqual([
        expect.objectContaining({
          initialValue: 8,
          modifierFlags: '!!p',
          modifiers: ['explode', 'compound', 'penetrate'],
          value: 18,
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
          modifierFlags: '!!p',
          modifiers: ['explode', 'compound', 'penetrate'],
          value: 14,
        }),
      ]);
    });

    test('exploding with d1 throws an error', () => {
      // create a 1 sided die
      die = new StandardDice('6d1', 1, 6);

      // set the modifier compare point
      mod.comparePoint = new ComparePoint('>=', 8);

      expect(() => {
        mod.run(results, die);
      }).toThrow(DieActionValueError);
    });
  });

  describe('Readonly properties', () => {
    test('cannot change name value', () => {
      const mod = new ExplodeModifier('!');

      expect(() => {
        mod.name = 'Foo';
      }).toThrow(TypeError);
    });

    test('cannot change compound value', () => {
      const mod = new ExplodeModifier('!');

      expect(() => {
        mod.compound = true;
      }).toThrow(TypeError);
    });

    test('cannot change penetrate value', () => {
      const mod = new ExplodeModifier('!');

      expect(() => {
        mod.penetrate = true;
      }).toThrow(TypeError);
    });
  });
});
