import { Random } from 'random-js';
import { Engine } from "../types/Interfaces/NumberGenerator/Engines/Engine";
import { RandomNumberGenerator } from "../types/Interfaces/NumberGenerator/Engines/RandomNumberGenerator";
import { engine as NativeMath } from "./engines/NativeMath";

/**
 * The `NumberGenerator` is capable of generating random numbers.
 *
 * @since 4.2.0
 *
 * @see This uses [random-js](https://github.com/ckknight/random-js).
 * For details of the engines, check the [documentation](https://github.com/ckknight/random-js#engines).
 */
class Generator implements RandomNumberGenerator {
  #engine!: Engine;
  #generator!: Random;

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
   * @param {Engine|{next(): number}} [engine=NativeMath] The RNG engine to use
   *
   * @throws {TypeError} engine must have function `next()`
   */
  constructor(engine: Engine = NativeMath) {
    this.engine = engine || NativeMath;
  }

  /**
   * The current engine.
   *
   * @returns {Engine|{next(): number}}
   */
  get engine(): Engine {
    return this.#engine;
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
  set engine(engine: Engine) {
    if (engine && (typeof engine.next !== 'function')) {
      throw new TypeError('engine must have function `next()`');
    }

    // set the engine and re-initialise the random engine
    this.#engine = engine || NativeMath;
    this.#generator = new Random(this.#engine);
  }

  /**
   * Generate a random integer within the inclusive range `[min, max]`.
   *
   * @param {number} min The minimum integer value, inclusive.
   * @param {number} max The maximum integer value, inclusive.
   *
   * @returns {number} The random integer
   */
  integer(min: number, max: number): number {
    this.#engine.range = [min, max];

    return this.#generator.integer(min, max);
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
  real(min: number, max: number, inclusive: boolean = false): number {
    this.#engine.range = [min, max];

    return this.#generator.real(min, max, inclusive);
  }
}

const generator = new Generator();

export default Generator;

export {
  generator,
};
