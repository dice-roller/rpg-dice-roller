import DieActionValueError from "../exceptions/DieActionValueError";
import { sumArray } from '../utilities/math';
import ComparisonModifier from './ComparisonModifier';
import { Comparator } from "../types/Interfaces/Comparator";
import { Modifiable } from "../types/Interfaces/Modifiable";
import { ExpressionResult } from "../types/Interfaces/Results/ExpressionResult";
import { ResultCollection } from "../types/Interfaces/Results/ResultCollection";
import StandardDice from "../dice/StandardDice";
import RollResults from "../results/RollResults";
import { ModifierJsonOutput } from "../types/Interfaces/Json/ModifierJsonOutput";
import { ComparisonOperator } from "../types/Enums/ComparisonOperator";

/**
 * An `ExplodeModifier` re-rolls dice that match a given test, and adds them to the results.
 *
 * @see {@link ReRollModifier} if you want to replace the old value with the new, rather than adding
 *
 * @extends ComparisonModifier
 */
class ExplodeModifier extends ComparisonModifier {
  /**
   * The default modifier execution order.
   *
   * @type {number}
   */
  static override order: number = 3;

  readonly #compound: boolean;
  readonly #penetrate: boolean;

  override readonly name:string = 'explode';

  /**
   * Create an `ExplodeModifier` instance
   *
   * @param {ComparePoint} [comparator=null] The comparison object
   * @param {boolean} [compound=false] Whether to compound or not
   * @param {boolean} [penetrate=false] Whether to penetrate or not
   *
   * @throws {TypeError} comparePoint must be a `ComparePoint` object
   */
  constructor(
    comparator?: Comparator|null,
    compound: boolean = false,
    penetrate: boolean = false,
  ) {
    super(comparator);

    this.#compound = !!compound;
    this.#penetrate = !!penetrate;
  }

  /**
   * Whether the modifier should compound the results or not.
   *
   * @returns {boolean} `true` if it should compound, `false` otherwise
   */
  get compound(): boolean {
    return this.#compound;
  }

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  override get notation(): string {
    return `!${this.compound ? '!' : ''}${this.penetrate ? 'p' : ''}${super.notation}`;
  }

  /**
   * Whether the modifier should penetrate the results or not.
   *
   * @returns {boolean} `true` if it should penetrate, `false` otherwise
   */
  get penetrate(): boolean {
    return this.#penetrate;
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
    if ('max' in _context) {
      return [ComparisonOperator.Equal, _context.max as number];
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
      throw new DieActionValueError(_context, 'explode');
    }

    const parsedResults = results;

    parsedResults.rolls = results
      .rolls
      .map((roll) => {
        const subRolls = [roll];
        let compareValue = roll.value;

        // explode if the value matches the compare point, and we haven't reached the max iterations
        for (let i = 0; (i < this.maxIterations) && this.isComparePoint(compareValue); i++) {
          const prevRoll = subRolls[subRolls.length - 1];

          if (!prevRoll) {
            continue;
          }

          // roll the dice
          const rollResult = _context.rollOnce();

          // update the value to check against
          compareValue = rollResult.value;

          // add the explode modifier flag
          prevRoll.modifiers.add('explode');

          // add the penetrate modifier flag and decrement the value
          if (this.penetrate) {
            prevRoll.modifiers.add('penetrate');
            rollResult.value -= 1;
          }

          // add the rolls to the list
          subRolls.push(rollResult);
        }

        // return the rolls (Compounded if necessary)
        if (this.compound && (subRolls.length > 1)) {
          // update the roll value and modifiers
          roll.value = sumArray(subRolls.map((result) => result.value));
          roll.modifiers = new Set([
            'explode',
            'compound',
          ]);

          if (this.penetrate) {
            roll.modifiers.add('penetrate');
          }

          return roll;
        }

        return subRolls;
      })
      .flat();

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
   *  compound: boolean,
   *  penetrate: boolean
   * }}
   */
  override toJSON(): ModifierJsonOutput & {compound: boolean, penetrate: boolean} {
    const { compound, penetrate } = this;

    return Object.assign(
      super.toJSON(),
      {
        compound,
        penetrate,
      },
    );
  }
}

export default ExplodeModifier;
