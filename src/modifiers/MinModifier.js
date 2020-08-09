import { isNumeric } from '../utilities/utils.js';
import Modifier from './Modifier.js';

const minSymbol = Symbol('min');

/**
 * A `MinModifier` causes die rolls under a minimum value to be treated as the minimum value.
 *
 * @since 4.3.0
 *
 * @see {@link MaxModifier} for the opposite of this modifier
 *
 * @extends {Modifier}
 */
class MinModifier extends Modifier {
  /**
   * Create a `MinModifier` instance.
   *
   * @param {number} min The minimum value
   *
   * @throws {TypeError} min must be a number
   */
  constructor(min) {
    super();

    this.min = min;

    // set the modifier's sort order
    this.order = 1;
  }

  /**
   * The minimum value.
   *
   * @returns {Number}
   */
  get min() {
    return this[minSymbol];
  }

  /**
   * Set the minimum value.
   *
   * @param {number} value
   *
   * @throws {TypeError} min must be a number
   */
  set min(value) {
    if (!isNumeric(value)) {
      throw new TypeError('min must be a number');
    }

    this[minSymbol] = parseFloat(`${value}`);
  }

  /* eslint-disable class-methods-use-this */
  /**
   * The name of the modifier.
   *
   * @returns {string} 'min'
   */
  get name() {
    return 'min';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  get notation() {
    return `min${this.min}`;
  }

  /**
   * Run the modifier on the results.
   *
   * @param {RollResults} results The results to run the modifier against
   * @param {StandardDice} _dice The die that the modifier is attached to
   *
   * @returns {RollResults} The modified results
   */
  run(results, _dice) {
    const parsedResults = results;

    parsedResults.rolls = results.rolls.map((roll) => {
      const parsedRoll = roll;

      if (roll.value < this.min) {
        parsedRoll.value = this.min;
        parsedRoll.modifiers.add('min');
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
   * @returns {{notation: string, name: string, type: string, min: Number}}
   */
  toJSON() {
    const { min } = this;

    return Object.assign(
      super.toJSON(),
      {
        min,
      },
    );
  }
}

export default MinModifier;
