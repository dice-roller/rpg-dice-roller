export default ExplodeModifier;
declare class ExplodeModifier extends ComparisonModifier {
    /**
     *
     * @param {string} notation
     * @param {ComparePoint} comparePoint
     * @param {boolean=} compound Defaults to false
     * @param {boolean=} penetrate Defaults to false
     */
    constructor(notation: string, comparePoint?: any, compound?: boolean | undefined, penetrate?: boolean | undefined);
    /**
     * Whether the modifier should compound the results or not
     *
     * @type {boolean}
     */
    get compound(): boolean;
    /**
     * Whether the modifier should penetrate the results or not
     *
     * @returns {boolean}
     */
    get penetrate(): boolean;
    [compoundSymbol]: boolean;
    [penetrateSymbol]: boolean;
}
import ComparisonModifier from "./ComparisonModifier";
declare const compoundSymbol: unique symbol;
declare const penetrateSymbol: unique symbol;
