import ComparisonModifier from "./ComparisonModifier.js";

const CriticalFailureModifier = (() => {
  class CriticalFailureModifier extends ComparisonModifier{
    /**
     * Runs the modifier on the rolls
     *
     * @param {RollResults} results
     * @param {StandardDice} dice
     *
     * @returns {RollResults}
     */
    run(results, dice){
      results.rolls
        .map(roll => {
          // add the modifier flag
          if (this.isComparePoint(roll.value)) {
            roll.modifiers.push('critical-failure');
          }

          return roll;
        });

      return results;
    }
  }

  return CriticalFailureModifier;
})();

export default CriticalFailureModifier;
