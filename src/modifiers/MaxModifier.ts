import { isNumeric } from '../utilities/math';
import Modifier from './Modifier';
import { ResultCollection } from "../types/Interfaces/Results/ResultCollection";
import { Modifiable } from "../types/Interfaces/Modifiable";
import { ExpressionResult } from "../types/Interfaces/Results/ExpressionResult";
import ResultGroup from "../results/ResultGroup";
import { ModifierJsonOutput } from "../types/Interfaces/Json/ModifierJsonOutput";

/**
 * A `MaxModifier` causes die rolls over a maximum value to be treated as the maximum value.
 *
 * @since 4.3.0
 *
 * @see {@link MinModifier} for the opposite of this modifier
 *
 * @extends {Modifier}
 */
class MaxModifier extends Modifier {
  /**
   * The default modifier execution order.
   *
   * @type {number}
   */
  static override order: number = 2;

  #max!: number;
  override readonly name: string = 'max';

  /**
   * Create a `MaxModifier` instance.
   *
   * @param {number} max The maximum value
   *
   * @throws {TypeError} max must be a number
   */
  constructor(max: number) {
    super();

    this.max = max;
  }

  /**
   * The maximum value.
   *
   * @returns {Number}
   */
  get max(): number {
    return this.#max;
  }

  /**
   * Set the maximum value.
   *
   * @param {number} value
   *
   * @throws {TypeError} max must be a number
   */
  set max(value: number) {
    if (!isNumeric(value)) {
      throw new TypeError('max must be a number');
    }

    this.#max = parseFloat(`${value}`);
  }

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  override get notation(): string {
    return `max${this.max}`;
  }

  /**
   * Run the modifier on the results.
   *
   * @param {RollResults} results The results to run the modifier against
   * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
   *
   * @returns {RollResults} The modified results
   */
  override run<T extends ExpressionResult | ResultCollection>(results: T, _context: Modifiable): T {
    if (results instanceof ResultGroup) {
      return results;
    }

    const parsedResults = results as ResultCollection;

    parsedResults.rolls = parsedResults
      .rolls
      .map((roll) => {
        const parsedRoll = roll;

        if (roll.value > this.max) {
          parsedRoll.value = this.max;
          parsedRoll.modifiers.add('max');
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
   * @returns {{notation: string, name: string, type: string, max: Number}}
   */
  override toJSON(): ModifierJsonOutput & {max: number} {
    const { max } = this;

    return Object.assign(
      super.toJSON(),
      {
        max,
      },
    );
  }
}

export default MaxModifier;
