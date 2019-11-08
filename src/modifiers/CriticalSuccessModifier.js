import ComparisonModifier from "./ComparisonModifier.js";

const CriticalSuccessModifier = (() => {
  class CriticalSuccessModifier extends ComparisonModifier{
    /**
     * Runs the modifier on the rolls
     *
     * @param {RollResults} results
     * @param {StandardDice} dice
     *
     * @returns {RollResults}
     */
    run(results, dice){
      // loop through each roll and see if it's a critical success
      results.rolls
        .map(roll => {
          // add the modifier flag
          if (this.isComparePoint(roll.value)) {
            roll.modifiers.push('critical-success');
          }

          return roll;
        });

      return results;
    }
  }

  return CriticalSuccessModifier;
})();

export default CriticalSuccessModifier;
