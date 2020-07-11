export default RollResult;
declare class RollResult {
    /**
     *
     * @param {number|{value: Number, initialValue: number}} value The value rolled
     * @param {string[]|Set<string>=} modifiers List of modifier names that affect this roll
     * @param {boolean=} useInTotal Whether to include the roll value when calculating totals
     */
    constructor(value: number | {
        value: number;
        initialValue: number;
    }, modifiers?: (string[] | Set<string>) | undefined, useInTotal?: boolean | undefined);
    /**
     * Set the modifiers that affect the roll
     *
     * @param value
     */
    set modifiers(arg: Set<string>);
    /**
     * Returns the modifiers that affect the roll
     *
     * @returns {Set<string>}
     */
    get modifiers(): Set<string>;
    /**
     * Sets the useInTotal flag
     *
     * @param {boolean} value
     */
    set useInTotal(arg: boolean);
    /**
     * Returns the useInTotal flag
     *
     * @returns {boolean}
     */
    get useInTotal(): boolean;
    /**
     * Sets the value
     *
     * @param value
     */
    set value(arg: number);
    /**
     * Roll value after modifiers have affected it
     *
     * @returns {number}
     */
    get value(): number;
    /**
     * Sets the value to use in calculations
     *
     * @param value
     */
    set calculationValue(arg: number);
    /**
     * Returns the value to use in calculations
     *
     * @returns {number}
     */
    get calculationValue(): number;
    /**
     * The initial roll value before any modifiers.
     * Not often used, you probably want `value` instead.
     *
     * @returns {Number}
     */
    get initialValue(): number;
    /**
     * Returns the flags for the modifiers that affect the roll
     *
     * @returns {string}
     */
    get modifierFlags(): string;
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
    [initialValueSymbol]: number;
    [calculationValueSymbol]: number | null | undefined;
    [modifiersSymbol]: Set<any> | undefined;
    [useInTotalSymbol]: boolean | undefined;
    [valueSymbol]: number | undefined;
}
declare const initialValueSymbol: unique symbol;
declare const calculationValueSymbol: unique symbol;
declare const modifiersSymbol: unique symbol;
declare const useInTotalSymbol: unique symbol;
declare const valueSymbol: unique symbol;
