// eslint-disable-next-line no-unused-vars
import Modifier from '../modifiers/Modifier.js';
import StandardDice from './StandardDice.js';

/**
 * Represents a percentile die.
 *
 * @extends StandardDice
 */
class PercentileDice extends StandardDice {
  /**
   * Create a `PercentileDice` instance.
   *
   * @param {number} [qty=1] The number of dice to roll (e.g. `4`)
   * @param {Map<string, Modifier>|Modifier[]|{}|null} [modifiers] The modifiers that affect the die
   * @param {boolean} [sidesAsNumber=false] Whether to show the sides as `%` (default) or `100`
   * @param {Description|string|null} [description=null] The roll description.
   *
   * @throws {TypeError} qty must be a positive integer, and modifiers must be valid
   */
  constructor(qty = 1, modifiers = null, sidesAsNumber = false, description = null) {
    super(100, qty, modifiers, null, null, description);

    this.sidesAsNumber = !!sidesAsNumber;
  }

  /* eslint-disable class-methods-use-this */
  /**
   * The name of the die.
   *
   * @returns {string} 'percentile'
   */
  get name() {
    return 'percentile';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * The number of sides the die has
   *
   * @returns {number|string} `%` if `sidesAsNumber == false`, or `100` otherwise
   */
  get sides() {
    return this.sidesAsNumber ? super.sides : '%';
  }
}

export default PercentileDice;
