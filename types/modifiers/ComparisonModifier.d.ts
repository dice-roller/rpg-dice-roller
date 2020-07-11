export default ComparisonModifier;
declare class ComparisonModifier extends Modifier {
    /**
     *
     * @param {string} notation
     * @param {ComparePoint} comparePoint
     */
    constructor(notation: string, comparePoint: ComparePoint);
    /**
     * Sets the compare point
     *
     * @param comparePoint
     */
    set comparePoint(arg: ComparePoint);
    /**
     * Returns the compare point for the object
     *
     * @returns {ComparePoint}
     */
    get comparePoint(): ComparePoint;
    /**
     * Checks whether value matches the compare point
     *
     * @param {number} value
     *
     * @returns {boolean}
     */
    isComparePoint(value: number): boolean;
    [comparePointSymbol]: ComparePoint | undefined;
}
import Modifier from "./Modifier";
import ComparePoint from "../ComparePoint";
declare const comparePointSymbol: unique symbol;
