// eslint-disable-next-line no-unused-vars
import ComparePoint from '../ComparePoint.js';
import ComparisonModifier from './ComparisonModifier.js';

/**
 * A `CriticalSuccessModifier` modifier flags values that match a comparison.
 *
 * Unlike most other modifiers, it doesn't affect the roll value, it simply "flags" matching rolls.
 *
 * @see {@link CriticalFailureModifier} for the opposite of this modifier
 *
 * @extends ComparisonModifier
 */
class CriticalSuccessModifier extends ComparisonModifier {
  /**
   * Create a `CriticalSuccessModifier` instance.
   *
   * @param {ComparePoint} comparePoint The comparison object
   *
   * @throws {TypeError} comparePoint must be a `ComparePoint` object
   */
  constructor(comparePoint) {
    super(comparePoint);

    // set the modifier's sort order
    this.order = 8;
  }

  /* eslint-disable class-methods-use-this */
  /**
   * The name of the modifier.
   *
   * @returns {string} 'critical-success'
   */
  get name() {
    return 'critical-success';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  get notation() {
    return `cs${super.notation}`;
  }

  /**
   * Runs the modifier on the rolls.
   *
   * @param {RollResults} results The results to run the modifier against
   * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
   *
   * @returns {RollResults}
   */
  run(results, _context) {
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
