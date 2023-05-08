import { DieActionValueError } from '../exceptions/index.js';
import ComparisonModifier from './ComparisonModifier.js';

const onceSymbol = Symbol('once');

/**
 *
 * @param {{}} value
 * @param {number} index
 * @param {[]} collection
 * @param {boolean=} [notFirst=false]
 * @returns {boolean}
 */
const isDuplicate = (value, index, collection, notFirst = false) => {
  const i = collection.map((e) => e.value).indexOf(value.value);

  return notFirst ? i < index : i !== index;
};

/**
 * A `ReRollModifier` re-rolls dice that match a given test, and replaces the new value with the old
 * one.
 *
 * @extends ComparisonModifier
 */
class UniqueModifier extends ComparisonModifier {
  /**
   * Create a `UniqueModifier` instance.
   *
   * @param {boolean} [once=false] Whether to only re-roll once or not
   * @param {ComparePoint} [comparePoint=null] The comparison object
   */
  constructor(once = false, comparePoint = null) {
    super(comparePoint);

    this.once = !!once;

    // set the modifier's sort order
    this.order = 5;
  }

  /* eslint-disable class-methods-use-this */
  /**
   * The name of the modifier.
   *
   * @returns {string} 'unique'
   */
  get name() {
    return 'unique';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  get notation() {
    return `u${this.once ? 'o' : ''}${super.notation}`;
  }

  /**
   * Whether the modifier should only re-roll once or not.
   *
   * @returns {boolean} `true` if it should re-roll once, `false` otherwise
   */
  get once() {
    return !!this[onceSymbol];
  }

  /**
   * Set whether the modifier should only re-roll once or not.
   *
   * @param {boolean} value
   */
  set once(value) {
    this[onceSymbol] = !!value;
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
    // ensure that the dice can re-roll without going into an infinite loop
    if (_context.min === _context.max) {
      throw new DieActionValueError(_context, 're-roll');
    }

    results.rolls
      .forEach((roll, index, collection) => {
        // no need to re-roll on the first roll
        if (index === 0) {
          return;
        }

        for (
          let i = 0;
          (
            (i < this.maxIterations)
            && (!this.comparePoint || this.isComparePoint(roll.value))
            && isDuplicate(roll, index, collection, true)
          );
          i++
        ) {
          // re-roll the dice
          const rollResult = _context.rollOnce();

          // eslint-disable-next-line no-param-reassign
          roll.value = rollResult.value;

          // add the re-roll modifier flag
          roll.modifiers.add(`unique${this.once ? '-once' : ''}`);

          if (this.once) {
            break;
          }
        }
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
   *  once: boolean
   * }}
   */
  toJSON() {
    const { once } = this;

    return Object.assign(
      super.toJSON(),
      {
        once,
      },
    );
  }
}

export default UniqueModifier;
