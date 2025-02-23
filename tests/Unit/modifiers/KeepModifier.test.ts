import { StandardDice } from '../../../src/dice';
import { KeepModifier, Modifier } from '../../../src/modifiers';
import RollResult from '../../../src/results/RollResult';
import RollResults from '../../../src/results/RollResults';
import RollGroup from '../../../src/RollGroup';
import { RangeEnd } from '../../../src/types/Enums/RangeEnd';
import { ModelType } from '../../../src/types/Enums/ModelType';
import { SingleResult } from '../../../src/types/Interfaces/Results/SingleResult';
import { RollResultType } from "../../../src/types/Types/RollResultType";
import { ResultGroup } from "../../../src/results";

describe('KeepModifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const mod = new KeepModifier(RangeEnd.High);

      expect(mod).toBeInstanceOf(KeepModifier);
      expect(mod).toBeInstanceOf(Modifier);

      expect(mod).toHaveProperty('end', RangeEnd.High);
      expect(mod).toHaveProperty('name', 'keep-h');
      expect(mod).toHaveProperty('notation', 'kh1');
      expect(mod).toHaveProperty('order', 6);
      expect(mod).toHaveProperty('run', expect.any(Function));
      expect(mod).toHaveProperty('toJSON', expect.any(Function));
      expect(mod).toHaveProperty('toString', expect.any(Function));
      expect(mod).toHaveProperty('qty', 1);
    });
  });

  describe('End', () => {
    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(KeepModifier.prototype, 'end', 'set');

      // create the modifier
      new KeepModifier(RangeEnd.High);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(RangeEnd.High);

      // create the modifier
      new KeepModifier(RangeEnd.Low);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith(RangeEnd.Low);

      // remove the spy
      spy.mockRestore();
    });

    test('can be changed', () => {
      const mod = new KeepModifier(RangeEnd.Low);

      expect(mod.end).toEqual(RangeEnd.Low);
      expect(mod.notation).toEqual('kl1');

      mod.end = RangeEnd.High;
      expect(mod.end).toEqual(RangeEnd.High);
      expect(mod.notation).toEqual('kh1');

      mod.end = RangeEnd.Low;
      expect(mod.end).toEqual(RangeEnd.Low);
      expect(mod.notation).toEqual('kl1');
    });

    test('must be "h" or "l"', () => {
      const mod = new KeepModifier(RangeEnd.High);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.end = 0;
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.end = 1;
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.end = 'foo';
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.end = ['h'];
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.end = { end: 'h' };
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.end = false;
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.end = null;
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.end = undefined;
      }).toThrow(RangeError);
    });

    test('defaults to "h"', () => {
      const mod = new KeepModifier();

      expect(mod.end).toEqual(RangeEnd.High);
    });
  });

  describe('Quantity', () => {
    test('qty must be numeric', () => {
      const mod = new KeepModifier(RangeEnd.High, 8);
      expect(mod.qty).toBe(8);
      expect(mod.notation).toEqual('kh8');

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.qty = 'foo';
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.qty = false;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.qty = true;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.qty = [];
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.qty = { qty: 4 };
      }).toThrow(TypeError);
    });

    test('qty must be positive non-zero', () => {
      let mod = new KeepModifier(RangeEnd.High, 1);
      expect(mod.qty).toBe(1);
      expect(mod.notation).toEqual('kh1');

      mod = new KeepModifier(RangeEnd.High, 324);
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
      let mod = new KeepModifier(RangeEnd.High, 5.145);
      expect(mod.qty).toBeCloseTo(5);
      expect(mod.notation).toEqual('kh5');

      mod = new KeepModifier(RangeEnd.High, 12.7);
      expect(mod.qty).toBeCloseTo(12);
      expect(mod.notation).toEqual('kh12');

      mod = new KeepModifier(RangeEnd.High, 50.5);
      expect(mod.qty).toBeCloseTo(50);
      expect(mod.notation).toEqual('kh50');
    });

    test('must be finite', () => {
      expect(() => {
        new KeepModifier(RangeEnd.High, Infinity);
      }).toThrow(RangeError);
    });

    test('can be very large number', () => {
      const mod = new KeepModifier(RangeEnd.High, 99 ** 99);
      expect(mod.qty).toBe(99 ** 99);
      expect(mod.notation).toEqual(`kh${99 ** 99}`);
    });
  });

  describe('Notation', () => {
    test('simple notation', () => {
      let mod = new KeepModifier(RangeEnd.Low, 35);
      expect(mod.notation).toEqual('kl35');

      mod = new KeepModifier(RangeEnd.High, 90876684);
      expect(mod.notation).toEqual('kh90876684');

      mod = new KeepModifier(RangeEnd.High, 7986);
      expect(mod.notation).toEqual('kh7986');

      mod = new KeepModifier(RangeEnd.Low, 2);
      expect(mod.notation).toEqual('kl2');
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const mod = new KeepModifier(RangeEnd.Low, 4);

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        end: RangeEnd.Low,
        name: 'keep-l',
        notation: 'kl4',
        qty: 4,
        type: ModelType.Modifier,
      });
    });

    test('toString output is correct', () => {
      const mod = new KeepModifier(RangeEnd.High, 4);

      expect(mod.toString()).toEqual('kh4');
    });
  });

  describe('Run', () => {
    let mod: KeepModifier;
    let results: ResultGroup|RollResults;

    beforeEach(() => {
      mod = new KeepModifier(RangeEnd.High);
    });

    describe('Basic', () => {
      let die: StandardDice;

      beforeEach(() => {
        results = new RollResults([8, 4, 2, 1, 6]);
        die = new StandardDice(10, 5);
      });

      test('returns RollResults object', () => {
        expect(mod.run(results as RollResults, die)).toBe(results);
      });

      test('can keep results from high end', () => {
        const modifiedResults = mod.run(results as RollResults, die).rolls;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(5);

        let result = modifiedResults[0] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(8);
        expect(result.value).toBe(8);
        expect(result.modifiers).toEqual(new Set());
        expect(result.useInTotal).toBe(true);

        result = modifiedResults[1] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(4);
        expect(result.value).toBe(4);
        expect(result.modifiers).toEqual(new Set(['drop']));
        expect(result.useInTotal).toBe(false);

        result = modifiedResults[2] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(2);
        expect(result.value).toBe(2);
        expect(result.modifiers).toEqual(new Set(['drop']));
        expect(result.useInTotal).toBe(false);

        result = modifiedResults[3] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(1);
        expect(result.value).toBe(1);
        expect(result.modifiers).toEqual(new Set(['drop']));
        expect(result.useInTotal).toBe(false);

        result = modifiedResults[4] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(6);
        expect(result.value).toBe(6);
        expect(result.modifiers).toEqual(new Set(['drop']));
        expect(result.useInTotal).toBe(false);
      });

      test('can keep multiple results from high end', () => {
        // set the qty
        mod.qty = 3;

        const modifiedResults = mod.run(results as RollResults, die).rolls;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(5);

        let result = modifiedResults[0] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(8);
        expect(result.value).toBe(8);
        expect(result.modifiers).toEqual(new Set());
        expect(result.useInTotal).toBe(true);

        result = modifiedResults[1] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(4);
        expect(result.value).toBe(4);
        expect(result.modifiers).toEqual(new Set());
        expect(result.useInTotal).toBe(true);

        result = modifiedResults[2] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(2);
        expect(result.value).toBe(2);
        expect(result.modifiers).toEqual(new Set(['drop']));
        expect(result.useInTotal).toBe(false);

        result = modifiedResults[3] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(1);
        expect(result.value).toBe(1);
        expect(result.modifiers).toEqual(new Set(['drop']));
        expect(result.useInTotal).toBe(false);

        result = modifiedResults[4] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(6);
        expect(result.value).toBe(6);
        expect(result.modifiers).toEqual(new Set());
        expect(result.useInTotal).toBe(true);
      });

      test('can keep results from low end', () => {
        // set the end to low
        mod.end = RangeEnd.Low;

        const modifiedResults = mod.run(results as RollResults, die).rolls;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(5);

        let result = modifiedResults[0] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(8);
        expect(result.value).toBe(8);
        expect(result.modifiers).toEqual(new Set(['drop']));
        expect(result.useInTotal).toBe(false);

        result = modifiedResults[1] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(4);
        expect(result.value).toBe(4);
        expect(result.modifiers).toEqual(new Set(['drop']));
        expect(result.useInTotal).toBe(false);

        result = modifiedResults[2] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(2);
        expect(result.value).toBe(2);
        expect(result.modifiers).toEqual(new Set(['drop']));
        expect(result.useInTotal).toBe(false);

        result = modifiedResults[3] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(1);
        expect(result.value).toBe(1);
        expect(result.modifiers).toEqual(new Set());
        expect(result.useInTotal).toBe(true);

        result = modifiedResults[4] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(6);
        expect(result.value).toBe(6);
        expect(result.modifiers).toEqual(new Set(['drop']));
        expect(result.useInTotal).toBe(false);
      });

      test('can keep multiple results from low end', () => {
        // set the end to low
        mod.end = RangeEnd.Low;
        // set the qty
        mod.qty = 3;

        const modifiedResults = mod.run(results as RollResults, die).rolls;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(5);

        let result = modifiedResults[0] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(8);
        expect(result.value).toBe(8);
        expect(result.modifiers).toEqual(new Set(['drop']));
        expect(result.useInTotal).toBe(false);

        result = modifiedResults[1] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(4);
        expect(result.value).toBe(4);
        expect(result.modifiers).toEqual(new Set());
        expect(result.useInTotal).toBe(true);

        result = modifiedResults[2] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(2);
        expect(result.value).toBe(2);
        expect(result.modifiers).toEqual(new Set());
        expect(result.useInTotal).toBe(true);

        result = modifiedResults[3] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(1);
        expect(result.value).toBe(1);
        expect(result.modifiers).toEqual(new Set());
        expect(result.useInTotal).toBe(true);

        result = modifiedResults[4] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(6);
        expect(result.value).toBe(6);
        expect(result.modifiers).toEqual(new Set(['drop']));
        expect(result.useInTotal).toBe(false);
      });

      test('keeping more than rolled keeps everything', () => {
        // set the qty
        mod.qty = 20;

        const modifiedResults = mod.run(results as RollResults, die).rolls;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(5);

        let result = modifiedResults[0] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(8);
        expect(result.value).toBe(8);
        expect(result.modifiers).toEqual(new Set());
        expect(result.useInTotal).toBe(true);

        result = modifiedResults[1] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(4);
        expect(result.value).toBe(4);
        expect(result.modifiers).toEqual(new Set());
        expect(result.useInTotal).toBe(true);

        result = modifiedResults[2] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(2);
        expect(result.value).toBe(2);
        expect(result.modifiers).toEqual(new Set());
        expect(result.useInTotal).toBe(true);

        result = modifiedResults[3] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(1);
        expect(result.value).toBe(1);
        expect(result.modifiers).toEqual(new Set());
        expect(result.useInTotal).toBe(true);

        result = modifiedResults[4] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(6);
        expect(result.value).toBe(6);
        expect(result.modifiers).toEqual(new Set());
        expect(result.useInTotal).toBe(true);
      });
    });

    describe('Roll groups', () => {
      let group: RollGroup;

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
          expect(mod.run(results as ResultGroup, group)).toBe(results);
        });

        test('can keep rolls from the high end', () => {
          const modifiedResults = mod.run(results as ResultGroup, group).results;

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(1);

          // sub-roll
          let result: ResultGroup|RollResultType|SingleResult = modifiedResults[0] as ResultGroup;
          expect(result).toBeInstanceOf(ResultGroup);
          expect(result.value).toBe(0);
          expect(result.modifiers).toEqual(new Set());
          expect(result.useInTotal).toBe(true);

          // sub-roll results
          const subResults = result.results as RollResults[];
          expect(subResults).toBeInstanceOf(Array);
          expect(subResults).toHaveLength(3);

          // first die roll
          result = subResults[0] as RollResults;
          expect(result).toBeInstanceOf(RollResults);
          expect(result.value).toBe(9);

          let subRolls = result.rolls;
          expect(subRolls).toBeInstanceOf(Array);
          expect(subRolls).toHaveLength(4);

          result = subRolls[0] as SingleResult;
          expect(result).toBeInstanceOf(RollResult);
          expect(result.value).toBe(9);
          expect(result.useInTotal).toBe(true);
          expect(result.modifiers).toEqual(new Set());

          result = subRolls[1] as SingleResult;
          expect(result).toBeInstanceOf(RollResult);
          expect(result.value).toBe(3);
          expect(result.useInTotal).toBe(false);
          expect(result.modifiers).toEqual(new Set(['drop']));

          result = subRolls[2] as SingleResult;
          expect(result).toBeInstanceOf(RollResult);
          expect(result.value).toBe(5);
          expect(result.useInTotal).toBe(false);
          expect(result.modifiers).toEqual(new Set(['drop']));

          result = subRolls[3] as SingleResult;
          expect(result).toBeInstanceOf(RollResult);
          expect(result.value).toBe(4);
          expect(result.useInTotal).toBe(false);
          expect(result.modifiers).toEqual(new Set(['drop']));

          // operator
          expect(subResults[1]).toEqual('*');

          // second die roll
          expect(subResults[2]).toBeInstanceOf(RollResults);
          expect(subResults[2]?.value).toBe(0);

          subRolls = (subResults[2] as RollResults).rolls;
          expect(subRolls).toBeInstanceOf(Array);
          expect(subRolls).toHaveLength(5);

          expect(subRolls[0]).toBeInstanceOf(RollResult);
          expect(subRolls[0]?.value).toBe(3);
          expect(subRolls[0]?.useInTotal).toBe(false);
          expect(subRolls[0]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[1]).toBeInstanceOf(RollResult);
          expect(subRolls[1]?.value).toBe(2);
          expect(subRolls[1]?.useInTotal).toBe(false);
          expect(subRolls[1]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[2]).toBeInstanceOf(RollResult);
          expect(subRolls[2]?.value).toBe(6);
          expect(subRolls[2]?.useInTotal).toBe(false);
          expect(subRolls[2]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[3]).toBeInstanceOf(RollResult);
          expect(subRolls[3]?.value).toBe(4);
          expect(subRolls[3]?.useInTotal).toBe(false);
          expect(subRolls[3]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[4]).toBeInstanceOf(RollResult);
          expect(subRolls[4]?.value).toBe(1);
          expect(subRolls[4]?.useInTotal).toBe(false);
          expect(subRolls[4]?.modifiers).toEqual(new Set(['drop']));
        });

        test('can keep multiple rolls from the high end', () => {
          // set the qty
          mod.qty = 2;

          const modifiedResults = mod.run(results as ResultGroup, group).results as ResultGroup[];

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(1);

          // sub-roll
          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0]?.value).toBe(54);
          expect(modifiedResults[0]?.modifiers).toEqual(new Set());
          expect(modifiedResults[0]?.useInTotal).toBe(true);

          // sub-roll results
          const subResults = modifiedResults[0]?.results as RollResults[];
          expect(subResults).toBeInstanceOf(Array);
          expect(subResults).toHaveLength(3);

          // first die roll
          expect(subResults[0]).toBeInstanceOf(RollResults);
          expect(subResults[0]?.value).toBe(9);

          let subRolls = subResults[0]?.rolls as SingleResult[];
          expect(subRolls).toBeInstanceOf(Array);
          expect(subRolls).toHaveLength(4);

          expect(subRolls[0]).toBeInstanceOf(RollResult);
          expect(subRolls[0]?.value).toBe(9);
          expect(subRolls[0]?.useInTotal).toBe(true);
          expect(subRolls[0]?.modifiers).toEqual(new Set());

          expect(subRolls[1]).toBeInstanceOf(RollResult);
          expect(subRolls[1]?.value).toBe(3);
          expect(subRolls[1]?.useInTotal).toBe(false);
          expect(subRolls[1]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[2]).toBeInstanceOf(RollResult);
          expect(subRolls[2]?.value).toBe(5);
          expect(subRolls[2]?.useInTotal).toBe(false);
          expect(subRolls[2]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[3]).toBeInstanceOf(RollResult);
          expect(subRolls[3]?.value).toBe(4);
          expect(subRolls[3]?.useInTotal).toBe(false);
          expect(subRolls[3]?.modifiers).toEqual(new Set(['drop']));

          // operator
          expect(subResults[1]).toEqual('*');

          // second die roll
          expect(subResults[2]).toBeInstanceOf(RollResults);
          expect(subResults[2]?.value).toBe(6);

          subRolls = subResults[2]?.rolls as SingleResult[];
          expect(subRolls).toBeInstanceOf(Array);
          expect(subRolls).toHaveLength(5);

          expect(subRolls[0]).toBeInstanceOf(RollResult);
          expect(subRolls[0]?.value).toBe(3);
          expect(subRolls[0]?.useInTotal).toBe(false);
          expect(subRolls[0]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[1]).toBeInstanceOf(RollResult);
          expect(subRolls[1]?.value).toBe(2);
          expect(subRolls[1]?.useInTotal).toBe(false);
          expect(subRolls[1]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[2]).toBeInstanceOf(RollResult);
          expect(subRolls[2]?.value).toBe(6);
          expect(subRolls[2]?.useInTotal).toBe(true);
          expect(subRolls[2]?.modifiers).toEqual(new Set());

          expect(subRolls[3]).toBeInstanceOf(RollResult);
          expect(subRolls[3]?.value).toBe(4);
          expect(subRolls[3]?.useInTotal).toBe(false);
          expect(subRolls[3]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[4]).toBeInstanceOf(RollResult);
          expect(subRolls[4]?.value).toBe(1);
          expect(subRolls[4]?.useInTotal).toBe(false);
          expect(subRolls[4]?.modifiers).toEqual(new Set(['drop']));
        });

        test('can keep results from low end', () => {
          // set the end to low
          mod.end = RangeEnd.Low;

          const modifiedResults = mod.run(results as ResultGroup, group).results as ResultGroup[];

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(1);

          // sub-roll
          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0]?.value).toBe(0);
          expect(modifiedResults[0]?.modifiers).toEqual(new Set());
          expect(modifiedResults[0]?.useInTotal).toBe(true);

          // sub-roll results
          const subResults = modifiedResults[0]?.results as RollResults[];
          expect(subResults).toBeInstanceOf(Array);
          expect(subResults).toHaveLength(3);

          // first die roll
          expect(subResults[0]).toBeInstanceOf(RollResults);
          expect(subResults[0]?.value).toBe(0);

          // 9, 3, 5, 4
          let subRolls = subResults[0]?.rolls as SingleResult[];
          expect(subRolls).toBeInstanceOf(Array);
          expect(subRolls).toHaveLength(4);

          expect(subRolls[0]).toBeInstanceOf(RollResult);
          expect(subRolls[0]?.value).toBe(9);
          expect(subRolls[0]?.useInTotal).toBe(false);
          expect(subRolls[0]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[1]).toBeInstanceOf(RollResult);
          expect(subRolls[1]?.value).toBe(3);
          expect(subRolls[1]?.useInTotal).toBe(false);
          expect(subRolls[1]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[2]).toBeInstanceOf(RollResult);
          expect(subRolls[2]?.value).toBe(5);
          expect(subRolls[2]?.useInTotal).toBe(false);
          expect(subRolls[2]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[3]).toBeInstanceOf(RollResult);
          expect(subRolls[3]?.value).toBe(4);
          expect(subRolls[3]?.useInTotal).toBe(false);
          expect(subRolls[3]?.modifiers).toEqual(new Set(['drop']));

          // operator
          expect(subResults[1]).toEqual('*');

          // second die roll
          expect(subResults[2]).toBeInstanceOf(RollResults);
          expect(subResults[2]?.value).toBe(1);

          // 3, 2, 6, 4, 1
          subRolls = subResults[2]?.rolls as SingleResult[];
          expect(subRolls).toBeInstanceOf(Array);
          expect(subRolls).toHaveLength(5);

          expect(subRolls[0]).toBeInstanceOf(RollResult);
          expect(subRolls[0]?.value).toBe(3);
          expect(subRolls[0]?.useInTotal).toBe(false);
          expect(subRolls[0]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[1]).toBeInstanceOf(RollResult);
          expect(subRolls[1]?.value).toBe(2);
          expect(subRolls[1]?.useInTotal).toBe(false);
          expect(subRolls[1]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[2]).toBeInstanceOf(RollResult);
          expect(subRolls[2]?.value).toBe(6);
          expect(subRolls[2]?.useInTotal).toBe(false);
          expect(subRolls[2]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[3]).toBeInstanceOf(RollResult);
          expect(subRolls[3]?.value).toBe(4);
          expect(subRolls[3]?.useInTotal).toBe(false);
          expect(subRolls[3]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[4]).toBeInstanceOf(RollResult);
          expect(subRolls[4]?.value).toBe(1);
          expect(subRolls[4]?.useInTotal).toBe(true);
          expect(subRolls[4]?.modifiers).toEqual(new Set());
        });

        test('can keep multiple results from low end', () => {
          // set the end to low
          mod.end = RangeEnd.Low;
          // set the qty
          mod.qty = 2;

          const modifiedResults = mod.run(results as ResultGroup, group).results as ResultGroup[];

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(1);

          // sub-roll
          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0]?.value).toBe(0);
          expect(modifiedResults[0]?.modifiers).toEqual(new Set());
          expect(modifiedResults[0]?.useInTotal).toBe(true);

          // sub-roll results
          const subResults = modifiedResults[0]?.results as RollResults[];
          expect(subResults).toBeInstanceOf(Array);
          expect(subResults).toHaveLength(3);

          // first die roll
          expect(subResults[0]).toBeInstanceOf(RollResults);
          expect(subResults[0]?.value).toBe(0);

          // 9, 3, 5, 4
          let subRolls = subResults[0]?.rolls as SingleResult[];
          expect(subRolls).toBeInstanceOf(Array);
          expect(subRolls).toHaveLength(4);

          expect(subRolls[0]).toBeInstanceOf(RollResult);
          expect(subRolls[0]?.value).toBe(9);
          expect(subRolls[0]?.useInTotal).toBe(false);
          expect(subRolls[0]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[1]).toBeInstanceOf(RollResult);
          expect(subRolls[1]?.value).toBe(3);
          expect(subRolls[1]?.useInTotal).toBe(false);
          expect(subRolls[1]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[2]).toBeInstanceOf(RollResult);
          expect(subRolls[2]?.value).toBe(5);
          expect(subRolls[2]?.useInTotal).toBe(false);
          expect(subRolls[2]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[3]).toBeInstanceOf(RollResult);
          expect(subRolls[3]?.value).toBe(4);
          expect(subRolls[3]?.useInTotal).toBe(false);
          expect(subRolls[3]?.modifiers).toEqual(new Set(['drop']));

          // operator
          expect(subResults[1]).toEqual('*');

          // second die roll
          expect(subResults[2]).toBeInstanceOf(RollResults);
          expect(subResults[2]?.value).toBe(3);

          // 3, 2, 6, 4, 1
          subRolls = subResults[2]?.rolls as SingleResult[];
          expect(subRolls).toBeInstanceOf(Array);
          expect(subRolls).toHaveLength(5);

          expect(subRolls[0]).toBeInstanceOf(RollResult);
          expect(subRolls[0]?.value).toBe(3);
          expect(subRolls[0]?.useInTotal).toBe(false);
          expect(subRolls[0]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[1]).toBeInstanceOf(RollResult);
          expect(subRolls[1]?.value).toBe(2);
          expect(subRolls[1]?.useInTotal).toBe(true);
          expect(subRolls[1]?.modifiers).toEqual(new Set());

          expect(subRolls[2]).toBeInstanceOf(RollResult);
          expect(subRolls[2]?.value).toBe(6);
          expect(subRolls[2]?.useInTotal).toBe(false);
          expect(subRolls[2]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[3]).toBeInstanceOf(RollResult);
          expect(subRolls[3]?.value).toBe(4);
          expect(subRolls[3]?.useInTotal).toBe(false);
          expect(subRolls[3]?.modifiers).toEqual(new Set(['drop']));

          expect(subRolls[4]).toBeInstanceOf(RollResult);
          expect(subRolls[4]?.value).toBe(1);
          expect(subRolls[4]?.useInTotal).toBe(true);
          expect(subRolls[4]?.modifiers).toEqual(new Set());
        });

        test('keeping more than rolled keeps everything', () => {
          // set the qty
          mod.qty = 20;

          const modifiedResults = mod.run(results as ResultGroup, group).results as ResultGroup[];

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(1);

          // sub-roll
          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0]?.value).toBe(336);
          expect(modifiedResults[0]?.modifiers).toEqual(new Set());
          expect(modifiedResults[0]?.useInTotal).toBe(true);

          // sub-roll results
          const subResults = modifiedResults[0]?.results as RollResults[];
          expect(subResults).toBeInstanceOf(Array);
          expect(subResults).toHaveLength(3);

          // first die roll
          expect(subResults[0]).toBeInstanceOf(RollResults);
          expect(subResults[0]?.value).toBe(21);

          // 9, 3, 5, 4
          let subRolls = subResults[0]?.rolls as SingleResult[];
          expect(subRolls).toBeInstanceOf(Array);
          expect(subRolls).toHaveLength(4);

          expect(subRolls[0]).toBeInstanceOf(RollResult);
          expect(subRolls[0]?.value).toBe(9);
          expect(subRolls[0]?.useInTotal).toBe(true);
          expect(subRolls[0]?.modifiers).toEqual(new Set());

          expect(subRolls[1]).toBeInstanceOf(RollResult);
          expect(subRolls[1]?.value).toBe(3);
          expect(subRolls[1]?.useInTotal).toBe(true);
          expect(subRolls[1]?.modifiers).toEqual(new Set());

          expect(subRolls[2]).toBeInstanceOf(RollResult);
          expect(subRolls[2]?.value).toBe(5);
          expect(subRolls[2]?.useInTotal).toBe(true);
          expect(subRolls[2]?.modifiers).toEqual(new Set());

          expect(subRolls[3]).toBeInstanceOf(RollResult);
          expect(subRolls[3]?.value).toBe(4);
          expect(subRolls[3]?.useInTotal).toBe(true);
          expect(subRolls[3]?.modifiers).toEqual(new Set());

          // operator
          expect(subResults[1]).toEqual('*');

          // second die roll
          expect(subResults[2]).toBeInstanceOf(RollResults);
          expect(subResults[2]?.value).toBe(16);

          // 3, 2, 6, 4, 2
          subRolls = subResults[2]?.rolls as SingleResult[];
          expect(subRolls).toBeInstanceOf(Array);
          expect(subRolls).toHaveLength(5);

          expect(subRolls[0]).toBeInstanceOf(RollResult);
          expect(subRolls[0]?.value).toBe(3);
          expect(subRolls[0]?.useInTotal).toBe(true);
          expect(subRolls[0]?.modifiers).toEqual(new Set());

          expect(subRolls[1]).toBeInstanceOf(RollResult);
          expect(subRolls[1]?.value).toBe(2);
          expect(subRolls[1]?.useInTotal).toBe(true);
          expect(subRolls[1]?.modifiers).toEqual(new Set());

          expect(subRolls[2]).toBeInstanceOf(RollResult);
          expect(subRolls[2]?.value).toBe(6);
          expect(subRolls[2]?.useInTotal).toBe(true);
          expect(subRolls[2]?.modifiers).toEqual(new Set());

          expect(subRolls[3]).toBeInstanceOf(RollResult);
          expect(subRolls[3]?.value).toBe(4);
          expect(subRolls[3]?.useInTotal).toBe(true);
          expect(subRolls[3]?.modifiers).toEqual(new Set());

          expect(subRolls[4]).toBeInstanceOf(RollResult);
          expect(subRolls[4]?.value).toBe(1);
          expect(subRolls[4]?.useInTotal).toBe(true);
          expect(subRolls[4]?.modifiers).toEqual(new Set());
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
          expect(mod.run(results as ResultGroup, group)).toBe(results);
        });

        test('can keep sub-rolls from the high end', () => {
          const modifiedResults = mod.run(results as ResultGroup, group).results as ResultGroup[];

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(3);

          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0]?.value).toBe(20);
          expect(modifiedResults[0]?.modifiers).toEqual(new Set(['drop']));
          expect(modifiedResults[0]?.useInTotal).toBe(false);

          expect(modifiedResults[1]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[1]?.value).toBe(0.5);
          expect(modifiedResults[1]?.modifiers).toEqual(new Set(['drop']));
          expect(modifiedResults[1]?.useInTotal).toBe(false);

          expect(modifiedResults[2]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[2]?.value).toBe(26);
          expect(modifiedResults[2]?.modifiers).toEqual(new Set());
          expect(modifiedResults[2]?.useInTotal).toBe(true);
        });

        test('can keep multiple results from high end', () => {
          // set the qty
          mod.qty = 2;

          const modifiedResults = mod.run(results as ResultGroup, group).results as ResultGroup[];

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(3);

          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0]?.value).toBe(20);
          expect(modifiedResults[0]?.modifiers).toEqual(new Set());
          expect(modifiedResults[0]?.useInTotal).toBe(true);

          expect(modifiedResults[1]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[1]?.value).toBe(0.5);
          expect(modifiedResults[1]?.modifiers).toEqual(new Set(['drop']));
          expect(modifiedResults[1]?.useInTotal).toBe(false);

          expect(modifiedResults[2]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[2]?.value).toBe(26);
          expect(modifiedResults[2]?.modifiers).toEqual(new Set());
          expect(modifiedResults[2]?.useInTotal).toBe(true);
        });

        test('can keep results from low end', () => {
          // set the end to low
          mod.end = RangeEnd.Low;

          const modifiedResults = mod.run(results as ResultGroup, group).results as ResultGroup[];

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(3);

          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0]?.value).toBe(20);
          expect(modifiedResults[0]?.modifiers).toEqual(new Set(['drop']));
          expect(modifiedResults[0]?.useInTotal).toBe(false);

          expect(modifiedResults[1]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[1]?.value).toBe(0.5);
          expect(modifiedResults[1]?.modifiers).toEqual(new Set());
          expect(modifiedResults[1]?.useInTotal).toBe(true);

          expect(modifiedResults[2]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[2]?.value).toBe(26);
          expect(modifiedResults[2]?.modifiers).toEqual(new Set(['drop']));
          expect(modifiedResults[2]?.useInTotal).toBe(false);
        });

        test('can keep multiple results from low end', () => {
          // set the end to low
          mod.end = RangeEnd.Low;
          // set the qty
          mod.qty = 2;

          const modifiedResults = mod.run(results as ResultGroup, group).results as ResultGroup[];

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(3);

          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0]?.value).toBe(20);
          expect(modifiedResults[0]?.modifiers).toEqual(new Set());
          expect(modifiedResults[0]?.useInTotal).toBe(true);

          expect(modifiedResults[1]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[1]?.value).toBe(0.5);
          expect(modifiedResults[1]?.modifiers).toEqual(new Set());
          expect(modifiedResults[1]?.useInTotal).toBe(true);

          expect(modifiedResults[2]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[2]?.value).toBe(26);
          expect(modifiedResults[2]?.modifiers).toEqual(new Set(['drop']));
          expect(modifiedResults[2]?.useInTotal).toBe(false);
        });

        test('keeping more than rolled keeps everything', () => {
          // set the qty
          mod.qty = 20;

          const modifiedResults = mod.run(results as ResultGroup, group).results as ResultGroup[];

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(3);

          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0]?.value).toBe(20);
          expect(modifiedResults[0]?.modifiers).toEqual(new Set());
          expect(modifiedResults[0]?.useInTotal).toBe(true);

          expect(modifiedResults[1]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[1]?.value).toBe(0.5);
          expect(modifiedResults[1]?.modifiers).toEqual(new Set());
          expect(modifiedResults[1]?.useInTotal).toBe(true);

          expect(modifiedResults[2]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[2]?.value).toBe(26);
          expect(modifiedResults[2]?.modifiers).toEqual(new Set());
          expect(modifiedResults[2]?.useInTotal).toBe(true);
        });
      });
    });
  });
});
