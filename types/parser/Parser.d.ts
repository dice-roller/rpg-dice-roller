export default Parser;
/**
 * A DiceParser object, which takes a notation
 * and parses it in to rolls
 *
 * @param {string|Object} notation  The dice notation or object
 */
declare class Parser {
    /** Public methods * */
    /**
     * Parses the given dice notation
     * and returns a list of dice and modifiers found
     *
     * @link https://en.m.wikipedia.org/wiki/Dice_notation
     *
     * @param {string} notation
     *
     * @returns {Array}
     */
    static parse(notation: string): any[];
}
