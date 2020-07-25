import SortingModifier from '../../src/modifiers/SortingModifier';
import Modifier from '../../src/modifiers/Modifier';
import RollResults from '../../src/results/RollResults';
import StandardDice from '../../src/dice/StandardDice';
import RequiredArgumentError from '../../src/exceptions/RequiredArgumentErrorError';

describe('SortingModifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const mod = new SortingModifier('s');

      expect(mod).toBeInstanceOf(SortingModifier);
      expect(mod).toBeInstanceOf(Modifier);
      expect(mod).toEqual(expect.objectContaining({
        direction: 'a',
        name: 'sorting',
        notation: 's',
        run: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });

    test('constructor requires notation', () => {
      expect(() => {
        new SortingModifier();
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new SortingModifier(false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new SortingModifier(null);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new SortingModifier(undefined);
      }).toThrow(RequiredArgumentError);
    });
  });

  describe('Direction', () => {
    test('gets set in constructor', () => {
      const mod = new SortingModifier('sd', 'd');

      expect(mod.direction).toEqual('d');
    });

    test('can be changed', () => {
      const mod = new SortingModifier('sa', 'a');

      expect(mod.direction).toEqual('a');

      mod.direction = 'd';

      expect(mod.direction).toEqual('d');
    });

    test('throws error if not set to `a` | `b`', () => {
      const mod = new SortingModifier('s');

      expect(() => {
        mod.direction = 'foo';
      }).toThrow(RangeError);

      expect(() => {
        mod.direction = '';
      }).toThrow(RangeError);

      expect(() => {
        mod.direction = ['a'];
      }).toThrow(RangeError);

      expect(() => {
        mod.direction = { direction: 'a' };
      }).toThrow(RangeError);

      expect(() => {
        mod.direction = true;
      }).toThrow(RangeError);

      expect(() => {
        mod.direction = false;
      }).toThrow(RangeError);

      expect(() => {
        mod.direction = 1;
      }).toThrow(RangeError);

      expect(() => {
        mod.direction = 0;
      }).toThrow(RangeError);
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const mod = new SortingModifier('sd', 'd');

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        direction: 'd',
        name: 'sorting',
        notation: 'sd',
        type: 'modifier',
      });
    });

    test('toString output is correct', () => {
      const mod = new SortingModifier('sa');

      expect(mod.toString()).toEqual('sa');
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
      mod = new SortingModifier('a');
    });

    test('returns RollResults object', () => {
      expect(mod.run(results, die)).toBe(results);
    });

    test('sorts rolls ascending', () => {
      expect(mod.run(results, die).rolls).toEqual([
        expect.objectContaining({
          initialValue: 1,
          modifierFlags: '',
          modifiers: new Set(),
          value: 1,
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
          initialValue: 6,
          modifierFlags: '',
          modifiers: new Set(),
          value: 6,
        }),
        expect.objectContaining({
          initialValue: 8,
          modifierFlags: '',
          modifiers: new Set(),
          value: 8,
        }),
        expect.objectContaining({
          initialValue: 10,
          modifierFlags: '',
          modifiers: new Set(),
          value: 10,
        }),
      ]);
    });

    test('sorts rolls descending', () => {
      mod.direction = 'd';

      expect(mod.run(results, die).rolls).toEqual([
        expect.objectContaining({
          initialValue: 10,
          modifierFlags: '',
          modifiers: new Set(),
          value: 10,
        }),
        expect.objectContaining({
          initialValue: 8,
          modifierFlags: '',
          modifiers: new Set(),
          value: 8,
        }),
        expect.objectContaining({
          initialValue: 6,
          modifierFlags: '',
          modifiers: new Set(),
          value: 6,
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
      ]);
    });
  });
});
