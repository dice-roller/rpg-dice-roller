import ResultGroup from '../../src/results/ResultGroup.ts';
import RollResults from '../../src/results/RollResults.ts';

describe('ResultGroup', () => {
  let group;
  let results;
  let subRollResults;

  beforeEach(() => {
    results = [
      new RollResults([3, 5, 4, 2]),
      '+',
      new RollResults([4, 8]),
    ];

    subRollResults = [
      new ResultGroup(
        results,
      ),
      new ResultGroup([
        5, '*', new RollResults([5, 7, 3]),
      ]),
      new ResultGroup([
        new RollResults([19]),
        '/',
        new RollResults([2]),
      ]),
    ];

    group = new ResultGroup(results);
  });

  describe('Initialisation', () => {
    test('model structure', () => {
      expect(group).toBeInstanceOf(ResultGroup);
      expect(group).toEqual(expect.objectContaining({
        addResult: expect.any(Function),
        calculationValue: 26,
        isRollGroup: false,
        length: 3,
        modifiers: new Set(),
        results,
        useInTotal: true,
        value: 26,
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });
  });

  describe('Calculation Value', () => {
    test('defaults to `value`', () => {
      expect(group.calculationValue).toBe(group.value);
    });

    test('can be changed', () => {
      group.calculationValue = 5;
      expect(group.calculationValue).toBe(5);

      group.calculationValue = -45;
      expect(group.calculationValue).toBe(-45);

      group.calculationValue = 0;
      expect(group.calculationValue).toBe(0);

      group.calculationValue = 245;
      expect(group.calculationValue).toBe(245);
    });

    test('must be numeric', () => {
      group.calculationValue = 1;
      expect(group.calculationValue).toBe(1);

      group.calculationValue = -45;
      expect(group.calculationValue).toBe(-45);

      group.calculationValue = 0;
      expect(group.calculationValue).toBe(0);

      group.calculationValue = 360;
      expect(group.calculationValue).toBe(360);

      group.calculationValue = 78.35;
      expect(group.calculationValue).toBeCloseTo(78.35);

      expect(() => {
        group.calculationValue = 'foo';
      }).toThrow(TypeError);

      expect(() => {
        group.calculationValue = [];
      }).toThrow(TypeError);

      expect(() => {
        group.calculationValue = {};
      }).toThrow(TypeError);

      expect(() => {
        group.calculationValue = { initialValue: 'foo' };
      }).toThrow(TypeError);

      expect(() => {
        group.calculationValue = { value: 'foo' };
      }).toThrow(TypeError);
    });

    test('when unset it should return the value property', () => {
      // change the calculation value
      group.calculationValue = 5;
      expect(group.calculationValue).toBe(5);

      group.calculationValue = null;
      expect(group.calculationValue).toBe(group.value);

      group.calculationValue = 5;
      group.calculationValue = undefined;
      expect(group.calculationValue).toBe(group.value);

      group.calculationValue = 5;
      group.calculationValue = false;
      expect(group.calculationValue).toBe(group.value);
    });

    test('changing calculation value does not affect value', () => {
      expect(group.value).toBe(26);
      expect(group.calculationValue).toBe(26);

      group.calculationValue = 3;

      expect(group.calculationValue).toBe(3);
      expect(group.value).toBe(26);
    });

    test('must be finite', () => {
      expect(() => {
        group.calculationValue = Infinity;
      }).toThrow(RangeError);
    });

    test('can be very large number', () => {
      group.calculationValue = 99 ** 99;
      expect(group.calculationValue).toBe(99 ** 99);
    });
  });

  describe('Modifiers', () => {
    test('can set in constructor', () => {
      group = new ResultGroup(results, ['explode', 'drop']);

      expect(group.modifiers).toEqual(new Set(['explode', 'drop']));
    });

    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(ResultGroup.prototype, 'modifiers', 'set');

      new ResultGroup(results, ['explode', 'drop']);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(['explode', 'drop']);

      // remove the spy
      spy.mockRestore();
    });

    test('can change', () => {
      group = new ResultGroup(results, ['explode', 'drop']);

      expect(group.modifiers).toEqual(new Set(['explode', 'drop']));

      const mods = [
        'critical-success',
        'target-success',
        're-roll',
      ];
      group.modifiers = mods;

      expect(group.modifiers).toEqual(new Set(mods));
    });

    test('can append', () => {
      group = new ResultGroup(results, ['explode', 'drop']);

      expect(group.modifiers).toEqual(new Set(['explode', 'drop']));

      group.modifiers.add('re-roll');

      expect(group.modifiers).toEqual(new Set(['explode', 'drop', 're-roll']));
    });

    test('can remove old item and add new item', () => {
      group = new ResultGroup(results, ['explode', 'drop']);

      expect(group.modifiers).toEqual(new Set(['explode', 'drop']));

      group.modifiers.delete('explode');
      group.modifiers.add('re-roll');

      expect(group.modifiers).toEqual(new Set(['re-roll', 'drop']));
    });

    test('can be `Set<string>`', () => {
      const modifiers = new Set(['explode', 'drop']);
      group = new ResultGroup(results, modifiers);

      expect(group.modifiers).toEqual(modifiers);
    });

    test('throws error for invalid type', () => {
      expect(() => {
        group.modifiers = 'foo';
      }).toThrow(TypeError);

      expect(() => {
        group.modifiers = {};
      }).toThrow(TypeError);

      expect(() => {
        group.modifiers = 0;
      }).toThrow(TypeError);

      expect(() => {
        group.modifiers = -34;
      }).toThrow(TypeError);

      expect(() => {
        group.modifiers = 1;
      }).toThrow(TypeError);

      expect(() => {
        group.modifiers = true;
      }).toThrow(TypeError);
    });

    test('items must be strings', () => {
      expect(() => {
        group.modifiers = ['drop', 1];
      }).toThrow(TypeError);

      expect(() => {
        group.modifiers = ['drop', {}];
      }).toThrow(TypeError);

      expect(() => {
        group.modifiers = [false, 'drop'];
      }).toThrow(TypeError);

      expect(() => {
        group.modifiers = ['drop', undefined];
      }).toThrow(TypeError);

      expect(() => {
        group.modifiers = ['drop', null];
      }).toThrow(TypeError);

      expect(() => {
        group.modifiers = [true];
      }).toThrow(TypeError);
    });

    test('can unset', () => {
      group = new ResultGroup(results, ['explode', 'compound']);

      group.modifiers = [];
      expect(group.modifiers).toEqual(new Set());

      // reset modifiers
      group.modifiers = ['drop'];
      expect(group.modifiers).toEqual(new Set(['drop']));

      group.modifiers = null;
      expect(group.modifiers).toEqual(new Set());

      // reset modifiers
      group.modifiers = ['drop'];
      expect(group.modifiers).toEqual(new Set(['drop']));

      group.modifiers = false;
      expect(group.modifiers).toEqual(new Set());

      // reset modifiers
      group.modifiers = ['drop'];
      expect(group.modifiers).toEqual(new Set(['drop']));

      group.modifiers = undefined;
      expect(group.modifiers).toEqual(new Set());
    });

    test('modifier flags are set correctly', () => {
      group = new ResultGroup(results, ['explode', 'compound']);

      expect(group.modifierFlags).toEqual('!!');

      group.modifiers.add('drop');
      expect(group.modifierFlags).toEqual('!!d');

      group.modifiers = ['critical-success'];
      expect(group.modifierFlags).toEqual('**');

      group.modifiers.delete('critical-success');
      expect(group.modifierFlags).toEqual('');

      group.modifiers.add('drop');
      expect(group.modifierFlags).toEqual('d');

      group.modifiers.add('critical-failure');
      expect(group.modifierFlags).toEqual('d__');

      group.modifiers = ['penetrate'];
      expect(group.modifierFlags).toEqual('p');

      group.modifiers = ['re-roll'];
      expect(group.modifierFlags).toEqual('r');

      group.modifiers = ['re-roll-once'];
      expect(group.modifierFlags).toEqual('ro');

      group.modifiers = ['target-failure'];
      expect(group.modifierFlags).toEqual('_');

      group.modifiers = ['target-success'];
      expect(group.modifierFlags).toEqual('*');
    });

    test('modifier flag defaults to modifier name if name not recognised', () => {
      group = new ResultGroup(results, ['foo', 'bar']);
      expect(group.modifierFlags).toEqual('foobar');
    });
  });

  describe('Is roll group', () => {
    test('can set in constructor', () => {
      group = new ResultGroup(results, null, true);
      expect(group.isRollGroup).toBe(true);

      group = new ResultGroup(results, null, false);
      expect(group.isRollGroup).toBe(false);
    });

    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(ResultGroup.prototype, 'isRollGroup', 'set');

      new ResultGroup(results, null, true);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(true);

      // remove the spy
      spy.mockRestore();
    });

    test('can change', () => {
      expect(group.isRollGroup).toBe(false);

      group.isRollGroup = true;
      expect(group.isRollGroup).toBe(true);

      group.isRollGroup = false;
      expect(group.isRollGroup).toBe(false);
    });

    test('cast to boolean', () => {
      expect((new ResultGroup(results, null, 'foo')).isRollGroup).toBe(true);
      expect((new ResultGroup(results, null, '')).isRollGroup).toBe(false);
      expect((new ResultGroup(results, null, '0')).isRollGroup).toBe(true);
      expect((new ResultGroup(results, null, 0)).isRollGroup).toBe(false);
      expect((new ResultGroup(results, null, 1)).isRollGroup).toBe(true);
      expect((new ResultGroup(results, null, [])).isRollGroup).toBe(true);
      expect((new ResultGroup(results, null, {})).isRollGroup).toBe(true);
      expect((new ResultGroup(results, null, null)).isRollGroup).toBe(false);

      // `false` because `undefined` triggers the constructor's default value of `false`
      expect((new ResultGroup(results, null, undefined)).isRollGroup).toBe(false);

      // `false` because the setter takes the value directly
      group.isRollGroup = undefined;
      expect(group.isRollGroup).toBe(false);
    });
  });

  describe('Use In Total', () => {
    test('can set in constructor', () => {
      group = new ResultGroup(results, null, false, true);
      expect(group.useInTotal).toBe(true);

      group = new ResultGroup(results, null, false, false);
      expect(group.useInTotal).toBe(false);
    });

    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(ResultGroup.prototype, 'useInTotal', 'set');

      new ResultGroup(results, null, false, false);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(false);

      // remove the spy
      spy.mockRestore();
    });

    test('can change', () => {
      expect(group.useInTotal).toBe(true);

      group.useInTotal = false;
      expect(group.useInTotal).toBe(false);

      group.useInTotal = true;
      expect(group.useInTotal).toBe(true);
    });

    test('cast to boolean', () => {
      expect((new ResultGroup(results, null, false, 'foo')).useInTotal).toBe(true);
      expect((new ResultGroup(results, null, false, '')).useInTotal).toBe(false);
      expect((new ResultGroup(results, null, false, '0')).useInTotal).toBe(true);
      expect((new ResultGroup(results, null, false, 0)).useInTotal).toBe(false);
      expect((new ResultGroup(results, null, false, 1)).useInTotal).toBe(true);
      expect((new ResultGroup(results, null, false, [])).useInTotal).toBe(true);
      expect((new ResultGroup(results, null, false, {})).useInTotal).toBe(true);
      expect((new ResultGroup(results, null, false, null)).useInTotal).toBe(false);

      // `true` because `undefined` triggers the constructor's default value of `true`
      expect((new ResultGroup(results, null, false, undefined)).useInTotal).toBe(true);

      // `false` because the setter takes the value directly
      group.useInTotal = undefined;
      expect(group.useInTotal).toBe(false);
    });
  });

  describe('results', () => {
    test('can set in constructor', () => {
      expect(group.results).toEqual(results);
    });

    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(ResultGroup.prototype, 'results', 'set');

      // create the object
      new ResultGroup(results);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(results);

      // remove the spy
      spy.mockRestore();
    });

    test('defaults to empty array', () => {
      group = new ResultGroup();

      expect(group.results).toEqual([]);
    });

    test('must be array', () => {
      expect(() => {
        group.results = 'Foo';
      }).toThrow(TypeError);

      expect(() => {
        group.results = {};
      }).toThrow(TypeError);

      expect(() => {
        group.results = true;
      }).toThrow(TypeError);

      expect(() => {
        group.results = false;
      }).toThrow(TypeError);

      expect(() => {
        group.results = null;
      }).toThrow(TypeError);

      expect(() => {
        group.results = undefined;
      }).toThrow(TypeError);

      expect(() => {
        group.results = 0;
      }).toThrow(TypeError);

      expect(() => {
        group.results = 1;
      }).toThrow(TypeError);
    });

    test('accepts `ResultGroup` objects', () => {
      group.results = [
        new ResultGroup([4]),
        new ResultGroup([6]),
      ];

      expect(group.results).toEqual([
        new ResultGroup([4]),
        new ResultGroup([6]),
      ]);
    });

    test('accepts `RollResults` objects', () => {
      group.results = [
        new RollResults([4]),
        new RollResults([6]),
      ];

      expect(group.results).toEqual([
        new RollResults([4]),
        new RollResults([6]),
      ]);
    });

    test('accepts numbers', () => {
      group.results = [5, 2, 0, 6];

      expect(group.results).toEqual([5, 2, 0, 6]);
    });

    test('accepts strings', () => {
      group.results = ['-', '+', '/', '*'];

      expect(group.results).toEqual(['-', '+', '/', '*']);
    });

    test('accepts mixed types', () => {
      group.results = [
        new ResultGroup([5, '+', 2]),
        new RollResults([4]),
        4,
        '+',
      ];

      expect(group.results).toEqual([
        new ResultGroup([5, '+', 2]),
        new RollResults([4]),
        4,
        '+',
      ]);
    });

    test('throws error on invalid roll values', () => {
      expect(() => {
        group.results = [34, { foo: 'bar' }];
      }).toThrow(TypeError);
    });

    test('can append to rolls', () => {
      group.addResult(new RollResults([4]));

      expect(group.results).toEqual([
        ...results,
        new RollResults([4]),
      ]);
    });
  });

  describe('length', () => {
    test('length returns number of results', () => {
      group = new ResultGroup();

      expect(group).toHaveLength(0);

      group.addResult(4);
      expect(group).toHaveLength(1);

      group.results = results;
      expect(group).toHaveLength(3);

      group.results = [];
      expect(group).toHaveLength(0);
    });

    test('cannot set length', () => {
      expect(() => {
        group.length = 3;
      }).toThrow(TypeError);
    });
  });

  describe('value', () => {
    test('is total of rolls', () => {
      group = new ResultGroup();

      expect(group.value).toEqual(0);

      group.results = results;
      expect(group.value).toEqual(26);

      group.addResult('+');
      group.addResult(6);
      expect(group.value).toEqual(32);
    });

    test('is total of sub-rolls', () => {
      group.results = subRollResults;

      expect(group.value).toEqual(110.5);

      group.results[1].calculationValue = 4;
      expect(group.value).toEqual(39.5);
    });

    test('ignores sub-rolls flagged as `useInTotal = false`', () => {
      // flag a sub-roll as ignored
      subRollResults[0].useInTotal = false;

      group.results = subRollResults;

      expect(group.value).toEqual(84.5);
    });

    test('cannot change value property', () => {
      expect(() => {
        group.value = 4;
      }).toThrow(TypeError);
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const json = group.toJSON();

      expect(json).toBeInstanceOf(Object);
      expect(json.calculationValue).toBe(group.calculationValue);
      expect(json.isRollGroup).toBe(group.isRollGroup);
      expect(json.modifiers).toEqual([...group.modifiers]);
      expect(json.results).toEqual([...group.results]);
      expect(json.type).toEqual('result-group');
      expect(json.useInTotal).toBe(group.useInTotal);
      expect(json.value).toBe(group.value);
    });

    test('JSON output is correct when is a roll group', () => {
      group.isRollGroup = true;
      const json = group.toJSON();

      expect(json).toBeInstanceOf(Object);
      expect(json.calculationValue).toBe(group.calculationValue);
      expect(json.isRollGroup).toBe(group.isRollGroup);
      expect(json.modifiers).toEqual([...group.modifiers]);
      expect(json.results).toEqual([...group.results]);
      expect(json.type).toEqual('result-group');
      expect(json.useInTotal).toBe(group.useInTotal);
      expect(json.value).toBe(group.value);
    });

    test('toString output is correct', () => {
      expect(group.toString()).toEqual('[3, 5, 4, 2]+[4, 8]');
    });

    test('toString outputs modifiers', () => {
      group.modifiers = ['drop'];

      expect(group.toString()).toEqual('([3, 5, 4, 2]+[4, 8])d');
    });

    test('toString output is correct with multiple sub-rolls', () => {
      group.isRollGroup = true;
      group.results = subRollResults;

      expect(group.toString()).toEqual('{[3, 5, 4, 2]+[4, 8], 5*[5, 7, 3], [19]/[2]}');
    });

    test('toString output modifiers with multiple sub-rolls', () => {
      group.isRollGroup = true;
      group.results = subRollResults;
      group.results[0].modifiers = ['drop'];

      expect(group.toString()).toEqual('{([3, 5, 4, 2]+[4, 8])d, 5*[5, 7, 3], [19]/[2]}');
    });
  });
});
