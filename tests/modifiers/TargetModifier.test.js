import { StandardDice } from '../../src/dice/index.js';
import { ComparisonModifier, TargetModifier } from '../../src/modifiers/index.js';
import ComparePoint from '../../src/ComparePoint.js';
import ResultGroup from '../../src/results/ResultGroup.js';
import RollResult from '../../src/results/RollResult.js';
import RollResults from '../../src/results/RollResults.js';
import RollGroup from '../../src/RollGroup.js';

describe('TargetModifier', () => {
  let sCP;
  let fCP;
  let mod;

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
      mod = new TargetModifier();

      mod.successComparePoint = sCP;

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('getter uses `comparePoint` getter in parent', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'comparePoint', 'get');

      // create the modifier
      mod = new TargetModifier(sCP);

      // call the success compare point getter
      expect(mod.successComparePoint).toBeInstanceOf(ComparePoint);

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
      expect(spy).toHaveBeenCalledWith(fCP);

      // remove the spy
      spy.mockRestore();
    });

    test('falsey value gets set to `null', () => {
      mod = new TargetModifier(sCP);

      mod.failureComparePoint = null;
      expect(mod.failureComparePoint).toBe(null);

      mod.failureComparePoint = undefined;
      expect(mod.failureComparePoint).toBe(null);

      mod.failureComparePoint = 0;
      expect(mod.failureComparePoint).toBe(null);

      mod.failureComparePoint = false;
      expect(mod.failureComparePoint).toBe(null);
    });

    test('must be instance of ComparePoint', () => {
      mod = new TargetModifier(sCP);

      expect(() => {
        mod.failureComparePoint = 'foo';
      }).toThrow(TypeError);

      expect(() => {
        mod.failureComparePoint = 1;
      }).toThrow(TypeError);

      expect(() => {
        mod.failureComparePoint = true;
      }).toThrow(TypeError);

      expect(() => {
        mod.failureComparePoint = [fCP];
      }).toThrow(TypeError);

      expect(() => {
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
        new ComparePoint('!=', 67.47),
      );
      expect(mod.notation).toEqual('>=2f!=67.47');

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
        type: 'modifier',
        failureComparePoint: {
          operator: '<',
          type: 'compare-point',
          value: 4,
        },
        successComparePoint: {
          operator: '>',
          type: 'compare-point',
          value: 8,
        },
      });
    });

    test('toString output is correct', () => {
      expect(mod.toString()).toEqual('>8f<4');
    });
  });

  describe('Readonly properties', () => {
    test('cannot change name value', () => {
      mod = new TargetModifier(sCP);

      expect(() => {
        mod.name = 'Foo';
      }).toThrow(TypeError);
    });
  });

  describe('Run', () => {
    let die;
    let results;

    describe('Basic', () => {
      beforeEach(() => {
        results = new RollResults([8, 4, 2, 9, 1, 6, 10]);
        die = new StandardDice(10, 6);
      });

      test('returns RollResults object', () => {
        expect(mod.run(results, die)).toBe(results);
      });

      test('flags successes and failures', () => {
        const modifiedResults = mod.run(results, die).rolls;

        expect(modifiedResults).toBeInstanceOf(Array);
        expect(modifiedResults).toHaveLength(7);

        expect(modifiedResults[0]).toBeInstanceOf(RollResult);
        expect(modifiedResults[0].calculationValue).toBe(0);
        expect(modifiedResults[0].value).toBe(8);
        expect(modifiedResults[0].modifiers).toEqual(new Set());
        expect(modifiedResults[0].useInTotal).toBe(true);

        expect(modifiedResults[1]).toBeInstanceOf(RollResult);
        expect(modifiedResults[1].calculationValue).toBe(0);
        expect(modifiedResults[1].value).toBe(4);
        expect(modifiedResults[1].modifiers).toEqual(new Set());
        expect(modifiedResults[1].useInTotal).toBe(true);

        expect(modifiedResults[2]).toBeInstanceOf(RollResult);
        expect(modifiedResults[2].calculationValue).toBe(-1);
        expect(modifiedResults[2].value).toBe(2);
        expect(modifiedResults[2].modifiers).toEqual(new Set(['target-failure']));
        expect(modifiedResults[2].useInTotal).toBe(true);

        expect(modifiedResults[3]).toBeInstanceOf(RollResult);
        expect(modifiedResults[3].calculationValue).toBe(1);
        expect(modifiedResults[3].value).toBe(9);
        expect(modifiedResults[3].modifiers).toEqual(new Set(['target-success']));
        expect(modifiedResults[3].useInTotal).toBe(true);

        expect(modifiedResults[4]).toBeInstanceOf(RollResult);
        expect(modifiedResults[4].calculationValue).toBe(-1);
        expect(modifiedResults[4].value).toBe(1);
        expect(modifiedResults[4].modifiers).toEqual(new Set(['target-failure']));
        expect(modifiedResults[4].useInTotal).toBe(true);

        expect(modifiedResults[5]).toBeInstanceOf(RollResult);
        expect(modifiedResults[5].calculationValue).toBe(0);
        expect(modifiedResults[5].value).toBe(6);
        expect(modifiedResults[5].modifiers).toEqual(new Set());
        expect(modifiedResults[5].useInTotal).toBe(true);

        expect(modifiedResults[6]).toBeInstanceOf(RollResult);
        expect(modifiedResults[6].calculationValue).toBe(1);
        expect(modifiedResults[6].value).toBe(10);
        expect(modifiedResults[6].modifiers).toEqual(new Set(['target-success']));
        expect(modifiedResults[6].useInTotal).toBe(true);
      });
    });

    describe('Roll groups', () => {
      let group;

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

        test('returns RollResults object', () => {
          mod = new TargetModifier(new ComparePoint('>', 2));
          expect(mod.run(results, group)).toBe(results);
        });

        test('flags successes', () => {
          mod = new TargetModifier(new ComparePoint('>', 10));
          const modifiedResults = mod.run(results, group).results;

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(1);

          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0].calculationValue).toBe(1);
          expect(modifiedResults[0].value).toBe(20);
          expect(modifiedResults[0].modifiers).toEqual(new Set(['target-success']));
          expect(modifiedResults[0].useInTotal).toBe(true);
        });

        test('flags failures', () => {
          mod = new TargetModifier(
            new ComparePoint('>', 25),
            new ComparePoint('<=', 20),
          );
          const modifiedResults = mod.run(results, group).results;

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(1);

          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0].calculationValue).toBe(-1);
          expect(modifiedResults[0].value).toBe(20);
          expect(modifiedResults[0].modifiers).toEqual(new Set(['target-failure']));
          expect(modifiedResults[0].useInTotal).toBe(true);
        });

        test('flags neutral', () => {
          mod = new TargetModifier(
            new ComparePoint('>', 25),
            new ComparePoint('<', 10),
          );
          const modifiedResults = mod.run(results, group).results;

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(1);

          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0].calculationValue).toBe(0);
          expect(modifiedResults[0].value).toBe(20);
          expect(modifiedResults[0].modifiers).toEqual(new Set());
          expect(modifiedResults[0].useInTotal).toBe(true);
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
          const modifiedResults = mod.run(results, group).results;

          expect(modifiedResults).toBeInstanceOf(Array);
          expect(modifiedResults).toHaveLength(3);

          expect(modifiedResults[0]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[0].calculationValue).toBe(0);
          expect(modifiedResults[0].value).toBe(20);
          expect(modifiedResults[0].modifiers).toEqual(new Set());
          expect(modifiedResults[0].useInTotal).toBe(true);

          expect(modifiedResults[1]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[1].calculationValue).toBe(-1);
          expect(modifiedResults[1].value).toBe(0.5);
          expect(modifiedResults[1].modifiers).toEqual(new Set(['target-failure']));
          expect(modifiedResults[1].useInTotal).toBe(true);

          expect(modifiedResults[2]).toBeInstanceOf(ResultGroup);
          expect(modifiedResults[2].calculationValue).toBe(1);
          expect(modifiedResults[2].value).toBe(26);
          expect(modifiedResults[2].modifiers).toEqual(new Set(['target-success']));
          expect(modifiedResults[2].useInTotal).toBe(true);
        });
      });
    });
  });
});
