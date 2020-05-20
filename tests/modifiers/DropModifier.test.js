import DropModifier from '../../src/modifiers/DropModifier';
import Modifier from '../../src/modifiers/Modifier';
import RollResults from '../../src/results/RollResults';
import StandardDice from '../../src/dice/StandardDice';
import RequiredArgumentError from '../../src/exceptions/RequiredArgumentErrorError';

describe('DropModifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const mod = new DropModifier('d1', 'l');

      expect(mod).toBeInstanceOf(DropModifier);
      expect(mod).toBeInstanceOf(Modifier);
      expect(mod).toEqual(expect.objectContaining({
        end: 'l',
        name: 'DropModifier-l',
        notation: 'd1',
        run: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
        qty: 1,
      }));
    });

    test('constructor requires notation', () => {
      expect(() => {
        new DropModifier();
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new DropModifier(false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new DropModifier(null);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new DropModifier(undefined);
      }).toThrow(RequiredArgumentError);
    });

    test('constructor requires end', () => {
      expect(() => {
        new DropModifier('d1');
      }).toThrow(RangeError);

      expect(() => {
        new DropModifier('d1', false);
      }).toThrow(RangeError);

      expect(() => {
        new DropModifier('d1', null);
      }).toThrow(RangeError);

      expect(() => {
        new DropModifier('d1', undefined);
      }).toThrow(RangeError);
    });
  });

  describe('End', () => {
    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(DropModifier.prototype, 'end', 'set');

      // create the ComparisonModifier
      new DropModifier('d1', 'l');

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('can be changed', () => {
      const mod = new DropModifier('dh', 'h');

      expect(mod.end).toEqual('h');

      mod.end = 'l';
      expect(mod.end).toEqual('l');

      mod.end = 'h';
      expect(mod.end).toEqual('h');
    });

    test('must be "h" or "l"', () => {
      const mod = new DropModifier('d1', 'l');

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
        mod.end = ['l'];
      }).toThrow(RangeError);

      expect(() => {
        mod.end = { end: 'l' };
      }).toThrow(RangeError);
    });
  });

  describe('Quantity', () => {
    test('qty must be numeric', () => {
      const mod = new DropModifier('dl', 'l', 8);
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
      let mod = new DropModifier('dl', 'l', 1);
      expect(mod.qty).toBe(1);

      mod = new DropModifier('dl', 'l', 324);
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
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const mod = new DropModifier('dh4', 'h', 4);

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        end: 'h',
        name: 'DropModifier-h',
        notation: 'dh4',
        qty: 4,
        type: 'modifier',
      });
    });

    test('toString output is correct', () => {
      const mod = new DropModifier('dl4', 'l', 4);

      expect(mod.toString()).toEqual('dl4');
    });
  });

  describe('Run', () => {
    let mod; let die; let
      results;

    beforeEach(() => {
      results = new RollResults([
        8, 4, 2, 1, 6,
      ]);
      die = new StandardDice('5d10', 10, 5);
      mod = new DropModifier('dl', 'l');
    });

    test('returns RollResults object', () => {
      expect(mod.run(results, die)).toBe(results);
    });

    test('can drop results from low end', () => {
      expect(mod.run(results, die).rolls).toEqual([
        expect.objectContaining({
          calculationValue: 8,
          initialValue: 8,
          modifierFlags: '',
          modifiers: [],
          useInTotal: true,
          value: 8,
        }),
        expect.objectContaining({
          calculationValue: 4,
          initialValue: 4,
          modifierFlags: '',
          modifiers: [],
          useInTotal: true,
          value: 4,
        }),
        expect.objectContaining({
          calculationValue: 2,
          initialValue: 2,
          modifierFlags: '',
          modifiers: [],
          useInTotal: true,
          value: 2,
        }),
        expect.objectContaining({
          calculationValue: 1,
          initialValue: 1,
          modifierFlags: 'd',
          modifiers: ['drop'],
          useInTotal: false,
          value: 1,
        }),
        expect.objectContaining({
          calculationValue: 6,
          initialValue: 6,
          modifierFlags: '',
          modifiers: [],
          useInTotal: true,
          value: 6,
        }),
      ]);
    });

    test('can drop multiple results from low end', () => {
      // set the qty
      mod.qty = 3;

      expect(mod.run(results, die).rolls).toEqual([
        expect.objectContaining({
          calculationValue: 8,
          initialValue: 8,
          modifierFlags: '',
          modifiers: [],
          useInTotal: true,
          value: 8,
        }),
        expect.objectContaining({
          calculationValue: 4,
          initialValue: 4,
          modifierFlags: 'd',
          modifiers: ['drop'],
          useInTotal: false,
          value: 4,
        }),
        expect.objectContaining({
          calculationValue: 2,
          initialValue: 2,
          modifierFlags: 'd',
          modifiers: ['drop'],
          useInTotal: false,
          value: 2,
        }),
        expect.objectContaining({
          calculationValue: 1,
          initialValue: 1,
          modifierFlags: 'd',
          modifiers: ['drop'],
          useInTotal: false,
          value: 1,
        }),
        expect.objectContaining({
          calculationValue: 6,
          initialValue: 6,
          modifierFlags: '',
          modifiers: [],
          useInTotal: true,
          value: 6,
        }),
      ]);
    });

    test('can drop results from high end', () => {
      // set the end to high
      mod.end = 'h';

      expect(mod.run(results, die).rolls).toEqual([
        expect.objectContaining({
          calculationValue: 8,
          initialValue: 8,
          modifierFlags: 'd',
          modifiers: ['drop'],
          useInTotal: false,
          value: 8,
        }),
        expect.objectContaining({
          calculationValue: 4,
          initialValue: 4,
          modifierFlags: '',
          modifiers: [],
          useInTotal: true,
          value: 4,
        }),
        expect.objectContaining({
          calculationValue: 2,
          initialValue: 2,
          modifierFlags: '',
          modifiers: [],
          useInTotal: true,
          value: 2,
        }),
        expect.objectContaining({
          calculationValue: 1,
          initialValue: 1,
          modifierFlags: '',
          modifiers: [],
          useInTotal: true,
          value: 1,
        }),
        expect.objectContaining({
          calculationValue: 6,
          initialValue: 6,
          modifierFlags: '',
          modifiers: [],
          useInTotal: true,
          value: 6,
        }),
      ]);
    });

    test('can drop multiple results from high end', () => {
      // set the end to high
      mod.end = 'h';

      // set the qty
      mod.qty = 3;

      expect(mod.run(results, die).rolls).toEqual([
        expect.objectContaining({
          calculationValue: 8,
          initialValue: 8,
          modifierFlags: 'd',
          modifiers: ['drop'],
          useInTotal: false,
          value: 8,
        }),
        expect.objectContaining({
          calculationValue: 4,
          initialValue: 4,
          modifierFlags: 'd',
          modifiers: ['drop'],
          useInTotal: false,
          value: 4,
        }),
        expect.objectContaining({
          calculationValue: 2,
          initialValue: 2,
          modifierFlags: '',
          modifiers: [],
          useInTotal: true,
          value: 2,
        }),
        expect.objectContaining({
          calculationValue: 1,
          initialValue: 1,
          modifierFlags: '',
          modifiers: [],
          useInTotal: true,
          value: 1,
        }),
        expect.objectContaining({
          calculationValue: 6,
          initialValue: 6,
          modifierFlags: 'd',
          modifiers: ['drop'],
          useInTotal: false,
          value: 6,
        }),
      ]);
    });

    test('dropping more than rolled drops everything', () => {
      // set the qty
      mod.qty = 20;

      expect(mod.run(results, die).rolls).toEqual([
        expect.objectContaining({
          calculationValue: 8,
          initialValue: 8,
          modifierFlags: 'd',
          modifiers: ['drop'],
          useInTotal: false,
          value: 8,
        }),
        expect.objectContaining({
          calculationValue: 4,
          initialValue: 4,
          modifierFlags: 'd',
          modifiers: ['drop'],
          useInTotal: false,
          value: 4,
        }),
        expect.objectContaining({
          calculationValue: 2,
          initialValue: 2,
          modifierFlags: 'd',
          modifiers: ['drop'],
          useInTotal: false,
          value: 2,
        }),
        expect.objectContaining({
          calculationValue: 1,
          initialValue: 1,
          modifierFlags: 'd',
          modifiers: ['drop'],
          useInTotal: false,
          value: 1,
        }),
        expect.objectContaining({
          calculationValue: 6,
          initialValue: 6,
          modifierFlags: 'd',
          modifiers: ['drop'],
          useInTotal: false,
          value: 6,
        }),
      ]);
    });
  });

  describe('Readonly properties', () => {
    test('cannot change name value', () => {
      const mod = new DropModifier('dl4', 'l');

      expect(() => {
        mod.name = 'Foo';
      }).toThrow(TypeError);
    });
  });
});
