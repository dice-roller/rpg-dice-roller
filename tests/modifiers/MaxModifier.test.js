import { StandardDice } from '../../src/dice/index.js';
import { MaxModifier, Modifier } from '../../src/modifiers/index.js';
import RollResults from '../../src/results/RollResults.js';

describe('MaxModifier', () => {
  let mod;

  beforeEach(() => {
    mod = new MaxModifier(3);
  });

  describe('Initialisation', () => {
    test('model structure', () => {
      expect(mod).toBeInstanceOf(MaxModifier);
      expect(mod).toBeInstanceOf(Modifier);

      expect(mod).toEqual(expect.objectContaining({
        max: 3,
        name: 'max',
        notation: 'max3',
        run: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });

    test('constructor requires max', () => {
      expect(() => {
        new MaxModifier();
      }).toThrow(TypeError);

      expect(() => {
        new MaxModifier(false);
      }).toThrow(TypeError);

      expect(() => {
        new MaxModifier(null);
      }).toThrow(TypeError);

      expect(() => {
        new MaxModifier(undefined);
      }).toThrow(TypeError);
    });
  });

  describe('Max', () => {
    test('can be changed', () => {
      expect(mod.max).toBe(3);
      expect(mod.notation).toBe('max3');

      mod.max = 1;
      expect(mod.max).toBe(1);
      expect(mod.notation).toBe('max1');

      mod.max = 23;
      expect(mod.max).toBe(23);
      expect(mod.notation).toBe('max23');
    });

    test('must be numeric', () => {
      expect(() => {
        mod.max = 'foo';
      }).toThrow(TypeError);

      expect(() => {
        mod.max = [];
      }).toThrow(TypeError);

      expect(() => {
        mod.max = { max: 3 };
      }).toThrow(TypeError);
    });

    test('can be float', () => {
      mod.max = 4.5;
      expect(mod.max).toBeCloseTo(4.5);
      expect(mod.notation).toBe('max4.5');

      mod.max = 300.6579;
      expect(mod.max).toBeCloseTo(300.6579);
      expect(mod.notation).toBe('max300.6579');
    });

    test('can be negative', () => {
      mod.max = -10;
      expect(mod.max).toBe(-10);
      expect(mod.notation).toBe('max-10');

      mod.max = -46.2;
      expect(mod.max).toBeCloseTo(-46.2);
      expect(mod.notation).toBe('max-46.2');
    });
  });

  describe('Notation', () => {
    test('simple notation', () => {
      mod = new MaxModifier(35);
      expect(mod.notation).toEqual('max35');

      mod = new MaxModifier(90876684);
      expect(mod.notation).toEqual('max90876684');

      mod = new MaxModifier(7986);
      expect(mod.notation).toEqual('max7986');

      mod = new MaxModifier(2);
      expect(mod.notation).toEqual('max2');
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        max: 3,
        name: 'max',
        notation: 'max3',
        type: 'modifier',
      });
    });

    test('toString output is correct', () => {
      expect(mod.toString()).toEqual('max3');
    });
  });

  describe('Run', () => {
    let die;
    let results;

    beforeEach(() => {
      results = new RollResults([
        1, 4, 2, 1, 6,
      ]);
      die = new StandardDice(10, 5);
    });

    test('returns RollResults object', () => {
      expect(mod.run(results, die)).toBe(results);
    });

    test('rolls lower than max are changed to max', () => {
      const { rolls } = mod.run(results, die);

      expect(rolls.length).toBe(5);

      // check the first roll
      expect(rolls[0].initialValue).toBe(1);
      expect(rolls[0].calculationValue).toBe(1);
      expect(rolls[0].value).toBe(1);
      expect(rolls[0].useInTotal).toBe(true);
      expect(rolls[0].modifierFlags).toEqual('');
      expect(rolls[0].modifiers).toEqual(new Set());

      // check the second roll
      expect(rolls[1].initialValue).toBe(4);
      expect(rolls[1].calculationValue).toBe(3);
      expect(rolls[1].value).toBe(3);
      expect(rolls[1].useInTotal).toBe(true);
      expect(rolls[1].modifierFlags).toEqual('v');
      expect(rolls[1].modifiers).toEqual(new Set(['max']));

      // check the third roll
      expect(rolls[2].initialValue).toBe(2);
      expect(rolls[2].calculationValue).toBe(2);
      expect(rolls[2].value).toBe(2);
      expect(rolls[2].useInTotal).toBe(true);
      expect(rolls[2].modifierFlags).toEqual('');
      expect(rolls[2].modifiers).toEqual(new Set());

      // check the fourth roll
      expect(rolls[3].initialValue).toBe(1);
      expect(rolls[3].calculationValue).toBe(1);
      expect(rolls[3].value).toBe(1);
      expect(rolls[3].useInTotal).toBe(true);
      expect(rolls[3].modifierFlags).toEqual('');
      expect(rolls[3].modifiers).toEqual(new Set());

      // check the fifth roll
      expect(rolls[4].initialValue).toBe(6);
      expect(rolls[4].calculationValue).toBe(3);
      expect(rolls[4].value).toBe(3);
      expect(rolls[4].useInTotal).toBe(true);
      expect(rolls[4].modifierFlags).toEqual('v');
      expect(rolls[4].modifiers).toEqual(new Set(['max']));
    });
  });

  describe('Readonly properties', () => {
    test('cannot change name value', () => {
      expect(() => {
        mod.name = 'Foo';
      }).toThrow(TypeError);
    });
  });
});
