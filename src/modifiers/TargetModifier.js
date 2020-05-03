import ComparisonModifier from './ComparisonModifier';
import ComparePoint from '../ComparePoint';

const failureCPSymbol = Symbol('failure-cp');

class TargetModifier extends ComparisonModifier {
  /**
   *
   * @param {string} notation
   * @param {ComparePoint} successCP
   * @param {ComparePoint=} failureCP
   */
  constructor(notation, successCP, failureCP) {
    super(notation, successCP);

    // set the failure compare point
    this.failureComparePoint = failureCP;

    // set the modifier's sort order
    this.order = 5;
  }

  /**
   * Returns the failure compare point for the modifier
   *
   * @returns {ComparePoint|null}
   */
  get failureComparePoint() {
    return this[failureCPSymbol];
  }

  /**
   * Sets the compare point
   *
   * @param comparePoint
   */
  set failureComparePoint(comparePoint) {
    if (comparePoint && !(comparePoint instanceof ComparePoint)) {
      throw new TypeError('failure comparePoint must be instance of ComparePoint or null');
    }

    this[failureCPSymbol] = comparePoint || null;
  }

  /**
   * Returns the success compare point for the modifier
   *
   * @returns {ComparePoint}
   */
  get successComparePoint() {
    return this.comparePoint;
  }

  /**
   * Sets the success compare point for the modifier
   *
   * @param value
   */
  set successComparePoint(value) {
    super.comparePoint = value;
  }

  /**
   * Checks if the value is a success/failure/neither and returns
   * its corresponding state value:
   * success = 1, fail = -1, neither = 0
   *
   * @param {number} value
   *
   * @returns {number}
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
   * Returns true if the value matches the failure compare point.
   *
   * A response of `false` does NOT indicate a success. A value
   * is a success ONLY if it passes the success compare point.
   * A value could be neither a failure or a success.
   *
   * @param value
   * @returns {boolean}
   */
  isFailure(value) {
    return this.failureComparePoint ? this.failureComparePoint.isMatch(value) : false;
  }

  /**
   * Returns true if the value doesn't match both the success compare point
   * and the failure compare point.
   *
   * @param {number} value
   * @returns {boolean}
   */
  isNeutral(value) {
    return !this.isSuccess(value) && !this.isFailure(value);
  }

  /**
   * Returns true if the value matches the success compare point.
   *
   * A response of `false` does NOT indicate a failure. A value
   * is a failure ONLY if it passes the failure compare point.
   * A value could be neither a failure or a success.
   *
   * @param {number} value
   *
   * @returns {boolean}
   */
  isSuccess(value) {
    return this.isComparePoint(value);
  }

  /**
   * Runs the modifier on the rolls
   *
   * @param {RollResults} results
   * @param {StandardDice} _dice
   *
   * @returns {RollResults}
   */
  run(results, _dice) {
    /* eslint-disable no-param-reassign */
    // loop through each roll and see if it matches the target
    results.rolls
      .map((roll) => {
        // add the modifier flag
        if (this.isSuccess(roll.value)) {
          roll.modifiers.push('target-success');
        } else if (this.isFailure(roll)) {
          roll.modifiers.push('target-failure');
        }

        // set the value to the success state value
        roll.calculationValue = this.getStateValue(roll.value);

        return roll;
      });

    return results;
  }

  /**
   * Returns an object for JSON serialising
   *
   * @returns {{}}
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
