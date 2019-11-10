import KeepModifier from "./KeepModifier.js";

const DropModifier = (() => {
  class DropModifier extends KeepModifier{
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
