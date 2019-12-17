import ComparisonModifier from "./ComparisonModifier.js";

class CriticalFailureModifier extends ComparisonModifier{
  constructor(notation, comparePoint){
    super(notation, comparePoint);

    // set the modifier's sort order
    this.order = 7;
  }

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

export default CriticalFailureModifier;
