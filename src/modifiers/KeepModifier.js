import Modifier from './Modifier';
import { diceUtils } from '../utilities/utils';

const endSymbol = Symbol('end');
const qtySymbol = Symbol('qty');

class KeepModifier extends Modifier {
  /**
   *
   * @param {string} notation
   * @param {string} end Either `h|l` to keep highest or lowest
   * @param {number=} qty The amount to keep
   */
  constructor(notation, end, qty) {
    super(notation);

    this.end = end;
    this.qty = (qty || (qty === 0)) ? qty : 1;

    // set the modifier's sort order
    this.order = 4;
  }

  /**
   * Returns which end the rolls should be kept ("h" = High, "l" = Low)
   *
   * @returns {string}
   */
  get end() {
    return this[endSymbol];
  }

  /**
   * Sets which end the rolls should be kept ("h" = High, "l" = Low)
   *
   * @param value
   */
  set end(value) {
    if ((value !== 'h') && (value !== 'l')) {
      throw new RangeError('End must be "h" or "l"');
    }

    this[endSymbol] = value;
  }

  /**
   * Returns the name for the modifier
   *
   * @returns {string}
   */
  get name() {
    return `${super.name}-${this.end}`;
  }

  /**
   * Returns the quantity of dice that should be kept
   *
   * @returns {number}
   */
  get qty() {
    return this[qtySymbol];
  }

  /**
   * Sets the quantity of dice that should be kept
   *
   * @param {number} value
   */
  set qty(value) {
    if (!diceUtils.isNumeric(value) || (value < 1)) {
      throw new TypeError('qty must be a positive integer');
    }

    this[qtySymbol] = parseInt(value, 10);
  }

  /**
   * Returns the min/max range of rolls to drop
   *
   * @param {RollResults} _results
   *
   * @returns {number[]}
   */
  rangeToDrop(_results) {
    // we're keeping, so we want to drop all dice that are outside of the qty range
    return [this.qty, _results.length];
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
    // first clone the rolls so it doesn't affect the original array
    const rollIndexes = [...results.rolls]
      // get a list of objects with roll values and original index
      .map((roll, index) => ({
        value: roll.value,
        index,
      }))
      // sort the list by value (Either ascending or descending depending on end)
      .sort((a, b) => ((this.end === 'h') ? b.value - a.value : a.value - b.value))
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
   * Returns an object for JSON serialising
   *
   * @returns {{}}
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
