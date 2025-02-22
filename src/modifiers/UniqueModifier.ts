import DieActionValueError from "../exceptions/DieActionValueError";
import ComparisonModifier from './ComparisonModifier';
import { Comparator } from "../types/Interfaces/Comparator";
import { ExpressionResult } from "../types/Interfaces/Results/ExpressionResult";
import { ResultCollection } from "../types/Interfaces/Results/ResultCollection";
import { Modifiable } from "../types/Interfaces/Modifiable";
import StandardDice from "../dice/StandardDice";
import RollResults from "../results/RollResults";
import { ResultValue } from "../types/Interfaces/Results/ResultValue";
import { ModifierJsonOutput } from "../types/Interfaces/Json/ModifierJsonOutput";

const isDuplicate = (value: ResultValue, index: number, collection: ResultValue[], notFirst: boolean = false): boolean => {
  const i = collection.map((e) => e.value).indexOf(value.value);

  return notFirst ? i < index : i !== index;
};

/**
 * A `UniqueModifier` re-rolls any non-unique dice values and, optionally that match a given test.
 *
 * @extends ComparisonModifier
 */
class UniqueModifier extends ComparisonModifier {
  /**
   * The default modifier execution order.
   *
   * @type {number}
   */
  static override order: number = 5;

  #once: boolean = false;

  override readonly name:string = 'unique';

  /**
   * Create a `UniqueModifier` instance.
   *
   * @param {boolean} [once=false] Whether to only re-roll once or not
   * @param {ComparePoint} [comparePoint=null] The comparison object
   */
  constructor(once: boolean = false, comparePoint?: Comparator) {
    super(comparePoint);

    this.once = !!once;
  }

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  override get notation(): string {
    return `u${this.once ? 'o' : ''}${super.notation}`;
  }

  /**
   * Whether the modifier should only re-roll once or not.
   *
   * @returns {boolean} `true` if it should re-roll once, `false` otherwise
   */
  get once(): boolean {
    return !!this.#once;
  }

  /**
   * Set whether the modifier should only re-roll once or not.
   *
   * @param {boolean} value
   */
  set once(value: boolean) {
    this.#once = !!value;
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
    const isDice = _context instanceof StandardDice;

    if (!isDice || !(results instanceof RollResults)){
      return results;
    }

    // ensure that the dice can re-roll without going into an infinite loop
    if (_context.min === _context.max) {
      throw new DieActionValueError(_context, this.name);
    }

    results.rolls
      .forEach((roll, index, collection) => {
        // no need to re-roll on the first roll
        if (index === 0) {
          return;
        }

        for (
          let i = 0;
          (
            (i < this.maxIterations)
            && (!this.comparePoint || this.isComparePoint(roll.value))
            && isDuplicate(roll, index, collection, true)
          );
          i++
        ) {
          // re-roll the dice
          const rollResult = _context.rollOnce();

          roll.value = rollResult.value;

          // add the re-roll modifier flag
          roll.modifiers.add(`unique${this.once ? '-once' : ''}`);

          if (this.once) {
            break;
          }
        }
      });

    return results;
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{
   *  notation: string,
   *  name: string,
   *  type: string,
   *  comparePoint: (ComparePoint|undefined),
   *  once: boolean
   * }}
   */
  override toJSON(): ModifierJsonOutput & {once: boolean} {
    const { once } = this;

    return Object.assign(
      super.toJSON(),
      {
        once,
      },
    );
  }
}

export default UniqueModifier;
