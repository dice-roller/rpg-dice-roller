import KeepModifier from "./KeepModifier.js";

const DropModifier = (() => {
  class DropModifier extends KeepModifier{
    constructor(notation, end, qty){
      super(notation, end, qty);

      // set the modifier's sort order
      this.order = 4;
    }

    /**
     * Returns the min/max range of rolls to drop
     *
     * @param {RollResults} results
     *
     * @returns {number[]}
     *
     * @private
     */
    _rangeToDrop(results){
      // we're dropping, so we want to drop all dice that are inside of the qty range
      return [0, this.qty];
    }
  }

  return DropModifier;
})();

export default DropModifier;
