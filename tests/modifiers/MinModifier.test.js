import { MinModifier, Modifier } from '../../src/modifiers';
import { StandardDice } from '../../src/dice';
import RollResults from '../../src/results/RollResults';

describe('MinModifier', () => {
  let mod;

  beforeEach(() => {
    mod = new MinModifier(3);
  });

  describe('Initialisation', () => {
    test('model structure', () => {
      expect(mod).toBeInstanceOf(MinModifier);
      expect(mod).toBeInstanceOf(Modifier);

      expect(mod).toEqual(expect.objectContaining({
        min: 3,
        name: 'min',
        notation: 'min3',
        run: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });

    test('constructor requires min', () => {
      expect(() => {
        new MinModifier();
      }).toThrow(TypeError);

      expect(() => {
        new MinModifier(false);
      }).toThrow(TypeError);

      expect(() => {
        new MinModifier(null);
      }).toThrow(TypeError);

      expect(() => {
        new MinModifier(undefined);
      }).toThrow(TypeError);
    });
  });

  describe('Min', () => {
    test('can be changed', () => {
      expect(mod.min).toBe(3);
      expect(mod.notation).toBe('min3');

      mod.min = 1;
      expect(mod.min).toBe(1);
      expect(mod.notation).toBe('min1');

      mod.min = 23;
      expect(mod.min).toBe(23);
      expect(mod.notation).toBe('min23');
    });

    test('must be numeric', () => {
      expect(() => {
        mod.min = 'foo';
      }).toThrow(TypeError);

      expect(() => {
        mod.min = [];
      }).toThrow(TypeError);

      expect(() => {
        mod.min = { min: 3 };
      }).toThrow(TypeError);
    });

    test('can be float', () => {
      mod.min = 4.5;
      expect(mod.min).toBeCloseTo(4.5);
      expect(mod.notation).toBe('min4.5');

      mod.min = 300.6579;
      expect(mod.min).toBeCloseTo(300.6579);
      expect(mod.notation).toBe('min300.6579');
    });

    test('can be negative', () => {
      mod.min = -10;
      expect(mod.min).toBe(-10);
      expect(mod.notation).toBe('min-10');

      mod.min = -46.2;
      expect(mod.min).toBeCloseTo(-46.2);
      expect(mod.notation).toBe('min-46.2');
    });
  });

  describe('Notation', () => {
    test('simple notation', () => {
      mod = new MinModifier(35);
      expect(mod.notation).toEqual('min35');

      mod = new MinModifier(90876684);
      expect(mod.notation).toEqual('min90876684');

      mod = new MinModifier(7986);
      expect(mod.notation).toEqual('min7986');

      mod = new MinModifier(2);
      expect(mod.notation).toEqual('min2');
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        min: 3,
        name: 'min',
        notation: 'min3',
        type: 'modifier',
      });
    });

    test('toString output is correct', () => {
      expect(mod.toString()).toEqual('min3');
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

    test('rolls lower than min are changed to min', () => {
      const { rolls } = mod.run(results, die);

      expect(rolls.length).toBe(5);

      // check the first roll
      expect(rolls[0].initialValue).toBe(1);
      expect(rolls[0].calculationValue).toBe(3);
      expect(rolls[0].value).toBe(3);
      expect(rolls[0].useInTotal).toBe(true);
      expect(rolls[0].modifierFlags).toEqual('^');
      expect(rolls[0].modifiers).toEqual(new Set(['min']));

      // check the second roll
      expect(rolls[1].initialValue).toBe(4);
      expect(rolls[1].calculationValue).toBe(4);
      expect(rolls[1].value).toBe(4);
      expect(rolls[1].useInTotal).toBe(true);
      expect(rolls[1].modifierFlags).toEqual('');
      expect(rolls[1].modifiers).toEqual(new Set());

      // check the third roll
      expect(rolls[2].initialValue).toBe(2);
      expect(rolls[2].calculationValue).toBe(3);
      expect(rolls[2].value).toBe(3);
      expect(rolls[2].useInTotal).toBe(true);
      expect(rolls[2].modifierFlags).toEqual('^');
      expect(rolls[2].modifiers).toEqual(new Set(['min']));

      // check the fourth roll
      expect(rolls[3].initialValue).toBe(1);
      expect(rolls[3].calculationValue).toBe(3);
      expect(rolls[3].value).toBe(3);
      expect(rolls[3].useInTotal).toBe(true);
      expect(rolls[3].modifierFlags).toEqual('^');
      expect(rolls[3].modifiers).toEqual(new Set(['min']));

      // check the fifth roll
      expect(rolls[4].initialValue).toBe(6);
      expect(rolls[4].calculationValue).toBe(6);
      expect(rolls[4].value).toBe(6);
      expect(rolls[4].useInTotal).toBe(true);
      expect(rolls[4].modifierFlags).toEqual('');
      expect(rolls[4].modifiers).toEqual(new Set());
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
