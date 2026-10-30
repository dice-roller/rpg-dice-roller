import * as diceUtils from '../../src/utilities/utils.js';
import exportFormats from '../../src/utilities/ExportFormats.js';

describe('Export formats', () => {
  test('contains all formats', () => {
    expect(exportFormats).toBeInstanceOf(Object);

    expect(exportFormats).toEqual({
      BASE_64: expect.any(Number),
      JSON: expect.any(Number),
      OBJECT: expect.any(Number),
    });
  });
});

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

      encodedString = btoa(true);
      expect(diceUtils.isBase64(encodedString)).toBe(true);

      encodedString = btoa({});
      expect(diceUtils.isBase64(encodedString)).toBe(true);

      encodedString = btoa(['foo', 'bar']);
      expect(diceUtils.isBase64(encodedString)).toBe(true);
    });

    test('returns false for non-base64 encoded string', () => {
      expect(diceUtils.isBase64(156)).toBe(false);
      expect(diceUtils.isBase64('foo')).toBe(false);
      expect(diceUtils.isBase64({})).toBe(false);
      expect(diceUtils.isBase64([])).toBe(false);
      expect(diceUtils.isBase64(true)).toBe(false);
      expect(diceUtils.isBase64(false)).toBe(false);
      expect(diceUtils.isBase64(null)).toBe(false);
      expect(diceUtils.isBase64(undefined)).toBe(false);
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
      expect(diceUtils.isJson()).toBe(false);
      expect(diceUtils.isJson('foo')).toBe(false);
      expect(diceUtils.isJson(124)).toBe(false);
      expect(diceUtils.isJson(true)).toBe(false);
      expect(diceUtils.isJson(false)).toBe(false);
      expect(diceUtils.isJson([])).toBe(false);
      expect(diceUtils.isJson({})).toBe(false);
    });
  });
});
