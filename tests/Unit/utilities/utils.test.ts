import * as diceUtils from '../../../src/utilities/utils';

describe('Utilities', () => {
  test('model structure', () => {
    expect(diceUtils).toEqual(expect.objectContaining({
      isBase64: expect.any(Function),
      isJson: expect.any(Function),
    }));
  });

  describe('isBase64', () => {
    test('returns true for base64 encoded string', () => {
      let encodedString = btoa('foo');
      expect(diceUtils.isBase64(encodedString)).toBe(true);

      encodedString = btoa('{"foo": "bar"}');
      expect(diceUtils.isBase64(encodedString)).toBe(true);

      // @ts-expect-error testing btoa data
      encodedString = btoa(true);
      expect(diceUtils.isBase64(encodedString)).toBe(true);

      // @ts-expect-error testing btoa data
      encodedString = btoa({});
      expect(diceUtils.isBase64(encodedString)).toBe(true);

      // @ts-expect-error testing btoa data
      encodedString = btoa(['foo', 'bar']);
      expect(diceUtils.isBase64(encodedString)).toBe(true);
    });

    test('returns false for non-base64 encoded string', () => {
      // @ts-expect-error testing invalid value
      expect(diceUtils.isBase64(156)).toBe(false);
      expect(diceUtils.isBase64('foo')).toBe(false);
      // @ts-expect-error testing invalid value
      expect(diceUtils.isBase64({})).toBe(false);
      // @ts-expect-error testing invalid value
      expect(diceUtils.isBase64([])).toBe(false);
      // @ts-expect-error testing invalid value
      expect(diceUtils.isBase64(true)).toBe(false);
      // @ts-expect-error testing invalid value
      expect(diceUtils.isBase64(false)).toBe(false);
      // @ts-expect-error testing invalid value
      expect(diceUtils.isBase64(null)).toBe(false);
      // @ts-expect-error testing invalid value
      expect(diceUtils.isBase64(undefined)).toBe(false);
      // @ts-expect-error testing invalid value
      expect(diceUtils.isBase64(NaN)).toBe(false);
    });
  });

  describe('isJson', () => {
    test('returns true for JSON encoded strings', () => {
      expect(diceUtils.isJson(JSON.stringify({ foo: 'bar' }))).toBe(true);
      expect(diceUtils.isJson(JSON.stringify(['foo', 'bar']))).toBe(true);
      expect(diceUtils.isJson(JSON.stringify({}))).toBe(true);
      expect(diceUtils.isJson(JSON.stringify([]))).toBe(true);
    });

    test('returns false for invalid strings', () => {
      expect(diceUtils.isJson(JSON.stringify('foo'))).toBe(false);
      expect(diceUtils.isJson(JSON.stringify(124))).toBe(false);
      expect(diceUtils.isJson(JSON.stringify(true))).toBe(false);
      expect(diceUtils.isJson(JSON.stringify(false))).toBe(false);
    });

    test('returns false for invalid data', () => {
      // @ts-expect-error testing missing argument
      expect(diceUtils.isJson()).toBe(false);
      expect(diceUtils.isJson('foo')).toBe(false);
      // @ts-expect-error testing invalid value
      expect(diceUtils.isJson(124)).toBe(false);
      // @ts-expect-error testing invalid value
      expect(diceUtils.isJson(true)).toBe(false);
      // @ts-expect-error testing invalid value
      expect(diceUtils.isJson(false)).toBe(false);
      // @ts-expect-error testing invalid value
      expect(diceUtils.isJson([])).toBe(false);
      // @ts-expect-error testing invalid value
      expect(diceUtils.isJson({})).toBe(false);
    });
  });
});
