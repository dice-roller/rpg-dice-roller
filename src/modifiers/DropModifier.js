import KeepModifier from './KeepModifier';

class DropModifier extends KeepModifier {
  constructor(notation, end, qty) {
    super(notation, end, qty);

    // set the modifier's sort order
    this.order = 5;
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
