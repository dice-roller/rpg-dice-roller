import KeepModifier from './KeepModifier';
import { RangeEnd } from "../types/Enums/RangeEnd";
import { ResultIndex } from "../types/Types/ResultIndex";

// @todo rename "end" to "target" / "rangeTarget" or similar

/**
 * A `DropModifier` will "drop" (Remove from total calculations) dice from a roll.
 *
 * @see {@link KeepModifier} for the opposite of this modifier
 *
 * @extends KeepModifier
 */
class DropModifier extends KeepModifier {
  /**
   * The default modifier execution order.
   *
   * @type {number}
   */
  static order: number = 7;

  /**
   * Create a `DropModifier` instance.
   *
   * @param {string} [end=l] Either `h|l` to drop highest or lowest
   * @param {number} [qty=1] The amount of dice to drop
   *
   * @throws {RangeError} End must be one of 'h' or 'l'
   * @throws {TypeError} qty must be a positive integer
   */
  constructor(end: RangeEnd = RangeEnd.Low, qty: number = 1) {
    super(end, qty);
  }

  /**
   * The name of the modifier.
   *
   * @returns {string} 'drop-l' or 'drop-h'
   */
  get name(): string {
    return `drop-${this.end}`;
  }

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  get notation(): string {
    return `d${this.end}${this.qty}`;
  }

  /**
   * Determine the start and end (end exclusive) range of rolls to drop.
   *
   * @param {RollResults} _results The results to drop from
   *
   * @returns {number[]} The min / max range to drop
   */
  rangeToDrop(_results: ResultIndex[]): number[] {
    // we're dropping, so we want to drop all dice that are inside the qty range
    if (this.end === RangeEnd.High) {
      return [_results.length - this.qty, _results.length];
    }

    return [0, this.qty];
  }
}

export default DropModifier;
