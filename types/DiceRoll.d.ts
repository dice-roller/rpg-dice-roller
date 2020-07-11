export default DiceRoll;
declare class DiceRoll {
    /** ***********************
     * Static Methods
     ************************ */
    /**
     * Imports the given dice roll data and builds an object from it.
     *
     * Throws Error on failure
     *
     * @param {{}|string|DiceRoll} data The data to import
     *
     * @throws Error
     *
     * @returns {DiceRoll}
     */
    static import(data: {} | string | DiceRoll): DiceRoll;
    /**
     * Parses the notation and rolls the dice
     *
     * @param notation
     */
    constructor(notation: any);
    /** ***********************
     * Public Properties
     ************************ */
    /**
     * The dice notation
     *
     * @returns {string}
     */
    get notation(): string;
    /**
     * Returns the roll notation and rolls in the format of:
     * 2d20+1d6: [20,2]+[2] = 24
     *
     * @returns {string}
     */
    get output(): string;
    /**
     * The dice rolled for the notation
     *
     * @returns {RollResults[]}
     */
    get rolls(): RollResults[];
    /**
     * Returns the roll total
     *
     * @returns {number}
     */
    get total(): number;
    /** ***********************
     * Public methods
     ************************ */
    /**
     * Exports the DiceRoll in the given format.
     * If no format is specified, JSON is returned.
     *
     * @throws Error
     * @param {exportFormats=} format The format to export the data as (ie. JSON, base64)
     * @returns {string|null}
     */
    export(format?: Readonly<{
        BASE_64: number;
        JSON: number;
        OBJECT: number;
    }> | undefined): string | null;
    /**
     * Returns whether the object has rolled dice or not
     *
     * @returns {boolean}
     */
    hasRolls(): boolean;
    /**
     * Rolls the dice for the existing notation.
     * This is useful if you want to re-roll the dice,
     * for some reason, but it's usually better to
     * create a new DiceRoll instance instead.
     *
     * @returns {Array}
     */
    roll(): any[];
    /**
     * Returns an object for JSON serialising
     *
     * @returns {{}}
     */
    toJSON(): {};
    /**
     * Returns the String representation
     * of the object as the roll notation
     *
     * @returns {string}
     */
    toString(): string;
}
import RollResults from "./results/RollResults";
