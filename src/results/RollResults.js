import RollResult from './RollResult';

const rollsSymbol = Symbol('rolls');

/**
 * A collection of roll results
 */
class RollResults {
  /**
   * Create a RollResults
   *
   * @param {RollResult[]|number[]} [rolls=[]]
   *
   * @throws {TypeError} Rolls must be an array
   */
  constructor(rolls = []) {
    this.rolls = rolls || [];
  }

  /**
   * Returns the numbers of rolls
   *
   * @returns {number}
   */
  get length() {
    return this.rolls.length || 0;
  }

  /**
   * Returns the rolls
   *
   * @returns {RollResult[]}
   */
  get rolls() {
    return [...this[rollsSymbol]];
  }

  /**
   * Sets the rolls
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
   * The total value of the rolls, taking in to consideration modifiers
   *
   * @returns {number}
   */
  get value() {
    return this.rolls.reduce((v, roll) => v + (roll.useInTotal ? roll.calculationValue : 0), 0);
  }

  /**
   * Adds a single roll to the list
   *
   * @param {RollResult|number} value
   */
  addRoll(value) {
    const result = (value instanceof RollResult) ? value : new RollResult(value);

    this[rollsSymbol].push(result);
  }

  /**
   * Returns an object for JSON serialising
   *
   * @returns {{}}
   */
  toJSON() {
    const { rolls, value } = this;

    return {
      rolls,
      value,
    };
  }

  /**
   * Returns the String representation of the object
   *
   * @returns {string}
   */
  toString() {
    return `[${this.rolls.join(', ')}]`;
  }
}

export default RollResults;
