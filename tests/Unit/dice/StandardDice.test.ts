import { StandardDice } from '../../../src/dice';
import { RequiredArgumentError } from '../../../src/exceptions';
import { ExplodeModifier, SortingModifier } from '../../../src/modifiers';
import ComparePoint from '../../../src/ComparePoint';
import RollResult from '../../../src/results/RollResult';
import RollResults from '../../../src/results/RollResults';
import Description from '../../../src/Description';
import { ModelType } from "../../../src/types/Enums/ModelType";
import { DescriptionType } from "../../../src/types/Enums/DescriptionType";

describe('StandardDice', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const die = new StandardDice(6, 4);

      expect(die).toBeInstanceOf(StandardDice);

      expect(die).toHaveProperty('average', 3.5);
      expect(die).toHaveProperty('description', null);
      expect(die).toHaveProperty('max', 6);
      expect(die).toHaveProperty('min', 1);
      expect(die).toHaveProperty('modifiers', new Map());
      expect(die).toHaveProperty('name', 'standard');
      expect(die).toHaveProperty('notation', '4d6');
      expect(die).toHaveProperty('qty', 4);
      expect(die).toHaveProperty('roll', expect.any(Function));
      expect(die).toHaveProperty('rollOnce', expect.any(Function));
      expect(die).toHaveProperty('sides', 6);
      expect(die).toHaveProperty('toJSON', expect.any(Function));
      expect(die).toHaveProperty('toString', expect.any(Function));
    });

    test('constructor requires sides', () => {
      expect(() => {
        // @ts-expect-error testing missing argument
        new StandardDice();
      }).toThrow(RequiredArgumentError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new StandardDice(false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new StandardDice(null);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new StandardDice(undefined);
      }).toThrow(RequiredArgumentError);
    });

    test('can set `min` in constructor', () => {
      const die = new StandardDice(6, 4, null, 3);

      expect(die.min).toBe(3);
    });

    test('can set `max` in constructor', () => {
      const die = new StandardDice(6, 4, null, 1, 8);

      expect(die.max).toBe(8);
    });
  });

  describe('Sides', () => {
    test('must be numeric or string', () => {
      let die = new StandardDice(1);
      expect(die.sides).toBe(1);

      die = new StandardDice('foo');
      expect(die.sides).toBe('foo');

      expect(() => {
        // @ts-expect-error testing invalid value
        new StandardDice({});
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new StandardDice([]);
      }).toThrow(TypeError);
    });

    describe('If numeric...', () => {
      test('must be positive non-zero', () => {
        let die = new StandardDice(45);
        expect(die.sides).toBe(45);

        die = new StandardDice(9);
        expect(die.sides).toBe(9);

        die = new StandardDice(689);
        expect(die.sides).toBe(689);

        expect(() => {
          new StandardDice(0);
        }).toThrow(RangeError);

        expect(() => {
          new StandardDice(-42);
        }).toThrow(RangeError);

        expect(() => {
          new StandardDice(-1);
        }).toThrow(RangeError);
      });

      test('can be float', () => {
        let die = new StandardDice(5.67);
        expect(die.sides).toBeCloseTo(5.67);

        die = new StandardDice(589.138);
        expect(die.sides).toBeCloseTo(589.138);

        die = new StandardDice(13.5);
        expect(die.sides).toBeCloseTo(13.5);
      });

      test('must be finite', () => {
        expect(() => {
          new StandardDice(Infinity);
        }).toThrow(RangeError);
      });

      describe('"Safe" number', () => {
        test('can be equal to `Number.MAX_SAFE_INTEGER`', () => {
          const die = new StandardDice(Number.MAX_SAFE_INTEGER);
          expect(die.sides).toBe(Number.MAX_SAFE_INTEGER);
        });

        test('cannot be greater than `Number.MAX_SAFE_INTEGER`', () => {
          expect(() => {
            new StandardDice(Number.MAX_SAFE_INTEGER + 1);
          }).toThrow(RangeError);
        });
      });
    });
  });

  describe('Quantity', () => {
    test('must be numeric', () => {
      let die = new StandardDice(6, 8);
      expect(die.qty).toBe(8);

      expect(() => {
        // @ts-expect-error testing invalid value
        die = new StandardDice(6, 'foo');
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        die = new StandardDice(6, false);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        die = new StandardDice(6, true);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        die = new StandardDice(6, []);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        die = new StandardDice(6, { qty: 4 });
      }).toThrow(TypeError);
    });

    test('must be positive non-zero', () => {
      let die = new StandardDice(6, 1);
      expect(die.qty).toBe(1);

      die = new StandardDice(6, 324);
      expect(die.qty).toBe(324);

      expect(() => {
        die = new StandardDice(6, 0);
      }).toThrow(RangeError);

      expect(() => {
        die = new StandardDice(6, -42);
      }).toThrow(RangeError);

      expect(() => {
        die = new StandardDice(6, -1);
      }).toThrow(RangeError);
    });

    test('cannot be greater than 999', () => {
      let die = new StandardDice(6, 999);
      expect(die.qty).toBe(999);

      die = new StandardDice(6, 998);
      expect(die.qty).toBe(998);

      expect(() => {
        die = new StandardDice(6, 1000);
      }).toThrow(RangeError);

      expect(() => {
        die = new StandardDice(6, 1001);
      }).toThrow(RangeError);

      expect(() => {
        die = new StandardDice(6, 50000);
      }).toThrow(RangeError);

      expect(() => {
        die = new StandardDice(6, 9999);
      }).toThrow(RangeError);
    });

    test('float values are floored to integer', () => {
      let die = new StandardDice(6, 8.1);
      expect(die.qty).toBe(8);

      die = new StandardDice(6, 5.9);
      expect(die.qty).toBe(5);

      die = new StandardDice(6, 67.5);
      expect(die.qty).toBe(67);
    });

    test('must be finite', () => {
      expect(() => {
        new StandardDice(6, Infinity);
      }).toThrow(TypeError);
    });
  });

  describe('Min', () => {
    test('must be numeric', () => {
      const die = new StandardDice(6, 8, null, 3);
      expect(die.min).toBe(3);

      expect(() => {
        // @ts-expect-error testing invalid value
        new StandardDice(6, 8, null, 'foo');
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new StandardDice(6, 8, null, false);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new StandardDice(6, 8, null, true);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new StandardDice(6, 8, null, []);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new StandardDice(6, 8, null, { min: 4 });
      }).toThrow(TypeError);
    });

    test('float values are floored to integer', () => {
      let die = new StandardDice(6, 4, null, 4.23);
      expect(die.min).toBe(4);

      die = new StandardDice(6, 4, null, -14.78);
      expect(die.min).toBe(-14);

      die = new StandardDice(6, 4, null, 145.5);
      expect(die.min).toBe(145);
    });

    test('must be finite', () => {
      expect(() => {
        new StandardDice(6, 4, null, Infinity);
      }).toThrow(TypeError);
    });

    describe('"Safe" number', () => {
      test('can be equal to `Number.MAX_SAFE_INTEGER`', () => {
        const die = new StandardDice(6, 4, null, Number.MAX_SAFE_INTEGER);
        expect(die.min).toBe(Number.MAX_SAFE_INTEGER);
      });

      test('cannot be greater than `Number.MAX_SAFE_INTEGER`', () => {
        expect(() => {
          new StandardDice(6, 4, null, Number.MAX_SAFE_INTEGER + 1);
        }).toThrow(RangeError);
      });

      test('can be equal to `Number.MIN_SAFE_INTEGER`', () => {
        const die = new StandardDice(6, 4, null, Number.MIN_SAFE_INTEGER);
        expect(die.min).toBe(Number.MIN_SAFE_INTEGER);
      });

      test('cannot be less than `Number.MIN_SAFE_INTEGER`', () => {
        expect(() => {
          new StandardDice(6, 4, null, Number.MIN_SAFE_INTEGER - 1);
        }).toThrow(RangeError);
      });
    });
  });

  describe('Max', () => {
    test('falsey is treated as value of sides', () => {
      // @ts-expect-error testing falsey value
      let die = new StandardDice(6, 4, null, 1, false);
      expect(die.max).toBe(6);

      die = new StandardDice(6, 4, null, 1, null);
      expect(die.max).toBe(6);

      die = new StandardDice(6, 4, null, 1, undefined);
      expect(die.max).toBe(6);
    });

    test('non-numeric throws an error', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        new StandardDice(6, 4, null, 1, 'foo');
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new StandardDice(6, 4, null, 1, []);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new StandardDice(6, 4, null, 1, {});
      }).toThrow(TypeError);
    });

    test('float values are floored to integer', () => {
      let die = new StandardDice(6, 4, null, 1, 65.143);
      expect(die.max).toBe(65);

      die = new StandardDice(6, 4, null, 1, -578.891);
      expect(die.max).toBe(-578);

      die = new StandardDice(6, 4, null, 1, 4.5);
      expect(die.max).toBe(4);
    });

    test('must be finite', () => {
      expect(() => {
        new StandardDice(6, 4, null, 1, Infinity);
      }).toThrow(TypeError);
    });

    describe('"Safe" number', () => {
      test('can be equal to `Number.MAX_SAFE_INTEGER`', () => {
        const die = new StandardDice(6, 4, null, 1, Number.MAX_SAFE_INTEGER);
        expect(die.max).toBe(Number.MAX_SAFE_INTEGER);
      });

      test('cannot be greater than `Number.MAX_SAFE_INTEGER`', () => {
        expect(() => {
          new StandardDice(6, 4, null, 1, Number.MAX_SAFE_INTEGER + 1);
        }).toThrow(RangeError);
      });

      test('can be equal to `Number.MIN_SAFE_INTEGER`', () => {
        const die = new StandardDice(6, 4, null, 1, Number.MIN_SAFE_INTEGER);
        expect(die.max).toBe(Number.MIN_SAFE_INTEGER);
      });

      test('cannot be less than `Number.MIN_SAFE_INTEGER`', () => {
        expect(() => {
          new StandardDice(6, 4, null, 1, Number.MIN_SAFE_INTEGER - 1);
        }).toThrow(RangeError);
      });
    });
  });

  describe('Average', () => {
    test('average is correct for single die', () => {
      let die = new StandardDice(3, 1);
      expect(die.average).toBe(2);

      die = new StandardDice(10, 1);
      expect(die.average).toBe(5.5);

      die = new StandardDice(1, 1);
      expect(die.average).toBe(1);

      die = new StandardDice(20, 1);
      expect(die.average).toBe(10.5);

      die = new StandardDice(45, 1);
      expect(die.average).toBe(23);
    });

    test('average is unaffected when rolling multiple', () => {
      let die = new StandardDice(3, 2);
      expect(die.average).toBe(2);

      die = new StandardDice(10, 400);
      expect(die.average).toBe(5.5);

      die = new StandardDice(1, 56);
      expect(die.average).toBe(1);

      die = new StandardDice(20, 12);
      expect(die.average).toBe(10.5);

      die = new StandardDice(45, 145);
      expect(die.average).toBe(23);
    });
  });

  describe('Modifiers', () => {
    test('setting modifiers in constructor calls setter', () => {
      const spy = jest.spyOn(StandardDice.prototype, 'modifiers', 'set');
      const modifiers = new Map(Object.entries({
        foo: new ExplodeModifier(),
      }));

      new StandardDice(6, 8, modifiers);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(modifiers);

      // remove the spy
      spy.mockRestore();
    });

    test('can set modifiers with Map', () => {
      const modifiers = new Map(Object.entries({
        foo: new ExplodeModifier(),
      }));
      const die = new StandardDice(6, 8);

      die.modifiers = modifiers;

      expect(die.modifiers).toBeInstanceOf(Map);
      expect(die.modifiers).toEqual(modifiers);
    });

    test('can set modifiers with Object', () => {
      const modifier = new ExplodeModifier();
      const die = new StandardDice(6, 8);

      die.modifiers = { foo: modifier };

      expect(die.modifiers).toBeInstanceOf(Map);
      expect(die.modifiers.get('foo')).toEqual(modifier);
    });

    test('can set modifiers with Array', () => {
      const modifiers = [new ExplodeModifier()];
      const die = new StandardDice(6, 8);

      die.modifiers = modifiers;

      expect(die.modifiers).toBeInstanceOf(Map);
      expect(die.modifiers.has('explode')).toBe(true);
      expect(die.modifiers.get('explode')).toEqual(modifiers[0]);
    });

    test('throws error if modifiers type is invalid', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        new StandardDice(6, 8, 'foo');
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new StandardDice(6, 8, 351);
      }).toThrow(TypeError);

      expect(() => {
        const modifiers = new Map(Object.entries({ foo: 'bar' }));
        // @ts-expect-error testing invalid value
        new StandardDice(6, 8, modifiers);
      }).toThrow(TypeError);

      expect(() => {
        const modifiers = { foo: 'bar' };
        // @ts-expect-error testing invalid value
        new StandardDice(6, 8, modifiers);
      }).toThrow(TypeError);

      expect(() => {
        const modifiers = ['bar'];
        // @ts-expect-error testing invalid value
        new StandardDice(6, 8, modifiers);
      }).toThrow(TypeError);
    });

    test('modifiers list always returns in correct order', () => {
      // create modifiers and define their order
      const mod1 = new ExplodeModifier();
      mod1.order = 4;
      const mod2 = new ExplodeModifier();
      mod2.order = 3;
      const mod3 = new ExplodeModifier();
      mod3.order = 1;
      const mod4 = new ExplodeModifier();
      mod4.order = 2;

      // create the dice instance
      const die = new StandardDice(6, 8);

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

  describe('Notation', () => {
    test('simple notation', () => {
      let die = new StandardDice(45, 167);
      expect(die.notation).toEqual('167d45');

      die = new StandardDice(20, 999);
      expect(die.notation).toEqual('999d20');

      die = new StandardDice(1, 10);
      expect(die.notation).toEqual('10d1');
    });

    test('notation with modifiers', () => {
      const modifiers = [
        new SortingModifier(),
        new ExplodeModifier(new ComparePoint('>', 3)),
      ];

      const die = new StandardDice(45, 167, modifiers);

      expect(die.notation).toEqual('167d45!>3sa');
    });
  });

  describe('Description', () => {
    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(StandardDice.prototype, 'description', 'set');
      const description = 'A really cool description';

      new StandardDice(6, 4, null, 1, 6, description);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(description);

      // remove the spy
      spy.mockRestore();
    });

    test('can be changed', () => {
      const die = new StandardDice(45, 167);

      expect(die.description).toBe(null);

      die.description = 'a description';

      expect(die.description).toBeInstanceOf(Description);
      expect(die.description?.text).toEqual('a description');
      expect(die.description?.type).toEqual(DescriptionType.Inline);

      die.description = 'foo';
      expect(die.description).toBeInstanceOf(Description);
      expect(die.description?.text).toEqual('foo');

      die.description = new Description('foo bar', DescriptionType.MultiLine);
      expect(die.description).toBeInstanceOf(Description);
      expect(die.description.text).toEqual('foo bar');
      expect(die.description.type).toEqual(DescriptionType.MultiLine);
    });

    test('setting to falsey get set to `null`', () => {
      const die = new StandardDice(45, 167);

      die.description = undefined;
      expect(die.description).toEqual(null);

      // @ts-expect-error testing falsey value
      die.description = false;
      expect(die.description).toEqual(null);

      die.description = null;
      expect(die.description).toEqual(null);
    });

    test('throws error if type is invalid', () => {
      const die = new StandardDice(4, 8);

      expect(() => {
        // @ts-expect-error testing invalid value
        die.description = 0;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        die.description = 356;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        die.description = 61.34;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        die.description = { foo: 'bar' };
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        die.description = ['bar'];
      }).toThrow(TypeError);
    });
  });

  describe('Output', () => {
    describe('With single-line description', () => {
      test('JSON output is correct', () => {
        const description = 'My awesome description';
        const die = new StandardDice(6, 4);

        die.description = description;

        // json encode, to get the encoded string, then decode so we can compare the object
        // this allows us to check that the output is correct, but ignoring the order of the
        // returned properties
        expect(JSON.parse(JSON.stringify(die))).toEqual({
          average: 3.5,
          description: {
            text: description,
            type: DescriptionType.Inline,
          },
          max: 6,
          min: 1,
          modifiers: {},
          name: 'standard',
          notation: '4d6',
          qty: 4,
          sides: 6,
          type: ModelType.Dice,
        });
      });

      test('String output is correct', () => {
        const description = 'My awesome description';
        const die = new StandardDice(6, 4);

        die.description = description;

        expect(die.toString()).toEqual(`4d6 # ${description}`);
      });
    });

    describe('With multi-line description', () => {
      test('JSON output is correct', () => {
        const description = 'My awesome description';
        const die = new StandardDice(6, 4);

        die.description = new Description(description, DescriptionType.MultiLine);

        // json encode, to get the encoded string, then decode so we can compare the object
        // this allows us to check that the output is correct, but ignoring the order of the
        // returned properties
        expect(JSON.parse(JSON.stringify(die))).toEqual({
          average: 3.5,
          description: {
            text: description,
            type: DescriptionType.MultiLine,
          },
          max: 6,
          min: 1,
          modifiers: {},
          name: 'standard',
          notation: '4d6',
          qty: 4,
          sides: 6,
          type: ModelType.Dice,
        });
      });

      test('String output is correct', () => {
        const description = 'My awesome description';
        const die = new StandardDice(6, 4);

        die.description = new Description(description, DescriptionType.MultiLine);

        expect(die.toString()).toEqual(`4d6 [${description}]`);
      });
    });

    describe('Without description', () => {
      test('JSON output is correct', () => {
        const die = new StandardDice(6, 4);

        // json encode, to get the encoded string, then decode so we can compare the object
        // this allows us to check that the output is correct, but ignoring the order of the
        // returned properties
        expect(JSON.parse(JSON.stringify(die))).toEqual({
          average: 3.5,
          description: null,
          max: 6,
          min: 1,
          modifiers: {},
          name: 'standard',
          notation: '4d6',
          qty: 4,
          sides: 6,
          type: ModelType.Dice,
        });
      });

      test('String output is correct', () => {
        const die = new StandardDice(6, 4);

        expect(die.toString()).toEqual('4d6');
      });
    });
  });

  describe('Rolling', () => {
    test('rollOnce returns a RollResult object', () => {
      expect((new StandardDice(6)).rollOnce()).toBeInstanceOf(RollResult);
    });

    test('rollOnce rolls between min and max (Inclusive)', () => {
      const die = new StandardDice(6);
      const iterations = 1000;

      // run the test multiple times to try and ensure consistency
      for (let i = 0; i < iterations; ++i) {
        const result = die.rollOnce();

        expect(result.value).toBeGreaterThanOrEqual(1);
        expect(result.value).toBeLessThanOrEqual(6);
      }
    });

    test('roll returns a RollResults object', () => {
      expect((new StandardDice(6)).roll()).toBeInstanceOf(RollResults);
    });

    test('rollOnce gets called when rolling', () => {
      // create a spy to listen for the Model.rollOnce method to have been triggered
      const spy = jest.spyOn(StandardDice.prototype, 'rollOnce');
      const die = new StandardDice(6, 4);

      // roll the dice
      die.roll();

      expect(spy).toHaveBeenCalledTimes(4);

      // remove the spy
      spy.mockRestore();
    });

    test('roll returns correct number of rolls', () => {
      const die = new StandardDice(6, 4);

      expect(die.roll()).toHaveLength(4);
    });
  });

  describe('Readonly properties', () => {
    test('cannot change max value', () => {
      const die = new StandardDice(6, 4);

      expect(() => {
        // @ts-expect-error testing invalid value
        die.max = 450;
      }).toThrow(TypeError);
    });

    test('cannot change min value', () => {
      const die = new StandardDice(6, 4);

      expect(() => {
        // @ts-expect-error testing invalid value
        die.min = 450;
      }).toThrow(TypeError);
    });

    test('cannot change notation value', () => {
      const die = new StandardDice(6, 4);

      expect(() => {
        // @ts-expect-error testing invalid value
        die.notation = '6d4';
      }).toThrow(TypeError);
    });

    test('cannot change qty value', () => {
      const die = new StandardDice(6, 4);

      expect(() => {
        // @ts-expect-error testing invalid value
        die.qty = 6;
      }).toThrow(TypeError);
    });

    test('cannot change sides value', () => {
      const die = new StandardDice(6, 4);

      expect(() => {
        // @ts-expect-error testing invalid value
        die.sides = 2;
      }).toThrow(TypeError);
    });
  });
});
