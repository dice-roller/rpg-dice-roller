import RollResult from './RollResult.js';

const rollsSymbol = Symbol('rolls');

/**
 * A collection of die roll results
 *
 * ::: tip
 * You will probably not need to create your own `RollResults` instances, unless you're importing
 * rolls, but RollResults objects will be returned when rolling dice.
 * :::
 */
class RollResults {
  /**
   * Create a `RollResults` instance.
   *
   * @example <caption>`RollResult` objects</caption>
   * const results = new RollResults([
   *  new RollResult(4),
   *  new RollResult(3),
   *  new RollResult(5),
   * ]);
   *
   * @example <caption>Numerical results</caption>
   * const results = new RollResults([4, 3, 5]);
   *
   * @example <caption>A mix</caption>
   * const results = new RollResults([
   *  new RollResult(4),
   *  3,
   *  new RollResult(5),
   * ]);
   *
   * @param {RollResult[]|number[]} [rolls=[]] The roll results
   *
   * @throws {TypeError} Rolls must be an array
   */
  constructor(rolls = []) {
    this.rolls = rolls;
  }

  /**
   * The number of roll results.
   *
   * @returns {number}
   */
  get length() {
    return this.rolls.length || 0;
  }

  /**
   * List of roll results.
   *
   * @returns {RollResult[]}
   */
  get rolls() {
    return [...this[rollsSymbol]];
  }

  /**
   * Set the rolls.
   *
   * @param {RollResult[]|number[]} rolls
   *
   * @throws {TypeError} Rolls must be an array
   */
  set rolls(rolls) {
    if (!rolls || !Array.isArray(rolls)) {
      // roll is not an array
      throw new TypeError(`rolls must be an array: ${rolls}`);
    }

    // loop through each result and add it to the rolls list
    this[rollsSymbol] = [];
    rolls.forEach((result) => {
      this.addRoll(result);
    });
  }

  /**
   * The total value of all the rolls after modifiers have been applied.
   *
   * @returns {number}
   */
  get value() {
    return this.rolls.reduce((v, roll) => v + (roll.useInTotal ? roll.calculationValue : 0), 0);
  }

  /**
   * Add a single roll to the list.
   *
   * @param {RollResult|number} value
   */
  addRoll(value) {
    const result = (value instanceof RollResult) ? value : new RollResult(value);

    this[rollsSymbol].push(result);
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{rolls: RollResult[], value: number}}
   */
  toJSON() {
    const { rolls, value } = this;

    return {
      rolls,
      type: 'roll-results',
      value,
    };
  }

  /**
   * Return the String representation of the object.
   *
   * This is called automatically when casting the object to a string.
   *
   * @returns {string}
   */
  toString() {
    return `[${this.rolls.join(', ')}]`;
  }
}

export default RollResults;
