import Modifier from './Modifier';
import { diceUtils } from '../utilities/utils';

const maxSymbol = Symbol('max');

/**
 * A max number modifier
 */
class MaxModifier extends Modifier {
  /**
   * Create a MaxModifier
   *
   * @param {number} max The maximum value
   *
   * @throws {TypeError} max must be a number
   */
  constructor(max) {
    super();

    this.max = max;

    // set the modifier's sort order
    this.order = 2;
  }

  /**
   * Returns the maximum value
   *
   * @returns {Number}
   */
  get max() {
    return this[maxSymbol];
  }

  /**
   * Sets the maximum value
   *
   * @param {number} value
   *
   * @throws {TypeError} max must be a number
   */
  set max(value) {
    if (!diceUtils.isNumeric(value)) {
      throw new TypeError('max must be a number');
    }

    this[maxSymbol] = parseFloat(value);
  }

  /* eslint-disable class-methods-use-this */
  /**
   * Returns the name for the modifier
   *
   * @returns {string}
   */
  get name() {
    return 'max';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * Returns the modifier notation
   *
   * @returns {string}
   */
  get notation() {
    return `max${this.max}`;
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
   * Returns an object for JSON serialising
   *
   * @returns {{}}
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
