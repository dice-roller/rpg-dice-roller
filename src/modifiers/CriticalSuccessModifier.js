import ComparisonModifier from './ComparisonModifier';

class CriticalSuccessModifier extends ComparisonModifier {
  constructor(notation, comparePoint) {
    super(notation, comparePoint);

    // set the modifier's sort order
    this.order = 6;
  }

  /**
   * Runs the modifier on the rolls
   *
   * @param {RollResults} results
   * @param {StandardDice} _dice
   *
   * @returns {RollResults}
   */
  run(results, _dice) {
    // loop through each roll and see if it's a critical success
    results.rolls
      .map((roll) => {
        // add the modifier flag
        if (this.isComparePoint(roll.value)) {
          roll.modifiers.push('critical-success');
        }

        return roll;
      });

    return results;
  }
}

export default CriticalSuccessModifier;
