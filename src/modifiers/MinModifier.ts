import { isNumeric } from '../utilities/math';
import Modifier from './Modifier';
import { ResultCollection } from "../types/Interfaces/Results/ResultCollection";
import { Modifiable } from "../types/Interfaces/Modifiable";
import { ExpressionResult } from "../types/Interfaces/Results/ExpressionResult";
import ResultGroup from "../results/ResultGroup";

/**
 * A `MinModifier` causes die rolls under a minimum value to be treated as the minimum value.
 *
 * @since 4.3.0
 *
 * @see {@link MaxModifier} for the opposite of this modifier
 *
 * @extends {Modifier}
 */
class MinModifier extends Modifier {
  /**
   * The default modifier execution order.
   *
   * @type {number}
   */
  static order: number = 1;

  #min!: number;

  /**
   * Create a `MinModifier` instance.
   *
   * @param {number} min The minimum value
   *
   * @throws {TypeError} min must be a number
   */
  constructor(min: number) {
    super();

    this.min = min;
  }

  /**
   * The minimum value.
   *
   * @returns {Number}
   */
  get min(): number {
    return this.#min;
  }

  /**
   * Set the minimum value.
   *
   * @param {number} value
   *
   * @throws {TypeError} min must be a number
   */
  set min(value: number) {
    if (!isNumeric(value)) {
      throw new TypeError('min must be a number');
    }

    this.#min = parseFloat(`${value}`);
  }

  /* eslint-disable class-methods-use-this */
  /**
   * The name of the modifier.
   *
   * @returns {string} 'min'
   */
  get name(): string {
    return 'min';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  get notation(): string {
    return `min${this.min}`;
  }

  /**
   * Run the modifier on the results.
   *
   * @param {RollResults} results The results to run the modifier against
   * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
   *
   * @returns {RollResults} The modified results
   */
  run<T extends ExpressionResult | ResultCollection>(results: T, _context: Modifiable): T {
    if (results instanceof ResultGroup) {
      return results;
    }

    const parsedResults = results as ResultCollection;

    parsedResults.rolls = parsedResults
      .rolls
      .map((roll) => {
        const parsedRoll = roll;

        if (roll.value < this.min) {
          parsedRoll.value = this.min;
          parsedRoll.modifiers.add('min');
        }

        return parsedRoll;
      });

    return parsedResults as T;
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{notation: string, name: string, type: string, min: Number}}
   */
  toJSON() {
    const { min } = this;

    return Object.assign(
      super.toJSON(),
      {
        min,
      },
    );
  }
}

export default MinModifier;
