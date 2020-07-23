import Modifier from './Modifier';
import { diceUtils } from '../utilities/utils';

const maxSymbol = Symbol('max');

class MaxModifier extends Modifier {
  /**
   *
   * @param {string} notation
   * @param {number} max
   */
  constructor(notation, max) {
    super(notation);

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
   * @param value
   */
  set max(value) {
    if (!diceUtils.isNumeric(value)) {
      throw new TypeError('max must be a number');
    }

    this[maxSymbol] = parseFloat(value);
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
