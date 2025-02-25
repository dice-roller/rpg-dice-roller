/* eslint-disable @typescript-eslint/no-useless-constructor */
import ComparisonModifier from './ComparisonModifier';
import { Comparator } from "../types/Interfaces/Comparator";
import { Modifiable } from "../types/Interfaces/Modifiable";
import { ExpressionResult } from "../types/Interfaces/Results/ExpressionResult";
import { ResultCollection } from "../types/Interfaces/Results/ResultCollection";
import RollResults from "../results/RollResults";

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
   * The default modifier execution order.
   *
   * @type {number}
   */
  static override order: number = 9;

  override readonly name:string = 'critical-success';

  /**
   * Create a `CriticalSuccessModifier` instance.
   *
   * @param {ComparePoint} comparator The comparison object
   *
   * @throws {TypeError} comparePoint must be a `ComparePoint` object
   */
  constructor(comparator: Comparator) {
    super(comparator);
  }

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  override get notation(): string {
    return `cs${super.notation}`;
  }

  /* eslint-disable @typescript-eslint/class-methods-use-this */
  /**
   * The default compare point definition
   *
   * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
   *
   * @returns {array}
   */
  protected override defaultComparePoint(_context: Modifiable): [string, number]|null {
    if ('max' in _context) {
      return ['=', _context.max as number];
    }

    return null;
  }
  /* eslint-enable @typescript-eslint/class-methods-use-this */

  /**
   * Runs the modifier on the rolls.
   *
   * @param {RollResults} results The results to run the modifier against
   * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
   *
   * @returns {RollResults}
   */
  override run<T extends ExpressionResult | ResultCollection>(results: T, _context: Modifiable): T {
    super.run(results, _context);

    if (results instanceof RollResults) {
      // loop through each roll and see if it's a critical success
      results.rolls = results
        .rolls
        .map((roll) => {
          // add the modifier flag
          if (this.isComparePoint(roll.value)) {
            roll.modifiers.add(this.name);
          }

          return roll;
        });
    }

    return results;
  }
}

export default CriticalSuccessModifier;
