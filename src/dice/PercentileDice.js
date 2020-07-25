import StandardDice from './StandardDice';

class PercentileDice extends StandardDice {
  /**
   * @param {string} notation
   * @param {number=} qty
   * @param {Map|{}|Map[]|null=} modifiers
   * @param {boolean=} sidesAsNumber whether to show the sides as a number or the percent symbol
   */
  constructor(notation, qty = 1, modifiers = null, sidesAsNumber = false) {
    super(notation, 100, qty, modifiers);

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
   * @returns {string}
   */
  get sides() {
    return this.sidesAsNumber ? super.sides : '%';
  }
}

export default PercentileDice;
