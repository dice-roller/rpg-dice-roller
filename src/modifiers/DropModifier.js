import KeepModifier from './KeepModifier';

/**
 * A `DropModifier` will "drop" (Remove from total calculations) dice from a roll.
 *
 * @see {@link KeepModifier} for the opposite of this modifier
 *
 * @extends KeepModifier
 */
class DropModifier extends KeepModifier {
  /**
   * Create a `DropModifier` instance.
   *
   * @param {string} end Either `h|l` to drop highest or lowest
   * @param {number} [qty=1] The amount of dice to drop
   *
   * @throws {RangeError} End must be one of 'h' or 'l'
   * @throws {TypeError} qty must be a positive integer
   */
  constructor(end, qty = 1) {
    super(end, qty);

    // set the modifier's sort order
    this.order = 6;
  }

  /**
   * The name of the modifier.
   *
   * @returns {string} 'drop-l' or 'drop-h'
   */
  get name() {
    return `drop-${this.end}`;
  }

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  get notation() {
    return `d${this.end}${this.qty}`;
  }

  /**
   * Determine the start and end (end exclusive) range of rolls to drop.
   *
   * @param {RollResults} _results The results to drop from
   *
   * @returns {number[]} The min / max range to drop
   */
  rangeToDrop(_results) {
    // we're dropping, so we want to drop all dice that are inside of the qty range
    if (this.end === 'h') {
      return [_results.length - this.qty, _results.length];
    }

    return [0, this.qty];
  }
}

export default DropModifier;
