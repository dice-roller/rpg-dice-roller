export default TargetModifier;
declare class TargetModifier extends ComparisonModifier {
    /**
     *
     * @param {string} notation
     * @param {ComparePoint} successCP
     * @param {ComparePoint=} failureCP
     */
    constructor(notation: string, successCP: ComparePoint, failureCP?: ComparePoint | undefined);
    /**
     * Sets the compare point
     *
     * @param comparePoint
     */
    set failureComparePoint(arg: ComparePoint | null);
    /**
     * Returns the failure compare point for the modifier
     *
     * @returns {ComparePoint|null}
     */
    get failureComparePoint(): ComparePoint | null;
    /**
     * Sets the success compare point for the modifier
     *
     * @param value
     */
    set successComparePoint(arg: ComparePoint);
    /**
     * Returns the success compare point for the modifier
     *
     * @returns {ComparePoint}
     */
    get successComparePoint(): ComparePoint;
    /**
     * Checks if the value is a success/failure/neither and returns
     * its corresponding state value:
     * success = 1, fail = -1, neither = 0
     *
     * @param {number} value
     *
     * @returns {number}
     */
    getStateValue(value: number): number;
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
    isFailure(value: any): boolean;
    /**
     * Returns true if the value doesn't match both the success compare point
     * and the failure compare point.
     *
     * @param {number} value
     * @returns {boolean}
     */
    isNeutral(value: number): boolean;
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
    isSuccess(value: number): boolean;
    [failureCPSymbol]: ComparePoint | null | undefined;
}
import ComparisonModifier from "./ComparisonModifier";
import ComparePoint from "../ComparePoint";
declare const failureCPSymbol: unique symbol;
