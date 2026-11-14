import { uniformBigIntDistribution, uniformIntDistribution } from "pure-rand";
import type { RandomGenerator as PureRandGenerator } from "pure-rand";
import { nativeMath } from "./builtInEngines.js";
import type { RandomEngine } from "./RandomEngine.js";

const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
const TWO_TO_53 = MAX_SAFE_INTEGER + 1;

class EngineAdapter implements PureRandGenerator {
  constructor(readonly engine: RandomEngine) {}

  clone(): PureRandGenerator {
    return this;
  }

  next(): [number, PureRandGenerator] {
    return [this.unsafeNext(), this];
  }

  unsafeNext(): number {
    return this.engine.next() | 0;
  }

  getState(): readonly number[] {
    return [];
  }
}

/**
 * Generates numbers in a range from a `RandomEngine`.
 *
 * Used by dice and modifier handlers. Each `Roller` has its own generator, using `nativeMath`
 * by default. Passing the same stateful engine to multiple rollers shares that engine's state.
 */
export class NumberGenerator {
  readonly #random: PureRandGenerator;

  constructor(readonly engine: RandomEngine = nativeMath) {
    this.#random = new EngineAdapter(engine);
  }

  /** Returns an integer between `min` and `max`, inclusive. */
  integer(min: number, max: number): number {
    min = Math.floor(min);
    max = Math.floor(max);

    if (min < -TWO_TO_53 || !isFinite(min)) {
      throw new RangeError(`Expected min to be at least ${-TWO_TO_53}`);
    }

    if (max > TWO_TO_53 || !isFinite(max)) {
      throw new RangeError(`Expected max to be at most ${TWO_TO_53}`);
    }

    if (max - min <= 0) {
      return min;
    }

    if (max - min > MAX_SAFE_INTEGER) {
      return Number(
        uniformBigIntDistribution(BigInt(min), BigInt(max), this.#random)[0],
      );
    }

    return uniformIntDistribution(min, max, this.#random)[0];
  }

  /** Returns a real number between `min` and `max` (`max` is excluded unless `inclusive` is true). */
  real(min: number, max: number, inclusive = false): number {
    if (!isFinite(min)) {
      throw new RangeError("Expected min to be a finite number");
    }

    if (!isFinite(max)) {
      throw new RangeError("Expected max to be a finite number");
    }

    const upperBound = inclusive ? TWO_TO_53 : MAX_SAFE_INTEGER;
    const [sample] = uniformIntDistribution(0, upperBound, this.#random);

    return (sample / TWO_TO_53) * (max - min) + min;
  }
}
