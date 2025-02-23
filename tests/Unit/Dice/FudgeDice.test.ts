import { ExplodeModifier, KeepModifier, SortingModifier, } from '../../../src/modifiers';
import { FudgeDice, StandardDice } from '../../../src/dice';
import RollResult from '../../../src/results/RollResult';
import RollResults from '../../../src/results/RollResults';
import ComparePoint from '../../../src/ComparePoint';
import Description from '../../../src/Description';
import { RangeEnd } from "../../../src/types/Enums/RangeEnd";
import { ComparisonOperator } from "../../../src/types/Enums/ComparisonOperator";
import { DescriptionType } from "../../../src/types/Enums/DescriptionType";
import { ModelType } from "../../../src/types/Enums/ModelType";

describe('FudgeDice', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const die = new FudgeDice();

      // assert that the die is a PercentileDie and that it extends StandardDice
      expect(die).toBeInstanceOf(FudgeDice);
      expect(die).toBeInstanceOf(StandardDice);

      expect(die).toHaveProperty('average', 0);
      expect(die).toHaveProperty('description', null);
      expect(die).toHaveProperty('max', 1);
      expect(die).toHaveProperty('min', -1);
      expect(die).toHaveProperty('modifiers', new Map());
      expect(die).toHaveProperty('name', 'fudge');
      expect(die).toHaveProperty('nonBlanks', 2);
      expect(die).toHaveProperty('notation', '1dF.2');
      expect(die).toHaveProperty('qty', 1);
      expect(die).toHaveProperty('roll', expect.any(Function));
      expect(die).toHaveProperty('rollOnce', expect.any(Function));
      expect(die).toHaveProperty('sides', 'F.2');
      expect(die).toHaveProperty('toJSON', expect.any(Function));
      expect(die).toHaveProperty('toString', expect.any(Function));
    });
  });

  describe('Sides / non-blanks', () => {
    test('no sides default to 2', () => {
      let die = new FudgeDice();

      expect(die.nonBlanks).toBe(2);
      expect(die.sides).toEqual('F.2');

      // @ts-expect-error testing default value
      die = new FudgeDice(null);

      expect(die.nonBlanks).toBe(2);
      expect(die.sides).toEqual('F.2');

      // @ts-expect-error testing default value
      die = new FudgeDice(false);

      expect(die.nonBlanks).toBe(2);
      expect(die.sides).toEqual('F.2');
    });

    test('can set sides to 2', () => {
      const die = new FudgeDice(2);
      expect(die.sides).toEqual('F.2');
      expect(die.nonBlanks).toBe(2);
      expect(die.notation).toEqual('1dF.2');
    });

    test('can set sides to 1', () => {
      const die = new FudgeDice(1);
      expect(die.sides).toEqual('F.1');
      expect(die.nonBlanks).toBe(1);
      expect(die.notation).toEqual('1dF.1');
    });

    test('sides must be 1 or 2', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        new FudgeDice(0);
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new FudgeDice(3);
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new FudgeDice(-1);
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new FudgeDice(6);
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new FudgeDice([]);
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new FudgeDice({ nonBlanks: 2 });
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new FudgeDice('foo');
      }).toThrow(RangeError);
    });
  });

  describe('Quantity', () => {
    test('qty must be numeric', () => {
      let die = new FudgeDice(undefined, 8);
      expect(die.qty).toBe(8);
      expect(die.notation).toEqual('8dF.2');

      expect(() => {
        // @ts-expect-error testing invalid value
        die = new FudgeDice(undefined, 'foo');
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        die = new FudgeDice(undefined, false);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        die = new FudgeDice(undefined, true);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        die = new FudgeDice(undefined, []);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        die = new FudgeDice(undefined, { qty: 4 });
      }).toThrow(TypeError);
    });

    test('qty must be positive non-zero', () => {
      let die = new FudgeDice(undefined, 1);
      expect(die.qty).toBe(1);
      expect(die.notation).toEqual('1dF.2');

      die = new FudgeDice(undefined, 324);
      expect(die.qty).toBe(324);
      expect(die.notation).toEqual('324dF.2');

      expect(() => {
        die = new FudgeDice(undefined, 0);
      }).toThrow(RangeError);

      expect(() => {
        die = new FudgeDice(undefined, -42);
      }).toThrow(RangeError);

      expect(() => {
        die = new FudgeDice(undefined, -1);
      }).toThrow(RangeError);
    });
  });

  describe('Average', () => {
    test('average is correct for single die', () => {
      let die = new FudgeDice();
      expect(die.average).toBe(0);

      die = new FudgeDice(1);
      expect(die.average).toBe(0);
    });

    test('average is unaffected when rolling multiple', () => {
      let die = new FudgeDice(2, 2);
      expect(die.average).toBe(0);

      die = new FudgeDice(2, 400);
      expect(die.average).toBe(0);

      die = new FudgeDice(1, 56);
      expect(die.average).toBe(0);

      die = new FudgeDice(1, 145);
      expect(die.average).toBe(0);
    });
  });

  describe('Modifiers', () => {
    test('setting modifiers in constructor calls setter', () => {
      const spy = jest.spyOn(FudgeDice.prototype, 'modifiers', 'set');
      const modifiers = new Map(Object.entries({
        foo: new ExplodeModifier(),
      }));

      new FudgeDice(undefined, 1, modifiers);

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('can set modifiers with Map', () => {
      const modifiers = new Map(Object.entries({
        foo: new ExplodeModifier(),
      }));
      const die = new FudgeDice(undefined, 1);

      die.modifiers = modifiers;

      expect(die.modifiers).toBeInstanceOf(Map);
      expect(die.modifiers).toEqual(modifiers);
    });

    test('can set modifiers with Object', () => {
      const modifier = new ExplodeModifier;
      const die = new FudgeDice(undefined, 1);

      die.modifiers = { foo: modifier };

      expect(die.modifiers).toBeInstanceOf(Map);
      expect(die.modifiers.get('foo')).toEqual(modifier);
    });

    test('can set modifiers with Array', () => {
      const modifiers = [new ExplodeModifier()];
      const die = new FudgeDice(undefined, 1);

      die.modifiers = modifiers;

      expect(die.modifiers).toBeInstanceOf(Map);
      expect(die.modifiers.has('explode'))
      expect(die.modifiers.get('explode')).toEqual(modifiers[0]);
    });

    test('throws error if modifiers type is invalid', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        new FudgeDice(undefined, 1, 'foo');
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new FudgeDice(undefined, 1, 351);
      }).toThrow(TypeError);

      expect(() => {
        const modifiers = new Map(Object.entries({ foo: 'bar' }));
        // @ts-expect-error testing invalid value
        new FudgeDice(undefined, 1, modifiers);
      }).toThrow(TypeError);

      expect(() => {
        const modifiers = { foo: 'bar' };
        // @ts-expect-error testing invalid value
        new FudgeDice(undefined, 1, modifiers);
      }).toThrow(TypeError);

      expect(() => {
        const modifiers = ['bar'];
        // @ts-expect-error testing invalid value
        new FudgeDice(undefined, 1, modifiers);
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
      const die = new FudgeDice(undefined, 4);

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
      let die = new FudgeDice(2, 45);
      expect(die.notation).toEqual('45dF.2');

      die = new FudgeDice(1, 999);
      expect(die.notation).toEqual('999dF.1');

      die = new FudgeDice(undefined, 10);
      expect(die.notation).toEqual('10dF.2');
    });

    test('notation with modifiers', () => {
      const modifiers = [
        new KeepModifier(RangeEnd.High, 1),
        new SortingModifier(),
        new ExplodeModifier(
          new ComparePoint(ComparisonOperator.GreaterThan, 3)
        ),
      ];

      const die = new FudgeDice(1, 36, modifiers);

      expect(die.notation).toEqual('36dF.1!>3kh1sa');
    });
  });

  describe('Description', () => {
    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(FudgeDice.prototype, 'description', 'set');
      const description = 'Some description';

      new FudgeDice(2, 1, null, description);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(description);

      // remove the spy
      spy.mockRestore();
    });

    test('can be changed', () => {
      const die = new FudgeDice();

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
      const die = new FudgeDice();

      die.description = undefined;
      expect(die.description).toEqual(null);

      // @ts-expect-error testing invalid value
      die.description = false;
      expect(die.description).toEqual(null);

      die.description = null;
      expect(die.description).toEqual(null);
    });

    test('throws error if type is invalid', () => {
      const die = new FudgeDice();

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
        const description = 'Some description';
        const die = new FudgeDice();

        die.description = description;

        expect(JSON.parse(JSON.stringify(die))).toEqual({
          average: 0,
          description: {
            text: description,
            type: DescriptionType.Inline,
          },
          max: 1,
          min: -1,
          modifiers: {},
          name: 'fudge',
          notation: '1dF.2',
          qty: 1,
          sides: 'F.2',
          type: ModelType.Dice,
        });
      });

      test('String output is correct', () => {
        const description = 'Another description';
        const die = new FudgeDice();

        die.description = description;

        expect(die.toString()).toEqual(`1dF.2 # ${description}`);
      });
    });

    describe('With multi-line description', () => {
      test('JSON output is correct', () => {
        const description = 'Some description';
        const die = new FudgeDice();

        die.description = new Description(description, DescriptionType.MultiLine);

        expect(JSON.parse(JSON.stringify(die))).toEqual({
          average: 0,
          description: {
            text: description,
            type: DescriptionType.MultiLine,
          },
          max: 1,
          min: -1,
          modifiers: {},
          name: 'fudge',
          notation: '1dF.2',
          qty: 1,
          sides: 'F.2',
          type: ModelType.Dice,
        });
      });

      test('String output is correct', () => {
        const description = 'Another description';
        const die = new FudgeDice();

        die.description = new Description(description, DescriptionType.MultiLine);

        expect(die.toString()).toEqual(`1dF.2 [${description}]`);
      });
    });

    describe('Without description', () => {
      test('JSON output is correct', () => {
        const die = new FudgeDice(undefined, 4);

        // json encode, to get the encoded string, then decode so we can compare the object
        // this allows us to check that the output is correct, but ignoring the order of the
        // returned properties
        expect(JSON.parse(JSON.stringify(die))).toEqual({
          average: 0,
          description: null,
          max: 1,
          min: -1,
          modifiers: {},
          name: 'fudge',
          notation: '4dF.2',
          qty: 4,
          sides: 'F.2',
          type: ModelType.Dice,
        });
      });

      test('String output is correct', () => {
        let die = new FudgeDice(undefined, 4);

        expect(die.toString()).toEqual('4dF.2');

        die = new FudgeDice(1, 4);

        expect(die.toString()).toEqual('4dF.1');
      });
    });
  });

  describe('Rolling', () => {
    test('rollOnce returns a RollResult object', () => {
      expect((new FudgeDice(2, 1)).rollOnce()).toBeInstanceOf(RollResult);
    });

    test('rollOnce rolls between min and max (Inclusive)', () => {
      const die = new FudgeDice(2, 1);
      const iterations = 1000;

      // run the test multiple times to try and ensure consistency
      for (let i = 0; i < iterations; ++i) {
        const result = die.rollOnce();

        expect(result.value).toBeGreaterThanOrEqual(-1);
        expect(result.value).toBeLessThanOrEqual(1);
      }
    });

    test('rollOnce rolls between min and max (Inclusive) for F.1', () => {
      const die = new FudgeDice(1, 1);
      const iterations = 1000;

      // run the test multiple times to try and ensure consistency
      for (let i = 0; i < iterations; ++i) {
        const result = die.rollOnce();

        expect(result.value).toBeGreaterThanOrEqual(-1);
        expect(result.value).toBeLessThanOrEqual(1);
      }
    });

    test('roll returns a RollResults object', () => {
      expect((new FudgeDice(undefined, 1)).roll()).toBeInstanceOf(RollResults);
    });

    test('rollOnce gets called when rolling', () => {
      const die = new FudgeDice(undefined, 4);
      // create a spy to listen for the Model.rollOnce method to have been triggered
      const spy = jest.spyOn(die, 'rollOnce');

      // roll the dice
      die.roll();

      expect(spy).toHaveBeenCalledTimes(4);

      // remove the spy
      spy.mockRestore();
    });

    test('roll returns correct number of rolls', () => {
      const die = new FudgeDice(undefined, 4);

      expect(die.roll()).toHaveLength(4);
    });
  });

  describe('Readonly properties', () => {
    test('cannot change max value', () => {
      const die = new FudgeDice(undefined, 4);

      expect(() => {
        // @ts-expect-error testing readonly value
        die.max = 450;
      }).toThrow(TypeError);
    });

    test('cannot change min value', () => {
      const die = new FudgeDice(undefined, 4);

      expect(() => {
        // @ts-expect-error testing readonly value
        die.min = 450;
      }).toThrow(TypeError);
    });

    test('cannot change notation value', () => {
      const die = new FudgeDice(undefined, 4);

      expect(() => {
        // @ts-expect-error testing readonly value
        die.notation = '6d4';
      }).toThrow(TypeError);
    });

    test('cannot change qty value', () => {
      const die = new FudgeDice(undefined, 4);

      expect(() => {
        // @ts-expect-error testing readonly value
        die.qty = 6;
      }).toThrow(TypeError);
    });

    test('cannot change sides value', () => {
      const die = new FudgeDice(undefined, 4);

      expect(() => {
        // @ts-expect-error testing readonly value
        die.sides = 2;
      }).toThrow(TypeError);
    });

    test('cannot change nonBlanks value', () => {
      const die = new FudgeDice(1, 4);

      expect(() => {
        // @ts-expect-error testing readonly value
        die.nonBlanks = 2;
      }).toThrow(TypeError);
    });
  });
});
