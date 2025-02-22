import DieActionValueError from "../exceptions/DieActionValueError";
import ComparisonModifier from './ComparisonModifier';
import { Comparator } from "../types/Interfaces/Comparator";
import { Modifiable } from "../types/Interfaces/Modifiable";
import { ExpressionResult } from "../types/Interfaces/Results/ExpressionResult";
import { ResultCollection } from "../types/Interfaces/Results/ResultCollection";
import RollResults from "../results/RollResults";
import StandardDice from "../dice/StandardDice";
import { ModifierJsonOutput } from "../types/Interfaces/Json/ModifierJsonOutput";

/**
 * A `ReRollModifier` re-rolls dice that match a given test, and replaces the new value with the old
 * one.
 *
 * @see {@link ExplodeModifier} if you want to keep the old value as well
 *
 * @extends ComparisonModifier
 */
class ReRollModifier extends ComparisonModifier {
  #once: boolean = false;

  override readonly name:string = 're-roll';

  /**
   * The default modifier execution order.
   *
   * @type {number}
   */
  static override order: number = 4;

  /**
   * Create a `ReRollModifier` instance.
   *
   * @param {boolean} [once=false] Whether to only re-roll once or not
   * @param {ComparePoint} [comparator=null] The comparison object
   */
  constructor(once: boolean = false, comparator?: Comparator) {
    super(comparator);

    this.once = !!once;
  }

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  override get notation(): string {
    return `r${this.once ? 'o' : ''}${super.notation}`;
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

  /* eslint-disable @typescript-eslint/class-methods-use-this */
  /**
   * The default compare point definition
   *
   * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
   *
   * @returns {array}
   */
  protected override defaultComparePoint(_context: Modifiable): [string, number]|null {
    if ('min' in _context) {
      return ['=', _context.min as number];
    }

    return null;
  }
  /* eslint-enable @typescript-eslint/class-methods-use-this */

  /**
   * Run the modifier on the results.
   *
   * @param {RollResults} results The results to run the modifier against
   * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
   *
   * @returns {RollResults} The modified results
   */
  override run<T extends ExpressionResult | ResultCollection>(results: T, _context: Modifiable): T {
    super.run(results, _context);

    const isDice = _context instanceof StandardDice;

    if (!isDice || !(results instanceof RollResults)){
      return results;
    }

    // ensure that the dice can explode without going into an infinite loop
    if (_context.min === _context.max) {
      throw new DieActionValueError(_context, this.name);
    }

    const parsedResults = results;

    parsedResults.rolls = results
      .rolls
      .map((roll) => {
        // re-roll if the value matches the compare point, and we haven't hit the max iterations,
        // unless we're only rolling once and have already re-rolled
        for (let i = 0; (i < this.maxIterations) && this.isComparePoint(roll.value); i++) {
          // re-roll the dice
          const rollResult = _context.rollOnce();

          // update the roll value (Unlike exploding, the original value is not kept)
          roll.value = rollResult.value;

          // add the re-roll modifier flag
          roll.modifiers.add(`re-roll${this.once ? '-once' : ''}`);

          // stop the loop if we're only re-rolling once
          if (this.once) {
            break;
          }
        }

        return roll;
      });

    return parsedResults;
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

export default ReRollModifier;
