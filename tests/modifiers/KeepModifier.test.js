import { StandardDice } from '../../src/dice/index.js';
import { KeepModifier, Modifier } from '../../src/modifiers/index.js';
import ResultGroup from '../../src/results/ResultGroup.js';
import RollResult from '../../src/results/RollResult.js';
import RollResults from '../../src/results/RollResults.js';
import RollGroup from '../../src/RollGroup.js';

describe('KeepModifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const mod = new KeepModifier('h');

      expect(mod).toBeInstanceOf(KeepModifier);
      expect(mod).toBeInstanceOf(Modifier);
      expect(mod).toEqual(expect.objectContaining({
        end: 'h',
        name: 'keep-h',
        notation: 'kh1',
        order: 6,
        run: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
        qty: 1,
      }));
    });
  });

  describe('End', () => {
    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(KeepModifier.prototype, 'end', 'set');

      // create the modifier
      new KeepModifier('h');

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('h');

      // create the modifier
      new KeepModifier('l');

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith('l');

      // remove the spy
      spy.mockRestore();
    });

    test('can be changed', () => {
      const mod = new KeepModifier('l');

      expect(mod.end).toEqual('l');
      expect(mod.notation).toEqual('kl1');

      mod.end = 'h';
      expect(mod.end).toEqual('h');
      expect(mod.notation).toEqual('kh1');

      mod.end = 'l';
      expect(mod.end).toEqual('l');
      expect(mod.notation).toEqual('kl1');
    });

    test('must be "h" or "l"', () => {
      const mod = new KeepModifier('h');

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

      expect(() => {
        mod.end = false;
      }).toThrow(RangeError);

      expect(() => {
        mod.end = null;
      }).toThrow(RangeError);

      expect(() => {
        mod.end = undefined;
      }).toThrow(RangeError);
    });

    test('defaults to "h"', () => {
      const mod = new KeepModifier();

      expect(mod.end).toEqual('h');
    });
  });

  describe('Quantity', () => {
    test('qty must be numeric', () => {
      const mod = new KeepModifier('h', 8);
      expect(mod.qty).toBe(8);
      expect(mod.notation).toEqual('kh8');

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
      let mod = new KeepModifier('h', 1);
      expect(mod.qty).toBe(1);
      expect(mod.notation).toEqual('kh1');

      mod = new KeepModifier('h', 324);
      expect(mod.qty).toBe(324);
      expect(mod.notation).toEqual('kh324');

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
      let mod = new KeepModifier('h', 5.145);
      expect(mod.qty).toBeCloseTo(5);
      expect(mod.notation).toEqual('kh5');

      mod = new KeepModifier('h', 12.7);
      expect(mod.qty).toBeCloseTo(12);
      expect(mod.notation).toEqual('kh12');

      mod = new KeepModifier('h', 50.5);
      expect(mod.qty).toBeCloseTo(50);
      expect(mod.notation).toEqual('kh50');
    });

    test('must be finite', () => {
      expect(() => {
        new KeepModifier('h', Infinity);
      }).toThrow(RangeError);
    });

    test('can be very large number', () => {
      const mod = new KeepModifier('h', 99 ** 99);
      expect(mod.qty).toBe(99 ** 99);
      expect(mod.notation).toEqual(`kh${99 ** 99}`);
    });
  });

  describe('Notation', () => {
    test('simple notation', () => {
      let mod = new KeepModifier('l', 35);
      expect(mod.notation).toEqual('kl35');

      mod = new KeepModifier('h', 90876684);
      expect(mod.notation).toEqual('kh90876684');

      mod = new KeepModifier('h', 7986);
      expect(mod.notation).toEqual('kh7986');

      mod = new KeepModifier('l', 2);
      expect(mod.notation).toEqual('kl2');
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const mod = new KeepModifier('l', 4);

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
      const mod = new KeepModifier('h', 4);

      expect(mod.toString()).toEqual('kh4');
    });
  });

  describe('Run', () => {
    let mod;
    let results;

    beforeEach(() => {
      mod = new KeepModifier('h');
    });

    describe('Basic', () => {
      let die;

      beforeEach(() => {
        results = new RollResults([8, 4, 2, 1, 6]);
        die = new StandardDice(10, 5);
      });

      test('returns RollResults object', () => {
        expect(mod.run(results, die)).toBe(results);
      });

      test('can keep results from high end', () => {
        const modifiedResults = mod.run(results, die).rolls;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(5);

        expect(modifiedResults[0]).toBeInstanceOf(RollResult);
        expect(modifiedResults[0].calculationValue).toBe(8);
        expect(modifiedResults[0].value).toBe(8);
        expect(modifiedResults[0].modifiers).toEqual(new Set());
        expect(modifiedResults[0].useInTotal).toBe(true);

        expect(modifiedResults[1]).toBeInstanceOf(RollResult);
        expect(modifiedResults[1].calculationValue).toBe(4);
        expect(modifiedResults[1].value).toBe(4);
        expect(modifiedResults[1].modifiers).toEqual(new Set(['drop']));
        expect(modifiedResults[1].useInTotal).toBe(false);

        expect(modifiedResults[2]).toBeInstanceOf(RollResult);
        expect(modifiedResults[2].calculationValue).toBe(2);
        expect(modifiedResults[2].value).toBe(2);
        expect(modifiedResults[2].modifiers).toEqual(new Set(['drop']));
        expect(modifiedResults[2].useInTotal).toBe(false);

        expect(modifiedResults[3]).toBeInstanceOf(RollResult);
        expect(modifiedResults[3].calculationValue).toBe(1);
        expect(modifiedResults[3].value).toBe(1);
        expect(modifiedResults[3].modifiers).toEqual(new Set(['drop']));
        expect(modifiedResults[3].useInTotal).toBe(false);

        expect(modifiedResults[4]).toBeInstanceOf(RollResult);
        expect(modifiedResults[4].calculationValue).toBe(6);
        expect(modifiedResults[4].value).toBe(6);
        expect(modifiedResults[4].modifiers).toEqual(new Set(['drop']));
        expect(modifiedResults[4].useInTotal).toBe(false);
      });

      test('can keep multiple results from high end', () => {
        // set the qty
        mod.qty = 3;

        const modifiedResults = mod.run(results, die).rolls;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(5);

        expect(modifiedResults[0]).toBeInstanceOf(RollResult);
        expect(modifiedResults[0].calculationValue).toBe(8);
        expect(modifiedResults[0].value).toBe(8);
        expect(modifiedResults[0].modifiers).toEqual(new Set());
        expect(modifiedResults[0].useInTotal).toBe(true);

        expect(modifiedResults[1]).toBeInstanceOf(RollResult);
        expect(modifiedResults[1].calculationValue).toBe(4);
        expect(modifiedResults[1].value).toBe(4);
        expect(modifiedResults[1].modifiers).toEqual(new Set());
        expect(modifiedResults[1].useInTotal).toBe(true);

        expect(modifiedResults[2]).toBeInstanceOf(RollResult);
        expect(modifiedResults[2].calculationValue).toBe(2);
        expect(modifiedResults[2].value).toBe(2);
        expect(modifiedResults[2].modifiers).toEqual(new Set(['drop']));
        expect(modifiedResults[2].useInTotal).toBe(false);

        expect(modifiedResults[3]).toBeInstanceOf(RollResult);
        expect(modifiedResults[3].calculationValue).toBe(1);
        expect(modifiedResults[3].value).toBe(1);
        expect(modifiedResults[3].modifiers).toEqual(new Set(['drop']));
        expect(modifiedResults[3].useInTotal).toBe(false);

        expect(modifiedResults[4]).toBeInstanceOf(RollResult);
        expect(modifiedResults[4].calculationValue).toBe(6);
        expect(modifiedResults[4].value).toBe(6);
        expect(modifiedResults[4].modifiers).toEqual(new Set());
        expect(modifiedResults[4].useInTotal).toBe(true);
      });

      test('can keep results from low end', () => {
        // set the end to low
        mod.end = 'l';

        const modifiedResults = mod.run(results, die).rolls;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(5);

        expect(modifiedResults[0]).toBeInstanceOf(RollResult);
        expect(modifiedResults[0].calculationValue).toBe(8);
        expect(modifiedResults[0].value).toBe(8);
        expect(modifiedResults[0].modifiers).toEqual(new Set(['drop']));
        expect(modifiedResults[0].useInTotal).toBe(false);

        expect(modifiedResults[1]).toBeInstanceOf(RollResult);
        expect(modifiedResults[1].calculationValue).toBe(4);
        expect(modifiedResults[1].value).toBe(4);
        expect(modifiedResults[1].modifiers).toEqual(new Set(['drop']));
        expect(modifiedResults[1].useInTotal).toBe(false);

        expect(modifiedResults[2]).toBeInstanceOf(RollResult);
        expect(modifiedResults[2].calculationValue).toBe(2);
        expect(modifiedResults[2].value).toBe(2);
        expect(modifiedResults[2].modifiers).toEqual(new Set(['drop']));
        expect(modifiedResults[2].useInTotal).toBe(false);

        expect(modifiedResults[3]).toBeInstanceOf(RollResult);
        expect(modifiedResults[3].calculationValue).toBe(1);
        expect(modifiedResults[3].value).toBe(1);
        expect(modifiedResults[3].modifiers).toEqual(new Set());
        expect(modifiedResults[3].useInTotal).toBe(true);

        expect(modifiedResults[4]).toBeInstanceOf(RollResult);
        expect(modifiedResults[4].calculationValue).toBe(6);
        expect(modifiedResults[4].value).toBe(6);
        expect(modifiedResults[4].modifiers).toEqual(new Set(['drop']));
        expect(modifiedResults[4].useInTotal).toBe(false);
      });

      test('can keep multiple results from low end', () => {
        // set the end to low
        mod.end = 'l';
        // set the qty
        mod.qty = 3;

        const modifiedResults = mod.run(results, die).rolls;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(5);

        expect(modifiedResults[0]).toBeInstanceOf(RollResult);
        expect(modifiedResults[0].calculationValue).toBe(8);
        expect(modifiedResults[0].value).toBe(8);
        expect(modifiedResults[0].modifiers).toEqual(new Set(['drop']));
        expect(modifiedResults[0].useInTotal).toBe(false);

        expect(modifiedResults[1]).toBeInstanceOf(RollResult);
        expect(modifiedResults[1].calculationValue).toBe(4);
        expect(modifiedResults[1].value).toBe(4);
        expect(modifiedResults[1].modifiers).toEqual(new Set());
        expect(modifiedResults[1].useInTotal).toBe(true);

        expect(modifiedResults[2]).toBeInstanceOf(RollResult);
        expect(modifiedResults[2].calculationValue).toBe(2);
        expect(modifiedResults[2].value).toBe(2);
        expect(modifiedResults[2].modifiers).toEqual(new Set());
        expect(modifiedResults[2].useInTotal).toBe(true);

        expect(modifiedResults[3]).toBeInstanceOf(RollResult);
        expect(modifiedResults[3].calculationValue).toBe(1);
        expect(modifiedResults[3].value).toBe(1);
        expect(modifiedResults[3].modifiers).toEqual(new Set());
        expect(modifiedResults[3].useInTotal).toBe(true);

        expect(modifiedResults[4]).toBeInstanceOf(RollResult);
        expect(modifiedResults[4].calculationValue).toBe(6);
        expect(modifiedResults[4].value).toBe(6);
        expect(modifiedResults[4].modifiers).toEqual(new Set(['drop']));
        expect(modifiedResults[4].useInTotal).toBe(false);
      });

      test('keeping more than rolled keeps everything', () => {
        // set the qty
        mod.qty = 20;

        const modifiedResults = mod.run(results, die).rolls;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(5);

        expect(modifiedResults[0]).toBeInstanceOf(RollResult);
        expect(modifiedResults[0].calculationValue).toBe(8);
        expect(modifiedResults[0].value).toBe(8);
        expect(modifiedResults[0].modifiers).toEqual(new Set());
        expect(modifiedResults[0].useInTotal).toBe(true);

        expect(modifiedResults[1]).toBeInstanceOf(RollResult);
        expect(modifiedResults[1].calculationValue).toBe(4);
        expect(modifiedResults[1].value).toBe(4);
        expect(modifiedResults[1].modifiers).toEqual(new Set());
        expect(modifiedResults[1].useInTotal).toBe(true);

        expect(modifiedResults[2]).toBeInstanceOf(RollResult);
        expect(modifiedResults[2].calculationValue).toBe(2);
        expect(modifiedResults[2].value).toBe(2);
        expect(modifiedResults[2].modifiers).toEqual(new Set());
        expect(modifiedResults[2].useInTotal).toBe(true);

        expect(modifiedResults[3]).toBeInstanceOf(RollResult);
        expect(modifiedResults[3].calculationValue).toBe(1);
        expect(modifiedResults[3].value).toBe(1);
        expect(modifiedResults[3].modifiers).toEqual(new Set());
        expect(modifiedResults[3].useInTotal).toBe(true);

        expect(modifiedResults[4]).toBeInstanceOf(RollResult);
        expect(modifiedResults[4].calculationValue).toBe(6);
        expect(modifiedResults[4].value).toBe(6);
        expect(modifiedResults[4].modifiers).toEqual(new Set());
        expect(modifiedResults[4].useInTotal).toBe(true);
      });
    });

    describe('Roll groups', () => {
      let group;

      describe('Single sub-rolls', () => {
        // equivalent to `{4d10*5d6}`
        beforeEach(() => {
          group = new RollGroup([
            [
              new StandardDice(10, 4),
              '*',
              new StandardDice(6, 5),
            ],
          ]);

          results = new ResultGroup([
            // 4d10*5d6
            new ResultGroup([
              // 4d10
              new RollResults([9, 3, 5, 4]),
              '*',
              // 5d6
              new RollResults([3, 2, 6, 4, 1]),
            ]),
          ]);
        });

        test('returns RollResults object', () => {
          expect(mod.run(results, group)).toBe(results);
        });

        test('can keep rolls from the high end', () => {
          const modifiedResults = mod.run(results, group).results;

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(1);

          // sub-roll
          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0].value).toBe(0);
          expect(modifiedResults[0].modifiers).toEqual(new Set());
          expect(modifiedResults[0].useInTotal).toBe(true);

          // sub-roll results
          const subResults = modifiedResults[0].results;
          expect(subResults).toBeInstanceOf(Array);
          expect(subResults).toHaveLength(3);

          // first die roll
          expect(subResults[0]).toBeInstanceOf(RollResults);
          expect(subResults[0].value).toBe(9);

          let subRolls = subResults[0].rolls;
          expect(subRolls).toBeInstanceOf(Array);
          expect(subRolls).toHaveLength(4);

          expect(subRolls[0]).toBeInstanceOf(RollResult);
          expect(subRolls[0].value).toBe(9);
          expect(subRolls[0].useInTotal).toBe(true);
          expect(subRolls[0].modifiers).toEqual(new Set());

          expect(subRolls[1]).toBeInstanceOf(RollResult);
          expect(subRolls[1].value).toBe(3);
          expect(subRolls[1].useInTotal).toBe(false);
          expect(subRolls[1].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[2]).toBeInstanceOf(RollResult);
          expect(subRolls[2].value).toBe(5);
          expect(subRolls[2].useInTotal).toBe(false);
          expect(subRolls[2].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[3]).toBeInstanceOf(RollResult);
          expect(subRolls[3].value).toBe(4);
          expect(subRolls[3].useInTotal).toBe(false);
          expect(subRolls[3].modifiers).toEqual(new Set(['drop']));

          // operator
          expect(subResults[1]).toEqual('*');

          // second die roll
          expect(subResults[2]).toBeInstanceOf(RollResults);
          expect(subResults[2].value).toBe(0);

          subRolls = subResults[2].rolls;
          expect(subRolls).toBeInstanceOf(Array);
          expect(subRolls).toHaveLength(5);

          expect(subRolls[0]).toBeInstanceOf(RollResult);
          expect(subRolls[0].value).toBe(3);
          expect(subRolls[0].useInTotal).toBe(false);
          expect(subRolls[0].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[1]).toBeInstanceOf(RollResult);
          expect(subRolls[1].value).toBe(2);
          expect(subRolls[1].useInTotal).toBe(false);
          expect(subRolls[1].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[2]).toBeInstanceOf(RollResult);
          expect(subRolls[2].value).toBe(6);
          expect(subRolls[2].useInTotal).toBe(false);
          expect(subRolls[2].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[3]).toBeInstanceOf(RollResult);
          expect(subRolls[3].value).toBe(4);
          expect(subRolls[3].useInTotal).toBe(false);
          expect(subRolls[3].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[4]).toBeInstanceOf(RollResult);
          expect(subRolls[4].value).toBe(1);
          expect(subRolls[4].useInTotal).toBe(false);
          expect(subRolls[4].modifiers).toEqual(new Set(['drop']));
        });

        test('can keep multiple rolls from the high end', () => {
          // set the qty
          mod.qty = 2;

          const modifiedResults = mod.run(results, group).results;

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(1);

          // sub-roll
          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0].value).toBe(54);
          expect(modifiedResults[0].modifiers).toEqual(new Set());
          expect(modifiedResults[0].useInTotal).toBe(true);

          // sub-roll results
          const subResults = modifiedResults[0].results;
          expect(subResults).toBeInstanceOf(Array);
          expect(subResults).toHaveLength(3);

          // first die roll
          expect(subResults[0]).toBeInstanceOf(RollResults);
          expect(subResults[0].value).toBe(9);

          let subRolls = subResults[0].rolls;
          expect(subRolls).toBeInstanceOf(Array);
          expect(subRolls).toHaveLength(4);

          expect(subRolls[0]).toBeInstanceOf(RollResult);
          expect(subRolls[0].value).toBe(9);
          expect(subRolls[0].useInTotal).toBe(true);
          expect(subRolls[0].modifiers).toEqual(new Set());

          expect(subRolls[1]).toBeInstanceOf(RollResult);
          expect(subRolls[1].value).toBe(3);
          expect(subRolls[1].useInTotal).toBe(false);
          expect(subRolls[1].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[2]).toBeInstanceOf(RollResult);
          expect(subRolls[2].value).toBe(5);
          expect(subRolls[2].useInTotal).toBe(false);
          expect(subRolls[2].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[3]).toBeInstanceOf(RollResult);
          expect(subRolls[3].value).toBe(4);
          expect(subRolls[3].useInTotal).toBe(false);
          expect(subRolls[3].modifiers).toEqual(new Set(['drop']));

          // operator
          expect(subResults[1]).toEqual('*');

          // second die roll
          expect(subResults[2]).toBeInstanceOf(RollResults);
          expect(subResults[2].value).toBe(6);

          subRolls = subResults[2].rolls;
          expect(subRolls).toBeInstanceOf(Array);
          expect(subRolls).toHaveLength(5);

          expect(subRolls[0]).toBeInstanceOf(RollResult);
          expect(subRolls[0].value).toBe(3);
          expect(subRolls[0].useInTotal).toBe(false);
          expect(subRolls[0].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[1]).toBeInstanceOf(RollResult);
          expect(subRolls[1].value).toBe(2);
          expect(subRolls[1].useInTotal).toBe(false);
          expect(subRolls[1].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[2]).toBeInstanceOf(RollResult);
          expect(subRolls[2].value).toBe(6);
          expect(subRolls[2].useInTotal).toBe(true);
          expect(subRolls[2].modifiers).toEqual(new Set());

          expect(subRolls[3]).toBeInstanceOf(RollResult);
          expect(subRolls[3].value).toBe(4);
          expect(subRolls[3].useInTotal).toBe(false);
          expect(subRolls[3].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[4]).toBeInstanceOf(RollResult);
          expect(subRolls[4].value).toBe(1);
          expect(subRolls[4].useInTotal).toBe(false);
          expect(subRolls[4].modifiers).toEqual(new Set(['drop']));
        });

        test('can keep results from low end', () => {
          // set the end to low
          mod.end = 'l';

          const modifiedResults = mod.run(results, group).results;

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(1);

          // sub-roll
          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0].value).toBe(0);
          expect(modifiedResults[0].modifiers).toEqual(new Set());
          expect(modifiedResults[0].useInTotal).toBe(true);

          // sub-roll results
          const subResults = modifiedResults[0].results;
          expect(subResults).toBeInstanceOf(Array);
          expect(subResults).toHaveLength(3);

          // first die roll
          expect(subResults[0]).toBeInstanceOf(RollResults);
          expect(subResults[0].value).toBe(0);

          // 9, 3, 5, 4
          let subRolls = subResults[0].rolls;
          expect(subRolls).toBeInstanceOf(Array);
          expect(subRolls).toHaveLength(4);

          expect(subRolls[0]).toBeInstanceOf(RollResult);
          expect(subRolls[0].value).toBe(9);
          expect(subRolls[0].useInTotal).toBe(false);
          expect(subRolls[0].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[1]).toBeInstanceOf(RollResult);
          expect(subRolls[1].value).toBe(3);
          expect(subRolls[1].useInTotal).toBe(false);
          expect(subRolls[1].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[2]).toBeInstanceOf(RollResult);
          expect(subRolls[2].value).toBe(5);
          expect(subRolls[2].useInTotal).toBe(false);
          expect(subRolls[2].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[3]).toBeInstanceOf(RollResult);
          expect(subRolls[3].value).toBe(4);
          expect(subRolls[3].useInTotal).toBe(false);
          expect(subRolls[3].modifiers).toEqual(new Set(['drop']));

          // operator
          expect(subResults[1]).toEqual('*');

          // second die roll
          expect(subResults[2]).toBeInstanceOf(RollResults);
          expect(subResults[2].value).toBe(1);

          // 3, 2, 6, 4, 1
          subRolls = subResults[2].rolls;
          expect(subRolls).toBeInstanceOf(Array);
          expect(subRolls).toHaveLength(5);

          expect(subRolls[0]).toBeInstanceOf(RollResult);
          expect(subRolls[0].value).toBe(3);
          expect(subRolls[0].useInTotal).toBe(false);
          expect(subRolls[0].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[1]).toBeInstanceOf(RollResult);
          expect(subRolls[1].value).toBe(2);
          expect(subRolls[1].useInTotal).toBe(false);
          expect(subRolls[1].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[2]).toBeInstanceOf(RollResult);
          expect(subRolls[2].value).toBe(6);
          expect(subRolls[2].useInTotal).toBe(false);
          expect(subRolls[2].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[3]).toBeInstanceOf(RollResult);
          expect(subRolls[3].value).toBe(4);
          expect(subRolls[3].useInTotal).toBe(false);
          expect(subRolls[3].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[4]).toBeInstanceOf(RollResult);
          expect(subRolls[4].value).toBe(1);
          expect(subRolls[4].useInTotal).toBe(true);
          expect(subRolls[4].modifiers).toEqual(new Set());
        });

        test('can keep multiple results from low end', () => {
          // set the end to low
          mod.end = 'l';
          // set the qty
          mod.qty = 2;

          const modifiedResults = mod.run(results, group).results;

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(1);

          // sub-roll
          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0].value).toBe(0);
          expect(modifiedResults[0].modifiers).toEqual(new Set());
          expect(modifiedResults[0].useInTotal).toBe(true);

          // sub-roll results
          const subResults = modifiedResults[0].results;
          expect(subResults).toBeInstanceOf(Array);
          expect(subResults).toHaveLength(3);

          // first die roll
          expect(subResults[0]).toBeInstanceOf(RollResults);
          expect(subResults[0].value).toBe(0);

          // 9, 3, 5, 4
          let subRolls = subResults[0].rolls;
          expect(subRolls).toBeInstanceOf(Array);
          expect(subRolls).toHaveLength(4);

          expect(subRolls[0]).toBeInstanceOf(RollResult);
          expect(subRolls[0].value).toBe(9);
          expect(subRolls[0].useInTotal).toBe(false);
          expect(subRolls[0].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[1]).toBeInstanceOf(RollResult);
          expect(subRolls[1].value).toBe(3);
          expect(subRolls[1].useInTotal).toBe(false);
          expect(subRolls[1].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[2]).toBeInstanceOf(RollResult);
          expect(subRolls[2].value).toBe(5);
          expect(subRolls[2].useInTotal).toBe(false);
          expect(subRolls[2].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[3]).toBeInstanceOf(RollResult);
          expect(subRolls[3].value).toBe(4);
          expect(subRolls[3].useInTotal).toBe(false);
          expect(subRolls[3].modifiers).toEqual(new Set(['drop']));

          // operator
          expect(subResults[1]).toEqual('*');

          // second die roll
          expect(subResults[2]).toBeInstanceOf(RollResults);
          expect(subResults[2].value).toBe(3);

          // 3, 2, 6, 4, 1
          subRolls = subResults[2].rolls;
          expect(subRolls).toBeInstanceOf(Array);
          expect(subRolls).toHaveLength(5);

          expect(subRolls[0]).toBeInstanceOf(RollResult);
          expect(subRolls[0].value).toBe(3);
          expect(subRolls[0].useInTotal).toBe(false);
          expect(subRolls[0].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[1]).toBeInstanceOf(RollResult);
          expect(subRolls[1].value).toBe(2);
          expect(subRolls[1].useInTotal).toBe(true);
          expect(subRolls[1].modifiers).toEqual(new Set());

          expect(subRolls[2]).toBeInstanceOf(RollResult);
          expect(subRolls[2].value).toBe(6);
          expect(subRolls[2].useInTotal).toBe(false);
          expect(subRolls[2].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[3]).toBeInstanceOf(RollResult);
          expect(subRolls[3].value).toBe(4);
          expect(subRolls[3].useInTotal).toBe(false);
          expect(subRolls[3].modifiers).toEqual(new Set(['drop']));

          expect(subRolls[4]).toBeInstanceOf(RollResult);
          expect(subRolls[4].value).toBe(1);
          expect(subRolls[4].useInTotal).toBe(true);
          expect(subRolls[4].modifiers).toEqual(new Set());
        });

        test('keeping more than rolled keeps everything', () => {
          // set the qty
          mod.qty = 20;

          const modifiedResults = mod.run(results, group).results;

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(1);

          // sub-roll
          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0].value).toBe(336);
          expect(modifiedResults[0].modifiers).toEqual(new Set());
          expect(modifiedResults[0].useInTotal).toBe(true);

          // sub-roll results
          const subResults = modifiedResults[0].results;
          expect(subResults).toBeInstanceOf(Array);
          expect(subResults).toHaveLength(3);

          // first die roll
          expect(subResults[0]).toBeInstanceOf(RollResults);
          expect(subResults[0].value).toBe(21);

          // 9, 3, 5, 4
          let subRolls = subResults[0].rolls;
          expect(subRolls).toBeInstanceOf(Array);
          expect(subRolls).toHaveLength(4);

          expect(subRolls[0]).toBeInstanceOf(RollResult);
          expect(subRolls[0].value).toBe(9);
          expect(subRolls[0].useInTotal).toBe(true);
          expect(subRolls[0].modifiers).toEqual(new Set());

          expect(subRolls[1]).toBeInstanceOf(RollResult);
          expect(subRolls[1].value).toBe(3);
          expect(subRolls[1].useInTotal).toBe(true);
          expect(subRolls[1].modifiers).toEqual(new Set());

          expect(subRolls[2]).toBeInstanceOf(RollResult);
          expect(subRolls[2].value).toBe(5);
          expect(subRolls[2].useInTotal).toBe(true);
          expect(subRolls[2].modifiers).toEqual(new Set());

          expect(subRolls[3]).toBeInstanceOf(RollResult);
          expect(subRolls[3].value).toBe(4);
          expect(subRolls[3].useInTotal).toBe(true);
          expect(subRolls[3].modifiers).toEqual(new Set());

          // operator
          expect(subResults[1]).toEqual('*');

          // second die roll
          expect(subResults[2]).toBeInstanceOf(RollResults);
          expect(subResults[2].value).toBe(16);

          // 3, 2, 6, 4, 2
          subRolls = subResults[2].rolls;
          expect(subRolls).toBeInstanceOf(Array);
          expect(subRolls).toHaveLength(5);

          expect(subRolls[0]).toBeInstanceOf(RollResult);
          expect(subRolls[0].value).toBe(3);
          expect(subRolls[0].useInTotal).toBe(true);
          expect(subRolls[0].modifiers).toEqual(new Set());

          expect(subRolls[1]).toBeInstanceOf(RollResult);
          expect(subRolls[1].value).toBe(2);
          expect(subRolls[1].useInTotal).toBe(true);
          expect(subRolls[1].modifiers).toEqual(new Set());

          expect(subRolls[2]).toBeInstanceOf(RollResult);
          expect(subRolls[2].value).toBe(6);
          expect(subRolls[2].useInTotal).toBe(true);
          expect(subRolls[2].modifiers).toEqual(new Set());

          expect(subRolls[3]).toBeInstanceOf(RollResult);
          expect(subRolls[3].value).toBe(4);
          expect(subRolls[3].useInTotal).toBe(true);
          expect(subRolls[3].modifiers).toEqual(new Set());

          expect(subRolls[4]).toBeInstanceOf(RollResult);
          expect(subRolls[4].value).toBe(1);
          expect(subRolls[4].useInTotal).toBe(true);
          expect(subRolls[4].modifiers).toEqual(new Set());
        });
      });

      describe('Multiple sub-rolls', () => {
        beforeEach(() => {
          // equivalent to `{4d6+2, 2/3d2, 2d8*1d2}`
          group = new RollGroup([
            [
              new StandardDice(6, 4),
              '+',
              5,
            ],
            [
              2,
              '/',
              new StandardDice(2, 3),
            ],
            [
              new StandardDice(8, 2),
              '*',
              new StandardDice(2, 1),
            ],
          ]);

          results = new ResultGroup([
            // first sub-roll `4d6+2`
            new ResultGroup([
              // 4d6
              new RollResults([4, 2, 6, 3]),
              '+',
              5,
            ]),
            // second sub-roll `2/3d2`
            new ResultGroup([
              2,
              '/',
              // 3d2
              new RollResults([1, 1, 2]),
            ]),
            // third sub-roll `2d8*1d2`
            new ResultGroup([
              // 2d8
              new RollResults([5, 8]),
              '*',
              // 1d2
              new RollResults([2]),
            ]),
          ]);
        });

        test('returns RollResults object', () => {
          expect(mod.run(results, group)).toBe(results);
        });

        test('can keep sub-rolls from the high end', () => {
          const modifiedResults = mod.run(results, group).results;

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(3);

          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0].value).toBe(20);
          expect(modifiedResults[0].modifiers).toEqual(new Set(['drop']));
          expect(modifiedResults[0].useInTotal).toBe(false);

          expect(modifiedResults[1]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[1].value).toBe(0.5);
          expect(modifiedResults[1].modifiers).toEqual(new Set(['drop']));
          expect(modifiedResults[1].useInTotal).toBe(false);

          expect(modifiedResults[2]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[2].value).toBe(26);
          expect(modifiedResults[2].modifiers).toEqual(new Set());
          expect(modifiedResults[2].useInTotal).toBe(true);
        });

        test('can keep multiple results from high end', () => {
          // set the qty
          mod.qty = 2;

          const modifiedResults = mod.run(results, group).results;

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(3);

          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0].value).toBe(20);
          expect(modifiedResults[0].modifiers).toEqual(new Set());
          expect(modifiedResults[0].useInTotal).toBe(true);

          expect(modifiedResults[1]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[1].value).toBe(0.5);
          expect(modifiedResults[1].modifiers).toEqual(new Set(['drop']));
          expect(modifiedResults[1].useInTotal).toBe(false);

          expect(modifiedResults[2]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[2].value).toBe(26);
          expect(modifiedResults[2].modifiers).toEqual(new Set());
          expect(modifiedResults[2].useInTotal).toBe(true);
        });

        test('can keep results from low end', () => {
          // set the end to low
          mod.end = 'l';

          const modifiedResults = mod.run(results, group).results;

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(3);

          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0].value).toBe(20);
          expect(modifiedResults[0].modifiers).toEqual(new Set(['drop']));
          expect(modifiedResults[0].useInTotal).toBe(false);

          expect(modifiedResults[1]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[1].value).toBe(0.5);
          expect(modifiedResults[1].modifiers).toEqual(new Set());
          expect(modifiedResults[1].useInTotal).toBe(true);

          expect(modifiedResults[2]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[2].value).toBe(26);
          expect(modifiedResults[2].modifiers).toEqual(new Set(['drop']));
          expect(modifiedResults[2].useInTotal).toBe(false);
        });

        test('can keep multiple results from low end', () => {
          // set the end to low
          mod.end = 'l';
          // set the qty
          mod.qty = 2;

          const modifiedResults = mod.run(results, group).results;

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(3);

          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0].value).toBe(20);
          expect(modifiedResults[0].modifiers).toEqual(new Set());
          expect(modifiedResults[0].useInTotal).toBe(true);

          expect(modifiedResults[1]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[1].value).toBe(0.5);
          expect(modifiedResults[1].modifiers).toEqual(new Set());
          expect(modifiedResults[1].useInTotal).toBe(true);

          expect(modifiedResults[2]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[2].value).toBe(26);
          expect(modifiedResults[2].modifiers).toEqual(new Set(['drop']));
          expect(modifiedResults[2].useInTotal).toBe(false);
        });

        test('keeping more than rolled keeps everything', () => {
          // set the qty
          mod.qty = 20;

          const modifiedResults = mod.run(results, group).results;

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(3);

          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0].value).toBe(20);
          expect(modifiedResults[0].modifiers).toEqual(new Set());
          expect(modifiedResults[0].useInTotal).toBe(true);

          expect(modifiedResults[1]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[1].value).toBe(0.5);
          expect(modifiedResults[1].modifiers).toEqual(new Set());
          expect(modifiedResults[1].useInTotal).toBe(true);

          expect(modifiedResults[2]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[2].value).toBe(26);
          expect(modifiedResults[2].modifiers).toEqual(new Set());
          expect(modifiedResults[2].useInTotal).toBe(true);
        });
      });
    });
  });

  describe('Readonly properties', () => {
    test('cannot change name value', () => {
      const mod = new KeepModifier('l');

      expect(() => {
        mod.name = 'Foo';
      }).toThrow(TypeError);
    });
  });
});
