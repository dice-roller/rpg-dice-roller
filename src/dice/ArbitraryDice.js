import {isNumeric} from '../utilities/math.js';

const sidesSymbol = Symbol('sides');
const qtySymbol = Symbol('qty');

class ArbitraryDice {
  /**
   * Create an `ArbitraryDice` instance.
   *
   * @param {string|number|string[]|number[]} sides The sides of the die
   * @param {number} [qty=1] The number of dice to roll (e.g. `4`)
   */
  constructor (sides, qty = 1) {
    this.sides = sides;

    if (!isNumeric(qty)) {
      throw new TypeError('qty must be a positive finite integer');
    } else if ((qty < 1) || (qty > 999)) {
      throw new RangeError('qty must be between 1 and 999');
    }

    this[qtySymbol] = parseInt(`${qty}`, 10);
  }

  /**
   * The number of sides the die has.
   *
   * @returns {number}
   */
  get sides() {
    return this[sidesSymbol] || [];
  }

  /**
   *
   * @param {string|number|string[]|number[]} sides The sides of the die
   */
  set sides(sides) {
    this[sidesSymbol] = Array.isArray(sides) ? sides : [sides];
  }

  /**
   * The number of dice that should be rolled.
   *
   * @returns {number}
   */
  get qty() {
    return this[qtySymbol];
  }
}

export default ArbitraryDice;
