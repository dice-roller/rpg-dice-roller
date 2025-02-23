import { StandardDice } from '../../../src/dice';
import { DieActionValueError } from '../../../src/exceptions';
import { ComparisonModifier, ExplodeModifier } from '../../../src/modifiers';
import ComparePoint from '../../../src/ComparePoint';
import RollResult from '../../../src/results/RollResult';
import RollResults from '../../../src/results/RollResults';
import { Dice } from "../../../src/types/Interfaces/Dice";
import { SingleResult } from "../../../src/types/Interfaces/Results/SingleResult";

describe('ExplodeModifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const mod = new ExplodeModifier();

      expect(mod).toBeInstanceOf(ExplodeModifier);
      expect(mod).toBeInstanceOf(ComparisonModifier);

      expect(mod).toHaveProperty('comparePoint', null);
      expect(mod).toHaveProperty('compound', false);
      expect(mod).toHaveProperty('isComparePoint', expect.any(Function));
      expect(mod).toHaveProperty('penetrate', false);
      expect(mod).toHaveProperty('maxIterations', 1000);
      expect(mod).toHaveProperty('name', 'explode');
      expect(mod).toHaveProperty('notation', '!');
      expect(mod).toHaveProperty('order', 3);
      expect(mod).toHaveProperty('run', expect.any(Function));
      expect(mod).toHaveProperty('toJSON', expect.any(Function));
      expect(mod).toHaveProperty('toString', expect.any(Function));
    });
  });

  describe('Compare Point', () => {
    test('gets set in constructor', () => {
      const cp = new ComparePoint('=', 12);
      const mod = new ExplodeModifier(cp);

      expect(mod.comparePoint).toBe(cp);
      expect(mod.notation).toBe('!=12');
    });

    test('setting in constructor calls setter in parent', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'comparePoint', 'set');

      // create the ComparisonModifier
      new ExplodeModifier(new ComparePoint('>', 8));

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });
  });

  describe('Matching', () => {
    test('isComparePoint uses parent', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'isComparePoint');
      const mod = new ExplodeModifier(new ComparePoint('>', 8));

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
      const mod = new ExplodeModifier(null, true);

      expect(mod.compound).toBe(true);
      expect(mod.notation).toBe('!!');
    });

    test('cast to boolean', () => {
      expect((new ExplodeModifier(null, false)).compound).toBe(false);
      // @ts-expect-error testing boolean cast
      expect((new ExplodeModifier(null, 'foo')).compound).toBe(true);
      // @ts-expect-error testing boolean cast
      expect((new ExplodeModifier(null, '')).compound).toBe(false);
      // @ts-expect-error testing boolean cast
      expect((new ExplodeModifier(null, '0')).compound).toBe(true);
      // @ts-expect-error testing boolean cast
      expect((new ExplodeModifier(null, 0)).compound).toBe(false);
      // @ts-expect-error testing boolean cast
      expect((new ExplodeModifier(null, 1)).compound).toBe(true);
      // @ts-expect-error testing boolean cast
      expect((new ExplodeModifier(null, [])).compound).toBe(true);
      // @ts-expect-error testing boolean cast
      expect((new ExplodeModifier(null, {})).compound).toBe(true);
      // @ts-expect-error testing boolean cast
      expect((new ExplodeModifier(null, null)).compound).toBe(false);
      expect((new ExplodeModifier(null, undefined)).compound).toBe(false);
    });
  });

  describe('Penetrate', () => {
    test('gets set in constructor', () => {
      const mod = new ExplodeModifier(null, false, true);

      expect(mod.penetrate).toBe(true);
      expect(mod.notation).toBe('!p');
    });

    test('cast to boolean', () => {
      expect((new ExplodeModifier(null, false, false)).penetrate).toBe(false);
      // @ts-expect-error testing invalid value
      expect((new ExplodeModifier(null, false, 'foo')).penetrate).toBe(true);
      // @ts-expect-error testing invalid value
      expect((new ExplodeModifier(null, false, '')).penetrate).toBe(false);
      // @ts-expect-error testing invalid value
      expect((new ExplodeModifier(null, false, '0')).penetrate).toBe(true);
      // @ts-expect-error testing invalid value
      expect((new ExplodeModifier(null, false, 0)).penetrate).toBe(false);
      // @ts-expect-error testing invalid value
      expect((new ExplodeModifier(null, false, 1)).penetrate).toBe(true);
      // @ts-expect-error testing invalid value
      expect((new ExplodeModifier(null, false, [])).penetrate).toBe(true);
      // @ts-expect-error testing invalid value
      expect((new ExplodeModifier(null, false, {})).penetrate).toBe(true);
      // @ts-expect-error testing invalid value
      expect((new ExplodeModifier(null, false, null)).penetrate).toBe(false);     expect((new ExplodeModifier(null, false, undefined)).penetrate).toBe(false);
    });
  });

  describe('Notation', () => {
    test('explode', () => {
      let mod = new ExplodeModifier(new ComparePoint('>=', 45));
      expect(mod.notation).toEqual('!>=45');

      mod = new ExplodeModifier(new ComparePoint('<', 1));
      expect(mod.notation).toEqual('!<1');

      mod = new ExplodeModifier(new ComparePoint('<=', 678997595));
      expect(mod.notation).toEqual('!<=678997595');

      mod = new ExplodeModifier(new ComparePoint('<>', 567));
      expect(mod.notation).toEqual('!<>567');
    });

    test('compound', () => {
      let mod = new ExplodeModifier(new ComparePoint('>=', 16), true);
      expect(mod.notation).toEqual('!!>=16');

      mod = new ExplodeModifier(new ComparePoint('<', 79), true);
      expect(mod.notation).toEqual('!!<79');

      mod = new ExplodeModifier(new ComparePoint('<=', 678997595), true);
      expect(mod.notation).toEqual('!!<=678997595');

      mod = new ExplodeModifier(new ComparePoint('<>', 51), true);
      expect(mod.notation).toEqual('!!<>51');
    });

    test('penetrate', () => {
      let mod = new ExplodeModifier(new ComparePoint('>=', 16), false, true);
      expect(mod.notation).toEqual('!p>=16');

      mod = new ExplodeModifier(new ComparePoint('<', 79), false, true);
      expect(mod.notation).toEqual('!p<79');

      mod = new ExplodeModifier(new ComparePoint('<=', 678997595), false, true);
      expect(mod.notation).toEqual('!p<=678997595');

      mod = new ExplodeModifier(new ComparePoint('<>', 1983746), false, true);
      expect(mod.notation).toEqual('!p<>1983746');
    });

    test('compound and penetrate', () => {
      let mod = new ExplodeModifier(new ComparePoint('>=', 16), true, true);
      expect(mod.notation).toEqual('!!p>=16');

      mod = new ExplodeModifier(new ComparePoint('<', 79), true, true);
      expect(mod.notation).toEqual('!!p<79');

      mod = new ExplodeModifier(new ComparePoint('<=', 678997595), true, true);
      expect(mod.notation).toEqual('!!p<=678997595');

      mod = new ExplodeModifier(new ComparePoint('<>', 18943), true, true);
      expect(mod.notation).toEqual('!!p<>18943');
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const cp = new ComparePoint('<=', 3);
      const mod = new ExplodeModifier(cp, true, true);

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
      const cp = new ComparePoint('>', 5);
      const mod = new ExplodeModifier(cp);

      expect(mod.toString()).toEqual('!>5');
    });
  });

  describe('Run', () => {
    let mod: ExplodeModifier;
    let die: Dice;
    let results: RollResults;

    beforeEach(() => {
      results = new RollResults([
        8, 4, 2, 1, 6, 10,
      ]);
      die = new StandardDice(10, 6);
      mod = new ExplodeModifier();

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

    test('can explode with default compare point', () => {
      const modifiedResults = mod.run(results, die).rolls;

      // assert that all the rolls exist
      expect(modifiedResults).toBeInstanceOf(Array);
      expect(modifiedResults).toHaveLength(8);

      let result = modifiedResults[0] as SingleResult;
      expect(result.initialValue).toBe(8);
      expect(result.value).toBe(8);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[1] as SingleResult;
      expect(result.initialValue).toBe(4);
      expect(result.value).toBe(4);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[2] as SingleResult;
      expect(result.initialValue).toBe(2);
      expect(result.value).toBe(2);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[3] as SingleResult;
      expect(result.initialValue).toBe(1);
      expect(result.value).toBe(1);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[4] as SingleResult;
      expect(result.initialValue).toBe(6);
      expect(result.value).toBe(6);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[5] as SingleResult;
      expect(result.initialValue).toBe(10);
      expect(result.value).toBe(10);
      expect(result.modifiers).toEqual(new Set(['explode']));

      result = modifiedResults[6] as SingleResult;
      expect(result.initialValue).toBe(10);
      expect(result.value).toBe(10);
      expect(result.modifiers).toEqual(new Set(['explode']));

      result = modifiedResults[7] as SingleResult;
      expect(result.initialValue).toBe(2);
      expect(result.value).toBe(2);
      expect(result.modifiers).toEqual(new Set());
    });

    test('can explode with compare point `>=8`', () => {
      mod.comparePoint = new ComparePoint('>=', 8);

      const modifiedResults = mod.run(results, die).rolls;

      // assert that all the rolls exist
      expect(modifiedResults).toBeInstanceOf(Array);
      expect(modifiedResults).toHaveLength(9);

      let result = modifiedResults[0] as SingleResult;
      expect(result.initialValue).toBe(8);
      expect(result.value).toBe(8);
      expect(result.modifiers).toEqual(new Set(['explode']));

      result = modifiedResults[1] as SingleResult;
      expect(result.initialValue).toBe(10);
      expect(result.value).toBe(10);
      expect(result.modifiers).toEqual(new Set(['explode']));

      result = modifiedResults[2] as SingleResult;
      expect(result.initialValue).toBe(2);
      expect(result.value).toBe(2);
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

      result = modifiedResults[6] as SingleResult;
      expect(result.initialValue).toBe(6);
      expect(result.value).toBe(6);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[7] as SingleResult;
      expect(result.initialValue).toBe(10);
      expect(result.value).toBe(10);
      expect(result.modifiers).toEqual(new Set(['explode']));

      result = modifiedResults[8] as SingleResult;
      expect(result.initialValue).toBe(5);
      expect(result.value).toBe(5);
      expect(result.modifiers).toEqual(new Set());
    });

    test('can explode with compare point `<3`', () => {
      mod.comparePoint = new ComparePoint('<', 3);

      const modifiedResults = mod.run(results, die).rolls;

      // assert that all the rolls exist
      expect(modifiedResults).toBeInstanceOf(Array);
      expect(modifiedResults).toHaveLength(9);

      let result = modifiedResults[0] as SingleResult;
      expect(result.initialValue).toBe(8);
      expect(result.value).toBe(8);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[1] as SingleResult;
      expect(result.initialValue).toBe(4);
      expect(result.value).toBe(4);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[2] as SingleResult;
      expect(result.initialValue).toBe(2);
      expect(result.value).toBe(2);
      expect(result.modifiers).toEqual(new Set(['explode']));

      result = modifiedResults[3] as SingleResult;
      expect(result.initialValue).toBe(10);
      expect(result.value).toBe(10);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[4] as SingleResult;
      expect(result.initialValue).toBe(1);
      expect(result.value).toBe(1);
      expect(result.modifiers).toEqual(new Set(['explode']));

      result = modifiedResults[5] as SingleResult;
      expect(result.initialValue).toBe(2);
      expect(result.value).toBe(2);
      expect(result.modifiers).toEqual(new Set(['explode']));

      result = modifiedResults[6] as SingleResult;
      expect(result.initialValue).toBe(5);
      expect(result.value).toBe(5);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[7] as SingleResult;
      expect(result.initialValue).toBe(6);
      expect(result.value).toBe(6);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[8] as SingleResult;
      expect(result.initialValue).toBe(10);
      expect(result.value).toBe(10);
      expect(result.modifiers).toEqual(new Set());
    });

    test('can explode with compare point `<>4`', () => {
      jest.restoreAllMocks();
      jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => new RollResult(10))
        .mockImplementationOnce(() => new RollResult(4))
        .mockImplementationOnce(() => new RollResult(4))
        .mockImplementationOnce(() => new RollResult(5))
        .mockImplementationOnce(() => new RollResult(4))
        .mockImplementationOnce(() => new RollResult(8))
        .mockImplementationOnce(() => new RollResult(3))
        .mockImplementationOnce(() => new RollResult(4))
        .mockImplementationOnce(() => new RollResult(4));

      mod.comparePoint = new ComparePoint('<>', 4);

      const modifiedResults = mod.run(results, die).rolls;

      // assert that all the rolls exist
      expect(modifiedResults).toBeInstanceOf(Array);
      expect(modifiedResults).toHaveLength(15);

      let result = modifiedResults[0] as SingleResult;
      expect(result.initialValue).toBe(8);
      expect(result.value).toBe(8);
      expect(result.modifiers).toEqual(new Set(['explode']));

      result = modifiedResults[1] as SingleResult;
      expect(result.initialValue).toBe(10);
      expect(result.value).toBe(10);
      expect(result.modifiers).toEqual(new Set(['explode']));

      result = modifiedResults[2] as SingleResult;
      expect(result.initialValue).toBe(4);
      expect(result.value).toBe(4);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[3] as SingleResult;
      expect(result.initialValue).toBe(4);
      expect(result.value).toBe(4);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[4] as SingleResult;
      expect(result.initialValue).toBe(2);
      expect(result.value).toBe(2);
      expect(result.modifiers).toEqual(new Set(['explode']));

      result = modifiedResults[5] as SingleResult;
      expect(result.initialValue).toBe(4);
      expect(result.value).toBe(4);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[6] as SingleResult;
      expect(result.initialValue).toBe(1);
      expect(result.value).toBe(1);
      expect(result.modifiers).toEqual(new Set(['explode']));

      result = modifiedResults[7] as SingleResult;
      expect(result.initialValue).toBe(5);
      expect(result.value).toBe(5);
      expect(result.modifiers).toEqual(new Set(['explode']));

      result = modifiedResults[8] as SingleResult;
      expect(result.initialValue).toBe(4);
      expect(result.value).toBe(4);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[9] as SingleResult;
      expect(result.initialValue).toBe(6);
      expect(result.value).toBe(6);
      expect(result.modifiers).toEqual(new Set(['explode']));

      result = modifiedResults[10] as SingleResult;
      expect(result.initialValue).toBe(8);
      expect(result.value).toBe(8);
      expect(result.modifiers).toEqual(new Set(['explode']));

      result = modifiedResults[11] as SingleResult;
      expect(result.initialValue).toBe(3);
      expect(result.value).toBe(3);
      expect(result.modifiers).toEqual(new Set(['explode']));

      result = modifiedResults[12] as SingleResult;
      expect(result.initialValue).toBe(4);
      expect(result.value).toBe(4);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[13] as SingleResult;
      expect(result.initialValue).toBe(10);
      expect(result.value).toBe(10);
      expect(result.modifiers).toEqual(new Set(['explode']));

      result = modifiedResults[14] as SingleResult;
      expect(result.initialValue).toBe(4);
      expect(result.value).toBe(4);
      expect(result.modifiers).toEqual(new Set());
    });

    test('can compound with compare point `>5`', () => {
      mod = new ExplodeModifier(new ComparePoint('>', 5), true);

      const modifiedResults = mod.run(results, die).rolls;

      // assert that all the rolls exist
      expect(modifiedResults).toBeInstanceOf(Array);
      expect(modifiedResults).toHaveLength(6);

      let result = modifiedResults[0] as SingleResult;
      expect(result.initialValue).toBe(8);
      expect(result.modifierFlags).toEqual('!!');
      expect(result.modifiers).toEqual(new Set(['explode', 'compound']));
      expect(result.value).toBe(20);

      result = modifiedResults[1] as SingleResult;
      expect(result.initialValue).toBe(4);
      expect(result.modifierFlags).toEqual('');
      expect(result.modifiers).toEqual(new Set());
      expect(result.value).toBe(4);

      result = modifiedResults[2] as SingleResult;
      expect(result.initialValue).toBe(2);
      expect(result.modifierFlags).toEqual('');
      expect(result.modifiers).toEqual(new Set());
      expect(result.value).toBe(2);

      result = modifiedResults[3] as SingleResult;
      expect(result.initialValue).toBe(1);
      expect(result.modifierFlags).toEqual('');
      expect(result.modifiers).toEqual(new Set());
      expect(result.value).toBe(1);

      result = modifiedResults[4] as SingleResult;
      expect(result.initialValue).toBe(6);
      expect(result.modifierFlags).toEqual('!!');
      expect(result.modifiers).toEqual(new Set(['explode', 'compound']));
      expect(result.value).toBe(11);

      result = modifiedResults[5] as SingleResult;
      expect(result.initialValue).toBe(10);
      expect(result.modifierFlags).toEqual('!!');
      expect(result.modifiers).toEqual(new Set(['explode', 'compound']));
      expect(result.value).toBe(21);
    });

    test('can penetrate with compare point `<=4`', () => {
      mod = new ExplodeModifier(new ComparePoint('<=', 4), false, true);

      const modifiedResults = mod.run(results, die).rolls;

      // assert that all the rolls exist
      expect(modifiedResults).toBeInstanceOf(Array);
      expect(modifiedResults).toHaveLength(10);

      let result = modifiedResults[0] as SingleResult;
      expect(result.initialValue).toBe(8);
      expect(result.value).toBe(8);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[1] as SingleResult;
      expect(result.initialValue).toBe(4);
      expect(result.value).toBe(4);
      expect(result.modifiers).toEqual(new Set(['explode', 'penetrate']));

      result = modifiedResults[2] as SingleResult;
      expect(result.initialValue).toBe(10);
      expect(result.value).toBe(9);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[3] as SingleResult;
      expect(result.initialValue).toBe(2);
      expect(result.value).toBe(2);
      expect(result.modifiers).toEqual(new Set(['explode', 'penetrate']));

      result = modifiedResults[4] as SingleResult;
      expect(result.initialValue).toBe(2);
      expect(result.value).toBe(1);
      expect(result.modifiers).toEqual(new Set(['explode', 'penetrate']));

      result = modifiedResults[5] as SingleResult;
      expect(result.initialValue).toBe(5);
      expect(result.value).toBe(4);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[6] as SingleResult;
      expect(result.initialValue).toBe(1);
      expect(result.value).toBe(1);
      expect(result.modifiers).toEqual(new Set(['explode', 'penetrate']));

      result = modifiedResults[7] as SingleResult;
      expect(result.initialValue).toBe(8);
      expect(result.value).toBe(7);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[8] as SingleResult;
      expect(result.initialValue).toBe(6);
      expect(result.value).toBe(6);
      expect(result.modifiers).toEqual(new Set());

      result = modifiedResults[9] as SingleResult;
      expect(result.initialValue).toBe(10);
      expect(result.value).toBe(10);
      expect(result.modifiers).toEqual(new Set());
    });

    test('can compound and penetrate with compare point >6', () => {
      mod = new ExplodeModifier(new ComparePoint('>', 6), true, true);

      const modifiedResults = mod.run(results, die).rolls;

      // assert that all the rolls exist
      expect(modifiedResults).toBeInstanceOf(Array);
      expect(modifiedResults).toHaveLength(6);

      let result = modifiedResults[0] as SingleResult;
      expect(result.initialValue).toBe(8);
      expect(result.modifierFlags).toEqual('!!p');
      expect(result.modifiers).toEqual(new Set(['explode', 'compound', 'penetrate']));
      expect(result.value).toBe(18);

      result = modifiedResults[1] as SingleResult;
      expect(result.initialValue).toBe(4);
      expect(result.modifierFlags).toEqual('');
      expect(result.modifiers).toEqual(new Set());
      expect(result.value).toBe(4);

      result = modifiedResults[2] as SingleResult;
      expect(result.initialValue).toBe(2);
      expect(result.modifierFlags).toEqual('');
      expect(result.modifiers).toEqual(new Set());
      expect(result.value).toBe(2);

      result = modifiedResults[3] as SingleResult;
      expect(result.initialValue).toBe(1);
      expect(result.modifierFlags).toEqual('');
      expect(result.modifiers).toEqual(new Set());
      expect(result.value).toBe(1);

      result = modifiedResults[4] as SingleResult;
      expect(result.initialValue).toBe(6);
      expect(result.modifierFlags).toEqual('');
      expect(result.modifiers).toEqual(new Set());
      expect(result.value).toBe(6);

      result = modifiedResults[5] as SingleResult;
      expect(result.initialValue).toBe(10);
      expect(result.modifierFlags).toEqual('!!p');
      expect(result.modifiers).toEqual(new Set(['explode', 'compound', 'penetrate']));
      expect(result.value).toBe(14);
    });

    test('exploding with d1 throws an error', () => {
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

      test('infinite explode stops at iteration limit `!>0`', () => {
        // exploding on greater than zero will always explode, but shouldn't loop infinitely
        mod.comparePoint = new ComparePoint('>', 0);

        for (let qty = 1; qty < 2; qty++) {
          // create a results object with the correct number of rolls in it, filled with values of 1
          results = new RollResults(Array(qty).fill(1) as number[]);

          // create the dice
          die = new StandardDice(10, qty);

          // apply modifiers
          const modifiedResults = mod.run(results, die).rolls;

          // check that the roll length is correct
          expect(modifiedResults).toHaveLength((mod.maxIterations + 1) * qty);
        }
      });
    });
  });

  describe('Readonly properties', () => {
    test('cannot change compound value', () => {
      const mod = new ExplodeModifier();

      expect(() => {
        // @ts-expect-error testing readonly property
        mod.compound = true;
      }).toThrow(TypeError);
    });

    test('cannot change penetrate value', () => {
      const mod = new ExplodeModifier();

      expect(() => {
        // @ts-expect-error testing readonly property
        mod.penetrate = true;
      }).toThrow(TypeError);
    });
  });
});
