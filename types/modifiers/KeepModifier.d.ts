export default KeepModifier;
declare class KeepModifier extends Modifier {
    /**
     *
     * @param {string} notation
     * @param {string} end Either `h|l` to keep highest or lowest
     * @param {number=} qty The amount to keep
     */
    constructor(notation: string, end: string, qty?: number | undefined);
    /**
     * Sets which end the rolls should be kept ("h" = High, "l" = Low)
     *
     * @param value
     */
    set end(arg: string);
    /**
     * Returns which end the rolls should be kept ("h" = High, "l" = Low)
     *
     * @returns {string}
     */
    get end(): string;
    /**
     * Sets the quantity of dice that should be kept
     *
     * @param {number} value
     */
    set qty(arg: number);
    /**
     * Returns the quantity of dice that should be kept
     *
     * @returns {number}
     */
    get qty(): number;
    /**
     * Returns the min/max range of rolls to drop
     *
     * @param {RollResults} _results
     *
     * @returns {number[]}
     */
    rangeToDrop(_results: any): number[];
    [endSymbol]: string | undefined;
    [qtySymbol]: number | undefined;
}
import Modifier from "./Modifier";
declare const endSymbol: unique symbol;
declare const qtySymbol: unique symbol;
