import CriticalSuccessModifier from '../../src/modifiers/CriticalSuccessModifier';
import ComparePoint from '../../src/ComparePoint';
import ComparisonModifier from '../../src/modifiers/ComparisonModifier';
import RollResults from '../../src/results/RollResults';
import StandardDice from '../../src/dice/StandardDice';

describe('CriticalSuccessModifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const mod = new CriticalSuccessModifier('>8');

      expect(mod).toBeInstanceOf(CriticalSuccessModifier);
      expect(mod).toBeInstanceOf(ComparisonModifier);
      expect(mod).toEqual(expect.objectContaining({
        comparePoint: undefined,
        isComparePoint: expect.any(Function),
        name: 'CriticalSuccessModifier',
        notation: '>8',
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });

    test('constructor requires notation', () => {
      expect(() => {
        new CriticalSuccessModifier();
      }).toThrow('Notation is required');

      expect(() => {
        new CriticalSuccessModifier(false);
      }).toThrow('Notation is required');

      expect(() => {
        new CriticalSuccessModifier(null);
      }).toThrow('Notation is required');

      expect(() => {
        new CriticalSuccessModifier(undefined);
      }).toThrow('Notation is required');
    });
  });

  describe('Compare point', () => {
    test('gets set in constructor', () => {
      const cp = new ComparePoint('>', 8);
      const mod = new CriticalSuccessModifier('>8', cp);

      expect(mod.comparePoint).toBe(cp);
    });

    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(CriticalSuccessModifier.prototype, 'comparePoint', 'set');

      // create the ComparisonModifier
      new CriticalSuccessModifier('>8', new ComparePoint('>', 8));

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('must be instance of ComparePoint', () => {
      const mod = new CriticalSuccessModifier('>8');

      expect(() => {
        mod.comparePoint = 'foo';
      }).toThrow('comparePoint must be instance of ComparePoint');

      expect(() => {
        mod.comparePoint = 1;
      }).toThrow('comparePoint must be instance of ComparePoint');

      expect(() => {
        mod.comparePoint = 0;
      }).toThrow('comparePoint must be instance of ComparePoint');

      expect(() => {
        mod.comparePoint = true;
      }).toThrow('comparePoint must be instance of ComparePoint');

      expect(() => {
        mod.comparePoint = false;
      }).toThrow('comparePoint must be instance of ComparePoint');

      expect(() => {
        mod.comparePoint = [new ComparePoint('>', 8)];
      }).toThrow('comparePoint must be instance of ComparePoint');

      expect(() => {
        mod.comparePoint = { comparePoint: new ComparePoint('>', 8) };
      }).toThrow('comparePoint must be instance of ComparePoint');
    });

    test('cannot unset compare point', () => {
      const mod = new CriticalSuccessModifier('>8');

      expect(() => {
        mod.comparePoint = null;
      }).toThrow('comparePoint must be instance of ComparePoint');

      expect(() => {
        mod.comparePoint = undefined;
      }).toThrow('comparePoint must be instance of ComparePoint');
    });
  });

  describe('Matching', () => {
    test('can match against values', () => {
      const spy = jest.spyOn(ComparePoint.prototype, 'isMatch');
      const mod = new CriticalSuccessModifier('>8', new ComparePoint('>', 8));

      // attempt to match
      expect(mod.isComparePoint(9)).toBe(true);
      expect(mod.isComparePoint(8)).toBe(false);
      expect(mod.isComparePoint(7)).toBe(false);
      expect(mod.isComparePoint(0)).toBe(false);

      expect(spy).toHaveBeenCalledTimes(4);

      // remove the spy
      spy.mockRestore();
    });

    test('with no ComparePoint return false', () => {
      const mod = new CriticalSuccessModifier('>8');

      expect(mod.isComparePoint(9)).toBe(false);
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const mod = new CriticalSuccessModifier('=4', new ComparePoint('=', 4));

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        comparePoint: {
          operator: '=',
          type: 'compare-point',
          value: 4,
        },
        name: 'CriticalSuccessModifier',
        notation: '=4',
        type: 'modifier',
      });
    });

    test('toString output is correct', () => {
      const mod = new CriticalSuccessModifier('=4', new ComparePoint('=', 4));

      expect(mod.toString()).toEqual('=4');
    });
  });

  describe('Run', () => {
    test('returns RollResults object', () => {
      const results = new RollResults();
      const die = new StandardDice('2d6', 6, 2);
      const mod = new CriticalSuccessModifier('=4', new ComparePoint('=', 4));

      expect(mod.run(results, die)).toBe(results);
    });

    test('checks roll value against compare point', () => {
      const spy = jest.spyOn(CriticalSuccessModifier.prototype, 'isComparePoint');
      const results = new RollResults([
        1, 2, 4, 8, 6,
      ]);
      const mod = new CriticalSuccessModifier('>=6', new ComparePoint('>=', 6));

      mod.run(results, new StandardDice('5d8', 6, 5));

      expect(spy).toHaveBeenCalledTimes(5);

      // remove the spy
      spy.mockRestore();
    });

    test('flags failure rolls', () => {
      const results = new RollResults([
        1, 2, 4, 8, 6,
      ]);
      const mod = new CriticalSuccessModifier('>=6', new ComparePoint('>=', 6));
      const modifiedRolls = mod.run(results, new StandardDice('5d8', 6, 5)).rolls;

      expect(modifiedRolls).toEqual([
        expect.objectContaining({
          calculationValue: 1,
          initialValue: 1,
          modifierFlags: '',
          modifiers: [],
          useInTotal: true,
          value: 1,
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
          calculationValue: 4,
          initialValue: 4,
          modifierFlags: '',
          modifiers: [],
          useInTotal: true,
          value: 4,
        }),
        expect.objectContaining({
          calculationValue: 8,
          initialValue: 8,
          modifierFlags: '**',
          modifiers: [
            'critical-success',
          ],
          useInTotal: true,
          value: 8,
        }),
        expect.objectContaining({
          calculationValue: 6,
          initialValue: 6,
          modifierFlags: '**',
          modifiers: [
            'critical-success',
          ],
          useInTotal: true,
          value: 6,
        }),
      ]);
    });
  });

  describe('Readonly properties', () => {
    test('cannot change name value', () => {
      const mod = new CriticalSuccessModifier('=4');

      expect(() => {
        mod.name = 'Foo';
      }).toThrowError(TypeError);
    });
  });
});
