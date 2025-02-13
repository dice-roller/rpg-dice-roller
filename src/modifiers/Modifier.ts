import { Modifier as IModifier } from '../types/Interfaces/Modifier';
import RollResults from "../results/RollResults";
import { Modifiable } from "../types/Interfaces/Modifiable";
import { ModelType } from "../types/Enums/ModelType";

/**
 * A `Modifier` is the base modifier class that all others extend from.
 *
 * @abstract
 */
class Modifier implements IModifier {
  /**
   * The default modifier execution order.
   *
   * @type {number}
   */
  static order: number = 999;

  order: number;

  /**
   * Create a `Modifier` instance.
   */
  constructor() {
    // set the modifier's sort order
    this.order = (this.constructor as typeof Modifier).order;
  }

  /* eslint-disable class-methods-use-this */
  /**
   * The name of the modifier.
   *
   * @returns {string} 'modifier'
   */
  get name(): string {
    return 'modifier';
  }
  /* eslint-enable class-methods-use-this */

  /* eslint-disable class-methods-use-this */
  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  get notation(): string {
    return '';
  }
  /* eslint-enable class-methods-use-this */

  /* eslint-disable class-methods-use-this */
  /**
   * The maximum number of iterations that the modifier can apply to a single die roll
   *
   * @returns {number} `1000`
   */
  get maxIterations(): number {
    return 1000;
  }

  /**
   * No default values present
   *
   * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
   *
   * @returns {object}
   */
  #defaults(_context: Modifiable): { [index: string]: unknown } {
    return {};
  }
  /* eslint-enable class-methods-use-this */

  /**
   * Processing default values definitions
   *
   * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
   *
   * @returns {void}
   */
  #useDefaultsIfNeeded(_context: Modifiable): void {
    (Object.entries(this.#defaults(_context)) as [keyof this, any][])
      .forEach(([field, value]) => {
        if (typeof this[field] === 'undefined') {
          this[field] = value;
        }
      });
  }

  /* eslint-disable class-methods-use-this */
  /**
   * Run the modifier on the results.
   *
   * @param {RollResults} results The results to run the modifier against
   * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
   *
   * @returns {RollResults} The modified results
   */
  run(results: RollResults, _context: Modifiable): RollResults {
    this.#useDefaultsIfNeeded(_context);
    return results;
  }
  /* eslint-enable class-methods-use-this */

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{notation: string, name: string, type: string}}
   */
  toJSON() {
    const { notation, name } = this;

    return {
      name,
      notation,
      type: ModelType.Modifier,
    };
  }

  /**
   * Return the String representation of the object.
   *
   * This is called automatically when casting the object to a string.
   *
   * @see {@link Modifier#notation}
   *
   * @returns {string}
   */
  toString(): string {
    return this.notation;
  }
}

export default Modifier;
