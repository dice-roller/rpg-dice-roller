import ComparePoint from '../../src/ComparePoint';
import ComparisonModifier from '../../src/modifiers/ComparisonModifier';
import DieActionValueError from '../../src/exceptions/DieActionValueError';
import ExplodeModifier from '../../src/modifiers/ExplodeModifier';
import RequiredArgumentError from '../../src/exceptions/RequiredArgumentError';
import RollResult from '../../src/results/RollResult';
import RollResults from '../../src/results/RollResults';
import StandardDice from '../../src/dice/StandardDice';

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
        maxIterations: 1000,
        name: 'explode',
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
        name: 'explode',
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
    let mod;
    let die;
    let results;

    beforeEach(() => {
      results = new RollResults([
        8, 4, 2, 1, 6, 10,
      ]);
      die = new StandardDice('6d10', 10, 6);
      mod = new ExplodeModifier('!');

      jest.spyOn(StandardDice.prototype, 'rollOnce')
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

    test('can explode with compare point `>=8`', () => {
      mod.comparePoint = new ComparePoint('>=', 8);

      const { rolls } = mod.run(results, die);

      // assert that all the rolls exist, including the exploded ones
      expect(rolls.length).toEqual(9);
      expect(rolls).toEqual([
        expect.objectContaining({
          initialValue: 8,
          modifierFlags: '!',
          modifiers: new Set(['explode']),
          value: 8,
        }),
        expect.objectContaining({
          initialValue: 10,
          modifierFlags: '!',
          modifiers: new Set(['explode']),
          value: 10,
        }),
        expect.objectContaining({
          initialValue: 2,
          modifierFlags: '',
          modifiers: new Set(),
          value: 2,
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
          modifierFlags: '!',
          modifiers: new Set(['explode']),
          value: 10,
        }),
        expect.objectContaining({
          initialValue: 5,
          modifierFlags: '',
          modifiers: new Set(),
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
          modifierFlags: '!',
          modifiers: new Set(['explode']),
          value: 2,
        }),
        expect.objectContaining({
          initialValue: 10,
          modifierFlags: '',
          modifiers: new Set(),
          value: 10,
        }),
        expect.objectContaining({
          initialValue: 1,
          modifierFlags: '!',
          modifiers: new Set(['explode']),
          value: 1,
        }),
        expect.objectContaining({
          initialValue: 2,
          modifierFlags: '!',
          modifiers: new Set(['explode']),
          value: 2,
        }),
        expect.objectContaining({
          initialValue: 5,
          modifierFlags: '',
          modifiers: new Set(),
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

    test('can compound with compare point `>5`', () => {
      mod = new ExplodeModifier('!!', new ComparePoint('>', 5), true);

      const { rolls } = mod.run(results, die);

      // assert that all the rolls exist
      expect(rolls.length).toEqual(6);

      expect(rolls[0].initialValue).toBe(8);
      expect(rolls[0].modifierFlags).toEqual('!!');
      expect(rolls[0].modifiers).toEqual(new Set(['explode', 'compound']));
      expect(rolls[0].value).toBe(20);

      expect(rolls[1].initialValue).toBe(4);
      expect(rolls[1].modifierFlags).toEqual('');
      expect(rolls[1].modifiers).toEqual(new Set());
      expect(rolls[1].value).toBe(4);

      expect(rolls[2].initialValue).toBe(2);
      expect(rolls[2].modifierFlags).toEqual('');
      expect(rolls[2].modifiers).toEqual(new Set());
      expect(rolls[2].value).toBe(2);

      expect(rolls[3].initialValue).toBe(1);
      expect(rolls[3].modifierFlags).toEqual('');
      expect(rolls[3].modifiers).toEqual(new Set());
      expect(rolls[3].value).toBe(1);

      expect(rolls[4].initialValue).toBe(6);
      expect(rolls[4].modifierFlags).toEqual('!!');
      expect(rolls[4].modifiers).toEqual(new Set(['explode', 'compound']));
      expect(rolls[4].value).toBe(11);

      expect(rolls[5].initialValue).toBe(10);
      expect(rolls[5].modifierFlags).toEqual('!!');
      expect(rolls[5].modifiers).toEqual(new Set(['explode', 'compound']));
      expect(rolls[5].value).toBe(21);
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
          modifiers: new Set(),
          value: 8,
        }),
        expect.objectContaining({
          initialValue: 4,
          modifierFlags: '!p',
          modifiers: new Set(['explode', 'penetrate']),
          value: 4,
        }),
        expect.objectContaining({
          initialValue: 10,
          modifierFlags: '',
          modifiers: new Set(),
          value: 9,
        }),
        expect.objectContaining({
          initialValue: 2,
          modifierFlags: '!p',
          modifiers: new Set(['explode', 'penetrate']),
          value: 2,
        }),
        expect.objectContaining({
          initialValue: 2,
          modifierFlags: '!p',
          modifiers: new Set(['explode', 'penetrate']),
          value: 1,
        }),
        expect.objectContaining({
          initialValue: 5,
          modifierFlags: '',
          modifiers: new Set(),
          value: 4,
        }),
        expect.objectContaining({
          initialValue: 1,
          modifierFlags: '!p',
          modifiers: new Set(['explode', 'penetrate']),
          value: 1,
        }),
        expect.objectContaining({
          initialValue: 8,
          modifierFlags: '',
          modifiers: new Set(),
          value: 7,
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

    test('can compound and penetrate with compare point >6', () => {
      mod = new ExplodeModifier('!!p', new ComparePoint('>', 6), true, true);

      const { rolls } = mod.run(results, die);

      // assert that all the rolls exist
      expect(rolls.length).toEqual(6);

      expect(rolls[0].initialValue).toBe(8);
      expect(rolls[0].modifierFlags).toEqual('!!p');
      expect(rolls[0].modifiers).toEqual(new Set(['explode', 'compound', 'penetrate']));
      expect(rolls[0].value).toBe(18);

      expect(rolls[1].initialValue).toBe(4);
      expect(rolls[1].modifierFlags).toEqual('');
      expect(rolls[1].modifiers).toEqual(new Set());
      expect(rolls[1].value).toBe(4);

      expect(rolls[2].initialValue).toBe(2);
      expect(rolls[2].modifierFlags).toEqual('');
      expect(rolls[2].modifiers).toEqual(new Set());
      expect(rolls[2].value).toBe(2);

      expect(rolls[3].initialValue).toBe(1);
      expect(rolls[3].modifierFlags).toEqual('');
      expect(rolls[3].modifiers).toEqual(new Set());
      expect(rolls[3].value).toBe(1);

      expect(rolls[4].initialValue).toBe(6);
      expect(rolls[4].modifierFlags).toEqual('');
      expect(rolls[4].modifiers).toEqual(new Set());
      expect(rolls[4].value).toBe(6);

      expect(rolls[5].initialValue).toBe(10);
      expect(rolls[5].modifierFlags).toEqual('!!p');
      expect(rolls[5].modifiers).toEqual(new Set(['explode', 'compound', 'penetrate']));
      expect(rolls[5].value).toBe(14);
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

    describe('Iteration limit', () => {
      test('has iteration limit', () => {
        expect(mod.maxIterations).toBe(1000);
      });

      test('infinite explode stops at iteration limit `!>0`', () => {
        // exploding on greater than zero will always explode, but shouldn't loop infinitely
        mod.comparePoint = new ComparePoint('>', 0);

        for (let qty = 1; qty < 2; qty++) {
          // create a results object with the correct number of rolls in it, filled with values of 1
          results = new RollResults(Array(qty).fill(1));

          // create the dice
          die = new StandardDice(`${qty}d10`, 10, qty);

          // apply modifiers
          const { rolls } = mod.run(results, die);

          // check that the roll length is correct
          expect(rolls.length).toEqual((mod.maxIterations + 1) * qty);
        }
      });
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
