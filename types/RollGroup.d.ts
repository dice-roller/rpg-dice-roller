export default RollGroup;
declare class RollGroup {
    /**
     *
     * @param {string} notation
     * @param {StandardDice[]} expressions
     * @param {[]|null} modifiers
     */
    constructor(notation: string, expressions: any[], modifiers?: [] | null);
    /**
     * The modifiers that affect this group
     *
     * @returns {Modifier[]|null}
     */
    get modifiers(): any[] | null;
    /**
     * The dice notation for this group
     *
     * @returns {string}
     */
    get notation(): string;
    /**
     * The expressions in this group
     *
     * @returns {StandardDice[]}
     */
    get expressions(): any[];
    /**
     * Returns an object for JSON serialising
     *
     * @returns {{}}
     */
    toJSON(): {};
    [notationSymbol]: string;
    [expressionsSymbol]: any[];
    [modifiersSymbol]: [] | null;
}
declare const notationSymbol: unique symbol;
declare const expressionsSymbol: unique symbol;
declare const modifiersSymbol: unique symbol;
