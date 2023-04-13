import {
  browserCrypto, nodeCrypto, MersenneTwister19937, nativeMath, Random,
} from 'random-js';

/**
 * The engine
 *
 * @type {symbol}
 *
 * @private
 */
const engineSymbol = Symbol('engine');

/**
 * The random object
 *
 * @type {symbol}
 *
 * @private
 */
const randomSymbol = Symbol('random');

/**
 * Engine that always returns the maximum value.
 * Used internally for calculating max roll values.
 *
 * @since 4.2.0
 *
 * @type {{next(): number, range: number[]}}
 */
const maxEngine = {
  /**
   * The min / max number range (e.g. `[1, 10]`).
   *
   * This _must_ be set for the `next()` method to return the correct last index.
   *
   * @example
   * maxEngine.range = [1, 10];
   *
   * @type {number[]}
   */
  range: [],
  /**
   * Returns the maximum number index for the range
   *
   * @returns {number}
   */
  next() {
    // calculate the index of the max number
    return this.range[1] - this.range[0];
  },
};

/**
 * Engine that always returns the minimum value.
 * Used internally for calculating min roll values.
 *
 * @since 4.2.0
 *
 * @type {{next(): number}}
 */
const minEngine = {
  /**
   * Returns the minimum number index, `0`
   *
   * @returns {number}
   */
  next() {
    return 0;
  },
};

/**
 * List of built-in number generator engines.
 *
 * @since 4.2.0
 *
 * @see This uses [random-js](https://github.com/ckknight/random-js).
 * For details of the engines, check the [documentation](https://github.com/ckknight/random-js#engines).
 *
 * @type {{
 *  min: {next(): number},
 *  max: {next(): number, range: number[]},
 *  browserCrypto: Engine,
 *  nodeCrypto: Engine,
 *  MersenneTwister19937: MersenneTwister19937,
 *  nativeMath: Engine
 * }}
 */
const engines = {
  browserCrypto,
  nodeCrypto,
  MersenneTwister19937,
  nativeMath,
  min: minEngine,
  max: maxEngine,
};

/**
 * The `NumberGenerator` is capable of generating random numbers.
 *
 * @since 4.2.0
 *
 * @see This uses [random-js](https://github.com/ckknight/random-js).
 * For details of the engines, check the [documentation](https://github.com/ckknight/random-js#engines).
 */
class NumberGenerator {
  /**
   * Create a `NumberGenerator` instance.
   *
   * The `engine` can be any object that has a `next()` method, which returns a number.
   *
   * @example <caption>Built-in engine</caption>
   * new NumberGenerator(engines.nodeCrypto);
   *
   * @example <caption>Custom engine</caption>
   * new NumberGenerator({
   *   next() {
   *     // return a random number
   *   },
   * });
   *
   * @param {Engine|{next(): number}} [engine=nativeMath] The RNG engine to use
   *
   * @throws {TypeError} engine must have function `next()`
   */
  constructor(engine = nativeMath) {
    this.engine = engine || nativeMath;
  }

  async defaultEngine() {
    try {
      const global = typeof window !== "undefined" && typeof window.document !== "undefined" ? window
        : (typeof self === "object" ? self : null);

      if (global?.crypto) {
        console.log('has browser crypto');

        return browserCrypto;
      } else if (await import('crypto') || await import('node:crypto')) {
        // @todo check if the import breaks the build
        // @todo check if the import breaks the browser check (When browser crypto is unavailable)
        console.log('has node crypto');

        return nodeCrypto;
      }
    } catch (err) {
      console.error('crypto support is disabled!');
    }

    return nativeMath;
  }

  /**
   * The current engine.
   *
   * @returns {Engine|{next(): number}}
   */
  get engine() {
    return this[engineSymbol];
  }

  /**
   * Set the engine.
   *
   * The `engine` can be any object that has a `next()` method, which returns a number.
   *
   * @example <caption>Built-in engine</caption>
   * numberGenerator.engine = engines.nodeCrypto;
   *
   * @example <caption>Custom engine</caption>
   * numberGenerator.engine = {
   *   next() {
   *     // return a random number
   *   },
   * });
   *
   * @see {@link engines}
   *
   * @param {Engine|{next(): number}} engine
   *
   * @throws {TypeError} engine must have function `next()`
   */
  set engine(engine) {
    if (engine && (typeof engine.next !== 'function')) {
      throw new TypeError('engine must have function `next()`');
    }

    // set the engine and re-initialise the random engine
    this[engineSymbol] = engine || nativeMath;
    this[randomSymbol] = new Random(this[engineSymbol]);
  }

  /**
   * Generate a random integer within the inclusive range `[min, max]`.
   *
   * @param {number} min The minimum integer value, inclusive.
   * @param {number} max The maximum integer value, inclusive.
   *
   * @returns {number} The random integer
   */
  integer(min, max) {
    this[engineSymbol].range = [min, max];

    return this[randomSymbol].integer(min, max);
  }

  /**
   * Returns a floating-point value within `[min, max)` or `[min, max]`.
   *
   * @param {number} min The minimum floating-point value, inclusive.
   * @param {number} max The maximum floating-point value.
   * @param {boolean} [inclusive=false] If `true`, `max` will be inclusive.
   *
   * @returns {number} The random floating-point value
   */
  real(min, max, inclusive = false) {
    this[engineSymbol].range = [min, max];

    return this[randomSymbol].real(min, max, inclusive);
  }
}

const generator = new NumberGenerator();

export {
  engines,
  generator,
};
