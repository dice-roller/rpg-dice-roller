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
  private readonly UINT32_MAX = 0xFFFFFFFF; // Max 32-bit unsigned integer
  private readonly UINT53_MAX = 0x1FFFFFFFFFFFFF; // Max 53-bit unsigned integer

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

  /**
   * Returns the maximum number index for the range
   *
   * @returns {number}
   */
  next(): number {
    return ((this.range[1] ?? 0) - (this.range[0] ?? 0));
    // calculate the index of the max number
    //return (this.range[1] ?? 0) - (this.range[0] ?? 0);
  }
}

export default Max;

const engine = new Max();

export {
  engine,
};
