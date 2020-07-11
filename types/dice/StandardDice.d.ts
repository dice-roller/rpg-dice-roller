export default StandardDice;
declare class StandardDice {
    /**
     * @param {string} notation
     * @param {number} sides
     * @param {number=} qty
     * @param {Map|{}|Map[]|null=} modifiers
     * @param {?number=} min The minimum possible roll value (Defaults to 1)
     * @param {?number=} max The maximum possible roll value (Defaults to the value of sides)
     */
    constructor(notation: string, sides: number, qty?: number | undefined, modifiers?: (Map | {} | Map[] | null) | undefined, min?: (number | null) | undefined, max?: (number | null) | undefined);
    /**
     * Sets the modifiers that affect this roll
     *
     * @param value
     */
    set modifiers(arg: Map<any, any> | null);
    /**
     * The modifiers that affect this dice roll
     *
     * @returns {Map|null}
     */
    get modifiers(): Map<any, any> | null;
    /**
     * The maximum value that can be rolled om the die
     *
     * @returns {number}
     */
    get max(): number;
    /**
     * Returns the minimum value that can be rolled on the die
     *
     * @returns {number}
     */
    get min(): number;
    /**
     * Returns the name for the dice
     *
     * @returns {*}
     */
    get name(): any;
    /**
     * The dice notation for this dice roll
     *
     * @returns {string}
     */
    get notation(): string;
    /**
     * Returns the number of dice that should be rolled.
     *
     * @returns {number}
     */
    get qty(): number;
    /**
     * The number of sides the dice has
     *
     * @returns {*}
     */
    get sides(): any;
    /**
     * Rolls the dice, for the specified quantity and
     * includes any modifiers, and returns the roll output
     *
     * @returns {RollResults}
     */
    roll(): RollResults;
    /**
     * Rolls a single die and returns the output value
     *
     * @returns {RollResult}
     */
    rollOnce(): RollResult;
    /**
     * Returns an object for JSON serialising
     *
     * @returns {{}}
     */
    toJSON(): {};
    /**
     * Returns the String representation of the object
     *
     * @returns {string}
     */
    toString(): string;
    [notationSymbol]: string;
    [qtySymbol]: number;
    [sidesSymbol]: number;
    [minSymbol]: number;
    [maxSymbol]: number;
    [modifiersSymbol]: Map<any, any> | undefined;
}
import RollResults from "../results/RollResults";
import RollResult from "../results/RollResult";
declare const notationSymbol: unique symbol;
declare const qtySymbol: unique symbol;
declare const sidesSymbol: unique symbol;
declare const minSymbol: unique symbol;
declare const maxSymbol: unique symbol;
declare const modifiersSymbol: unique symbol;
