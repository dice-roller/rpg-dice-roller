import { StandardDice } from '../../src/dice/index.js';
import { DieActionValueError } from '../../src/exceptions/index.js';
import { ComparisonModifier, Modifier, ReRollModifier } from '../../src/modifiers/index.js';
import ComparePoint from '../../src/ComparePoint.js';
import RollResult from '../../src/results/RollResult.js';
import RollResults from '../../src/results/RollResults.js';

describe('ReRollModifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const mod = new ReRollModifier();

      expect(mod).toBeInstanceOf(ReRollModifier);
      expect(mod).toBeInstanceOf(ComparisonModifier);
      expect(mod).toEqual(expect.objectContaining({
        comparePoint: undefined,
        isComparePoint: expect.any(Function),
        maxIterations: ReRollModifier.defaultMaxIterations,
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

  describe('Limit', () => {
    test('gets set in constructor', () => {
      const mod = new ReRollModifier(35);

      expect(mod.maxIterations).toBe(35);
      expect(mod.notation).toBe('r35');
    });
  });

  describe('Once', () => {
    test('gets set in constructor', () => {
      const mod = new ReRollModifier(true);

      expect(mod.once).toBe(true);
      expect(mod.maxIterations).toBe(1);
      expect(mod.notation).toBe('ro');
    });

    test('can be changed', () => {
      const mod = new ReRollModifier(true);

      expect(mod.once).toBe(true);
      expect(mod.maxIterations).toBe(1);
      expect(mod.notation).toBe('ro');

      mod.once = false;

      expect(mod.once).toBe(false);
      expect(mod.maxIterations).toBe(Modifier.defaultMaxIterations);
      expect(mod.notation).toBe('r');
    });

    test('must be boolean or number', () => {
      expect(() => {
        new ReRollModifier('foo');
      }).toThrow(TypeError);

      expect(() => {
        new ReRollModifier('foo');
      }).toThrow(TypeError);

      expect(() => {
        new ReRollModifier([]);
      }).toThrow(TypeError);

      expect(() => {
        new ReRollModifier({});
      }).toThrow(TypeError);
    });

    test('falsey is set to default max', () => {
      expect((new ReRollModifier(null)).once).toBe(false);
      expect((new ReRollModifier(null)).maxIterations).toBe(Modifier.defaultMaxIterations);

      expect((new ReRollModifier(undefined)).once).toBe(false);
      expect((new ReRollModifier(undefined)).maxIterations).toBe(Modifier.defaultMaxIterations);

      expect((new ReRollModifier('')).once).toBe(false);
      expect((new ReRollModifier('')).maxIterations).toBe(Modifier.defaultMaxIterations);
    });
  });

  describe('Notation', () => {
    test('without limit', () => {
      let mod = new ReRollModifier(false, new ComparePoint('>', 15));
      expect(mod.notation).toEqual('r>15');

      mod = new ReRollModifier(false, new ComparePoint('=', 6961));
      expect(mod.notation).toEqual('r=6961');

      mod = new ReRollModifier(false, new ComparePoint('<=', 189));
      expect(mod.notation).toEqual('r<=189');

      mod = new ReRollModifier(false, new ComparePoint('>=', 3));
      expect(mod.notation).toEqual('r>=3');
    });

    test('with limit', () => {
      let mod = new ReRollModifier(true, new ComparePoint('>', 15));
      expect(mod.notation).toEqual('ro>15');

      mod = new ReRollModifier(1, new ComparePoint('=', 6961));
      expect(mod.notation).toEqual('ro=6961');

      mod = new ReRollModifier(490, new ComparePoint('<=', 189));
      expect(mod.notation).toEqual('r490<=189');

      mod = new ReRollModifier(12, new ComparePoint('>=', 3));
      expect(mod.notation).toEqual('r12>=3');
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const cp = new ComparePoint('<=', 3);
      const mod = new ReRollModifier(45, cp);

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(mod))).toEqual(expect.objectContaining({
        comparePoint: cp.toJSON(),
        maxIterations: 45,
        name: 're-roll',
        notation: 'r45<=3',
        type: 'modifier',
      }));
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

    test('does not re-roll without compare point', () => {
      const modifiedResults = mod.run(results, die).rolls;

      expect(modifiedResults).toBeInstanceOf(Array);
      expect(modifiedResults).toHaveLength(6);

      expect(modifiedResults[0].initialValue).toBe(8);
      expect(modifiedResults[0].value).toBe(8);
      expect(modifiedResults[0].modifiers).toEqual(new Set());

      expect(modifiedResults[1].initialValue).toBe(4);
      expect(modifiedResults[1].value).toBe(4);
      expect(modifiedResults[1].modifiers).toEqual(new Set());

      expect(modifiedResults[2].initialValue).toBe(2);
      expect(modifiedResults[2].value).toBe(2);
      expect(modifiedResults[2].modifiers).toEqual(new Set());

      expect(modifiedResults[3].initialValue).toBe(1);
      expect(modifiedResults[3].value).toBe(1);
      expect(modifiedResults[3].modifiers).toEqual(new Set());

      expect(modifiedResults[4].initialValue).toBe(6);
      expect(modifiedResults[4].value).toBe(6);
      expect(modifiedResults[4].modifiers).toEqual(new Set());

      expect(modifiedResults[5].initialValue).toBe(10);
      expect(modifiedResults[5].value).toBe(10);
      expect(modifiedResults[5].modifiers).toEqual(new Set());
    });

    test('can re-roll with compare point `<=4`', () => {
      mod.comparePoint = new ComparePoint('<=', 4);

      const modifiedResults = mod.run(results, die).rolls;

      expect(modifiedResults).toBeInstanceOf(Array);
      expect(modifiedResults).toHaveLength(6);

      expect(modifiedResults[0].initialValue).toBe(8);
      expect(modifiedResults[0].value).toBe(8);
      expect(modifiedResults[0].modifiers).toEqual(new Set());

      expect(modifiedResults[1].initialValue).toBe(4);
      expect(modifiedResults[1].value).toBe(10);
      expect(modifiedResults[1].modifiers).toEqual(new Set(['re-roll']));

      expect(modifiedResults[2].initialValue).toBe(2);
      expect(modifiedResults[2].value).toBe(5);
      expect(modifiedResults[2].modifiers).toEqual(new Set(['re-roll']));

      expect(modifiedResults[3].initialValue).toBe(1);
      expect(modifiedResults[3].value).toBe(8);
      expect(modifiedResults[3].modifiers).toEqual(new Set(['re-roll']));

      expect(modifiedResults[4].initialValue).toBe(6);
      expect(modifiedResults[4].value).toBe(6);
      expect(modifiedResults[4].modifiers).toEqual(new Set());

      expect(modifiedResults[5].initialValue).toBe(10);
      expect(modifiedResults[5].value).toBe(10);
      expect(modifiedResults[5].modifiers).toEqual(new Set());
    });

    test('can re-roll once with compare point `<=4`', () => {
      mod.comparePoint = new ComparePoint('<=', 4);
      mod.once = true;

      const modifiedResults = mod.run(results, die).rolls;

      expect(modifiedResults).toBeInstanceOf(Array);
      expect(modifiedResults).toHaveLength(6);

      expect(modifiedResults[0].initialValue).toBe(8);
      expect(modifiedResults[0].value).toBe(8);
      expect(modifiedResults[0].calculationValue).toBe(8);
      expect(modifiedResults[0].modifiers).toEqual(new Set());

      expect(modifiedResults[1].initialValue).toBe(4);
      expect(modifiedResults[1].value).toBe(10);
      expect(modifiedResults[1].calculationValue).toBe(10);
      expect(modifiedResults[1].modifiers).toEqual(new Set(['re-roll-once']));

      expect(modifiedResults[2].initialValue).toBe(2);
      expect(modifiedResults[2].value).toBe(2);
      expect(modifiedResults[2].calculationValue).toBe(2);
      expect(modifiedResults[2].modifiers).toEqual(new Set(['re-roll-once']));

      expect(modifiedResults[3].initialValue).toBe(1);
      expect(modifiedResults[3].value).toBe(5);
      expect(modifiedResults[3].calculationValue).toBe(5);
      expect(modifiedResults[3].modifiers).toEqual(new Set(['re-roll-once']));

      expect(modifiedResults[4].initialValue).toBe(6);
      expect(modifiedResults[4].value).toBe(6);
      expect(modifiedResults[4].calculationValue).toBe(6);
      expect(modifiedResults[4].modifiers).toEqual(new Set());

      expect(modifiedResults[5].initialValue).toBe(10);
      expect(modifiedResults[5].value).toBe(10);
      expect(modifiedResults[5].calculationValue).toBe(10);
      expect(modifiedResults[5].modifiers).toEqual(new Set());
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
        expect(mod.maxIterations).toBe(ReRollModifier.defaultMaxIterations);
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
          const modifiedResults = mod.run(results, die).rolls;

          // check that the roll length is correct (It shouldn't change)
          expect(modifiedResults).toHaveLength(qty);

          // `StandardDice.rollOnce()` should be called once for each re-roll
          expect(spy).toHaveBeenCalledTimes(mod.maxIterations * qty);
        }
      });
    });
  });
});
