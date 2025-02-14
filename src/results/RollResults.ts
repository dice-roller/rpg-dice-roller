import RollResult from './RollResult.js';
import { ResultCollection } from "../types/Interfaces/Results/ResultCollection";
import { ModelType } from "../types/Enums/ModelType";
import { SingleResult } from "../types/Interfaces/Results/SingleResult";

/**
 * A collection of die roll results
 *
 * ::: tip
 * You will probably not need to create your own `RollResults` instances, unless you're importing
 * rolls, but RollResults objects will be returned when rolling dice.
 * :::
 */
class RollResults implements ResultCollection {
  #rolls: SingleResult[] = [];

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
   * @param {Array.<RollResult|number>} [rolls=[]] The roll results
   *
   * @throws {TypeError} Rolls must be an array
   */
  constructor(rolls: SingleResult[]|number[] = []) {
    this.rolls = rolls;
  }

  /**
   * The number of roll results.
   *
   * @returns {number}
   */
  get length(): number {
    return this.rolls.length || 0;
  }

  /**
   * List of roll results.
   *
   * @returns {RollResult[]}
   */
  get rolls(): SingleResult[] {
    return [...this.#rolls];
  }

  /**
   * Set the rolls.
   *
   * @param {RollResult[]|number[]} rolls
   *
   * @throws {TypeError} Rolls must be an array
   */
  set rolls(rolls: SingleResult[]|number[]) {
    if (!rolls || !Array.isArray(rolls)) {
      // roll is not an array
      throw new TypeError(`rolls must be an array: ${rolls}`);
    }

    // loop through each result and add it to the rolls list
    this.#rolls = [];
    rolls.forEach((result) => {
      this.addRoll(result);
    });
  }

  /**
   * The total value of all the rolls after modifiers have been applied.
   *
   * @returns {number}
   */
  get value(): number {
    return this
      .rolls
      .filter((roll) => roll.useInTotal)
      .reduce(
        (carry, roll) => carry + roll.calculationValue,
        0
      );
  }

  /**
   * Add a single roll to the list.
   *
   * @param {RollResult|number} value
   */
  addRoll(value: SingleResult|number): void {
    const result = (value instanceof RollResult) ? value : new RollResult(value);

    this.#rolls.push(result);
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{rolls: RollResult[], value: number}}
   */
  toJSON(): object {
    const { rolls, value } = this;

    return {
      rolls,
      type: ModelType.ResultCollection,
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
  toString(): string {
    return `[${this.rolls.join(', ')}]`;
  }
}

export default RollResults;
