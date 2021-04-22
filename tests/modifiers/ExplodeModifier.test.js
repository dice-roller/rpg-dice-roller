import { StandardDice } from '../../src/dice/index.js';
import { DieActionValueError } from '../../src/exceptions/index.js';
import { ComparisonModifier, ExplodeModifier } from '../../src/modifiers/index.js';
import ComparePoint from '../../src/ComparePoint.js';
import RollResult from '../../src/results/RollResult.js';
import RollResults from '../../src/results/RollResults.js';

describe('ExplodeModifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const mod = new ExplodeModifier();

      expect(mod).toBeInstanceOf(ExplodeModifier);
      expect(mod).toBeInstanceOf(ComparisonModifier);
      expect(mod).toEqual(expect.objectContaining({
        comparePoint: undefined,
        compound: false,
        isComparePoint: expect.any(Function),
        penetrate: false,
        maxIterations: ExplodeModifier.defaultMaxIterations,
        name: 'explode',
        notation: '!',
        run: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
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
      expect((new ExplodeModifier(null, 'foo')).compound).toBe(true);
      expect((new ExplodeModifier(null, '')).compound).toBe(false);
      expect((new ExplodeModifier(null, '0')).compound).toBe(true);
      expect((new ExplodeModifier(null, 0)).compound).toBe(false);
      expect((new ExplodeModifier(null, 1)).compound).toBe(true);
      expect((new ExplodeModifier(null, [])).compound).toBe(true);
      expect((new ExplodeModifier(null, {})).compound).toBe(true);
      expect((new ExplodeModifier(null, null)).compound).toBe(false);
      expect((new ExplodeModifier(null, undefined)).compound).toBe(false);
    });
  });

  describe('Penetrate', () => {
    test('gets set in constructor', () => {
      const mod = new ExplodeModifier(null, null, true);

      expect(mod.penetrate).toBe(true);
      expect(mod.notation).toBe('!p');
    });

    test('cast to boolean', () => {
      expect((new ExplodeModifier(null, null, false)).penetrate).toBe(false);
      expect((new ExplodeModifier(null, null, 'foo')).penetrate).toBe(true);
      expect((new ExplodeModifier(null, null, '')).penetrate).toBe(false);
      expect((new ExplodeModifier(null, null, '0')).penetrate).toBe(true);
      expect((new ExplodeModifier(null, null, 0)).penetrate).toBe(false);
      expect((new ExplodeModifier(null, null, 1)).penetrate).toBe(true);
      expect((new ExplodeModifier(null, null, [])).penetrate).toBe(true);
      expect((new ExplodeModifier(null, null, {})).penetrate).toBe(true);
      expect((new ExplodeModifier(null, null, null)).penetrate).toBe(false);
      expect((new ExplodeModifier(null, null, undefined)).penetrate).toBe(false);
    });
  });

  describe('Limit', () => {
    test('gets set in constructor', () => {
      const mod = new ExplodeModifier(null, null, null, 3);

      expect(mod.maxIterations).toBe(3);
      expect(mod.notation).toBe('!3');
    });
  });

  describe('Notation', () => {
    describe('explode', () => {
      test('without limit', () => {
        let mod = new ExplodeModifier(new ComparePoint('>=', 45));
        expect(mod.notation).toEqual('!>=45');

        mod = new ExplodeModifier(new ComparePoint('<', 1));
        expect(mod.notation).toEqual('!<1');

        mod = new ExplodeModifier(new ComparePoint('<=', 678997595));
        expect(mod.notation).toEqual('!<=678997595');

        mod = new ExplodeModifier(new ComparePoint('<>', 567));
        expect(mod.notation).toEqual('!<>567');
      });

      test('with limit', () => {
        let mod = new ExplodeModifier(new ComparePoint('>=', 45), false, false, 34);
        expect(mod.notation).toEqual('!34>=45');

        mod = new ExplodeModifier(new ComparePoint('<', 1), false, false, 6);
        expect(mod.notation).toEqual('!6<1');

        mod = new ExplodeModifier(new ComparePoint('<=', 678997595), false, false, 798);
        expect(mod.notation).toEqual('!798<=678997595');
      });
    });

    describe('compound', () => {
      test('without limit', () => {
        let mod = new ExplodeModifier(new ComparePoint('>=', 16), true);
        expect(mod.notation).toEqual('!!>=16');

        mod = new ExplodeModifier(new ComparePoint('<', 79), true);
        expect(mod.notation).toEqual('!!<79');

        mod = new ExplodeModifier(new ComparePoint('<=', 678997595), true);
        expect(mod.notation).toEqual('!!<=678997595');

        mod = new ExplodeModifier(new ComparePoint('<>', 51), true);
        expect(mod.notation).toEqual('!!<>51');
      });

      test('with limit', () => {
        let mod = new ExplodeModifier(new ComparePoint('>=', 16), true, false, 67);
        expect(mod.notation).toEqual('!!67>=16');

        mod = new ExplodeModifier(new ComparePoint('<', 79), true, false, 891);
        expect(mod.notation).toEqual('!!891<79');

        mod = new ExplodeModifier(new ComparePoint('<=', 678997595), true, false, 15);
        expect(mod.notation).toEqual('!!15<=678997595');
      });
    });

    describe('penetrate', () => {
      test('without limit', () => {
        let mod = new ExplodeModifier(new ComparePoint('>=', 16), false, true);
        expect(mod.notation).toEqual('!p>=16');

        mod = new ExplodeModifier(new ComparePoint('<', 79), false, true);
        expect(mod.notation).toEqual('!p<79');

        mod = new ExplodeModifier(new ComparePoint('<=', 678997595), false, true);
        expect(mod.notation).toEqual('!p<=678997595');

        mod = new ExplodeModifier(new ComparePoint('<>', 1983746), false, true);
        expect(mod.notation).toEqual('!p<>1983746');
      });

      test('with limit', () => {
        let mod = new ExplodeModifier(new ComparePoint('>=', 16), false, true, 82);
        expect(mod.notation).toEqual('!p82>=16');

        mod = new ExplodeModifier(new ComparePoint('<', 79), false, true, 678);
        expect(mod.notation).toEqual('!p678<79');

        mod = new ExplodeModifier(new ComparePoint('<=', 678997595), false, true, 1);
        expect(mod.notation).toEqual('!po<=678997595');
      });
    });

    describe('compound and penetrate', () => {
      test('without limit', () => {
        let mod = new ExplodeModifier(new ComparePoint('>=', 16), true, true);
        expect(mod.notation).toEqual('!!p>=16');

        mod = new ExplodeModifier(new ComparePoint('<', 79), true, true);
        expect(mod.notation).toEqual('!!p<79');

        mod = new ExplodeModifier(new ComparePoint('<=', 678997595), true, true);
        expect(mod.notation).toEqual('!!p<=678997595');

        mod = new ExplodeModifier(new ComparePoint('<>', 18943), true, true);
        expect(mod.notation).toEqual('!!p<>18943');
      });

      test('with limit', () => {
        let mod = new ExplodeModifier(new ComparePoint('>=', 16), true, true, 7);
        expect(mod.notation).toEqual('!!p7>=16');

        mod = new ExplodeModifier(new ComparePoint('<', 79), true, true, 68);
        expect(mod.notation).toEqual('!!p68<79');

        mod = new ExplodeModifier(new ComparePoint('<=', 678997595), true, true, 309);
        expect(mod.notation).toEqual('!!p309<=678997595');
      });
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const cp = new ComparePoint('<=', 3);
      const mod = new ExplodeModifier(cp, true, true, 56);

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        comparePoint: cp.toJSON(),
        compound: true,
        maxIterations: 56,
        name: 'explode',
        notation: '!!p56<=3',
        penetrate: true,
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
    let mod;
    let die;
    let results;

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

    test('does not explode without compare point', () => {
      const modifiedResults = mod.run(results, die).rolls;

      // assert that all the rolls exist
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

    test('can explode with compare point `>=8`', () => {
      mod.comparePoint = new ComparePoint('>=', 8);

      const modifiedResults = mod.run(results, die).rolls;

      // assert that all the rolls exist
      expect(modifiedResults).toBeInstanceOf(Array);
      expect(modifiedResults).toHaveLength(9);

      expect(modifiedResults[0].initialValue).toBe(8);
      expect(modifiedResults[0].value).toBe(8);
      expect(modifiedResults[0].modifiers).toEqual(new Set(['explode']));

      expect(modifiedResults[1].initialValue).toBe(10);
      expect(modifiedResults[1].value).toBe(10);
      expect(modifiedResults[1].modifiers).toEqual(new Set(['explode']));

      expect(modifiedResults[2].initialValue).toBe(2);
      expect(modifiedResults[2].value).toBe(2);
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

      expect(modifiedResults[6].initialValue).toBe(6);
      expect(modifiedResults[6].value).toBe(6);
      expect(modifiedResults[6].modifiers).toEqual(new Set());

      expect(modifiedResults[7].initialValue).toBe(10);
      expect(modifiedResults[7].value).toBe(10);
      expect(modifiedResults[7].modifiers).toEqual(new Set(['explode']));

      expect(modifiedResults[8].initialValue).toBe(5);
      expect(modifiedResults[8].value).toBe(5);
      expect(modifiedResults[8].modifiers).toEqual(new Set());
    });

    test('can explode with compare point `<3`', () => {
      mod.comparePoint = new ComparePoint('<', 3);

      const modifiedResults = mod.run(results, die).rolls;

      // assert that all the rolls exist
      expect(modifiedResults).toBeInstanceOf(Array);
      expect(modifiedResults).toHaveLength(9);

      expect(modifiedResults[0].initialValue).toBe(8);
      expect(modifiedResults[0].value).toBe(8);
      expect(modifiedResults[0].modifiers).toEqual(new Set());

      expect(modifiedResults[1].initialValue).toBe(4);
      expect(modifiedResults[1].value).toBe(4);
      expect(modifiedResults[1].modifiers).toEqual(new Set());

      expect(modifiedResults[2].initialValue).toBe(2);
      expect(modifiedResults[2].value).toBe(2);
      expect(modifiedResults[2].modifiers).toEqual(new Set(['explode']));

      expect(modifiedResults[3].initialValue).toBe(10);
      expect(modifiedResults[3].value).toBe(10);
      expect(modifiedResults[3].modifiers).toEqual(new Set());

      expect(modifiedResults[4].initialValue).toBe(1);
      expect(modifiedResults[4].value).toBe(1);
      expect(modifiedResults[4].modifiers).toEqual(new Set(['explode']));

      expect(modifiedResults[5].initialValue).toBe(2);
      expect(modifiedResults[5].value).toBe(2);
      expect(modifiedResults[5].modifiers).toEqual(new Set(['explode']));

      expect(modifiedResults[6].initialValue).toBe(5);
      expect(modifiedResults[6].value).toBe(5);
      expect(modifiedResults[6].modifiers).toEqual(new Set());

      expect(modifiedResults[7].initialValue).toBe(6);
      expect(modifiedResults[7].value).toBe(6);
      expect(modifiedResults[7].modifiers).toEqual(new Set());

      expect(modifiedResults[8].initialValue).toBe(10);
      expect(modifiedResults[8].value).toBe(10);
      expect(modifiedResults[8].modifiers).toEqual(new Set());
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

      expect(modifiedResults[0].initialValue).toBe(8);
      expect(modifiedResults[0].value).toBe(8);
      expect(modifiedResults[0].modifiers).toEqual(new Set(['explode']));

      expect(modifiedResults[1].initialValue).toBe(10);
      expect(modifiedResults[1].value).toBe(10);
      expect(modifiedResults[1].modifiers).toEqual(new Set(['explode']));

      expect(modifiedResults[2].initialValue).toBe(4);
      expect(modifiedResults[2].value).toBe(4);
      expect(modifiedResults[2].modifiers).toEqual(new Set());

      expect(modifiedResults[3].initialValue).toBe(4);
      expect(modifiedResults[3].value).toBe(4);
      expect(modifiedResults[3].modifiers).toEqual(new Set());

      expect(modifiedResults[4].initialValue).toBe(2);
      expect(modifiedResults[4].value).toBe(2);
      expect(modifiedResults[4].modifiers).toEqual(new Set(['explode']));

      expect(modifiedResults[5].initialValue).toBe(4);
      expect(modifiedResults[5].value).toBe(4);
      expect(modifiedResults[5].modifiers).toEqual(new Set());

      expect(modifiedResults[6].initialValue).toBe(1);
      expect(modifiedResults[6].value).toBe(1);
      expect(modifiedResults[6].modifiers).toEqual(new Set(['explode']));

      expect(modifiedResults[7].initialValue).toBe(5);
      expect(modifiedResults[7].value).toBe(5);
      expect(modifiedResults[7].modifiers).toEqual(new Set(['explode']));

      expect(modifiedResults[8].initialValue).toBe(4);
      expect(modifiedResults[8].value).toBe(4);
      expect(modifiedResults[8].modifiers).toEqual(new Set());

      expect(modifiedResults[9].initialValue).toBe(6);
      expect(modifiedResults[9].value).toBe(6);
      expect(modifiedResults[9].modifiers).toEqual(new Set(['explode']));

      expect(modifiedResults[10].initialValue).toBe(8);
      expect(modifiedResults[10].value).toBe(8);
      expect(modifiedResults[10].modifiers).toEqual(new Set(['explode']));

      expect(modifiedResults[11].initialValue).toBe(3);
      expect(modifiedResults[11].value).toBe(3);
      expect(modifiedResults[11].modifiers).toEqual(new Set(['explode']));

      expect(modifiedResults[12].initialValue).toBe(4);
      expect(modifiedResults[12].value).toBe(4);
      expect(modifiedResults[12].modifiers).toEqual(new Set());

      expect(modifiedResults[13].initialValue).toBe(10);
      expect(modifiedResults[13].value).toBe(10);
      expect(modifiedResults[13].modifiers).toEqual(new Set(['explode']));

      expect(modifiedResults[14].initialValue).toBe(4);
      expect(modifiedResults[14].value).toBe(4);
      expect(modifiedResults[14].modifiers).toEqual(new Set());
    });

    test('can compound with compare point `>5`', () => {
      mod = new ExplodeModifier(new ComparePoint('>', 5), true);

      const modifiedResults = mod.run(results, die).rolls;

      // assert that all the rolls exist
      expect(modifiedResults).toBeInstanceOf(Array);
      expect(modifiedResults).toHaveLength(6);

      expect(modifiedResults[0].initialValue).toBe(8);
      expect(modifiedResults[0].modifierFlags).toEqual('!!');
      expect(modifiedResults[0].modifiers).toEqual(new Set(['explode', 'compound']));
      expect(modifiedResults[0].value).toBe(20);

      expect(modifiedResults[1].initialValue).toBe(4);
      expect(modifiedResults[1].modifierFlags).toEqual('');
      expect(modifiedResults[1].modifiers).toEqual(new Set());
      expect(modifiedResults[1].value).toBe(4);

      expect(modifiedResults[2].initialValue).toBe(2);
      expect(modifiedResults[2].modifierFlags).toEqual('');
      expect(modifiedResults[2].modifiers).toEqual(new Set());
      expect(modifiedResults[2].value).toBe(2);

      expect(modifiedResults[3].initialValue).toBe(1);
      expect(modifiedResults[3].modifierFlags).toEqual('');
      expect(modifiedResults[3].modifiers).toEqual(new Set());
      expect(modifiedResults[3].value).toBe(1);

      expect(modifiedResults[4].initialValue).toBe(6);
      expect(modifiedResults[4].modifierFlags).toEqual('!!');
      expect(modifiedResults[4].modifiers).toEqual(new Set(['explode', 'compound']));
      expect(modifiedResults[4].value).toBe(11);

      expect(modifiedResults[5].initialValue).toBe(10);
      expect(modifiedResults[5].modifierFlags).toEqual('!!');
      expect(modifiedResults[5].modifiers).toEqual(new Set(['explode', 'compound']));
      expect(modifiedResults[5].value).toBe(21);
    });

    test('can penetrate with compare point `<=4`', () => {
      mod = new ExplodeModifier(new ComparePoint('<=', 4), false, true);

      const modifiedResults = mod.run(results, die).rolls;

      // assert that all the rolls exist
      expect(modifiedResults).toBeInstanceOf(Array);
      expect(modifiedResults).toHaveLength(10);

      expect(modifiedResults[0].initialValue).toBe(8);
      expect(modifiedResults[0].value).toBe(8);
      expect(modifiedResults[0].modifiers).toEqual(new Set());

      expect(modifiedResults[1].initialValue).toBe(4);
      expect(modifiedResults[1].value).toBe(4);
      expect(modifiedResults[1].modifiers).toEqual(new Set(['explode', 'penetrate']));

      expect(modifiedResults[2].initialValue).toBe(10);
      expect(modifiedResults[2].value).toBe(9);
      expect(modifiedResults[2].modifiers).toEqual(new Set());

      expect(modifiedResults[3].initialValue).toBe(2);
      expect(modifiedResults[3].value).toBe(2);
      expect(modifiedResults[3].modifiers).toEqual(new Set(['explode', 'penetrate']));

      expect(modifiedResults[4].initialValue).toBe(2);
      expect(modifiedResults[4].value).toBe(1);
      expect(modifiedResults[4].modifiers).toEqual(new Set(['explode', 'penetrate']));

      expect(modifiedResults[5].initialValue).toBe(5);
      expect(modifiedResults[5].value).toBe(4);
      expect(modifiedResults[5].modifiers).toEqual(new Set());

      expect(modifiedResults[6].initialValue).toBe(1);
      expect(modifiedResults[6].value).toBe(1);
      expect(modifiedResults[6].modifiers).toEqual(new Set(['explode', 'penetrate']));

      expect(modifiedResults[7].initialValue).toBe(8);
      expect(modifiedResults[7].value).toBe(7);
      expect(modifiedResults[7].modifiers).toEqual(new Set());

      expect(modifiedResults[8].initialValue).toBe(6);
      expect(modifiedResults[8].value).toBe(6);
      expect(modifiedResults[8].modifiers).toEqual(new Set());

      expect(modifiedResults[9].initialValue).toBe(10);
      expect(modifiedResults[9].value).toBe(10);
      expect(modifiedResults[9].modifiers).toEqual(new Set());
    });

    test('can compound and penetrate with compare point >6', () => {
      mod = new ExplodeModifier(new ComparePoint('>', 6), true, true);

      const modifiedResults = mod.run(results, die).rolls;

      // assert that all the rolls exist
      expect(modifiedResults).toBeInstanceOf(Array);
      expect(modifiedResults).toHaveLength(6);

      expect(modifiedResults[0].initialValue).toBe(8);
      expect(modifiedResults[0].modifierFlags).toEqual('!!p');
      expect(modifiedResults[0].modifiers).toEqual(new Set(['explode', 'compound', 'penetrate']));
      expect(modifiedResults[0].value).toBe(18);

      expect(modifiedResults[1].initialValue).toBe(4);
      expect(modifiedResults[1].modifierFlags).toEqual('');
      expect(modifiedResults[1].modifiers).toEqual(new Set());
      expect(modifiedResults[1].value).toBe(4);

      expect(modifiedResults[2].initialValue).toBe(2);
      expect(modifiedResults[2].modifierFlags).toEqual('');
      expect(modifiedResults[2].modifiers).toEqual(new Set());
      expect(modifiedResults[2].value).toBe(2);

      expect(modifiedResults[3].initialValue).toBe(1);
      expect(modifiedResults[3].modifierFlags).toEqual('');
      expect(modifiedResults[3].modifiers).toEqual(new Set());
      expect(modifiedResults[3].value).toBe(1);

      expect(modifiedResults[4].initialValue).toBe(6);
      expect(modifiedResults[4].modifierFlags).toEqual('');
      expect(modifiedResults[4].modifiers).toEqual(new Set());
      expect(modifiedResults[4].value).toBe(6);

      expect(modifiedResults[5].initialValue).toBe(10);
      expect(modifiedResults[5].modifierFlags).toEqual('!!p');
      expect(modifiedResults[5].modifiers).toEqual(new Set(['explode', 'compound', 'penetrate']));
      expect(modifiedResults[5].value).toBe(14);
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
        expect(mod.maxIterations).toBe(ExplodeModifier.defaultMaxIterations);
      });

      test('infinite explode stops at iteration limit `!>0`', () => {
        // exploding on greater than zero will always explode, but shouldn't loop infinitely
        mod.comparePoint = new ComparePoint('>', 0);

        for (let qty = 1; qty < 2; qty++) {
          // create a results object with the correct number of rolls in it, filled with values of 1
          results = new RollResults(Array(qty).fill(1));

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
    test('cannot change name value', () => {
      const mod = new ExplodeModifier();

      expect(() => {
        mod.name = 'Foo';
      }).toThrow(TypeError);
    });

    test('cannot change compound value', () => {
      const mod = new ExplodeModifier();

      expect(() => {
        mod.compound = true;
      }).toThrow(TypeError);
    });

    test('cannot change penetrate value', () => {
      const mod = new ExplodeModifier();

      expect(() => {
        mod.penetrate = true;
      }).toThrow(TypeError);
    });
  });
});
