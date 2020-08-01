import KeepModifier from './KeepModifier';

/**
 * A drop modifier
 */
class DropModifier extends KeepModifier {
  /**
   * Create a DropModifier
   *
   * @param {string} end Either `h|l` to drop highest or lowest
   * @param {number} [qty=1] The amount to keep
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
   * Returns the name for the modifier
   *
   * @returns {string}
   */
  get name() {
    return `drop-${this.end}`;
  }

  /**
   * Returns the modifier notation
   *
   * @returns {string}
   */
  get notation() {
    return `d${this.end}${this.qty}`;
  }

  /**
   * Returns the start and end (end exclusive) range of rolls to drop.
   *
   * @param {RollResults} _results
   *
   * @returns {number[]}
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
