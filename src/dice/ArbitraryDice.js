import { isNumeric } from '../utilities/math.js';
import Modifier from '../modifiers/Modifier.js';
import ExplodeModifier from '../modifiers/ExplodeModifier.js';
import ComparePoint from '../ComparePoint.js';
import ReRollModifier from '../modifiers/ReRollModifier.js';

const modifiersSymbol = Symbol('modifiers');
const sidesSymbol = Symbol('sides');
const qtySymbol = Symbol('qty');

class ArbitraryDice {
  /* eslint-disable max-len */
  /**
   * Create an `ArbitraryDice` instance.
   *
   * @param {string|number|string[]|number[]|{start: string|number, end: string|number, step: number}|{start: string|number, end: string|number, step: number}[]} sides The sides of the die
   * @param {number} [qty=1] The number of dice to roll (e.g. `4`)
   */
  constructor(sides, qty = 1) {
    this.sides = sides;

    if (!isNumeric(qty)) {
      throw new TypeError('qty must be a positive finite integer');
    } else if ((qty < 1) || (qty > 999)) {
      throw new RangeError('qty must be between 1 and 999');
    }

    this[qtySymbol] = parseInt(`${qty}`, 10);
  }

  /**
   * The modifiers that affect this die roll.
   *
   * @returns {Map<string, Modifier>|null}
   */
  get modifiers() {
    if (this[modifiersSymbol]) {
      // ensure modifiers are ordered correctly
      return new Map([...this[modifiersSymbol]].sort((a, b) => a[1].order - b[1].order));
    }

    return null;
  }

  /**
   * Set the modifiers that affect this roll.
   *
   * @param {Map<string, Modifier>|Modifier[]|{}|null} value
   *
   * @throws {TypeError} Modifiers should be a Map, array of Modifiers, or an Object
   */
  set modifiers(value) {
    let modifiers;
    if (value instanceof Map) {
      modifiers = value;
    } else if (Array.isArray(value)) {
      // loop through and get the modifier name of each item and use it as the map key
      modifiers = new Map(value.map((modifier) => [modifier.name, modifier]));
    } else if (typeof value === 'object') {
      modifiers = new Map(Object.entries(value));
    } else {
      throw new TypeError('modifiers should be a Map, array, or an Object containing Modifiers');
    }

    if (
      modifiers.size
      && [...modifiers.entries()].some((entry) => !(entry[1] instanceof Modifier))
    ) {
      throw new TypeError('modifiers must only contain Modifier instances');
    }

    this[modifiersSymbol] = modifiers;

    // loop through each modifier and ensure that those that require it have compare points
    // @todo find a better way of defining compare point on modifiers that don't have them
    /* eslint-disable no-param-reassign */
    this[modifiersSymbol].forEach((modifier) => {
      if ((modifier instanceof ExplodeModifier) && !modifier.comparePoint) {
        modifier.comparePoint = new ComparePoint('=', this.max);
      } else if ((modifier instanceof ReRollModifier) && !modifier.comparePoint) {
        modifier.comparePoint = new ComparePoint('=', this.min);
      }
    });
    /* eslint-enable */
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
