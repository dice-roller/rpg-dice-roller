import Modifier from './Modifier';
import { diceUtils } from '../utilities/utils';

const minSymbol = Symbol('min');

class MinModifier extends Modifier {
  constructor(notation, min) {
    super(notation);

    this.min = min;

    // set the modifier's sort order
    this.order = 1;
  }

  /**
   * Returns the minimum value
   *
   * @returns {Number}
   */
  get min() {
    return this[minSymbol];
  }

  /**
   * Sets the minimum value
   *
   * @param value
   */
  set min(value) {
    if (!diceUtils.isNumeric(value)) {
      throw new TypeError('min must be a number');
    }

    this[minSymbol] = parseFloat(value);
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

      if (roll.value < this.min) {
        parsedRoll.value = this.min;
        parsedRoll.modifiers.add('min');
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
