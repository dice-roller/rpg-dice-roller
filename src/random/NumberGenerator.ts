import { Random, nativeMath } from "random-js";
import type { RandomEngine } from "./RandomEngine.js";

/**
 * Generates numbers in a range from a `RandomEngine`.
 *
 * Used by dice and modifier handlers. Each `Roller` has its own generator, so there is no global
 * state.
 */
export class NumberGenerator {
  readonly #random: Random;

  constructor(readonly engine: RandomEngine = nativeMath) {
    this.#random = new Random(engine);
  }

  /** Returns an integer between `min` and `max`, inclusive. */
  integer(min: number, max: number): number {
    return this.#random.integer(min, max);
  }

  /** Returns a real number between `min` and `max` (`max` is excluded unless `inclusive`). */
  real(min: number, max: number, inclusive = false): number {
    return this.#random.real(min, max, inclusive);
  }
}
