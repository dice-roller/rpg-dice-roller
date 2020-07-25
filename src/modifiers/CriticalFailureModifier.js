import ComparisonModifier from './ComparisonModifier';

class CriticalFailureModifier extends ComparisonModifier {
  constructor(notation, comparePoint) {
    super(notation, comparePoint);

    // set the modifier's sort order
    this.order = 9;
  }

  /* eslint-disable class-methods-use-this */
  /**
   * Returns the name for the modifier
   *
   * @returns {string}
   */
  get name() {
    return 'critical-failure';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * Runs the modifier on the rolls
   *
   * @param {RollResults} results
   * @param {StandardDice} _dice
   *
   * @returns {RollResults}
   */
  run(results, _dice) {
    results.rolls
      .forEach((roll) => {
        // add the modifier flag
        if (this.isComparePoint(roll.value)) {
          roll.modifiers.add('critical-failure');
        }

        return roll;
      });

    return results;
  }
}

export default CriticalFailureModifier;
