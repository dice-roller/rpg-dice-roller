import { RandomGenerator, unsafeUniformIntDistribution } from 'pure-rand';
import { Engine } from "../Types/Interfaces/NumberGenerator/Engines/Engine";
import { RandomNumberGenerator } from "../Types/Interfaces/NumberGenerator/Engines/RandomNumberGenerator";
import { engine as NativeMath } from "./Engines/NativeMath";

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
  constructor(engine?: Engine) {
    this.engine = engine ?? NativeMath;
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
    if (
      (engine as unknown)
      && (typeof (engine as Engine|undefined)?.next !== 'function')
    ) {
      throw new TypeError('engine must have function `next()`');
    }

    // set the engine and re-initialise the random engine
    this.#engine = ((engine as unknown) || NativeMath) as Engine;
  }

  /**
   * Converts the current engine to the format required by the pure-rand library.
   *
   * @param min
   * @param max
   * @param engine
   * @private
   */
  #getUsableEngine(min: number, max: number, engine?: Engine): RandomGenerator & Pick<Engine, 'range'> {
    const initialEngine = (engine ?? this.#engine);

    return {
      clone: () => {
        return this.#getUsableEngine(min, max, initialEngine.clone() as unknown as Engine);
      },
      getState: () => [1],
      next: () => [
        initialEngine.next(),
        initialEngine as unknown as RandomGenerator,
      ],
      unsafeNext: () =>
        typeof initialEngine.unsafeNext === 'function'
          ? initialEngine.unsafeNext()
          : initialEngine.next(),
      range: [min, max],
    };
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
    return unsafeUniformIntDistribution(min, max, this.#getUsableEngine(min, max));
  }

  /**
   * Generate a floating-point number in the range `[min, max)`, using 32 bit precision.
   *
   * @param {number} min - The lower bound of the range.
   * @param {number} max - The upper bound of the range.
   *
   * @returns {number} The random floating-point number in range `[min, max)`.
   */
  float(min: number, max: number): number {
    const intNumber = this.integer(0, (1 << 24) - 1)

    // Normalize to range [0, 1)
    const floatNumber = intNumber / (1 << 24);

    // Scale to [min, max)
    return min + (max - min) * floatNumber;
  }

  /**
   * Generate a floating-point number in the range `[min, max)`, using 53 bit precision.
   *
   * @param {number} min - The lower bound of the range.
   * @param {number} max - The upper bound of the range.
   *
   * @returns {number} The random floating-point number in range `[min, max)`.
   */
  float64(min: number, max: number): number {
    // Generate first 26 random bits
    const intNumber1 = this.integer(0, (1 << 26) - 1);
    // Generate last 27 random bits
    const intNumber2 = this.integer(0, (1 << 27) - 1);
    // Combine into a 53-bit integer and normalize to [0, 1)
    const floatNumber = (intNumber1 * Math.pow(2, 27) + intNumber2) * Math.pow(2, -53);

    // Scale exclusively to [min, max)
    return (1 - Number.EPSILON) * (min + (max - min) * floatNumber);

  }
}

const generator = new Generator();

export default Generator;

export {
  generator,
};
