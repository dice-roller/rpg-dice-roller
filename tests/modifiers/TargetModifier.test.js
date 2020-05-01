import TargetModifier from '../../src/modifiers/TargetModifier';
import ComparePoint from '../../src/ComparePoint';
import ComparisonModifier from '../../src/modifiers/ComparisonModifier';
import RollResults from '../../src/results/RollResults';
import StandardDice from '../../src/dice/StandardDice';
import RequiredArgumentError from '../../src/exceptions/RequiredArgumentErrorError';

describe('TargetModifier', () => {
  let sCP; let fCP; let
    mod;

  beforeEach(() => {
    sCP = new ComparePoint('>', 8);
    fCP = new ComparePoint('<', 4);
    mod = new TargetModifier('>8f<4', sCP, fCP);
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
        name: 'TargetModifier',
        notation: '>8f<4',
        run: expect.any(Function),
        successComparePoint: sCP,
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });

    test('constructor requires notation', () => {
      expect(() => {
        new TargetModifier();
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new TargetModifier(false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new TargetModifier(null);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new TargetModifier(undefined);
      }).toThrow(RequiredArgumentError);
    });
  });

  describe('Success Compare Point', () => {
    test('gets set in constructor', () => {
      mod = new TargetModifier('>8', sCP);

      expect(mod.successComparePoint).toBe(sCP);
    });

    test('setting in constructor calls `comparePoint` setter in parent', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'comparePoint', 'set');

      // create the modifier
      mod = new TargetModifier('>8', sCP);

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('setter uses `comparePoint` setter in parent', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'comparePoint', 'set');

      // create the modifier
      mod = new TargetModifier('>8');

      mod.successComparePoint = sCP;

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('getter uses `comparePoint` getter in parent', () => {
      const spy = jest.spyOn(ComparisonModifier.prototype, 'comparePoint', 'get');

      // create the modifier
      mod = new TargetModifier('>8', sCP);

      // call the success compare point getter
      expect(mod.successComparePoint).toBeInstanceOf(ComparePoint);

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });
  });

  describe('Failure Compare Point', () => {
    test('gets set in constructor', () => {
      mod = new TargetModifier('>8', sCP, fCP);

      expect(mod.failureComparePoint).toBe(fCP);
    });

    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(TargetModifier.prototype, 'failureComparePoint', 'set');

      // create the modifier
      mod = new TargetModifier('>8', sCP, fCP);

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('falsey value gets set to `null', () => {
      mod = new TargetModifier('>8f<4');

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
      mod = new TargetModifier('>8f<4');

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
      mod = new TargetModifier('>8', sCP);

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
      mod = new TargetModifier('>8<4');

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
      mod = new TargetModifier('>8<4');

      expect(mod.isNeutral(3)).toBe(true);
      expect(mod.isNeutral(8)).toBe(true);
      expect(mod.isNeutral(4)).toBe(true);
      expect(mod.isNeutral(9)).toBe(true);
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        name: 'TargetModifier',
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
      mod = new TargetModifier('=4');

      expect(() => {
        mod.name = 'Foo';
      }).toThrow(TypeError);
    });
  });

  describe('Run', () => {
    let die; let
      results;

    beforeEach(() => {
      results = new RollResults([
        8, 4, 2, 9, 1, 6, 10,
      ]);
      die = new StandardDice('6d10', 10, 6);
    });

    test('returns RollResults object', () => {
      expect(mod.run(results, die)).toBe(results);
    });

    test('flags successes and failures', () => {
      const { rolls } = mod.run(results, die);

      expect(rolls.length).toEqual(7);
      expect(rolls).toEqual([
        expect.objectContaining({
          calculationValue: 0,
          initialValue: 8,
          modifierFlags: '',
          modifiers: [],
          value: 8,
        }),
        expect.objectContaining({
          calculationValue: 0,
          initialValue: 4,
          modifierFlags: '',
          modifiers: [],
          value: 4,
        }),
        expect.objectContaining({
          calculationValue: -1,
          initialValue: 2,
          modifierFlags: '_',
          modifiers: ['target-failure'],
          value: 2,
        }),
        expect.objectContaining({
          calculationValue: 1,
          initialValue: 9,
          modifierFlags: '*',
          modifiers: ['target-success'],
          value: 9,
        }),
        expect.objectContaining({
          calculationValue: -1,
          initialValue: 1,
          modifierFlags: '_',
          modifiers: ['target-failure'],
          value: 1,
        }),
        expect.objectContaining({
          calculationValue: 0,
          initialValue: 6,
          modifierFlags: '',
          modifiers: [],
          value: 6,
        }),
        expect.objectContaining({
          calculationValue: 1,
          initialValue: 10,
          modifierFlags: '*',
          modifiers: ['target-success'],
          value: 10,
        }),
      ]);
    });
  });
});
