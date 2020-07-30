import Modifier from './Modifier';
import { diceUtils } from '../utilities/utils';

const endSymbol = Symbol('end');
const qtySymbol = Symbol('qty');

/**
 * A keep modifier
 */
class KeepModifier extends Modifier {
  /**
   * Create a KeepModifier
   *
   * @param {string} notation The modifier notation
   * @param {string} end Either `h|l` to keep highest or lowest
   * @param {number} [qty=1] The amount to keep
   *
   * @throws {RangeError} End must be one of 'h' or 'l'
   * @throws {RequiredArgumentError} Notation is required
   * @throws {TypeError} qty must be a positive integer
   */
  constructor(notation, end, qty = 1) {
    super(notation);

    this.end = end;
    this.qty = qty;

    // set the modifier's sort order
    this.order = 5;
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
   * Returns the name for the modifier
   *
   * @returns {string}
   */
  get name() {
    return `keep-${this.end}`;
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
   * Returns the start and end (end exclusive) range of rolls to drop.
   *
   * @param {RollResults} _results
   *
   * @returns {number[]}
   */
  rangeToDrop(_results) {
    // we're keeping, so we want to drop all dice that are outside of the qty range
    if (this.end === 'h') {
      return [0, _results.length - this.qty];
    }

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
