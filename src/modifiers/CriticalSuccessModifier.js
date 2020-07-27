import ComparisonModifier from './ComparisonModifier';

/**
 * A critical success modifier
 */
class CriticalSuccessModifier extends ComparisonModifier {
  /**
   * Create a CriticalSuccessModifier
   *
   * @param {string} notation The modifier notation
   * @param {ComparePoint} comparePoint The comparison object
   *
   * @throws {RequiredArgumentError} Notation is required
   * @throws {TypeError} comparePoint must be a ComparePoint object
   */
  constructor(notation, comparePoint) {
    super(notation, comparePoint);

    // set the modifier's sort order
    this.order = 8;
  }

  /* eslint-disable class-methods-use-this */
  /**
   * Returns the name for the modifier
   *
   * @returns {string}
   */
  get name() {
    return 'critical-success';
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
    // loop through each roll and see if it's a critical success
    results.rolls
      .forEach((roll) => {
        // add the modifier flag
        if (this.isComparePoint(roll.value)) {
          roll.modifiers.add('critical-success');
        }

        return roll;
      });

    return results;
  }
}

export default CriticalSuccessModifier;
