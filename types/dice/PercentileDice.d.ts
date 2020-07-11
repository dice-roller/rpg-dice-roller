export default PercentileDice;
declare class PercentileDice extends StandardDice {
    /**
     * @param {string} notation
     * @param {number=} qty
     * @param {Map|{}|Map[]|null=} modifiers
     * @param {boolean=} sidesAsNumber whether to show the sides as a number or the percent symbol
     */
    constructor(notation: string, qty?: number | undefined, modifiers?: (Map | {} | Map[] | null) | undefined, sidesAsNumber?: boolean | undefined);
    sidesAsNumber: boolean;
}
import StandardDice from "./StandardDice";
