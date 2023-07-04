import ComparisonModifier from './ComparisonModifier.js';
import ComparePoint from '../ComparePoint.js';
import ResultGroup from '../results/ResultGroup.js';

const failureCPSymbol = Symbol('failure-cp');

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
  static order = 8;

  /**
   * Create a `TargetModifier` instance.
   *
   * @param {ComparePoint} successCP The success comparison object
   * @param {ComparePoint} [failureCP=null] The failure comparison object
   *
   * @throws {TypeError} failure comparePoint must be instance of ComparePoint or null
   */
  constructor(successCP, failureCP = null) {
    super(successCP);

    // set the failure compare point
    this.failureComparePoint = failureCP;
  }

  /**
   * The failure compare point for the modifier
   *
   * @returns {ComparePoint|null}
   */
  get failureComparePoint() {
    return this[failureCPSymbol];
  }

  /**
   * Set the failure compare point
   *
   * @param {ComparePoint|null} comparePoint
   *
   * @throws {TypeError} failure comparePoint must be instance of ComparePoint or null
   */
  set failureComparePoint(comparePoint) {
    if (comparePoint && !(comparePoint instanceof ComparePoint)) {
      throw new TypeError('failure comparePoint must be instance of ComparePoint or null');
    }

    this[failureCPSymbol] = comparePoint || null;
  }

  /* eslint-disable class-methods-use-this */
  /**
   * The name of the modifier.
   *
   * @returns {string} 'target'
   */
  get name() {
    return 'target';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  get notation() {
    return `${super.notation}${this.failureComparePoint ? `f${this.failureComparePoint}` : ''}`;
  }

  /**
   * The success compare point for the modifier
   *
   * @returns {ComparePoint}
   */
  get successComparePoint() {
    return this.comparePoint;
  }

  /**
   * Set the success compare point for the modifier
   *
   * @param {ComparePoint} value
   */
  set successComparePoint(value) {
    super.comparePoint = value;
  }

  /**
   * Check if the value is a success/failure/neither and return the corresponding state value.
   *
   * @param {number} value The number to compare against
   *
   * @returns {number} success = `1`, failure = `-1`, neutral = `0`
   */
  getStateValue(value) {
    if (this.isSuccess(value)) {
      return 1;
    }

    if (this.isFailure(value)) {
      return -1;
    }

    return 0;
  }

  /**
   * Check if the `value` matches the failure compare point.
   *
   * A response of `false` does _NOT_ indicate a success.
   * A value is a success _ONLY_ if it passes the success compare point.
   * A value could be neither a failure or a success.
   *
   * @param {number} value The number to compare against
   *
   * @returns {boolean}
   */
  isFailure(value) {
    return this.failureComparePoint ? this.failureComparePoint.isMatch(value) : false;
  }

  /**
   * Check if the `value` is neither a success or a failure.
   *
   * @param {number} value The number to compare against
   *
   * @returns {boolean} `true` if the value doesn't match the success and failure compare points
   */
  isNeutral(value) {
    return !this.isSuccess(value) && !this.isFailure(value);
  }

  /**
   * Check if the `value` matches the success compare point.
   *
   * A response of `false` does _NOT_ indicate a failure.
   * A value is a failure _ONLY_ if it passes the failure compare point.
   * A value could be neither a failure or a success.
   *
   * @param {number} value The number to compare against
   *
   * @returns {boolean}
   */
  isSuccess(value) {
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
  run(results, _context) {
    let rolls;

    if (results instanceof ResultGroup) {
      rolls = results.results;
    } else {
      rolls = results.rolls;
    }

    // loop through each roll and see if it matches the target
    rolls
      .forEach((roll) => {
        // add the modifier flag
        if (this.isSuccess(roll.value)) {
          roll.modifiers.add('target-success');
        } else if (this.isFailure(roll.value)) {
          roll.modifiers.add('target-failure');
        }

        // set the value to the success state value
        // eslint-disable-next-line no-param-reassign
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
  toJSON() {
    const { failureComparePoint, successComparePoint } = this;

    // get the inherited object, but remove the comparePoint property
    const result = super.toJSON();
    delete result.comparePoint;

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
