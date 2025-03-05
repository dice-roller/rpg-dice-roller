import { SeedableEngine } from "../../types/Interfaces/NumberGenerator/SeedableEngine";
import { MersenneTwister19937 } from "random-js";

/**
 * An Engine that is a pseudorandom number generator using the Mersenne
 * Twister algorithm based on the prime 2**19937 − 1
 *
 * See @link{http://en.wikipedia.org/wiki/Mersenne_twister}
 *
 * @type {SeedableEngine}
 */
class MersenneTwister implements SeedableEngine {
  #engine!: MersenneTwister19937;

  constructor(seed?: number) {
    if (seed) {
      this.seed(seed);
    } else {
      this.autoSeed();
    }
  }

  /**
   * Returns a MersenneTwister19937 seeded with the current time and
   * a series of natively-generated random values.
   */
  autoSeed(): this {
    this.#engine = MersenneTwister19937.autoSeed();
    return this;
  }

  /**
   * Returns a MersenneTwister19937 seeded with an initial int32 value.
   *
   * @param {number} seed
   */
  seed(seed: number): this {
    this.#engine = MersenneTwister19937.seed(seed);
    return this;
  }

  /**
   * Discards one or more items from the engine.
   *
   * @param count The count of items to discard
   */
  discard(count: number): this {
    this.#engine.discard(count);
    return this;
  }

  /**
   * Returns the number of times that the Engine has been used.
   *
   * This can be provided to an unused MersenneTwister19937 with the same
   * seed, bringing it to the exact point that was left off.
   */
  getUseCount(): number {
    return this.#engine.getUseCount();
  }

  /**
   * Returns the next int32 value of the sequence.
   */
  next(): number {
    return this.#engine.next();
  }
}

export default MersenneTwister;

const engine = new MersenneTwister();

export {
  engine,
};
