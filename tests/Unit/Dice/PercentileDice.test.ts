import { PercentileDice, StandardDice } from '../../../src/dice';
import { ExplodeModifier, KeepModifier, SortingModifier, } from '../../../src/modifiers';
import RollResult from '../../../src/results/RollResult';
import RollResults from '../../../src/results/RollResults';
import ComparePoint from '../../../src/ComparePoint';
import Description from '../../../src/Description';
import { RangeEnd } from "../../../src/types/Enums/RangeEnd";
import { ComparisonOperator } from "../../../src/types/Enums/ComparisonOperator";
import { SortDirection } from "../../../src/types/Enums/SortDirection";
import { DescriptionType } from "../../../src/types/Enums/DescriptionType";
import { ModelType } from "../../../src/types/Enums/ModelType";
import { DiceJsonOutput } from "../../../src/types/Interfaces/Json/DiceJsonOutput";

describe('PercentileDice', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const die = new PercentileDice(4);

      // assert that the die is a PercentileDie and that it extends StandardDice
      expect(die).toBeInstanceOf(PercentileDice);
      expect(die).toBeInstanceOf(StandardDice);

      expect(die).toHaveProperty('average', 50.5);
      expect(die).toHaveProperty('description', null);
      expect(die).toHaveProperty('max', 100);
      expect(die).toHaveProperty('min', 1);
      expect(die).toHaveProperty('modifiers', new Map());
      expect(die).toHaveProperty('name', 'percentile');
      expect(die).toHaveProperty('notation', '4d%');
      expect(die).toHaveProperty('qty', 4);
      expect(die).toHaveProperty('roll', expect.any(Function));
      expect(die).toHaveProperty('rollOnce', expect.any(Function));
      expect(die).toHaveProperty('sides', '%');
      expect(die).toHaveProperty('toJSON', expect.any(Function));
      expect(die).toHaveProperty('toString', expect.any(Function));
    });
  });

  describe('Quantity', () => {
    test('qty must be numeric', () => {
      let die = new PercentileDice(8);
      expect(die.qty).toBe(8);

      expect(() => {
        // @ts-expect-error testing invalid value
        die = new PercentileDice('foo');
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        die = new PercentileDice(false);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        die = new PercentileDice(true);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        die = new PercentileDice([]);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        die = new PercentileDice({ qty: 4 });
      }).toThrow(TypeError);
    });

    test('qty must be positive non-zero', () => {
      let die = new PercentileDice(1);
      expect(die.qty).toBe(1);

      die = new PercentileDice(324);
      expect(die.qty).toBe(324);

      expect(() => {
        die = new PercentileDice(0);
      }).toThrow(RangeError);

      expect(() => {
        die = new PercentileDice(-42);
      }).toThrow(RangeError);

      expect(() => {
        die = new PercentileDice(-1);
      }).toThrow(RangeError);
    });
  });

  describe('Average', () => {
    test('average is correct for single die', () => {
      const die = new PercentileDice();
      expect(die.average).toBe(50.5);
    });

    test('average is unaffected when rolling multiple', () => {
      let die = new PercentileDice(2);
      expect(die.average).toBe(50.5);

      die = new PercentileDice(400);
      expect(die.average).toBe(50.5);

      die = new PercentileDice(56);
      expect(die.average).toBe(50.5);

      die = new PercentileDice(12);
      expect(die.average).toBe(50.5);

      die = new PercentileDice(145);
      expect(die.average).toBe(50.5);
    });
  });

  describe('Modifiers', () => {
    test('setting modifiers in constructor calls setter', () => {
      const spy = jest.spyOn(PercentileDice.prototype, 'modifiers', 'set');
      const modifiers = new Map(Object.entries({
        foo: new ExplodeModifier(),
      }));

      new PercentileDice(1, modifiers);

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('can set modifiers with Map', () => {
      const modifiers = new Map(Object.entries({
        foo: new ExplodeModifier(),
      }));
      const die = new PercentileDice();

      die.modifiers = modifiers;

      expect(die.modifiers).toBeInstanceOf(Map);
      expect(die.modifiers).toEqual(modifiers);
    });

    test('can set modifiers with Object', () => {
      const modifier = new ExplodeModifier();
      const die = new PercentileDice(1);

      die.modifiers = { foo: modifier };

      expect(die.modifiers).toBeInstanceOf(Map);
      expect(die.modifiers.get('foo')).toEqual(modifier);
    });

    test('can set modifiers with Array', () => {
      const modifiers = [new ExplodeModifier()];
      const die = new PercentileDice(1);

      die.modifiers = modifiers;

      expect(die.modifiers).toBeInstanceOf(Map);
      expect(die.modifiers.has('explode')).toBe(true);
      expect(die.modifiers.get('explode')).toEqual(modifiers[0]);
    });

    test('throws error if modifiers type is invalid', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        new PercentileDice(1, 'foo');
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new PercentileDice(1, 351);
      }).toThrow(TypeError);

      expect(() => {
        const modifiers = new Map(Object.entries({ foo: 'bar' }));
        // @ts-expect-error testing invalid value
        new PercentileDice(1, modifiers);
      }).toThrow(TypeError);

      expect(() => {
        const modifiers = { foo: 'bar' };
        // @ts-expect-error testing invalid value
        new PercentileDice(1, modifiers);
      }).toThrow(TypeError);

      expect(() => {
        const modifiers = ['bar'];
        // @ts-expect-error testing invalid value
        new PercentileDice(1, modifiers);
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
      const die = new PercentileDice(1);

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

  describe('Sides', () => {
    test('returns `%`', () => {
      const die = new PercentileDice(4);

      expect(die.sides).toBe('%');
    });

    test('can be returned as `100`', () => {
      const die = new PercentileDice(4, null, true);

      expect(die.sides).toBe(100);
    });
  });

  describe('Notation', () => {
    test('simple notation `%`', () => {
      let die = new PercentileDice(45);
      expect(die.notation).toEqual('45d%');

      die = new PercentileDice(999);
      expect(die.notation).toEqual('999d%');

      die = new PercentileDice(10);
      expect(die.notation).toEqual('10d%');
    });

    test('simple notation `100`', () => {
      let die = new PercentileDice(45, null, true);
      expect(die.notation).toEqual('45d100');

      die = new PercentileDice(999, null, true);
      expect(die.notation).toEqual('999d100');

      die = new PercentileDice(10, null, true);
      expect(die.notation).toEqual('10d100');
    });

    test('notation with modifiers `%`', () => {
      const modifiers = [
        new KeepModifier(RangeEnd.High, 1),
        new SortingModifier(),
        new ExplodeModifier(new ComparePoint(ComparisonOperator.GreaterThan, 3)),
      ];

      const die = new PercentileDice(36, modifiers);

      expect(die.notation).toEqual('36d%!>3kh1sa');
    });

    test('notation with modifiers `100`', () => {
      const modifiers = [
        new KeepModifier(RangeEnd.Low, 2),
        new SortingModifier(SortDirection.Desc),
        new ExplodeModifier(new ComparePoint(ComparisonOperator.GreaterThanOrEqual, 50)),
      ];

      const die = new PercentileDice(36, modifiers, true);

      expect(die.notation).toEqual('36d100!>=50kl2sd');
    });
  });

  describe('Description', () => {
    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(PercentileDice.prototype, 'description', 'set');
      const description = 'Some description';

      new PercentileDice(1, null, false, description);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(description);

      // remove the spy
      spy.mockRestore();
    });

    test('can be changed', () => {
      const die = new PercentileDice(1);

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
      const die = new PercentileDice(1);

      die.description = undefined;
      expect(die.description).toEqual(null);

      // @ts-expect-error testing falsey value
      die.description = false;
      expect(die.description).toEqual(null);

      die.description = null;
      expect(die.description).toEqual(null);
    });

    test('throws error if type is invalid', () => {
      const die = new PercentileDice(1);

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
        const description = 'Another description';
        const die = new PercentileDice(6);

        die.description = description;

        // json encode, to get the encoded string, then decode so we can compare the object
        // this allows us to check that the output is correct, but ignoring the order of the
        // returned properties
        expect(JSON.parse(JSON.stringify(die))).toEqual({
          average: 50.5,
          description: {
            text: description,
            type: DescriptionType.Inline,
          },
          max: 100,
          min: 1,
          modifiers: {},
          name: 'percentile',
          notation: '6d%',
          qty: 6,
          sides: '%',
          type: ModelType.Dice,
        });
      });

      test('String output is correct', () => {
        const description = 'Another description';
        const die = new PercentileDice(8);

        die.description = description;

        expect(die.toString()).toEqual(`8d% # ${description}`);
      });
    });

    describe('With multi-line description', () => {
      test('JSON output is correct', () => {
        const description = 'Another description';
        const die = new PercentileDice(6);

        die.description = new Description(description, DescriptionType.MultiLine);

        // json encode, to get the encoded string, then decode so we can compare the object
        // this allows us to check that the output is correct, but ignoring the order of the
        // returned properties
        expect(JSON.parse(JSON.stringify(die))).toEqual({
          average: 50.5,
          description: {
            text: description,
            type: DescriptionType.MultiLine,
          },
          max: 100,
          min: 1,
          modifiers: {},
          name: 'percentile',
          notation: '6d%',
          qty: 6,
          sides: '%',
          type: ModelType.Dice,
        });
      });

      test('String output is correct', () => {
        const description = 'Another description';
        const die = new PercentileDice(8);

        die.description = new Description(description, DescriptionType.MultiLine);

        expect(die.toString()).toEqual(`8d% [${description}]`);
      });
    });

    describe('Without description', () => {
      test('JSON output is correct', () => {
        const die = new PercentileDice(6);

        // json encode, to get the encoded string, then decode so we can compare the object
        // this allows us to check that the output is correct, but ignoring the order of the
        // returned properties
        expect(JSON.parse(JSON.stringify(die))).toEqual({
          average: 50.5,
          description: null,
          max: 100,
          min: 1,
          modifiers: {},
          name: 'percentile',
          notation: '6d%',
          qty: 6,
          sides: '%',
          type: ModelType.Dice,
        });
      });

      test('String output is correct', () => {
        const die = new PercentileDice(8);

        expect(die.toString()).toEqual('8d%');
      });
    });

    test('can output sides as a number in JSON', () => {
      const die = new PercentileDice(10, null, true);

      expect((JSON.parse(JSON.stringify(die)) as DiceJsonOutput).sides).toBe(100);
    });

    test('can output sides as a number in string', () => {
      const die = new PercentileDice(10, null, true);

      expect(die.toString()).toEqual('10d100');
    });
  });

  describe('Rolling', () => {
    test('rollOnce returns a RollResult object', () => {
      expect((new PercentileDice()).rollOnce()).toBeInstanceOf(RollResult);
    });

    test('rollOnce rolls between min and max (Inclusive)', () => {
      const die = new PercentileDice();
      const iterations = 1000;

      // run the test multiple times to try and ensure consistency
      for (let i = 0; i < iterations; ++i) {
        const result = die.rollOnce();

        expect(result.value).toBeGreaterThanOrEqual(1);
        expect(result.value).toBeLessThanOrEqual(100);
      }
    });

    test('roll return a RollResults object', () => {
      expect((new PercentileDice()).roll()).toBeInstanceOf(RollResults);
    });

    test('rollOnce gets called when rolling', () => {
      // create a spy to listen for the Model.rollOnce method to have been triggered
      const spy = jest.spyOn(PercentileDice.prototype, 'rollOnce');
      const die = new PercentileDice(4);

      // roll the dice
      die.roll();

      expect(spy).toHaveBeenCalledTimes(4);

      // remove the spy
      spy.mockRestore();
    });

    test('roll returns correct number of rolls', () => {
      const die = new PercentileDice(4);

      expect(die.roll()).toHaveLength(4);
    });
  });

  describe('Readonly properties', () => {
    test('cannot change max value', () => {
      const die = new PercentileDice();

      expect(() => {
        // @ts-expect-error testing invalid value
        die.max = 450;
      }).toThrow(TypeError);
    });

    test('cannot change min value', () => {
      const die = new PercentileDice();

      expect(() => {
        // @ts-expect-error testing invalid value
        die.min = 450;
      }).toThrow(TypeError);
    });

    test('cannot change notation value', () => {
      const die = new PercentileDice();

      expect(() => {
        // @ts-expect-error testing invalid value
        die.notation = '6d4';
      }).toThrow(TypeError);
    });

    test('cannot change qty value', () => {
      const die = new PercentileDice();

      expect(() => {
        // @ts-expect-error testing invalid value
        die.qty = 6;
      }).toThrow(TypeError);
    });

    test('cannot change sides value', () => {
      const die = new PercentileDice();

      expect(() => {
        // @ts-expect-error testing invalid value
        die.sides = 2;
      }).toThrow(TypeError);
    });
  });
});
