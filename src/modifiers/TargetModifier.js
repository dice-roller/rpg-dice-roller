import ComparisonModifier from "./ComparisonModifier.js";
import ComparePoint from '../ComparePoint.js';

const TargetModifier = (() => {
  const _failureCP = Symbol('failure-cp');

  class TargetModifier extends ComparisonModifier{
    /**
     *
     * @param {string} notation
     * @param {ComparePoint} successCP
     * @param {ComparePoint=} failureCP
     */
    constructor(notation, successCP, failureCP){
      super(notation, successCP);

      if (!failureCP && !(failureCP instanceof ComparePoint)) {
        throw new TypeError('Failure Compare Point must be a ComparePoint or null');
      }

      this[_failureCP] = failureCP;
    }

    /**
     * Returns the failure compare point for the modifier
     *
     * @returns {ComparePoint|null}
     */
    get failureComparePoint(){
      return this[_failureCP];
    }

    /**
     * Returns the success compare point for the modifier
     *
     * @returns {ComparePoint}
     */
    get successComparePoint(){
      return this.comparePoint;
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
      return this.isSuccess(value) ? 1 : (this.isFailure(value) ? -1 : 0);
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
    isFailure(value){
      return this.failureComparePoint ? this.failureComparePoint.isMatch(value) : false;
    }

    /**
     * Returns true if the value doesn't match both the success compare point
     * and the failure compare point.
     *
     * @param {number} value
     * @returns {boolean}
     */
    isNeutral(value){
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
    isSuccess(value){
      return this.isComparePoint(value);
    }

    /**
     * Returns an object for JSON serialising
     *
     * @returns {{}}
     */
    toJSON() {
      const {failureComparePoint, successComparePoint} = this;

      // get the inherited object, but remove the comparePoint property
      const result = super.toJSON();
      delete result.comparePoint;

      return Object.assign(
        result,
        {
          failureComparePoint,
          successComparePoint,
        }
      );
    }
  }

  return TargetModifier;
})();

export default TargetModifier;
