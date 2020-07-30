import KeepModifier from '../../src/modifiers/KeepModifier';
import Modifier from '../../src/modifiers/Modifier';
import RollResults from '../../src/results/RollResults';
import StandardDice from '../../src/dice/StandardDice';
import RequiredArgumentError from '../../src/exceptions/RequiredArgumentError';

describe('KeepModifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const mod = new KeepModifier('kh', 'h');

      expect(mod).toBeInstanceOf(KeepModifier);
      expect(mod).toBeInstanceOf(Modifier);
      expect(mod).toEqual(expect.objectContaining({
        end: 'h',
        name: 'keep-h',
        notation: 'kh',
        run: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
        qty: 1,
      }));
    });

    test('constructor requires notation', () => {
      expect(() => {
        new KeepModifier();
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new KeepModifier(false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new KeepModifier(null);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new KeepModifier(undefined);
      }).toThrow(RequiredArgumentError);
    });

    test('constructor requires end', () => {
      expect(() => {
        new KeepModifier('kh');
      }).toThrow(RangeError);

      expect(() => {
        new KeepModifier('kh', false);
      }).toThrow(RangeError);

      expect(() => {
        new KeepModifier('kh', null);
      }).toThrow(RangeError);

      expect(() => {
        new KeepModifier('kh', undefined);
      }).toThrow(RangeError);
    });
  });

  describe('End', () => {
    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(KeepModifier.prototype, 'end', 'set');

      // create the ComparisonModifier
      new KeepModifier('kh', 'h');

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('can be changed', () => {
      const mod = new KeepModifier('kh', 'l');

      expect(mod.end).toEqual('l');

      mod.end = 'h';
      expect(mod.end).toEqual('h');

      mod.end = 'l';
      expect(mod.end).toEqual('l');
    });

    test('must be "h" or "l"', () => {
      const mod = new KeepModifier('kh', 'h');

      expect(() => {
        mod.end = 0;
      }).toThrow(RangeError);

      expect(() => {
        mod.end = 1;
      }).toThrow(RangeError);

      expect(() => {
        mod.end = 'foo';
      }).toThrow(RangeError);

      expect(() => {
        mod.end = ['h'];
      }).toThrow(RangeError);

      expect(() => {
        mod.end = { end: 'h' };
      }).toThrow(RangeError);
    });
  });

  describe('Quantity', () => {
    test('qty must be numeric', () => {
      const mod = new KeepModifier('kh', 'h', 8);
      expect(mod.qty).toBe(8);

      expect(() => {
        mod.qty = 'foo';
      }).toThrow(TypeError);

      expect(() => {
        mod.qty = false;
      }).toThrow(TypeError);

      expect(() => {
        mod.qty = true;
      }).toThrow(TypeError);

      expect(() => {
        mod.qty = [];
      }).toThrow(TypeError);

      expect(() => {
        mod.qty = { qty: 4 };
      }).toThrow(TypeError);
    });

    test('qty must be positive non-zero', () => {
      let mod = new KeepModifier('kh', 'h', 1);
      expect(mod.qty).toBe(1);

      mod = new KeepModifier('kh', 'h', 324);
      expect(mod.qty).toBe(324);

      expect(() => {
        mod.qty = 0;
      }).toThrow(TypeError);

      expect(() => {
        mod.qty = -42;
      }).toThrow(TypeError);

      expect(() => {
        mod.qty = -1;
      }).toThrow(TypeError);
    });

    test('float gets floored to integer', () => {
      let mod = new KeepModifier('kh', 'h', 5.145);
      expect(mod.qty).toBeCloseTo(5);

      mod = new KeepModifier('kh', 'h', 12.7);
      expect(mod.qty).toBeCloseTo(12);

      mod = new KeepModifier('kh', 'h', 50.5);
      expect(mod.qty).toBeCloseTo(50);
    });

    test('must be finite', () => {
      expect(() => {
        new KeepModifier('kh', 'h', Infinity);
      }).toThrow(RangeError);
    });

    test('can be very large number', () => {
      const mod = new KeepModifier('kh', 'h', 99 ** 99);
      expect(mod.qty).toBe(99 ** 99);
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const mod = new KeepModifier('kl4', 'l', 4);

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        end: 'l',
        name: 'keep-l',
        notation: 'kl4',
        qty: 4,
        type: 'modifier',
      });
    });

    test('toString output is correct', () => {
      const mod = new KeepModifier('kh4', 'h', 4);

      expect(mod.toString()).toEqual('kh4');
    });
  });

  describe('Run', () => {
    let mod;
    let die;
    let results;

    beforeEach(() => {
      results = new RollResults([
        8, 4, 2, 1, 6,
      ]);
      die = new StandardDice('5d10', 10, 5);
      mod = new KeepModifier('kh', 'h');
    });

    test('returns RollResults object', () => {
      expect(mod.run(results, die)).toBe(results);
    });

    test('can keep results from high end', () => {
      expect(mod.run(results, die).rolls).toEqual([
        expect.objectContaining({
          calculationValue: 8,
          initialValue: 8,
          modifierFlags: '',
          modifiers: new Set(),
          useInTotal: true,
          value: 8,
        }),
        expect.objectContaining({
          calculationValue: 4,
          initialValue: 4,
          modifierFlags: 'd',
          modifiers: new Set(['drop']),
          useInTotal: false,
          value: 4,
        }),
        expect.objectContaining({
          calculationValue: 2,
          initialValue: 2,
          modifierFlags: 'd',
          modifiers: new Set(['drop']),
          useInTotal: false,
          value: 2,
        }),
        expect.objectContaining({
          calculationValue: 1,
          initialValue: 1,
          modifierFlags: 'd',
          modifiers: new Set(['drop']),
          useInTotal: false,
          value: 1,
        }),
        expect.objectContaining({
          calculationValue: 6,
          initialValue: 6,
          modifierFlags: 'd',
          modifiers: new Set(['drop']),
          useInTotal: false,
          value: 6,
        }),
      ]);
    });

    test('can keep multiple results from high end', () => {
      // set the qty
      mod.qty = 3;

      expect(mod.run(results, die).rolls).toEqual([
        expect.objectContaining({
          calculationValue: 8,
          initialValue: 8,
          modifierFlags: '',
          modifiers: new Set(),
          useInTotal: true,
          value: 8,
        }),
        expect.objectContaining({
          calculationValue: 4,
          initialValue: 4,
          modifierFlags: '',
          modifiers: new Set(),
          useInTotal: true,
          value: 4,
        }),
        expect.objectContaining({
          calculationValue: 2,
          initialValue: 2,
          modifierFlags: 'd',
          modifiers: new Set(['drop']),
          useInTotal: false,
          value: 2,
        }),
        expect.objectContaining({
          calculationValue: 1,
          initialValue: 1,
          modifierFlags: 'd',
          modifiers: new Set(['drop']),
          useInTotal: false,
          value: 1,
        }),
        expect.objectContaining({
          calculationValue: 6,
          initialValue: 6,
          modifierFlags: '',
          modifiers: new Set(),
          useInTotal: true,
          value: 6,
        }),
      ]);
    });

    test('can keep results from low end', () => {
      // set the end to high
      mod.end = 'l';

      expect(mod.run(results, die).rolls).toEqual([
        expect.objectContaining({
          calculationValue: 8,
          initialValue: 8,
          modifierFlags: 'd',
          modifiers: new Set(['drop']),
          useInTotal: false,
          value: 8,
        }),
        expect.objectContaining({
          calculationValue: 4,
          initialValue: 4,
          modifierFlags: 'd',
          modifiers: new Set(['drop']),
          useInTotal: false,
          value: 4,
        }),
        expect.objectContaining({
          calculationValue: 2,
          initialValue: 2,
          modifierFlags: 'd',
          modifiers: new Set(['drop']),
          useInTotal: false,
          value: 2,
        }),
        expect.objectContaining({
          calculationValue: 1,
          initialValue: 1,
          modifierFlags: '',
          modifiers: new Set(),
          useInTotal: true,
          value: 1,
        }),
        expect.objectContaining({
          calculationValue: 6,
          initialValue: 6,
          modifierFlags: 'd',
          modifiers: new Set(['drop']),
          useInTotal: false,
          value: 6,
        }),
      ]);
    });

    test('can keep multiple results from low end', () => {
      // set the end to high
      mod.end = 'l';
      // set the qty
      mod.qty = 3;

      expect(mod.run(results, die).rolls).toEqual([
        expect.objectContaining({
          calculationValue: 8,
          initialValue: 8,
          modifierFlags: 'd',
          modifiers: new Set(['drop']),
          useInTotal: false,
          value: 8,
        }),
        expect.objectContaining({
          calculationValue: 4,
          initialValue: 4,
          modifierFlags: '',
          modifiers: new Set(),
          useInTotal: true,
          value: 4,
        }),
        expect.objectContaining({
          calculationValue: 2,
          initialValue: 2,
          modifierFlags: '',
          modifiers: new Set(),
          useInTotal: true,
          value: 2,
        }),
        expect.objectContaining({
          calculationValue: 1,
          initialValue: 1,
          modifierFlags: '',
          modifiers: new Set(),
          useInTotal: true,
          value: 1,
        }),
        expect.objectContaining({
          calculationValue: 6,
          initialValue: 6,
          modifierFlags: 'd',
          modifiers: new Set(['drop']),
          useInTotal: false,
          value: 6,
        }),
      ]);
    });

    test('keeping more than rolled keeps everything', () => {
      // set the qty
      mod.qty = 20;

      expect(mod.run(results, die).rolls).toEqual([
        expect.objectContaining({
          calculationValue: 8,
          initialValue: 8,
          modifierFlags: '',
          modifiers: new Set(),
          useInTotal: true,
          value: 8,
        }),
        expect.objectContaining({
          calculationValue: 4,
          initialValue: 4,
          modifierFlags: '',
          modifiers: new Set(),
          useInTotal: true,
          value: 4,
        }),
        expect.objectContaining({
          calculationValue: 2,
          initialValue: 2,
          modifierFlags: '',
          modifiers: new Set(),
          useInTotal: true,
          value: 2,
        }),
        expect.objectContaining({
          calculationValue: 1,
          initialValue: 1,
          modifierFlags: '',
          modifiers: new Set(),
          useInTotal: true,
          value: 1,
        }),
        expect.objectContaining({
          calculationValue: 6,
          initialValue: 6,
          modifierFlags: '',
          modifiers: new Set(),
          useInTotal: true,
          value: 6,
        }),
      ]);
    });
  });

  describe('Readonly properties', () => {
    test('cannot change name value', () => {
      const mod = new KeepModifier('dl4', 'l');

      expect(() => {
        mod.name = 'Foo';
      }).toThrow(TypeError);
    });
  });
});
