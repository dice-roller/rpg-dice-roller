import PercentileDice from '../../src/dice/PercentileDice';
import StandardDice from '../../src/dice/StandardDice';
import RollResult from '../../src/results/RollResult';
import RollResults from '../../src/results/RollResults';
import Modifier from '../../src/modifiers/Modifier';
import RequiredArgumentError from '../../src/exceptions/RequiredArgumentErrorError';

describe('PercentileDice', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const die = new PercentileDice('4d%', 4);

      // assert that the die is a PercentileDie and that it extends StandardDice
      expect(die).toBeInstanceOf(PercentileDice);
      expect(die).toBeInstanceOf(StandardDice);
      expect(die).toEqual(expect.objectContaining({
        notation: '4d%',
        sides: '%',
        qty: 4,
        modifiers: null,
        max: 100,
        min: 1,
        name: 'PercentileDice',
        roll: expect.any(Function),
        rollOnce: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });

    test('constructor requires notation', () => {
      expect(() => {
        new PercentileDice();
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new PercentileDice(false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new PercentileDice(null);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new PercentileDice(undefined);
      }).toThrow(RequiredArgumentError);
    });
  });

  describe('Quantity', () => {
    test('qty must be numeric', () => {
      let die = new PercentileDice('4d%', 8);
      expect(die.qty).toBe(8);

      expect(() => {
        die = new PercentileDice('4d%', 'foo');
      }).toThrow(TypeError);

      expect(() => {
        die = new PercentileDice('4d%', false);
      }).toThrow(TypeError);

      expect(() => {
        die = new PercentileDice('4d%', true);
      }).toThrow(TypeError);

      expect(() => {
        die = new PercentileDice('4d%', []);
      }).toThrow(TypeError);

      expect(() => {
        die = new PercentileDice('4d%', { qty: 4 });
      }).toThrow(TypeError);
    });

    test('qty must be positive non-zero', () => {
      let die = new PercentileDice('4d%', 1);
      expect(die.qty).toBe(1);

      die = new PercentileDice('4d%', 324);
      expect(die.qty).toBe(324);

      expect(() => {
        die = new PercentileDice('4d%', 0);
      }).toThrow(TypeError);

      expect(() => {
        die = new PercentileDice('4d%', -42);
      }).toThrow(TypeError);

      expect(() => {
        die = new PercentileDice('4d%', -1);
      }).toThrow(TypeError);
    });
  });

  describe('Modifiers', () => {
    test('setting modifiers in constructor calls setter', () => {
      const spy = jest.spyOn(PercentileDice.prototype, 'modifiers', 'set');
      const modifiers = new Map(Object.entries({ foo: new Modifier('m') }));

      new PercentileDice('4d%', 1, modifiers);

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('can set modifiers with Map', () => {
      const modifiers = new Map(Object.entries({ foo: new Modifier('m') }));
      const die = new PercentileDice('4d%', 1);

      die.modifiers = modifiers;

      expect(die.modifiers).toBeInstanceOf(Map);
      expect(die.modifiers).toEqual(modifiers);
    });

    test('can set modifiers with Object', () => {
      const modifier = new Modifier('m');
      const die = new PercentileDice('4d%', 1);

      die.modifiers = { foo: modifier };

      expect(die.modifiers).toBeInstanceOf(Map);
      expect(die.modifiers.get('foo')).toEqual(modifier);
    });

    test('can set modifiers with Array', () => {
      const modifiers = [new Modifier('m')];
      const die = new PercentileDice('4d%', 1);

      die.modifiers = modifiers;

      expect(die.modifiers).toBeInstanceOf(Map);
      expect(die.modifiers.get('Modifier')).toEqual(modifiers[0]);
    });

    test('throws error if modifiers type is invalid', () => {
      expect(() => {
        new PercentileDice('4d%', 1, 'foo');
      }).toThrow(TypeError);

      expect(() => {
        new PercentileDice('4d%', 1, 351);
      }).toThrow(TypeError);

      expect(() => {
        const modifiers = new Map(Object.entries({ foo: 'bar' }));
        new PercentileDice('4d%', 1, modifiers);
      }).toThrow(TypeError);

      expect(() => {
        const modifiers = { foo: 'bar' };
        new PercentileDice('4d%', 1, modifiers);
      }).toThrow(TypeError);

      expect(() => {
        const modifiers = ['bar'];
        new PercentileDice('4d%', 1, modifiers);
      }).toThrow(TypeError);
    });

    test('modifiers list always returns in correct order', () => {
      // create modifiers and define their order
      const mod1 = new Modifier('m1');
      mod1.order = 4;
      const mod2 = new Modifier('m2');
      mod2.order = 3;
      const mod3 = new Modifier('m3');
      mod3.order = 1;
      const mod4 = new Modifier('m4');
      mod4.order = 2;

      // create the dice instance
      const die = new PercentileDice('4d%', 1);

      die.modifiers = {
        mod1, mod2, mod3, mod4,
      };

      // get the modifier keys
      const modKeys = [...die.modifiers.keys()];
      // check that the order matches the defined modifier orders
      expect(modKeys[0]).toEqual('mod3');
      expect(modKeys[1]).toEqual('mod4');
      expect(modKeys[2]).toEqual('mod2');
      expect(modKeys[3]).toEqual('mod1');
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const die = new PercentileDice('4d%', 4);

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(die))).toEqual({
        max: 100,
        min: 1,
        modifiers: null,
        name: 'PercentileDice',
        notation: '4d%',
        qty: 4,
        sides: '%',
        type: 'die',
      });
    });

    test('String output is correct', () => {
      const die = new PercentileDice('4d%', 4);

      expect(die.toString()).toEqual('4d%');
    });
  });

  describe('Rolling', () => {
    test('rollOnce returns a RollResult object', () => {
      expect((new PercentileDice('1d%', 1)).rollOnce()).toBeInstanceOf(RollResult);
    });

    test('rollOnce rolls between min and max (Inclusive)', () => {
      const die = new PercentileDice('1d%', 1);
      const iterations = 1000;

      // run the test multiple times to try and ensure consistency
      for (let i = 0; i < iterations; ++i) {
        const result = die.rollOnce();

        expect(result.value).toBeGreaterThanOrEqual(1);
        expect(result.value).toBeLessThanOrEqual(100);
      }
    });

    test('roll return a RollResults object', () => {
      expect((new PercentileDice('1d%', 1)).roll()).toBeInstanceOf(RollResults);
    });

    test('rollOnce gets called when rolling', () => {
      // create a spy to listen for the Model.rollOnce method to have been triggered
      const spy = jest.spyOn(PercentileDice.prototype, 'rollOnce');
      const die = new PercentileDice('4d%', 4);

      // roll the dice
      die.roll();

      expect(spy).toHaveBeenCalledTimes(4);

      // remove the spy
      spy.mockRestore();
    });

    test('roll returns correct number of rolls', () => {
      const die = new PercentileDice('4d%', 4);

      expect(die.roll()).toHaveLength(4);
    });
  });

  describe('Readonly properties', () => {
    test('cannot change max value', () => {
      const die = new PercentileDice('4d%', 4);

      expect(() => {
        die.max = 450;
      }).toThrow(TypeError);
    });

    test('cannot change min value', () => {
      const die = new PercentileDice('4d%', 4);

      expect(() => {
        die.min = 450;
      }).toThrow(TypeError);
    });

    test('cannot change name value', () => {
      const die = new PercentileDice('4d%', 4);

      expect(() => {
        die.name = 'Foo';
      }).toThrow(TypeError);
    });

    test('cannot change notation value', () => {
      const die = new PercentileDice('4d%', 4);

      expect(() => {
        die.notation = '6d4';
      }).toThrow(TypeError);
    });

    test('cannot change qty value', () => {
      const die = new PercentileDice('4d%', 4);

      expect(() => {
        die.qty = 6;
      }).toThrow(TypeError);
    });

    test('cannot change sides value', () => {
      const die = new PercentileDice('4d%', 4);

      expect(() => {
        die.sides = 2;
      }).toThrow(TypeError);
    });
  });
});
