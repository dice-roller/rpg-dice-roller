export default ReRollModifier;
declare class ReRollModifier extends ComparisonModifier {
    /**
     *
     * @param {string} notation
     * @param {boolean} once
     * @param {ComparePoint} comparePoint
     */
    constructor(notation: string, once?: boolean, comparePoint?: any);
    /**
     * Sets whether the modifier should only re-roll once or not
     *
     * @param value
     */
    set once(arg: boolean);
    /**
     * Returns whether the modifier should only re-roll once or not
     *
     * @returns {boolean}
     */
    get once(): boolean;
    [onceSymbol]: boolean | undefined;
}
import ComparisonModifier from "./ComparisonModifier";
declare const onceSymbol: unique symbol;
