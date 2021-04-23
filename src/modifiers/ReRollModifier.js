import { DieActionValueError } from '../exceptions/index.js';
import ComparisonModifier from './ComparisonModifier.js';

/**
 * A `ReRollModifier` re-rolls dice that match a given test, and replaces the new value with the old
 * one.
 *
 * @see {@link ExplodeModifier} if you want to keep the old value as well
 *
 * @extends ComparisonModifier
 */
class ReRollModifier extends ComparisonModifier {
  /**
   * Create a `ReRollModifier` instance.
   *
   * @param {number|boolean} [limit=null] The maximum iteration limit per roll.
   * @param {ComparePoint} [comparePoint=null] The comparison object
   */
  constructor(limit = null, comparePoint = null) {
    super(comparePoint);

    this.maxIterations = (limit === true) ? 1 : limit;

    // set the modifier's sort order
    this.order = 4;
  }

  /* eslint-disable class-methods-use-this */
  /**
   * The name of the modifier.
   *
   * @returns {string} 're-roll'
   */
  get name() {
    return 're-roll';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  get notation() {
    let notation = 'r';

    // if the max iterations has been changed, add it to the notation
    if (this.maxIterations && (this.maxIterations !== this.constructor.defaultMaxIterations)) {
      notation = `${notation}${(this.maxIterations === 1) ? 'o' : this.maxIterations}`;
    }

    return `${notation}${super.notation}`;
  }

  /**
   * Whether the modifier should only re-roll once or not.
   *
   * @deprecated use {@link ReRollModifier#maxIterations} instead.
   * @returns {boolean} `true` if it should re-roll once, `false` otherwise
   */
  get once() {
    return this.maxIterations === 1;
  }

  /**
   * Set whether the modifier should only re-roll once or not.
   *
   * @deprecated use {@link ReRollModifier#maxIterations} instead.
   * @param {boolean} value
   */
  set once(value) {
    this.maxIterations = value ? 1 : null;
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
    // ensure that the dice can explode without going into an infinite loop
    if (_context.min === _context.max) {
      throw new DieActionValueError(_context, 're-roll');
    }

    results.rolls
      .map((roll) => {
        // re-roll if the value matches the compare point, and we haven't hit the max iterations,
        // unless we're only rolling once and have already re-rolled
        for (let i = 0; (i < this.maxIterations) && this.isComparePoint(roll.value); i++) {
          // re-roll the dice
          const rollResult = _context.rollOnce();

          // update the roll value (Unlike exploding, the original value is not kept)
          // eslint-disable-next-line no-param-reassign
          roll.value = rollResult.value;

          // add the re-roll modifier flag
          roll.modifiers.add(`re-roll${(this.maxIterations === 1) ? '-once' : ''}`);
        }

        return roll;
      });

    return results;
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{
   *  notation: string,
   *  name: string,
   *  type: string,
   *  comparePoint: (ComparePoint|undefined),
   *  maxIterations: number,
   *  once: boolean
   * }}
   */
  toJSON() {
    const { maxIterations, once } = this;

    return Object.assign(
      super.toJSON(),
      {
        maxIterations,
        once,
      },
    );
  }
}

export default ReRollModifier;
