import { StandardDice } from '../../../src/dice';
import { ComparisonModifier, TargetModifier } from '../../../src/modifiers';
import ComparePoint from '../../../src/ComparePoint';
import ResultGroup from '../../../src/results/ResultGroup';
import RollResult from '../../../src/results/RollResult';
import RollResults from '../../../src/results/RollResults';
import RollGroup from '../../../src/RollGroup';
import { ComparisonOperator } from "../../../src/types/Enums/ComparisonOperator";
import { SingleResult } from "../../../src/types/Interfaces/Results/SingleResult";
import { ModelType } from "../../../src/types/Enums/ModelType";

describe('TargetModifier', () => {
  let sCP: ComparePoint;
  let fCP: ComparePoint;
  let mod: TargetModifier;

  beforeEach(() => {
    sCP = new ComparePoint('>', 8);
    fCP = new ComparePoint('<', 4);
    mod = new TargetModifier(sCP, fCP);
  });

  describe('Initialisation', () => {
    test('model structure', () => {
      expect(mod).toBeInstanceOf(TargetModifier);
      expect(mod).toBeInstanceOf(ComparisonModifier);
      expect(mod).toEqual(expect.objectContaining({
        failureComparePoint: fCP,
        isFailure: expect.any(Function),
        isNeutral: expect.any(Function),
        isSuccess: expect.any(Function),
        name: 'target',
        notation: '>8f<4',
        order: 8,
        run: expect.any(Function),
        successComparePoint: sCP,
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });
  });

  describe('Success Compare Point', () => {
    test('gets set in constructor', () => {
      mod = new TargetModifier(sCP);

      expect(mod.successComparePoint).toBe(sCP);
      expect(mod.notation).toBe('>8');
    });

    test('setting in constructor calls `comparePoint` setter in parent', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'comparePoint', 'set');

      // create the modifier
      mod = new TargetModifier(sCP);

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('setter uses `comparePoint` setter in parent', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'comparePoint', 'set');

      // create the modifier
      mod = new TargetModifier(new ComparePoint(ComparisonOperator.Equal, 6));

      mod.successComparePoint = sCP;

      expect(mod.successComparePoint).toBe(sCP);
      expect(spy).toHaveBeenCalledTimes(2);

      // remove the spy
      spy.mockRestore();
    });

    test('getter uses `comparePoint` getter in parent', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'comparePoint', 'get');

      // create the modifier
      mod = new TargetModifier(sCP);

      // call the success compare point getter
      expect(mod.successComparePoint).toBe(sCP);
      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });
  });

  describe('Failure Compare Point', () => {
    test('gets set in constructor', () => {
      mod = new TargetModifier(sCP, fCP);

      expect(mod.failureComparePoint).toBe(fCP);
      expect(mod.notation).toBe('>8f<4');
    });

    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(TargetModifier.prototype, 'failureComparePoint', 'set');

      // create the modifier
      mod = new TargetModifier(sCP, fCP);

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('falsey value gets set to `null', () => {
      mod = new TargetModifier(sCP);

      mod.failureComparePoint = null;
      expect(mod.failureComparePoint).toBe(null);

      // @ts-expect-error testing invalid value
      mod.failureComparePoint = undefined;
      expect(mod.failureComparePoint).toBe(null);

      // @ts-expect-error testing invalid value
      mod.failureComparePoint = 0;
      expect(mod.failureComparePoint).toBe(null);

      // @ts-expect-error testing invalid value
      mod.failureComparePoint = false;
      expect(mod.failureComparePoint).toBe(null);
    });

    test('must be instance of ComparePoint', () => {
      mod = new TargetModifier(sCP);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.failureComparePoint = 'foo';
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.failureComparePoint = 1;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.failureComparePoint = true;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.failureComparePoint = [fCP];
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        mod.failureComparePoint = { comparePoint: fCP };
      }).toThrow(TypeError);
    });
  });

  describe('Success Matching', () => {
    test('isSuccess uses `isComparePoint` in parent', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'isComparePoint');
      mod = new TargetModifier(sCP);

      // attempt to match
      expect(mod.isSuccess(9)).toBe(true);
      expect(mod.isSuccess(8)).toBe(false);
      expect(mod.isSuccess(7)).toBe(false);
      expect(mod.isSuccess(0)).toBe(false);

      expect(spy).toHaveBeenCalledTimes(4);

      // remove the spy
      spy.mockRestore();
    });
  });

  describe('Failure Matching', () => {
    test('can match against values', () => {
      const spy = jest.spyOn(ComparePoint.prototype, 'isMatch');

      // attempt to match
      expect(mod.isFailure(4)).toBe(false);
      expect(mod.isFailure(8)).toBe(false);
      expect(mod.isFailure(3)).toBe(true);
      expect(mod.isFailure(0)).toBe(true);
      expect(mod.isFailure(-25)).toBe(true);
      expect(mod.isFailure(25)).toBe(false);

      expect(spy).toHaveBeenCalledTimes(6);

      // remove the spy
      spy.mockRestore();
    });

    test('with no ComparePoint return false', () => {
      mod = new TargetModifier(sCP);

      expect(mod.isFailure(3)).toBe(false);
    });
  });

  describe('Neutral Matching', () => {
    test('can match against values', () => {
      const spySuccess = jest.spyOn(TargetModifier.prototype, 'isSuccess');
      const spyFail = jest.spyOn(TargetModifier.prototype, 'isFailure');

      // attempt to match
      expect(mod.isNeutral(4)).toBe(true);
      expect(mod.isNeutral(8)).toBe(true);
      expect(mod.isNeutral(3)).toBe(false);
      expect(mod.isNeutral(0)).toBe(false);
      expect(mod.isNeutral(-25)).toBe(false);
      expect(mod.isNeutral(25)).toBe(false);
      expect(mod.isNeutral(6)).toBe(true);
      expect(mod.isNeutral(7)).toBe(true);

      expect(spySuccess).toHaveBeenCalled();
      expect(spyFail).toHaveBeenCalled();

      // remove the spy
      spySuccess.mockRestore();
      spyFail.mockRestore();
    });

    test('with no ComparePoints return true', () => {
      // @ts-expect-error testing with no compare point
      mod = new TargetModifier();

      expect(mod.isNeutral(3)).toBe(true);
      expect(mod.isNeutral(8)).toBe(true);
      expect(mod.isNeutral(4)).toBe(true);
      expect(mod.isNeutral(9)).toBe(true);
    });
  });

  describe('Notation', () => {
    test('success compare point', () => {
      mod = new TargetModifier(new ComparePoint('<=', 78058));
      expect(mod.notation).toEqual('<=78058');

      mod = new TargetModifier(new ComparePoint('!=', 45));
      expect(mod.notation).toEqual('!=45');

      mod = new TargetModifier(new ComparePoint('<>', 24));
      expect(mod.notation).toEqual('<>24');

      mod = new TargetModifier(new ComparePoint('>=', 2));
      expect(mod.notation).toEqual('>=2');

      mod = new TargetModifier(new ComparePoint('=', 1579.565));
      expect(mod.notation).toEqual('=1579.565');
    });

    test('failure compare point', () => {
      mod = new TargetModifier(
        new ComparePoint('<=', 78058),
        new ComparePoint('=', 54),
      );
      expect(mod.notation).toEqual('<=78058f=54');

      mod = new TargetModifier(
        new ComparePoint('!=', 45),
        new ComparePoint('>=', 3697),
      );
      expect(mod.notation).toEqual('!=45f>=3697');

      mod = new TargetModifier(
        new ComparePoint('>=', 2),
        new ComparePoint('<>', 67.47),
      );
      expect(mod.notation).toEqual('>=2f<>67.47');

      mod = new TargetModifier(
        new ComparePoint('=', 1579.565),
        new ComparePoint('<=', 2),
      );
      expect(mod.notation).toEqual('=1579.565f<=2');
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        name: 'target',
        notation: '>8f<4',
        type: ModelType.Modifier,
        failureComparePoint: {
          name: 'compare-point',
          operator: ComparisonOperator.LessThan,
          type: ModelType.ComparePoint,
          value: 4,
        },
        successComparePoint: {
          name: 'compare-point',
          operator: ComparisonOperator.GreaterThan,
          type: ModelType.ComparePoint,
          value: 8,
        },
      });
    });

    test('toString output is correct', () => {
      expect(mod.toString()).toEqual('>8f<4');
    });
  });

  describe('Run', () => {
    let die: StandardDice;
    let results: RollResults|ResultGroup;

    describe('Basic', () => {
      beforeEach(() => {
        results = new RollResults([8, 4, 2, 9, 1, 6, 10]);
        die = new StandardDice(10, 6);
      });

      test('returns RollResults object', () => {
        expect(mod.run(results, die)).toBe(results);
      });

      test('flags successes and failures', () => {
        const modifiedResults = (mod.run(results, die) as RollResults).rolls;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(7);

        let result = modifiedResults[0] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(0);
        expect(result.value).toBe(8);
        expect(result.modifiers).toEqual(new Set());
        expect(result.useInTotal).toBe(true);

        result = modifiedResults[1] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(0);
        expect(result.value).toBe(4);
        expect(result.modifiers).toEqual(new Set());
        expect(result.useInTotal).toBe(true);

        result = modifiedResults[2] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(-1);
        expect(result.value).toBe(2);
        expect(result.modifiers).toEqual(new Set(['target-failure']));
        expect(result.useInTotal).toBe(true);

        result = modifiedResults[3] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(1);
        expect(result.value).toBe(9);
        expect(result.modifiers).toEqual(new Set(['target-success']));
        expect(result.useInTotal).toBe(true);

        result = modifiedResults[4] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(-1);
        expect(result.value).toBe(1);
        expect(result.modifiers).toEqual(new Set(['target-failure']));
        expect(result.useInTotal).toBe(true);

        result = modifiedResults[5] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(0);
        expect(result.value).toBe(6);
        expect(result.modifiers).toEqual(new Set());
        expect(result.useInTotal).toBe(true);

        result = modifiedResults[6] as SingleResult;
        expect(result).toBeInstanceOf(RollResult);
        expect(result.calculationValue).toBe(1);
        expect(result.value).toBe(10);
        expect(result.modifiers).toEqual(new Set(['target-success']));
        expect(result.useInTotal).toBe(true);
      });
    });

    describe('Roll groups', () => {
      let group: RollGroup;

      describe('Single sub-rolls', () => {
        beforeEach(() => {
          // equivalent to `{4d6+5}`
          group = new RollGroup([
            [
              new StandardDice(6, 4),
              '+',
              5,
            ],
          ]);

          results = new ResultGroup([
            // first sub-roll `4d6+5`
            new ResultGroup([
              // 4d6
              new RollResults([4, 2, 6, 3]),
              '+',
              5,
            ]),
          ]);
        });

        test('returns ResultGroup object', () => {
          mod = new TargetModifier(new ComparePoint('>', 2));
          expect(mod.run(results, group)).toBe(results);
        });

        test('flags successes', () => {
          mod = new TargetModifier(new ComparePoint('>', 10));
          const modifiedResults = (mod.run(results, group) as ResultGroup).results;

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(1);

          const result = modifiedResults[0] as ResultGroup;
          expect(result).toBeInstanceOf(ResultGroup);
          expect(result.calculationValue).toBe(1);
          expect(result.value).toBe(20);
          expect(result.modifiers).toEqual(new Set(['target-success']));
          expect(result.useInTotal).toBe(true);
        });

        test('flags failures', () => {
          mod = new TargetModifier(
            new ComparePoint('>', 25),
            new ComparePoint('<=', 20),
          );
          const modifiedResults = (mod.run(results, group) as ResultGroup).results;

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(1);

          const result = modifiedResults[0] as ResultGroup;
          expect(result).toBeInstanceOf(ResultGroup);
          expect(result.calculationValue).toBe(-1);
          expect(result.value).toBe(20);
          expect(result.modifiers).toEqual(new Set(['target-failure']));
          expect(result.useInTotal).toBe(true);
        });

        test('flags neutral', () => {
          mod = new TargetModifier(
            new ComparePoint('>', 25),
            new ComparePoint('<', 10),
          );
          const modifiedResults = (mod.run(results, group) as ResultGroup).results;

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(1);

          const result = modifiedResults[0] as ResultGroup;
          expect(result).toBeInstanceOf(ResultGroup);
          expect(result.calculationValue).toBe(0);
          expect(result.value).toBe(20);
          expect(result.modifiers).toEqual(new Set());
          expect(result.useInTotal).toBe(true);
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

          sCP = new ComparePoint('>', 20);
          fCP = new ComparePoint('<', 4);
          mod = new TargetModifier(sCP, fCP);
        });

        test('returns RollResults object', () => {
          expect(mod.run(results, group)).toBe(results);
        });

        test('flags successes and failures', () => {
          const modifiedResults = (mod.run(results, group) as ResultGroup).results;

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(3);

          let result = modifiedResults[0] as ResultGroup;
          expect(result).toBeInstanceOf(ResultGroup);
          expect(result.calculationValue).toBe(0);
          expect(result.value).toBe(20);
          expect(result.modifiers).toEqual(new Set());
          expect(result.useInTotal).toBe(true);

          result = modifiedResults[1] as ResultGroup;
          expect(result).toBeInstanceOf(ResultGroup);
          expect(result.calculationValue).toBe(-1);
          expect(result.value).toBe(0.5);
          expect(result.modifiers).toEqual(new Set(['target-failure']));
          expect(result.useInTotal).toBe(true);

          result = modifiedResults[2] as ResultGroup;
          expect(result).toBeInstanceOf(ResultGroup);
          expect(result.calculationValue).toBe(1);
          expect(result.value).toBe(26);
          expect(result.modifiers).toEqual(new Set(['target-success']));
          expect(result.useInTotal).toBe(true);
        });
      });
    });
  });
});
