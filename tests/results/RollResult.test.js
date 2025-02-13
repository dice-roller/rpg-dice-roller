import RollResult from '../../src/results/RollResult.ts';

describe('RollResult', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const result = new RollResult(4);

      expect(result).toBeInstanceOf(RollResult);
      expect(result).toEqual(expect.objectContaining({
        calculationValue: 4,
        initialValue: 4,
        modifierFlags: '',
        modifiers: new Set(),
        useInTotal: true,
        value: 4,
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });

    test('constructor requires value', () => {
      expect(() => {
        new RollResult();
      }).toThrow(TypeError);

      expect(() => {
        new RollResult(false);
      }).toThrow(TypeError);

      expect(() => {
        new RollResult(null);
      }).toThrow(TypeError);

      expect(() => {
        new RollResult(undefined);
      }).toThrow(TypeError);
    });

    test('constructor accepts object of values', () => {
      // set only the initial value should set all values
      let result = new RollResult({
        initialValue: 4,
      });

      expect(result.initialValue).toBe(4);
      expect(result.calculationValue).toBe(4);
      expect(result.value).toBe(4);

      // set only the value should set all values
      result = new RollResult({
        value: 2,
      });

      expect(result.initialValue).toBe(2);
      expect(result.calculationValue).toBe(2);
      expect(result.value).toBe(2);

      // set only the initial value and value should set all values
      result = new RollResult({
        initialValue: 4,
        value: 2,
      });

      expect(result.initialValue).toBe(4);
      expect(result.calculationValue).toBe(2);
      expect(result.value).toBe(2);

      // set the calculation value
      result = new RollResult({
        initialValue: 4,
        value: 2,
        calculationValue: 6,
      });

      expect(result.initialValue).toBe(4);
      expect(result.calculationValue).toBe(6);
      expect(result.value).toBe(2);
    });
  });

  describe('Initial Value', () => {
    test('cannot change initial value', () => {
      const result = new RollResult(4);

      expect(() => {
        result.initialValue = 5;
      }).toThrow(TypeError);
    });

    test('must be numeric', () => {
      expect((new RollResult(1)).initialValue).toBe(1);
      expect((new RollResult(-45)).initialValue).toBe(-45);
      expect((new RollResult(0)).initialValue).toBe(0);
      expect((new RollResult(360)).initialValue).toBe(360);
      expect((new RollResult(43.256)).initialValue).toBeCloseTo(43.256);

      expect(() => {
        new RollResult('foo');
      }).toThrow(TypeError);

      expect(() => {
        new RollResult([]);
      }).toThrow(TypeError);

      expect(() => {
        new RollResult({});
      }).toThrow(TypeError);

      expect(() => {
        new RollResult({ initialValue: 'foo' });
      }).toThrow(TypeError);

      expect(() => {
        new RollResult({ value: 'foo' });
      }).toThrow(TypeError);
    });

    test('must be finite', () => {
      expect(() => {
        new RollResult(Infinity);
      }).toThrow(RangeError);
    });

    test('can be very large number', () => {
      expect((new RollResult(99 ** 99)).initialValue).toBe(99 ** 99);
    });
  });

  describe('Value', () => {
    test('setting value with object calls value setter', () => {
      const spy = jest.spyOn(RollResult.prototype, 'value', 'set');

      // setter only gets called if value is defined and different to initial value
      new RollResult({
        initialValue: 4,
        value: 2,
      });
      expect(spy).toHaveBeenCalledTimes(1);

      // these two wont call the value setter
      new RollResult({
        initialValue: 4,
      });
      // no initial value defined, so value gets set to it and doesn't set value directly
      new RollResult({
        value: 2,
      });

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('can change', () => {
      const result = new RollResult(1);

      result.value = 5;
      expect(result.value).toBe(5);

      result.value = -45;
      expect(result.value).toBe(-45);

      result.value = 0;
      expect(result.value).toBe(0);

      result.value = 245;
      expect(result.value).toBe(245);

      result.value = 56.365;
      expect(result.value).toBeCloseTo(56.365);
    });

    test('changing value does not affect initialValue', () => {
      const result = new RollResult(45);

      expect(result.initialValue).toBe(45);
      expect(result.value).toBe(45);

      result.value = 3;

      expect(result.initialValue).toBe(45);
      expect(result.value).toBe(3);
    });

    test('changing value does affect calculationValue if not modified', () => {
      const result = new RollResult(45);

      expect(result.calculationValue).toBe(45);
      expect(result.value).toBe(45);

      result.value = 3;

      expect(result.calculationValue).toBe(3);
      expect(result.value).toBe(3);
    });

    test('changing value does not affect calculationValue if modified', () => {
      const result = new RollResult(45);

      expect(result.calculationValue).toBe(45);
      expect(result.value).toBe(45);

      result.calculationValue = 23;
      result.value = 3;

      expect(result.calculationValue).toBe(23);
      expect(result.value).toBe(3);
    });

    test('must be numeric', () => {
      const result = new RollResult(45);

      expect(() => {
        result.value = 'foo';
      }).toThrow(TypeError);

      expect(() => {
        result.value = true;
      }).toThrow(TypeError);

      expect(() => {
        result.value = false;
      }).toThrow(TypeError);

      expect(() => {
        result.value = {};
      }).toThrow(TypeError);

      expect(() => {
        result.value = [];
      }).toThrow(TypeError);

      expect(() => {
        result.value = null;
      }).toThrow(TypeError);
    });

    test('must be finite', () => {
      expect(() => {
        (new RollResult(45)).value = Infinity;
      }).toThrow(RangeError);
    });

    test('can be very large number', () => {
      const result = new RollResult(3);

      result.value = 99 ** 99;
      expect(result.value).toBe(99 ** 99);
    });
  });

  describe('Calculation Value', () => {
    test('can change', () => {
      const result = new RollResult(3);

      expect(result.calculationValue).toBe(3);

      result.calculationValue = 5;
      expect(result.calculationValue).toBe(5);

      result.calculationValue = -45;
      expect(result.calculationValue).toBe(-45);

      result.calculationValue = 0;
      expect(result.calculationValue).toBe(0);

      result.calculationValue = 245;
      expect(result.calculationValue).toBe(245);
    });

    test('must be numeric', () => {
      const result = new RollResult(3);

      result.calculationValue = 1;
      expect(result.calculationValue).toBe(1);

      result.calculationValue = -45;
      expect(result.calculationValue).toBe(-45);

      result.calculationValue = 0;
      expect(result.calculationValue).toBe(0);

      result.calculationValue = 360;
      expect(result.calculationValue).toBe(360);

      result.calculationValue = 78.35;
      expect(result.calculationValue).toBeCloseTo(78.35);

      expect(() => {
        result.calculationValue = 'foo';
      }).toThrow(TypeError);

      expect(() => {
        result.calculationValue = [];
      }).toThrow(TypeError);

      expect(() => {
        result.calculationValue = {};
      }).toThrow(TypeError);

      expect(() => {
        result.calculationValue = { initialValue: 'foo' };
      }).toThrow(TypeError);

      expect(() => {
        result.calculationValue = { value: 'foo' };
      }).toThrow(TypeError);
    });

    test('when unset it should return the value property', () => {
      const result = new RollResult(3);

      // change the calculation value
      result.calculationValue = 5;
      expect(result.calculationValue).toBe(5);

      result.calculationValue = null;
      expect(result.calculationValue).toBe(3);

      result.calculationValue = 5;
      result.calculationValue = undefined;
      expect(result.calculationValue).toBe(3);

      result.calculationValue = 5;
      result.calculationValue = false;
      expect(result.calculationValue).toBe(3);
    });

    test('changing calculation value does not affect initialValue or value', () => {
      const result = new RollResult(45);

      expect(result.initialValue).toBe(45);
      expect(result.value).toBe(45);
      expect(result.calculationValue).toBe(45);

      result.calculationValue = 3;

      expect(result.initialValue).toBe(45);
      expect(result.value).toBe(45);
      expect(result.calculationValue).toBe(3);
    });

    test('must be finite', () => {
      expect(() => {
        (new RollResult(45)).calculationValue = Infinity;
      }).toThrow(RangeError);
    });

    test('can be very large number', () => {
      const result = new RollResult(3);

      result.calculationValue = 99 ** 99;
      expect(result.calculationValue).toBe(99 ** 99);
    });
  });

  describe('Modifiers', () => {
    test('can set in constructor', () => {
      const result = new RollResult(4, ['explode', 'drop']);

      expect(result.modifiers).toEqual(new Set(['explode', 'drop']));
    });

    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(RollResult.prototype, 'modifiers', 'set');

      new RollResult(4, ['explode', 'drop']);

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('can change', () => {
      const result = new RollResult(4, ['explode', 'drop']);

      expect(result.modifiers).toEqual(new Set(['explode', 'drop']));

      const mods = [
        'critical-success',
        'target-success',
        're-roll',
      ];
      result.modifiers = mods;

      expect(result.modifiers).toEqual(new Set(mods));
    });

    test('can append', () => {
      const result = new RollResult(4, ['explode', 'drop']);

      expect(result.modifiers).toEqual(new Set(['explode', 'drop']));

      result.modifiers.add('re-roll');

      expect(result.modifiers).toEqual(new Set(['explode', 'drop', 're-roll']));
    });

    test('can remove old item and add new item', () => {
      const result = new RollResult(4, ['explode', 'drop']);

      expect(result.modifiers).toEqual(new Set(['explode', 'drop']));

      result.modifiers.delete('explode');
      result.modifiers.add('re-roll');

      expect(result.modifiers).toEqual(new Set(['re-roll', 'drop']));
    });

    test('can be Set<string>', () => {
      const modifiers = new Set(['explode', 'drop']);
      const result = new RollResult(4, modifiers);

      expect(result.modifiers).toEqual(modifiers);
    });

    test('throws error for invalid type', () => {
      const result = new RollResult(4);

      expect(() => {
        result.modifiers = 'foo';
      }).toThrow(TypeError);

      expect(() => {
        result.modifiers = {};
      }).toThrow(TypeError);

      expect(() => {
        result.modifiers = 0;
      }).toThrow(TypeError);

      expect(() => {
        result.modifiers = -34;
      }).toThrow(TypeError);

      expect(() => {
        result.modifiers = 1;
      }).toThrow(TypeError);

      expect(() => {
        result.modifiers = true;
      }).toThrow(TypeError);
    });

    test('items must be strings', () => {
      const result = new RollResult(4);

      expect(() => {
        result.modifiers = ['drop', 1];
      }).toThrow(TypeError);

      expect(() => {
        result.modifiers = ['drop', {}];
      }).toThrow(TypeError);

      expect(() => {
        result.modifiers = [false, 'drop'];
      }).toThrow(TypeError);

      expect(() => {
        result.modifiers = ['drop', undefined];
      }).toThrow(TypeError);

      expect(() => {
        result.modifiers = ['drop', null];
      }).toThrow(TypeError);

      expect(() => {
        result.modifiers = [true];
      }).toThrow(TypeError);
    });

    test('can unset', () => {
      const result = new RollResult(4, ['explode', 'compound']);

      result.modifiers = [];
      expect(result.modifiers).toEqual(new Set());

      // reset modifiers
      result.modifiers = ['drop'];
      expect(result.modifiers).toEqual(new Set(['drop']));

      result.modifiers = null;
      expect(result.modifiers).toEqual(new Set());

      // reset modifiers
      result.modifiers = ['drop'];
      expect(result.modifiers).toEqual(new Set(['drop']));

      result.modifiers = false;
      expect(result.modifiers).toEqual(new Set());

      // reset modifiers
      result.modifiers = ['drop'];
      expect(result.modifiers).toEqual(new Set(['drop']));

      result.modifiers = undefined;
      expect(result.modifiers).toEqual(new Set());
    });

    test('modifier flags are set correctly', () => {
      const result = new RollResult(4, ['explode', 'compound']);

      expect(result.modifierFlags).toEqual('!!');

      result.modifiers.add('drop');
      expect(result.modifierFlags).toEqual('!!d');

      result.modifiers = ['critical-success'];
      expect(result.modifierFlags).toEqual('**');

      result.modifiers.delete('critical-success');
      expect(result.modifierFlags).toEqual('');

      result.modifiers.add('drop');
      expect(result.modifierFlags).toEqual('d');

      result.modifiers.add('critical-failure');
      expect(result.modifierFlags).toEqual('d__');

      result.modifiers = ['penetrate'];
      expect(result.modifierFlags).toEqual('p');

      result.modifiers = ['re-roll'];
      expect(result.modifierFlags).toEqual('r');

      result.modifiers = ['re-roll-once'];
      expect(result.modifierFlags).toEqual('ro');

      result.modifiers = ['target-failure'];
      expect(result.modifierFlags).toEqual('_');

      result.modifiers = ['target-success'];
      expect(result.modifierFlags).toEqual('*');
    });

    test('modifier flag defaults to modifier name if name not recognised', () => {
      const result = new RollResult(4, ['foo', 'bar']);
      expect(result.modifierFlags).toEqual('foobar');
    });
  });

  describe('Use In Total', () => {
    test('can set in constructor', () => {
      let result = new RollResult(4, null, true);
      expect(result.useInTotal).toBe(true);

      result = new RollResult(4, null, false);
      expect(result.useInTotal).toBe(false);
    });

    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(RollResult.prototype, 'useInTotal', 'set');

      new RollResult(4, null, false);

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('can change', () => {
      const result = new RollResult(4);

      expect(result.useInTotal).toBe(true);

      result.useInTotal = false;
      expect(result.useInTotal).toBe(false);

      result.useInTotal = true;
      expect(result.useInTotal).toBe(true);
    });

    test('cast to boolean', () => {
      expect((new RollResult(4, null, 'foo')).useInTotal).toBe(true);
      expect((new RollResult(4, null, '')).useInTotal).toBe(false);
      expect((new RollResult(4, null, '0')).useInTotal).toBe(true);
      expect((new RollResult(4, null, 0)).useInTotal).toBe(false);
      expect((new RollResult(4, null, 1)).useInTotal).toBe(true);
      expect((new RollResult(4, null, [])).useInTotal).toBe(true);
      expect((new RollResult(4, null, {})).useInTotal).toBe(true);
      expect((new RollResult(4, null, null)).useInTotal).toBe(false);

      // `true` because `undefined` triggers the constructor's default value of `true`
      expect((new RollResult(4, null, undefined)).useInTotal).toBe(true);

      // `false` because the setter takes the value directly
      const result = new RollResult(4);
      result.useInTotal = undefined;
      expect(result.useInTotal).toBe(false);
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const result = new RollResult(4, ['explode', 'compound', 'drop'], false);

      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(result))).toEqual({
        calculationValue: 4,
        initialValue: 4,
        modifierFlags: '!!d',
        modifiers: [
          'explode', 'compound', 'drop',
        ],
        type: 'result',
        useInTotal: false,
        value: 4,
      });

      // change the value
      result.value = 3;
      expect(JSON.parse(JSON.stringify(result))).toEqual({
        calculationValue: 3,
        initialValue: 4,
        modifierFlags: '!!d',
        modifiers: [
          'explode', 'compound', 'drop',
        ],
        type: 'result',
        useInTotal: false,
        value: 3,
      });

      // change the calculation value
      result.calculationValue = 75;
      expect(JSON.parse(JSON.stringify(result))).toEqual({
        calculationValue: 75,
        initialValue: 4,
        modifierFlags: '!!d',
        modifiers: [
          'explode', 'compound', 'drop',
        ],
        type: 'result',
        useInTotal: false,
        value: 3,
      });

      // change the modifiers
      result.modifiers = ['critical-success'];
      expect(JSON.parse(JSON.stringify(result))).toEqual({
        calculationValue: 75,
        initialValue: 4,
        modifierFlags: '**',
        modifiers: [
          'critical-success',
        ],
        type: 'result',
        useInTotal: false,
        value: 3,
      });

      // use it in the total
      result.useInTotal = true;
      expect(JSON.parse(JSON.stringify(result))).toEqual({
        calculationValue: 75,
        initialValue: 4,
        modifierFlags: '**',
        modifiers: ['critical-success'],
        type: 'result',
        useInTotal: true,
        value: 3,
      });
    });

    test('toString output is correct', () => {
      const result = new RollResult(4, [
        'explode', 'compound', 'drop',
      ]);

      expect(result.toString()).toEqual('4!!d');

      // change the value
      result.value = 3;
      expect(result.toString()).toEqual('3!!d');

      // change the calculation value
      result.calculationValue = 75;
      expect(result.toString()).toEqual('3!!d');

      // change the modifiers
      result.modifiers = ['critical-success'];
      expect(result.toString()).toEqual('3**');

      // don't use it in the total
      result.useInTotal = false;
      expect(result.toString()).toEqual('3**');
    });
  });
});
