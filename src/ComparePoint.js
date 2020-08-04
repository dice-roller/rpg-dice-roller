import { CompareOperatorError, RequiredArgumentError } from './exceptions';
import { diceUtils } from './utilities/utils';

/**
 * The operator
 *
 * @type {symbol}
 *
 * @private
 */
const operatorSymbol = Symbol('operator');

/**
 * The value
 *
 * @type {symbol}
 *
 * @private
 */
const valueSymbol = Symbol('value');

/**
 * A `ComparePoint` object compares numbers against each other.
 * For example, _is 6 greater than 3_, or _is 8 equal to 10_.
 */
class ComparePoint {
  /**
   * Create a `ComparePoint` instance.
   *
   * @param {string} operator The comparison operator (One of `=`, `!=`, `<`, `>`, `<=`, `>=`)
   * @param {number} value The value to compare to
   *
   * @throws {CompareOperatorError} operator is invalid
   * @throws {RequiredArgumentError} operator and value are required
   * @throws {TypeError} value must be numeric
   */
  constructor(operator, value) {
    if (!operator) {
      throw new RequiredArgumentError('operator');
    } else if (!value && (value !== 0)) {
      throw new RequiredArgumentError('value');
    }

    this.operator = operator;
    this.value = value;
  }

  /**
   * Check if the operator is valid.
   *
   * @param {string} operator
   *
   * @returns {boolean} `true` if the operator is valid, `false` otherwise
   */
  static isValidOperator(operator) {
    return (typeof operator === 'string') && /^(?:[<>!]?=|[<>])$/.test(operator);
  }

  /**
   * Set the comparison operator.
   *
   * @param {string} operator One of `=`, `!=`, `<`, `>`, `<=`, `>=`
   *
   * @throws CompareOperatorError operator is invalid
   */
  set operator(operator) {
    if (!this.constructor.isValidOperator(operator)) {
      throw new CompareOperatorError(operator);
    }

    this[operatorSymbol] = operator;
  }

  /**
   * The comparison operator.
   *
   * @returns {string}
   */
  get operator() {
    return this[operatorSymbol];
  }

  /**
   * Set the value.
   *
   * @param {number} value
   *
   * @throws {TypeError} value must be numeric
   */
  set value(value) {
    if (!diceUtils.isNumeric(value)) {
      throw new TypeError('value must be a finite number');
    }

    this[valueSymbol] = Number(value);
  }

  /**
   * The comparison value
   *
   * @returns {number}
   */
  get value() {
    return this[valueSymbol];
  }

  /**
   * Check whether value matches the compare point
   *
   * @param {number} value The number to compare
   *
   * @returns {boolean} `true` if it is a match, `false` otherwise
   */
  isMatch(value) {
    return diceUtils.compareNumbers(value, this.value, this.operator);
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{type: string, value: number, operator: string}}
   */
  toJSON() {
    const { operator, value } = this;

    return {
      operator,
      type: 'compare-point',
      value,
    };
  }

  /**
   * Return the String representation of the object.
   *
   * This is called automatically when casting the object to a string.
   *
   * @returns {string}
   */
  toString() {
    return `${this.operator}${this.value}`;
  }
}

export default ComparePoint;
