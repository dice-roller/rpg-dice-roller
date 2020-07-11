export default ComparePoint;
declare class ComparePoint {
    /**
     * Checks if the operator is valid
     *
     * @param {string} operator
     *
     * @returns {boolean}
     */
    static isValidOperator(operator: string): boolean;
    /**
     *
     * @param {string} operator
     * @param {number} value
     */
    constructor(operator: string, value: number);
    /**
     * Sets the operator value
     *
     * @param {string} operator
     *
     * @throws Error
     */
    set operator(arg: string);
    /**
     * Returns the comparison operator
     *
     * @returns {string}
     */
    get operator(): string;
    /**
     * Sets the value
     *
     * @param {number} value
     *
     * @throws Error
     */
    set value(arg: number);
    /**
     * Returns the comparison value
     *
     * @returns {number}
     */
    get value(): number;
    /**
     * Checks whether value matches the compare point
     *
     * @param {number} value
     *
     * @returns {boolean}
     */
    isMatch(value: number): boolean;
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
    [operatorSymbol]: string | undefined;
    [valueSymbol]: number | undefined;
}
declare const operatorSymbol: unique symbol;
declare const valueSymbol: unique symbol;
