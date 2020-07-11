export default Modifier;
declare class Modifier {
    /**
     *
     * @param {string} notation
     */
    constructor(notation: string);
    notation: string;
    order: number;
    /**
     * Returns the name for the modifier
     *
     * @returns {string}
     */
    get name(): string;
    /**
     * Runs the modifier on the rolls
     *
     * @param {RollResults} results
     * @param {StandardDice} _dice
     *
     * @returns {RollResults}
     */
    run(results: any, _dice: any): any;
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
}
