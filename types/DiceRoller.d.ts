export default DiceRoller;
/**
 * A DiceRoller handles dice rolling functionality,
 * keeps track of rolls and can output logs etc.
 *
 * @param {{}=} data
 */
declare class DiceRoller {
    /**
     * Takes the given data, imports it into a new DiceRoller instance
     * and returns the DiceRoller
     *
     * @throws Error
     * @param data
     * @returns {DiceRoller}
     */
    static import(data: any): DiceRoller;
    /**
     * Initialises the object
     *
     * @constructor
     * @param data
     */
    constructor(data: any);
    /**
     * Returns the current roll log
     *
     * @returns {DiceRoll[]}
     */
    get log(): DiceRoll[];
    /**
     * Returns the roll notation and rolls in the format of:
     * 2d20+1d6: [20,2]+[2] = 24; 1d8: [6] = 6
     *
     * @returns {string}
     */
    get output(): string;
    /**
     * Returns the total for all the rolls
     *
     * @returns {number}
     */
    get total(): number;
    /**
     * Clears the roll history log
     */
    clearLog(): void;
    /**
     * Exports the roll log in the given format.
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
     * Takes the given roll data and imports it into
     * the existing DiceRoller, appending the rolls
     * to the current roll log.
     * Returns the roll log.
     *
     * @param {*} data
     *
     * @throws Error
     *
     * @returns {DiceRoll[]}
     */
    import(data: any): DiceRoll[];
    /**
     * Returns an object for JSON serialising
     *
     * @returns {{}}
     */
    toJSON(): {};
    /**
     * Returns the String representation
     * of the object as the roll notations
     *
     * @returns {string}
     */
    toString(): string;
    /**
     * Rolls the given dice notation(s) and returns them.
     *
     * You can roll multiple, separate notations at once by
     * passing them as separate arguments like:
     * ```
     * roll('2d6', '4d10', 'd8');
     * ```
     *
     * If only a single notation is passed, a single DiceRoll
     * object will be returned, if multiple are provided then
     * it will return an array of DiceRoll objects.
     *
     * @param {string[]} notations
     *
     * @returns {DiceRoll|DiceRoll[]}
     */
    roll(...notations: string[]): DiceRoll | DiceRoll[];
}
import DiceRoll from "./DiceRoll";
