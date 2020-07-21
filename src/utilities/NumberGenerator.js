import {
  browserCrypto, nodeCrypto, MersenneTwister19937, nativeMath, Random,
} from 'random-js';

const engineSymbol = Symbol('engine');
const randomSymbol = Symbol('random');

const engines = {
  browserCrypto,
  nodeCrypto,
  MersenneTwister19937,
  nativeMath,
};

class NumberGenerator {
  /**
   * @param {Engine=} engine
   */
  constructor(engine = nativeMath) {
    this.engine = engine || nativeMath;
  }

  /**
   * Returns the current engine
   *
   * @returns {Engine}
   */
  get engine() {
    return this[engineSymbol];
  }

  /**
   * Sets the engine
   *
   * @param {Engine} engine
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
   * Returns a random integer within the inclusive range `[min, max]`
   *
   * @param {number} min The minimum integer value, inclusive.
   * @param {number} max The maximum integer value, inclusive.
   *
   * @returns {number}
   */
  integer(min, max) {
    return this[randomSymbol].integer(min, max);
  }

  /**
   * Returns a floating-point value within [min, max) or [min, max]
   *
   * @param {number} min The minimum floating-point value, inclusive.
   * @param {number} max The maximum floating-point value.
   * @param {boolean=} inclusive If true, `max` will be inclusive.
   *
   * @returns {number}
   */
  real(min, max, inclusive = false) {
    return this[randomSymbol].real(min, max, inclusive);
  }
}

const generator = new NumberGenerator();

export {
  engines,
  generator,
};
