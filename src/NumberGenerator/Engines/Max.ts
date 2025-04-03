import { Engine } from "../../Types/Interfaces/NumberGenerator/Engines/Engine";

/**
 * Engine that always returns the maximum value.
 * Used internally for calculating max roll values.
 *
 * @since 4.2.0
 *
 * @type {{next(): number, range: number[]}}
 */
class Max implements Engine {
  private readonly UINT32_MAX = 0xFFFFFFFF;

  readonly name: string = 'max';

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
  range: number[] = [];

  constructor(min?: number, max?: number) {
    if (min !== undefined && max !== undefined) {
      this.range = [min, max];
    }
  }

  clone(): Max {
    return new Max(this.range[0], this.range[1]);
  }

  /**
   * Returns the maximum number index for the range
   *
   * @returns {number}
   */
  next(): number {
    const min = this.range[0] ?? 0;
    const max = this.range[1] ?? min;

    // Compute range and "maxAllowed" boundary from unsafeUniformIntDistribution
    const rangeSize = max - min + 1;
    const maxAllowed = rangeSize > 2
      ? Math.floor(this.UINT32_MAX / rangeSize) * rangeSize
      : this.UINT32_MAX;

    const val = 0x80000000;

    // Safe value to prevent infinite loop in pure-rand's internal logic
    return maxAllowed - 1 - val;
  }
}

export default Max;

const engine = new Max();

export {
  engine,
};
