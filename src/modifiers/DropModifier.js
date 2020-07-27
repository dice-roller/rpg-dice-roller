import KeepModifier from './KeepModifier';

/**
 * A drop modifier
 */
class DropModifier extends KeepModifier {
  /**
   * Create a DropModifier
   *
   * @param {string} notation The modifier notation
   * @param {string} end Either `h|l` to drop highest or lowest
   * @param {number} [qty=1] The amount to keep
   *
   * @throws {RangeError} End must be one of 'h' or 'l'
   * @throws {RequiredArgumentError} Notation is required
   * @throws {TypeError} qty must be a positive integer
   */
  constructor(notation, end, qty = 1) {
    super(notation, end, qty);

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
   * Returns the min/max range of rolls to drop
   *
   * @param {RollResults} _results
   *
   * @returns {number[]}
   */
  rangeToDrop(_results) {
    // we're dropping, so we want to drop all dice that are inside of the qty range
    return [0, this.qty];
  }
}

export default DropModifier;
