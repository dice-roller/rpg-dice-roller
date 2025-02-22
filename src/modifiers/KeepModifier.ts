import { isNumeric } from '../utilities/math';
import Modifier from './Modifier';
import { ResultGroup, RollResults } from '../results';
import { RangeEnd } from "../types/Enums/RangeEnd";
import { ResultCollection } from "../types/Interfaces/Results/ResultCollection";
import { Modifiable } from "../types/Interfaces/Modifiable";
import { ExpressionResult } from "../types/Interfaces/Results/ExpressionResult";
import { SingleResult } from "../types/Interfaces/Results/SingleResult";
import { ResultValue } from "../types/Interfaces/Results/ResultValue";
import { ResultIndex } from "../types/Interfaces/ResultIndex";
import { ModifierJsonOutput } from "../types/Interfaces/Json/ModifierJsonOutput";

// @todo rename "end" to "target" / "rangeTarget" or similar

/**
 * A `KeepModifier` will "keep" dice from a roll, dropping (Remove from total calculations) all
 * others.
 *
 * @see {@link DropModifier} for the opposite of this modifier
 *
 * @extends Modifier
 */
class KeepModifier extends Modifier {
  /**
   * The default modifier execution order.
   *
   * @type {number}
   */
  static override order: number = 6;

  #end!: RangeEnd;
  #qty!: number;

  /**
   * Create a `KeepModifier` instance
   *
   * @param {string} [end=h] Either `h|l` to keep highest or lowest
   * @param {number} [qty=1] The amount dice to keep
   *
   * @throws {RangeError} End must be one of 'h' or 'l'
   * @throws {TypeError} qty must be a positive integer
   */
  constructor(end: RangeEnd = RangeEnd.High, qty: number = 1) {
    super();

    this.end = end;
    this.qty = qty;
  }

  /**
   * Which end the rolls should be kept ("h" = High, "l" = Low).
   *
   * @returns {string} 'h' or 'l'
   */
  get end(): RangeEnd {
    return this.#end;
  }

  /**
   * Set which end the rolls should be kept ("h" = High, "l" = Low).
   *
   * @param {string} value Either 'h' or 'l'
   *
   * @throws {RangeError} End must be one of 'h' or 'l'
   */
  set end(value: RangeEnd) {
    if (!Object.values(RangeEnd).includes(value)) {
      // @todo update error to use enum values
      throw new RangeError('End must be "h" or "l"');
    }

    this.#end = value;
  }

  override get name(): string {
    return`keep-${this.end}`;
  }

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  override get notation(): string {
    return `k${this.end}${this.qty}`;
  }

  /**
   * The quantity of dice that should be kept.
   *
   * @returns {number}
   */
  get qty(): number {
    return this.#qty;
  }

  /**
   * Set the quantity of dice that should be kept.
   *
   * @param {number} value
   *
   * @throws {TypeError} qty must be a positive finite integer
   */
  set qty(value: number) {
    if (value === Infinity) {
      throw new RangeError('qty must be a finite number');
    }
    if (!isNumeric(value) || (value < 1)) {
      throw new TypeError('qty must be a positive finite integer');
    }

    this.#qty = Math.floor(value);
  }

  /**
   * Determine the start and end (end exclusive) range of rolls to drop.
   *
   * @param {RollResults} _results The results to drop from
   *
   * @returns {number[]} The min / max range to drop
   */
  rangeToDrop(_results: ResultIndex[]): number[] {
    // we're keeping, so we want to drop all dice that are outside the qty range
    if (this.end === RangeEnd.High) {
      return [0, _results.length - this.qty];
    }

    return [this.qty, _results.length];
  }

  /**
   * Run the modifier on the results.
   *
   * @param {ResultGroup|RollResults} results The results to run the modifier against
   * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
   *
   * @returns {ResultGroup|RollResults} The modified results
   */
  override run<T extends ExpressionResult | ResultCollection>(results: T, _context: Modifiable): T {
    let modifiedRolls: (ExpressionResult|ResultCollection|ResultValue|number|string)[];
    let rollIndexes: ResultIndex[] = [];

    if (results instanceof ResultGroup) {
      modifiedRolls = results.results;

      if ((modifiedRolls.length === 1) && (modifiedRolls[0] instanceof ResultGroup)) {
        // single sub-roll - get all the dice rolled and their 2d indexes
        rollIndexes = (modifiedRolls[0] as ExpressionResult)
          .results
          .map((result, index) => {
            if (!(result instanceof RollResults)) {
              return null;
            }

            return (result as ResultCollection)
              .rolls
              .map((subResult, subIndex) => ({
                value: subResult.value,
                index: [index, subIndex],
              }));
          })
          .flat()
          .filter(Boolean) as ResultIndex[];
      } else {
        rollIndexes = [...modifiedRolls]
          .filter((result) => (typeof result === 'object') && ('value' in result))
          // get a list of objects with roll values and original index
          .map((roll, index) => ({
            value: (roll as ExpressionResult|ResultCollection|ResultValue).value,
            index,
          }));
      }
    } else if (results instanceof RollResults) {
      modifiedRolls = results.rolls;

      rollIndexes = [...modifiedRolls]
        // get a list of objects with roll values and original index
        .map((roll , index) => ({
          value: (roll as SingleResult).value,
          index,
        }));
    }

    // determine the indexes that need to be dropped
    const dropIndexes: (number|number[])[] = rollIndexes
      // sort the list ascending by value
      .sort((a, b) => a.value - b.value)
      .map((rollIndex) => rollIndex.index)
      // get the roll indexes to drop
      .slice(...this.rangeToDrop(rollIndexes));

    // loop through all of our dice to drop and flag them as such
    dropIndexes.forEach((rollIndex) => {
      let roll: ResultValue;

      if (Array.isArray(rollIndex)) {
        // array of indexes (e.g. single sub-roll in a group roll)
        roll = (
          (modifiedRolls[0] as ExpressionResult)
            .results[rollIndex[0] as number] as ResultCollection
        )
          .rolls[rollIndex[1] as number] as ResultValue;
      } else {
        roll = modifiedRolls[rollIndex] as ResultValue;
      }

      roll.modifiers.add('drop');
      roll.useInTotal = false;
    });

    return results;
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{notation: string, name: string, type: string, qty: number, end: string}}
   */
  override toJSON(): ModifierJsonOutput & {end: RangeEnd, qty: number} {
    const { end, qty } = this;

    return Object.assign(
      super.toJSON(),
      {
        end,
        qty,
      },
    );
  }
}

export default KeepModifier;
