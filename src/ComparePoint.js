import { diceUtils } from './utilities/utils';
import CompareOperatorError from './exceptions/CompareOperatorError';
import RequiredArgumentError from './exceptions/RequiredArgumentErrorError';

const operatorSymbol = Symbol('operator');
const valueSymbol = Symbol('value');

/**
 * A compare point
 */
class ComparePoint {
  /**
   * Create a ComparePoint
   *
   * @param {string} operator The comparison operator (e.g '=')
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
   * Checks if the operator is valid
   *
   * @param {string} operator
   *
   * @returns {boolean}
   */
  static isValidOperator(operator) {
    return (typeof operator === 'string') && /^(?:[<>!]?=|[<>])$/.test(operator);
  }

  /**
   * Sets the operator value
   *
   * @param {string} operator
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
   * Returns the comparison operator
   *
   * @returns {string}
   */
  get operator() {
    return this[operatorSymbol];
  }

  /**
   * Sets the value
   *
   * @param {number} value
   *
   * @throws {TypeError} value must be numeric
   */
  set value(value) {
    if (!diceUtils.isNumeric(value)) {
      throw new TypeError('value must be numeric');
    }

    this[valueSymbol] = parseInt(value, 10);
  }

  /**
   * Returns the comparison value
   *
   * @returns {number}
   */
  get value() {
    return this[valueSymbol];
  }

  /**
   * Checks whether value matches the compare point
   *
   * @param {number} value
   *
   * @returns {boolean}
   */
  isMatch(value) {
    return diceUtils.compareNumbers(value, this.value, this.operator);
  }

  /**
   * Returns an object for JSON serialising
   *
   * @returns {{}}
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
   * Returns the String representation of the object
   *
   * @returns {string}
   */
  toString() {
    return `${this.operator}${this.value}`;
  }
}

export default ComparePoint;
