export default RollResults;
declare class RollResults {
    /**
     * @param {RollResult[]=} rolls
     */
    constructor(rolls?: RollResult[] | undefined);
    /**
     * Sets the rolls
     *
     * @param {RollResult[]|number[]} rolls
     *
     * @throws Error
     */
    set rolls(arg: RollResult[]);
    /**
     * Returns the rolls
     *
     * @returns {RollResult[]}
     */
    get rolls(): RollResult[];
    /**
     * Returns the numbers of rolls
     *
     * @returns {number}
     */
    get length(): number;
    /**
     * The total value of the rolls, taking in to consideration modifiers
     *
     * @returns {number}
     */
    get value(): number;
    /**
     * Adds a single roll to the list
     *
     * @param {RollResult|number} value
     */
    addRoll(value: RollResult | number): void;
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
    [rollsSymbol]: any[] | undefined;
}
import RollResult from "./RollResult";
declare const rollsSymbol: unique symbol;
