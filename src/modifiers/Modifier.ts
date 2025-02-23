import { Modifier as IModifier } from '../types/Interfaces/Modifiers/Modifier';
import { Modifiable } from "../types/Interfaces/Modifiable";
import { ModelType } from "../types/Enums/ModelType";
import { ResultCollection } from "../types/Interfaces/Results/ResultCollection";
import { ExpressionResult } from "../types/Interfaces/Results/ExpressionResult";
import { ModifierJsonOutput } from "../types/Interfaces/Json/ModifierJsonOutput";

/**
 * A `Modifier` is the base modifier class that all others extend from.
 *
 * @abstract
 */
abstract class Modifier implements IModifier {
  /**
   * The default modifier execution order.
   *
   * @type {number}
   */
  static order: number = 999;

  readonly abstract name: string;
  order: number;

  /**
   * Create a `Modifier` instance.
   */
  constructor() {
    // set the modifier's sort order
    this.order = (this.constructor as typeof Modifier).order;
  }

  /* eslint-disable @typescript-eslint/class-methods-use-this */
  /* eslint-disable @typescript-eslint/class-literal-property-style */
  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  get notation(): string {
    return '';
  }

  /**
   * The maximum number of iterations that the modifier can apply to a single die roll
   *
   * @returns {number} `1000`
   */
  get maxIterations(): number {
    return 1000;
  }
  /* eslint-enable @typescript-eslint/class-literal-property-style */

  /**
   * No default values present
   *
   * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
   *
   * @returns {object}
   */
  protected defaults(_context: Modifiable): Record<string, unknown> {
    return {};
  }
  /* eslint-enable @typescript-eslint/class-methods-use-this */

  /**
   * Processing default values definitions
   *
   * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
   *
   * @returns {void}
   */
  protected useDefaultsIfNeeded(_context: Modifiable): void {
    (Object.entries(this.defaults(_context)) as [keyof this, typeof this[keyof this]][])
      .forEach(([field, value]) => {
        if (
          (field in this)
          && (typeof this[field] === 'undefined' || this[field] === null)
        ) {
          this[field] = value;
        }
      });
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
    this.useDefaultsIfNeeded(_context);
    return results;
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{notation: string, name: string, type: string}}
   */
  toJSON(): ModifierJsonOutput {
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
