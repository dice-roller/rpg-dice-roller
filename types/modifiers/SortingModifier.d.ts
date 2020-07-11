export default SortingModifier;
declare class SortingModifier extends Modifier {
    /**
     *
     * @param {string} notation
     * @param {string} direction Either `a|d`
     */
    constructor(notation: string, direction?: string);
    /**
     * Sets the sort direction
     *
     * @param {string} value
     */
    set direction(arg: string);
    /**
     * Returns the sort direction
     *
     * @returns {string}
     */
    get direction(): string;
    [directionSymbol]: string | undefined;
}
import Modifier from "./Modifier";
declare const directionSymbol: unique symbol;
