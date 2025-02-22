import { CompareOperatorError, RequiredArgumentError } from './exceptions/index';
import { compareNumbers, isNumeric } from './utilities/math';
import { ComparisonOperator } from "./types/Enums/ComparisonOperator";
import { Comparator } from "./types/Interfaces/Comparator";
import { ModelType } from "./types/Enums/ModelType";
import { JsonOutput } from "./types/Interfaces/Json/JsonOutput";

/**
 * A `ComparePoint` object compares numbers against each other.
 * For example, _is 6 greater than 3_, or _is 8 equal to 10_.
 */
class ComparePoint implements Comparator {
  #operator!: ComparisonOperator;
  #value!: number;

  readonly name = 'compare-point';

  /**
   * Create a `ComparePoint` instance.
   *
   * @param {string} operator The comparison operator (One of `=`, `!=`, `<>`, `<`, `>`, `<=`, `>=`)
   * @param {number} value The value to compare to
   *
   * @throws {CompareOperatorError} operator is invalid
   * @throws {RequiredArgumentError} operator and value are required
   * @throws {TypeError} value must be numeric
   */
  constructor(operator: ComparisonOperator|string, value: number) {
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
   *
   * @todo move this to a helper
   */
  static isValidOperator(operator: ComparisonOperator|string): boolean {
    return (Object.values(ComparisonOperator) as string[])
      .includes(operator);
  }

  /**
   * Set the comparison operator.
   *
   * @param {string} operator One of `=`, `!=`, `<>`, `<`, `>`, `<=`, `>=`
   *
   * @throws CompareOperatorError operator is invalid
   */
  set operator(operator: ComparisonOperator|string) {
    if (!(this.constructor as typeof ComparePoint).isValidOperator(operator)) {
      throw new CompareOperatorError(operator);
    }

    this.#operator = operator as ComparisonOperator;
  }

  /**
   * The comparison operator.
   *
   * @returns {string}
   */
  get operator(): ComparisonOperator {
    return this.#operator;
  }

  /**
   * Set the value.
   *
   * @param {number} value
   *
   * @throws {TypeError} value must be numeric
   */
  set value(value: number) {
    if (!isNumeric(value)) {
      throw new TypeError('value must be a finite number');
    }

    this.#value = Number(value);
  }

  /**
   * The comparison value
   *
   * @returns {number}
   */
  get value(): number {
    return this.#value;
  }

  /**
   * Check whether value matches the compare point
   *
   * @param {number} value The number to compare
   *
   * @returns {boolean} `true` if it is a match, `false` otherwise
   */
  isMatch(value: number): boolean {
    return compareNumbers(value, this.value, this.operator);
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{type: string, value: number, operator: string}}
   */
  toJSON(): JsonOutput & {operator: ComparisonOperator, value: number} {
    const { name, operator, value } = this;

    return {
      name: name,
      operator,
      type: ModelType.ComparePoint,
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
  toString(): string {
    return `${this.operator}${this.value}`;
  }
}

export default ComparePoint;
