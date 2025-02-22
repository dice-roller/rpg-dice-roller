import Modifier from './Modifier';
import ResultGroup from '../results/ResultGroup';
import RollResults from '../results/RollResults';
import { SortDirection } from "../types/Enums/SortDirection";
import { ExpressionResult } from "../types/Interfaces/Results/ExpressionResult";
import { ResultCollection } from "../types/Interfaces/Results/ResultCollection";
import { Modifiable } from "../types/Interfaces/Modifiable";
import { SingleResult } from "../types/Interfaces/Results/SingleResult";
import { ResultValue } from "../types/Interfaces/Results/ResultValue";
import { ModifierJsonOutput } from "../types/Interfaces/Json/ModifierJsonOutput";

/**
 * A `SortingModifier` sorts roll results by their value, either ascending or descending.
 *
 * @extends ComparisonModifier
 */
class SortingModifier extends Modifier {
  /**
   * The default modifier execution order.
   *
   * @type {number}
   */
  static override order: number = 11;

  #direction!: SortDirection;

  override readonly name: string = 'sorting';

  /**
   * Create a `SortingModifier` instance.
   *
   * @param {string} [direction=a] The direction to sort in; 'a' (Ascending) or 'd' (Descending)
   *
   * @throws {RangeError} Direction must be 'a' or 'd'
   */
  constructor(direction: SortDirection = SortDirection.Asc) {
    super();

    this.direction = direction;
  }

  /**
   * The sort direction.
   *
   * @returns {string} Either 'a' or 'd'
   */
  get direction(): SortDirection {
    return this.#direction;
  }

  /**
   * Set the sort direction.
   *
   * @param {string} value Either 'a' (Ascending) or 'd' (Descending)
   *
   * @throws {RangeError} Direction must be 'a' or 'd'
   */
  set direction(value: SortDirection) {
    if (!Object.values(SortDirection).includes(value)) {
      throw new RangeError('Direction must be "a" (Ascending) or "d" (Descending)');
    }

    this.#direction = value;
  }

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  override get notation(): string {
    return `s${this.direction}`;
  }

  /* eslint-disable @typescript-eslint/class-methods-use-this */
  #getCompareValue(value: ExpressionResult|SingleResult|ResultCollection|number|string): string|number {
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }

    return value.value;
  }
  /* eslint-enable @typescript-eslint/class-methods-use-this */

  #compareItems<T extends ExpressionResult|SingleResult|ResultCollection|number|string>(a: T, b: T): number {
    const aVal = this.#getCompareValue(a);
    const bVal = this.#getCompareValue(b);

    if (typeof aVal !== typeof bVal) {
      return 0;
    }

    if (typeof a === 'string') {
      return a.localeCompare(b as string);
    } else if (typeof a === 'number') {
      return a - (b as number);
    }

    return a.value - (b as ResultValue|ResultCollection).value;
  }

  #sortItems<T extends (ExpressionResult|SingleResult|ResultCollection|number|string)[]>(items: T): T {
    return items.sort((a, b) => {
      if (this.direction === SortDirection.Desc) {
        return this.#compareItems(b, a);
      }

      return this.#compareItems(a, b);
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
  override run<T extends ExpressionResult | ResultCollection>(results: T, _context: Modifiable): T {
    if ('results' in results) {
      results.results = this.#sortItems(results.results);
    } else {
      results.rolls = this.#sortItems(results.rolls);
    }

    // if result group, we also need to sort any die rolls in th sub-rolls
    if (results instanceof ResultGroup) {
      results.results = results
        .results
        .map((subRoll) => {
          if ((subRoll instanceof ResultGroup) || (subRoll instanceof RollResults)) {
            return this.run(subRoll, _context);
          }

          return subRoll;
        });
    }

    return results;
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{notation: string, name: string, type: string, direction: string}}
   */
  override toJSON(): ModifierJsonOutput & {direction: SortDirection} {
    const { direction } = this;

    return Object.assign(
      super.toJSON(),
      {
        direction,
      },
    );
  }
}

export default SortingModifier;
