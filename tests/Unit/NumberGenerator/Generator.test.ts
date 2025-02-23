import { Random } from 'random-js';
import { engines, generator } from '../../../src/NumberGenerator';

describe('NumberGenerator', () => {
  describe('initialisation', () => {
    test('model structure', () => {
      expect(generator).toEqual(expect.objectContaining({
        engine: expect.any(Object),
        integer: expect.any(Function),
        real: expect.any(Function),
      }));
    });
  });

  describe('engine', () => {
    test('default engine is nativeMath (e.g. Math.round)', () => {
      expect(generator.engine).toBe(engines.NativeMath);
    });

    test('can change engine', () => {
      generator.engine = engines.NodeCrypto;
      expect(generator.engine).toBe(engines.NodeCrypto);

      generator.engine = engines.BrowserCrypto;
      expect(generator.engine).toBe(engines.BrowserCrypto);

      generator.engine = engines.NativeMath;
      expect(generator.engine).toBe(engines.NativeMath);
    });

    test('setting to falsey defaults to nativeMath', () => {
      // @ts-expect-error testing falsey values
      generator.engine = false;
      expect(generator.engine).toBe(engines.NativeMath);

      // @ts-expect-error testing falsey values
      generator.engine = null;
      expect(generator.engine).toBe(engines.NativeMath);

      // @ts-expect-error testing falsey values
      generator.engine = undefined;
      expect(generator.engine).toBe(engines.NativeMath);

      // @ts-expect-error testing falsey values
      generator.engine = 0;
      expect(generator.engine).toBe(engines.NativeMath);
    });

    test('throws error if engine has no `next` method', () => {
      expect(() => {
        // @ts-expect-error testing invalid values
        generator.engine = {};
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid values
        generator.engine = 'foo';
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid values
        generator.engine = true;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid values
        generator.engine = [];
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid values
        generator.engine = 1;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid values
        generator.engine = 45;
      }).toThrow(TypeError);
    });
  });

  describe('generate', () => {
    beforeEach(() => {
      // reset to the default engine
      generator.engine = engines.NativeMath;
    });

    describe('integer', () => {
      test('calls `Random.integer()`', () => {
        const spy = jest.spyOn(Random.prototype, 'integer')
          .mockImplementationOnce(() => 3);

        const result = generator.integer(1, 4);

        expect(spy).toHaveBeenCalledWith(1, 4);
        expect(result).toBe(3);
      });

      test('generates integer', () => {
        const val = generator.integer(1, 4);

        expect(Number.isInteger(val)).toBe(true);
      });

      test('generates integer even if `next` provides float', () => {
        generator.engine = {
          next() {
            return 4.5;
          },
        };

        const val = generator.integer(1, 4);

        expect(Number.isInteger(val)).toBe(true);
      });
    });

    describe('float', () => {
      test('calls `Random.real()`', () => {
        const spy = jest.spyOn(Random.prototype, 'real')
          .mockImplementationOnce(() => 2.45);

        const result = generator.real(1, 4);

        expect(spy).toHaveBeenCalledWith(1, 4, false);
        expect(result).toBe(2.45);
      });

      test('passes `inclusive` boolean to `Random.real()', () => {
        const spy = jest.spyOn(Random.prototype, 'real')
          .mockImplementation(() => 2.45);

        let result = generator.real(1, 4, false);
        expect(spy).toHaveBeenCalledWith(1, 4, false);
        expect(result).toBe(2.45);

        result = generator.real(1, 4, true);
        expect(spy).toHaveBeenCalledWith(1, 4, true);
        expect(result).toBe(2.45);
      });

      test('generates float', () => {
        const val = generator.real(1, 4);

        expect(Number.isInteger(val)).toBe(false);
      });

      test('generates float even if `next` provides integer', () => {
        generator.engine = {
          next() {
            return 4;
          },
        };

        const val = generator.real(1, 4);

        expect(Number.isInteger(val)).toBe(false);
      });
    });
  });
});

describe('Engines', () => {
  describe('Min', () => {
    test('model structure', () => {
      expect(engines.Min).toEqual(expect.objectContaining({
        next: expect.any(Function),
      }));
    });

    test('`next()` always returns `0`', () => {
      // run it several times to ensure the correct value is always returned
      for (let i = 0; i < 100; i++) {
        expect(engines.Min.next()).toBe(0);
      }
    });
  });

  describe('Max', () => {
    test('model structure', () => {
      expect(engines.Max).toEqual(expect.objectContaining({
        next: expect.any(Function),
        range: [],
      }));
    });

    test('`next()` always returns the index of the max value in the range', () => {
      // range values are 0 indexed and the next method should return
      // the index of the max value in the range, as though the range
      // is an array of all values between the max and min:
      // [1, 4] = [1, 2, 3, 4]
      engines.Max.range = [1, 4];
      expect(engines.Max.next()).toBe(3);

      engines.Max.range = [6, 25];
      expect(engines.Max.next()).toBe(19);

      engines.Max.range = [-5, -3];
      expect(engines.Max.next()).toBe(2);

      engines.Max.range = [-1, 0];
      expect(engines.Max.next()).toBe(1);
    });
  });
});
