import { isNumeric } from '../utilities/math.js';
import Modifier from './Modifier.js';

const maxSymbol = Symbol('max');

/**
 * A `MaxModifier` causes die rolls over a maximum value to be treated as the maximum value.
 *
 * @since 4.3.0
 *
 * @see {@link MinModifier} for the opposite of this modifier
 *
 * @extends {Modifier}
 */
class MaxModifier extends Modifier {
  /**
   * The default modifier execution order.
   *
   * @type {number}
   */
  static order = 2;

  /**
   * Create a `MaxModifier` instance.
   *
   * @param {number} max The maximum value
   *
   * @throws {TypeError} max must be a number
   */
  constructor(max) {
    super();

    this.max = max;
  }

  /**
   * The maximum value.
   *
   * @returns {Number}
   */
  get max() {
    return this[maxSymbol];
  }

  /**
   * Set the maximum value.
   *
   * @param {number} value
   *
   * @throws {TypeError} max must be a number
   */
  set max(value) {
    if (!isNumeric(value)) {
      throw new TypeError('max must be a number');
    }

    this[maxSymbol] = parseFloat(`${value}`);
  }

  /* eslint-disable class-methods-use-this */
  /**
   * The name of the modifier.
   *
   * @returns {string} 'max'
   */
  get name() {
    return 'max';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  get notation() {
    return `max${this.max}`;
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
    const parsedResults = results;

    parsedResults.rolls = results.rolls.map((roll) => {
      const parsedRoll = roll;

      if (roll.value > this.max) {
        parsedRoll.value = this.max;
        parsedRoll.modifiers.add('max');
      }

      return parsedRoll;
    });

    return parsedResults;
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{notation: string, name: string, type: string, max: Number}}
   */
  toJSON() {
    const { max } = this;

    return Object.assign(
      super.toJSON(),
      {
        max,
      },
    );
  }
}

export default MaxModifier;
