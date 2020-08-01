import StandardDice from './StandardDice';

/**
 * A percentile die
 */
class PercentileDice extends StandardDice {
  /**
   * Create a PercentileDice
   *
   * @param {number} [qty=1] The number of dice to roll (e.g. 4)
   * @param {Map<string, Modifier>|Modifier[]|{}|null} [modifiers=null]
   * @param {boolean} [sidesAsNumber=false] whether to show the sides as a number or percent symbol
   *
   * @throws {TypeError} qty must be a positive integer, and modifiers must be valid
   */
  constructor(qty = 1, modifiers = null, sidesAsNumber = false) {
    super(100, qty, modifiers);

    this.sidesAsNumber = !!sidesAsNumber;
  }

  /* eslint-disable class-methods-use-this */
  /**
   * Returns the name for the dice
   *
   * @returns {string}
   */
  get name() {
    return 'percentile';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * The number of sides the dice has
   *
   * @returns {number|string} Percent symbol if sidesAsNumber is false, or 100 otherwise
   */
  get sides() {
    return this.sidesAsNumber ? super.sides : '%';
  }
}

export default PercentileDice;
