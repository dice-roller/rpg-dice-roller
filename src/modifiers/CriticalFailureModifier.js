import ComparisonModifier from './ComparisonModifier.js';

/**
 * A `CriticalFailureModifier` modifier flags values that match a comparison.
 *
 * Unlike most other modifiers, it doesn't affect the roll value, it simply "flags" matching rolls.
 *
 * @see {@link CriticalSuccessModifier} for the opposite of this modifier
 *
 * @extends ComparisonModifier
 */
class CriticalFailureModifier extends ComparisonModifier {
  /**
   * Create a `CriticalFailureModifier` instance.
   *
   * @param {ComparePoint} [comparePoint] The comparison object
   *
   * @throws {TypeError} comparePoint must be a `ComparePoint` object
   */
  constructor(comparePoint) {
    super(comparePoint);

    // set the modifier's sort order
    this.order = 10;
  }

  /* eslint-disable class-methods-use-this */
  /**
   * The name of the modifier.
   *
   * @returns {string} 'critical-failure'
   */
  get name() {
    return 'critical-failure';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  get notation() {
    return `cf${super.notation}`;
  }

  /**
   * Run the modifier on the results.
   *
   * @param {RollResults} results The results to run the modifier against
   * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
   *
   * @returns {RollResults} The modified results
   */
  run(results, _context) {
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
