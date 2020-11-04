import ComparePoint from '../../src/ComparePoint.js';
import ComparisonModifier from '../../src/modifiers/ComparisonModifier.js';
import MultiplyModifier from '../../src/modifiers/MultiplyModifier.js';
import RollResults from '../../src/results/RollResults.js';
import StandardDice from '../../src/dice/StandardDice.js';

describe('MultiplyModifier', () => {
  let cp;
  let mod;

  beforeEach(() => {
    cp = new ComparePoint('>', 5);
    mod = new MultiplyModifier(2);
  });

  describe('Initialisation', () => {
    test('model structure', () => {
      expect(mod).toBeInstanceOf(ComparisonModifier);
      expect(mod).toBeInstanceOf(MultiplyModifier);
      expect(mod).toEqual(expect.objectContaining({
        comparePoint: undefined,
        factor: 2,
        name: 'multiply',
        notation: 'mul2',
        run: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });

    test('constructor requires `factor`', () => {
      expect(() => {
        new MultiplyModifier();
      }).toThrow(TypeError);

      expect(() => {
        new MultiplyModifier(false);
      }).toThrow(TypeError);

      expect(() => {
        new MultiplyModifier(null);
      }).toThrow(TypeError);

      expect(() => {
        new MultiplyModifier(undefined);
      }).toThrow(TypeError);
    });
  });

  describe('Factor', () => {
    test('gets set in constructor', () => {
      mod = new MultiplyModifier(4);

      expect(mod.factor).toBe(4);
      expect(mod.notation).toBe('mul4');
    });

    test('can be changed', () => {
      expect(mod.factor).toBe(2);
      expect(mod.notation).toBe('mul2');

      mod.factor = 5;
      expect(mod.factor).toBe(5);
      expect(mod.notation).toBe('mul5');

      mod.factor = 46;
      expect(mod.factor).toBe(46);
      expect(mod.notation).toBe('mul46');
    });

    test('must be numeric', () => {
      expect(() => {
        mod.factor = 'foo';
      }).toThrow(TypeError);

      expect(() => {
        mod.factor = [];
      }).toThrow(TypeError);

      expect(() => {
        mod.factor = { max: 3 };
      }).toThrow(TypeError);
    });

    test('can be float', () => {
      mod.factor = 4.5;
      expect(mod.factor).toBeCloseTo(4.5);
      expect(mod.notation).toBe('mul4.5');

      mod.factor = 300.6579;
      expect(mod.factor).toBeCloseTo(300.6579);
      expect(mod.notation).toBe('mul300.6579');
    });

    test('can be negative', () => {
      mod.factor = -1;
      expect(mod.factor).toBeCloseTo(-1);
      expect(mod.notation).toBe('mul-1');

      mod.factor = -568;
      expect(mod.factor).toBeCloseTo(-568);
      expect(mod.notation).toBe('mul-568');

      mod.factor = -0.01;
      expect(mod.factor).toBeCloseTo(-0.01);
      expect(mod.notation).toBe('mul-0.01');
    });

    test('can be zero', () => {
      mod.factor = 0;
      expect(mod.factor).toBeCloseTo(0);
      expect(mod.notation).toBe('mul0');
    });
  });

  describe('Compare point', () => {
    test('gets set in constructor', () => {
      mod = new MultiplyModifier(4, cp);

      expect(mod.comparePoint).toBe(cp);
      expect(mod.notation).toBe('mul4>5');
    });

    test('setting in constructor calls `comparePoint` setter in parent', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'comparePoint', 'set');

      // create the modifier
      mod = new MultiplyModifier(3, cp);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(cp);

      // remove the spy
      spy.mockRestore();
    });
  });

  describe('Notation', () => {
    test('No compare point', () => {
      mod.factor = 7.657;
      expect(mod.notation).toEqual('mul7.657');

      mod.factor = -56.34;
      expect(mod.notation).toEqual('mul-56.34');

      mod.factor = 10;
      expect(mod.notation).toEqual('mul10');
    });

    test('With compare point', () => {
      mod.comparePoint = new ComparePoint('!=', 4);
      expect(mod.notation).toEqual('mul2!=4');

      mod.comparePoint = new ComparePoint('<=', 76);
      expect(mod.notation).toEqual('mul2<=76');

      mod.comparePoint = new ComparePoint('>', 3);
      expect(mod.notation).toEqual('mul2>3');

      mod.comparePoint = new ComparePoint('=', 56.789);
      expect(mod.notation).toEqual('mul2=56.789');
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        factor: 2,
        name: 'multiply',
        notation: 'mul2',
        type: 'modifier',
      });

      mod.comparePoint = cp;
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        comparePoint: JSON.parse(JSON.stringify(cp)),
        factor: 2,
        name: 'multiply',
        notation: 'mul2>5',
        type: 'modifier',
      });
    });

    test('toString output is correct', () => {
      expect(mod.toString()).toEqual(mod.notation);
    });
  });

  describe('Run', () => {
    let die;
    let results;

    beforeEach(() => {
      results = new RollResults([
        8, 4, 2, 1, 6,
      ]);
      die = new StandardDice(10, 5);
    });

    test('returns RollResults object', () => {
      expect(mod.run(results, die)).toBe(results);
    });

    describe('No compare point', () => {
      test('all rolls are multiplied by factor', () => {
        const modifiedResults = mod.run(results, die).rolls;

        expect(modifiedResults).toHaveLength(5);

        // check the first roll
        expect(modifiedResults[0].initialValue).toBe(8);
        expect(modifiedResults[0].calculationValue).toBe(16);
        expect(modifiedResults[0].value).toBe(8);
        expect(modifiedResults[0].useInTotal).toBe(true);
        expect(modifiedResults[0].modifierFlags).toEqual('*');
        expect(modifiedResults[0].modifiers).toEqual(new Set(['multiply']));

        // check the second roll
        expect(modifiedResults[1].initialValue).toBe(4);
        expect(modifiedResults[1].calculationValue).toBe(8);
        expect(modifiedResults[1].value).toBe(4);
        expect(modifiedResults[1].useInTotal).toBe(true);
        expect(modifiedResults[1].modifierFlags).toEqual('*');
        expect(modifiedResults[1].modifiers).toEqual(new Set(['multiply']));

        // check the third roll
        expect(modifiedResults[2].initialValue).toBe(2);
        expect(modifiedResults[2].calculationValue).toBe(4);
        expect(modifiedResults[2].value).toBe(2);
        expect(modifiedResults[2].useInTotal).toBe(true);
        expect(modifiedResults[2].modifierFlags).toEqual('*');
        expect(modifiedResults[2].modifiers).toEqual(new Set(['multiply']));

        // check the fourth roll
        expect(modifiedResults[3].initialValue).toBe(1);
        expect(modifiedResults[3].calculationValue).toBe(2);
        expect(modifiedResults[3].value).toBe(1);
        expect(modifiedResults[3].useInTotal).toBe(true);
        expect(modifiedResults[3].modifierFlags).toEqual('*');
        expect(modifiedResults[3].modifiers).toEqual(new Set(['multiply']));

        // check the fifth roll
        expect(modifiedResults[4].initialValue).toBe(6);
        expect(modifiedResults[4].calculationValue).toBe(12);
        expect(modifiedResults[4].value).toBe(6);
        expect(modifiedResults[4].useInTotal).toBe(true);
        expect(modifiedResults[4].modifierFlags).toEqual('*');
        expect(modifiedResults[4].modifiers).toEqual(new Set(['multiply']));
      });
    });

    describe('With compare point', () => {
      test('Only matching rolls are multiplied by factor', () => {
        mod.factor = 5;
        mod.comparePoint = cp;

        const modifiedResults = mod.run(results, die).rolls;

        expect(modifiedResults).toHaveLength(5);

        // check the first roll
        expect(modifiedResults[0].initialValue).toBe(8);
        expect(modifiedResults[0].calculationValue).toBe(40);
        expect(modifiedResults[0].value).toBe(8);
        expect(modifiedResults[0].useInTotal).toBe(true);
        expect(modifiedResults[0].modifierFlags).toEqual('*');
        expect(modifiedResults[0].modifiers).toEqual(new Set(['multiply']));

        // check the second roll
        expect(modifiedResults[1].initialValue).toBe(4);
        expect(modifiedResults[1].calculationValue).toBe(4);
        expect(modifiedResults[1].value).toBe(4);
        expect(modifiedResults[1].useInTotal).toBe(true);
        expect(modifiedResults[1].modifierFlags).toEqual('');
        expect(modifiedResults[1].modifiers).toEqual(new Set());

        // check the third roll
        expect(modifiedResults[2].initialValue).toBe(2);
        expect(modifiedResults[2].calculationValue).toBe(2);
        expect(modifiedResults[2].value).toBe(2);
        expect(modifiedResults[2].useInTotal).toBe(true);
        expect(modifiedResults[2].modifierFlags).toEqual('');
        expect(modifiedResults[2].modifiers).toEqual(new Set());

        // check the fourth roll
        expect(modifiedResults[3].initialValue).toBe(1);
        expect(modifiedResults[3].calculationValue).toBe(1);
        expect(modifiedResults[3].value).toBe(1);
        expect(modifiedResults[3].useInTotal).toBe(true);
        expect(modifiedResults[3].modifierFlags).toEqual('');
        expect(modifiedResults[3].modifiers).toEqual(new Set());

        // check the fifth roll
        expect(modifiedResults[4].initialValue).toBe(6);
        expect(modifiedResults[4].calculationValue).toBe(30);
        expect(modifiedResults[4].value).toBe(6);
        expect(modifiedResults[4].useInTotal).toBe(true);
        expect(modifiedResults[0].modifierFlags).toEqual('*');
        expect(modifiedResults[0].modifiers).toEqual(new Set(['multiply']));
      });
    });

    // @todo should this work with roll groups?
  });

  describe('Readonly properties', () => {
    test('cannot change name value', () => {
      expect(() => {
        mod.name = 'Foo';
      }).toThrow(TypeError);
    });
  });
});
