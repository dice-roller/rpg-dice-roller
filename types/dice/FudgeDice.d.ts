export default FudgeDice;
declare class FudgeDice extends StandardDice {
    constructor(notation: any, nonBlanks?: number, qty?: number, modifiers?: any);
    get nonBlanks(): any;
}
import StandardDice from "./StandardDice";
