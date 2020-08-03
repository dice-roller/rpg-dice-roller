import Modifier from './Modifier';
import { diceUtils } from '../utilities/utils';

const endSymbol = Symbol('end');
const qtySymbol = Symbol('qty');

/**
 * A `KeepModifier` will "keep" dice from a roll, dropping (Remove from total calculations) all
 * others.
 *
 * @see {@link DropModifier} for the opposite of this modifier
 *
 * @extends Modifier
 */
class KeepModifier extends Modifier {
  /**
   * Create a `KeepModifier` instance
   *
   * @param {string} end Either `h|l` to keep highest or lowest
   * @param {number} [qty=1] The amount dice to keep
   *
   * @throws {RangeError} End must be one of 'h' or 'l'
   * @throws {TypeError} qty must be a positive integer
   */
  constructor(end, qty = 1) {
    super();

    this.end = end;
    this.qty = qty;

    // set the modifier's sort order
    this.order = 5;
  }

  /**
   * Which end the rolls should be kept ("h" = High, "l" = Low).
   *
   * @returns {string} 'h' or 'l'
   */
  get end() {
    return this[endSymbol];
  }

  /**
   * Set which end the rolls should be kept ("h" = High, "l" = Low).
   *
   * @param {string} value Either 'h' or 'l'
   *
   * @throws {RangeError} End must be one of 'h' or 'l'
   */
  set end(value) {
    if ((value !== 'h') && (value !== 'l')) {
      throw new RangeError('End must be "h" or "l"');
    }

    this[endSymbol] = value;
  }

  /**
   * The name of the modifier.
   *
   * @returns {string} 'keep-l' or 'keep-h'
   */
  get name() {
    return `keep-${this.end}`;
  }

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  get notation() {
    return `k${this.end}${this.qty}`;
  }

  /**
   * The quantity of dice that should be kept.
   *
   * @returns {number}
   */
  get qty() {
    return this[qtySymbol];
  }

  /**
   * Set the quantity of dice that should be kept.
   *
   * @param {number} value
   *
   * @throws {TypeError} qty must be a positive finite integer
   */
  set qty(value) {
    if (value === Infinity) {
      throw new RangeError('qty must be a finite number');
    }
    if (!diceUtils.isNumeric(value) || (value < 1)) {
      throw new TypeError('qty must be a positive finite integer');
    }

    this[qtySymbol] = Math.floor(value);
  }

  /**
   * Determine the start and end (end exclusive) range of rolls to drop.
   *
   * @param {RollResults} _results The results to drop from
   *
   * @returns {number[]} The min / max range to drop
   */
  rangeToDrop(_results) {
    // we're keeping, so we want to drop all dice that are outside of the qty range
    if (this.end === 'h') {
      return [0, _results.length - this.qty];
    }

    return [this.qty, _results.length];
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
    // first clone the rolls so it doesn't affect the original array
    const rollIndexes = [...results.rolls]
      // get a list of objects with roll values and original index
      .map((roll, index) => ({
        value: roll.value,
        index,
      }))
      // sort the list ascending by value
      .sort((a, b) => a.value - b.value)
      .map((rollIndex) => rollIndex.index)
      // get the roll indexes to drop
      .slice(...this.rangeToDrop(results));

    // loop through all of our dice to drop and flag them as such
    rollIndexes.forEach((rollIndex) => {
      const roll = results.rolls[rollIndex];

      roll.modifiers.add('drop');
      roll.useInTotal = false;
    });

    return results;
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{notation: string, name: string, type: string, qty: number, end: string}}
   */
  toJSON() {
    const { end, qty } = this;

    return Object.assign(
      super.toJSON(),
      {
        end,
        qty,
      },
    );
  }
}

export default KeepModifier;
