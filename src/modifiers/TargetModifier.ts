import ComparisonModifier from './ComparisonModifier';
import ComparePoint from '../ComparePoint';
import ResultGroup from '../results/ResultGroup';
import { Comparator } from "../types/Interfaces/Comparator";
import { SuccessState } from "../types/Enums/SuccessState";
import { ExpressionResult } from "../types/Interfaces/Results/ExpressionResult";
import { ResultCollection } from "../types/Interfaces/Results/ResultCollection";
import { Modifiable } from "../types/Interfaces/Modifiable";
import { SingleResult } from "../types/Interfaces/Results/SingleResult";
import { ModifierJsonOutput } from "../types/Interfaces/Json/ModifierJsonOutput";
import { RollResultType } from "../types/Types/RollResultType";

/**
 * A `TargetModifier` determines whether rolls are classed as a success, failure, or neutral.
 *
 * This modifies the roll values, depending on the state;
 *
 * success = `1`, failure = `-1`, neutral = `0`.
 *
 * @extends ComparisonModifier
 */
class TargetModifier extends ComparisonModifier {
  /**
   * The default modifier execution order.
   *
   * @type {number}
   */
  static override order: number = 8;

  #failComparator: Comparator|null = null;

  override readonly name:string = 'target';

  /**
   * Create a `TargetModifier` instance.
   *
   * @param {ComparePoint} successCP The success comparison object
   * @param {ComparePoint} [failureCP=null] The failure comparison object
   *
   * @throws {TypeError} failure comparePoint must be an instance of ComparePoint or null
   */
  constructor(successCP: Comparator, failureCP?: Comparator) {
    super(successCP);

    // set the failure compare point
    this.failureComparePoint = failureCP ?? null;
  }

  /**
   * The failure compare point for the modifier
   *
   * @returns {ComparePoint|null}
   */
  get failureComparePoint(): Comparator|null {
    return this.#failComparator;
  }

  /**
   * Set the failure compare point
   *
   * @param {ComparePoint|null} comparePoint
   *
   * @throws {TypeError} failure comparePoint must be an instance of ComparePoint or null
   */
  set failureComparePoint(comparePoint: Comparator|null) {
    if (comparePoint && !(comparePoint instanceof ComparePoint)) {
      throw new TypeError('failure comparePoint must be instance of ComparePoint or null');
    }

    if (!comparePoint) {
      this.#failComparator = null;
    } else {
      this.#failComparator = comparePoint;
    }
  }

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  override get notation(): string {
    return `${super.notation}${this.failureComparePoint ? `f${this.failureComparePoint}` : ''}`;
  }

  /**
   * The success compare point for the modifier
   *
   * @returns {ComparePoint}
   */
  get successComparePoint(): Comparator|null {
    return this.comparePoint;
  }

  /**
   * Set the success compare point for the modifier
   *
   * @param {ComparePoint} value
   */
  set successComparePoint(value: Comparator|null) {
    super.comparePoint = value;
  }

  /**
   * Check if the value is a success/failure/neither and return the corresponding state value.
   *
   * @param {number} value The number to compare against
   *
   * @returns {number} success = `1`, failure = `-1`, neutral = `0`
   */
  getStateValue(value: number): SuccessState {
    if (this.isSuccess(value)) {
      return SuccessState.Success;
    }

    if (this.isFailure(value)) {
      return SuccessState.Failure;
    }

    return SuccessState.Neutral;
  }

  /**
   * Check if the `value` matches the failure compare point.
   *
   * A response of `false` does _NOT_ indicate a success.
   * A value is a success _ONLY_ if it passes the success compare point.
   * A value could be neither a failure nor a success.
   *
   * @param {number} value The number to compare against
   *
   * @returns {boolean}
   */
  isFailure(value: number): boolean {
    return this.failureComparePoint
      ? this.failureComparePoint.isMatch(value)
      : false;
  }

  /**
   * Check if the `value` is neither a success nor a failure.
   *
   * @param {number} value The number to compare against
   *
   * @returns {boolean} `true` if the value doesn't match the success and failure compare points
   */
  isNeutral(value: number): boolean {
    return !this.isSuccess(value) && !this.isFailure(value);
  }

  /**
   * Check if the `value` matches the success compare point.
   *
   * A response of `false` does _NOT_ indicate a failure.
   * A value is a failure _ONLY_ if it passes the failure compare point.
   * A value could be neither a failure nor a success.
   *
   * @param {number} value The number to compare against
   *
   * @returns {boolean}
   */
  isSuccess(value: number): boolean {
    return this.isComparePoint(value);
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
    let rolls: RollResultType[]|SingleResult[];

    if (results instanceof ResultGroup) {
      rolls = results.results;
    } else {
      rolls = (results as ResultCollection).rolls;
    }

    // loop through each roll and see if it matches the target
    rolls
      .forEach((roll) => {
        if (typeof roll === 'string' || typeof roll === 'number') {
          return;
        }

        if (!('modifiers' in roll)) {
          return;
        }

        // add the modifier flag
        if (this.isSuccess(roll.value)) {
          roll.modifiers.add('target-success');
        } else if (this.isFailure(roll.value)) {
          roll.modifiers.add('target-failure');
        }

        // set the value to the success state value
        roll.calculationValue = this.getStateValue(roll.value);
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
   *  failureComparePoint: (ComparePoint|null),
   *  successComparePoint: ComparePoint
   * }}
   */
  override toJSON(): ModifierJsonOutput & {failureComparePoint: Comparator|null, successComparePoint: Comparator|null} {
    const { failureComparePoint, successComparePoint } = this;
    // get the inherited object, but remove the comparePoint property
    const { comparePoint, ...result } = super.toJSON();

    return Object.assign(
      result,
      {
        failureComparePoint,
        successComparePoint,
      },
    );
  }
}

export default TargetModifier;
