import { evaluate, isNumeric } from '../utilities/math';
import getModifierFlags from '../modifiers/modifier-flags';
import RollResults from './RollResults';
import { ExpressionResult } from "../types/Interfaces/Results/ExpressionResult";
import { ModelType } from "../types/Enums/ModelType";
import { RollResultType } from "../types/Types/RollResultType";
import { ExpressionResultJsonOutput } from "../types/Interfaces/Json/ExpressionResultJsonOutput";
import { RollResultJsonOutput } from "../types/Types/Json/RollResultJsonOutput";

// @todo modifiers should be empty set, instead of null|undefined

/**
 * A collection of results and expressions.
 * Usually used to represent the results of a `RollGroup` instance.
 *
 * This can contain `ResultGroup`, `RollResults`, operators, and plain numbers.
 *
 * ::: tip
 * You will probably not need to create your own `ResultGroup` instances, unless you're importing
 * rolls, but `ResultGroup` objects will be returned when rolling group rolls.
 * :::
 *
 * @since 4.5.0
 */
class ResultGroup implements ExpressionResult {
  #calculationValue: number|null = null;
  #isRollGroup!: boolean;
  #modifiers: Set<string> = new Set();
  #results!: RollResultType[];
  #useInTotal!: boolean;

  /**
   * Create a `ResultGroup` instance.
   *
   * @example <caption>Normal roll: `4d6+2d10`</caption>
   * const results = new ResultGroup([
   *  new RollResults([3, 5, 4, 2]),
   *  '+',
   *  new RollResults([4, 8]),
   * ]);
   *
   * @example <caption>Roll group: `{4d6+2d10/2, 5d6/2d%}`</caption>
   * const results = new ResultGroup([
   *  new ResultGroup([
   *    new RollResults([3, 5, 4, 2]),
   *    '+',
   *    new RollResults([4, 8]),
   *    '/',
   *    2,
   *  ]),
   *  new ResultGroup([
   *    new RollResults([3, 3, 5, 2, 4]),
   *    '/',
   *    new RollResults([87, 46]),
   *  ]),
   * ]);
   *
   * @param {Array.<ResultGroup|RollResults|number|string>} [results=[]] The results and expressions
   * @param {string[]|Set<string>} [modifiers=[]] List of modifier names that affect the group
   * @param {boolean} [isRollGroup=false] Whether the result group represents a roll group or not
   * @param {boolean} [useInTotal=true] Whether to include the group's value when calculating totals
   *
   * @throws {TypeError} Rolls must be an array
   */
  constructor(
    results: RollResultJsonOutput[]|RollResultType[] = [],
    modifiers?: Set<string>|string[]|null,
    isRollGroup: boolean = false,
    useInTotal: boolean = true
  ) {
    this.isRollGroup = isRollGroup;
    this.modifiers = modifiers ?? [];
    this.results = results;
    this.useInTotal = useInTotal;
  }

  /**
   * The value to use in calculations.
   * This may be changed by modifiers.
   *
   * @returns {number}
   */
  get calculationValue(): number {
    return isNumeric(this.#calculationValue)
      ? parseFloat(`${this.#calculationValue}`)
      : this.value;
  }

  /**
   * Set the value to use in calculations.
   *
   * @param {number} value
   *
   * @throws {TypeError} value is invalid
   */
  set calculationValue(value: number) {
    const isValNumeric = isNumeric(value);
    if (value === Infinity) {
      throw new RangeError('Results calculation value must be a finite number');
    }
    if (value && !isValNumeric) {
      throw new TypeError(`Results calculation value is invalid: ${value}`);
    }

    this.#calculationValue = isValNumeric ? parseFloat(`${value}`) : null;
  }

  /**
   * Whether the result group represents a roll group or not.
   *
   * @returns {boolean} `true` if it is a roll group, `false` otherwise
   */
  get isRollGroup(): boolean {
    return this.#isRollGroup;
  }

  /**
   * Set whether the result group represents a roll group or not.
   *
   * @param {boolean} value
   */
  set isRollGroup(value: boolean) {
    this.#isRollGroup = !!value;
  }

  /**
   * The number of results.
   *
   * @returns {number}
   */
  get length(): number {
    return this.results.length || 0;
  }

  /**
   * The visual flags for the modifiers that affect the group.
   *
   * @see {@link ResultGroup#modifiers}
   *
   * @returns {string}
   */
  get modifierFlags(): string {
    return getModifierFlags(...this.modifiers);
  }

  /**
   * The modifier names that affect the group.
   *
   * @returns {Set<string>}
   */
  get modifiers(): Set<string> {
    return this.#modifiers;
  }

  /**
   * Set the modifier names that affect the group.
   *
   * @example
   * resultGroup.modifiers = ['drop', 'target-success'];
   *
   * @param {string[]|Set<string>} value
   *
   * @throws {TypeError} modifiers must be a Set or array of modifier names
   */
  set modifiers(value: Set<string>|string[]) {
    if ((Array.isArray(value) || (value instanceof Set)) && [...value].every((item) => typeof item === 'string')) {
      this.#modifiers = new Set([...value]);
    } else if (!(value as unknown) && ((value as unknown) !== 0)) {
      // clear the modifiers
      this.#modifiers = new Set();
    } else {
      throw new TypeError(`modifiers must be a Set or array of modifier names: ${value as unknown}`);
    }
  }

  /**
   * List of results.
   *
   * @returns {Array.<ResultGroup|RollResults|number|string>}
   */
  get results(): RollResultType[] {
    return [...this.#results];
  }

  /**
   * Set the results.
   *
   * @param {Array.<ResultGroup|RollResults|number|string>} results
   *
   * @throws {TypeError} Results must be an array
   */
  set results(results: RollResultJsonOutput[]|RollResultType[]) {
    if (!Array.isArray(results)) {
      // results is not an array
      throw new TypeError(`results must be an array: ${results}`);
    }

    // loop through each result and add it to the results list
    this.#results = [];
    results.forEach((result) => {
      this.addResult(result);
    });
  }

  /**
   * Whether to use the value in total calculations or not.
   *
   * @returns {boolean}
   */
  get useInTotal(): boolean {
    return !!this.#useInTotal;
  }

  /**
   * Set whether to use the value in total calculations or not.
   *
   * @param {boolean} value
   */
  set useInTotal(value: boolean) {
    this.#useInTotal = !!value;
  }

  /**
   * The total value of all the results after modifiers have been applied.
   *
   * @returns {number}
   */
  get value(): number {
    if (!this.results.length) {
      return 0;
    }

    // loop through the results
    // - get the values of result objects and add any operators and plain numbers
    // we'll either end up with a numerical total (If all results are result objects or numbers)
    // or a string equation (If there are operators)
    const value: number|string = this
      .results
      .reduce(
        (carry: string|number, currentValue) => {
          let val;
          if (currentValue instanceof ResultGroup) {
            val = currentValue.useInTotal ? currentValue.calculationValue : 0;
          } else if (currentValue instanceof RollResults) {
            val = currentValue.value;
          } else {
            val = currentValue as string|number;
          }

          if (typeof carry === 'string' || typeof val === 'string') {
            return `${carry}${val}`;
          }

          return carry + val;
        },
        (typeof this.results[0] === 'string') ? '' : 0
      );

    // if value is a string that means operators were included, so we need to evaluate the equation
    if (typeof value === 'string') {
      return evaluate(value);
    }

    return value;
  }

  /**
   * Add a single result to the list.
   *
   * @param {ResultGroup|RollResults|number|string} value
   *
   * @throws {TypeError} Value type is invalid
   */
  addResult(value: RollResultJsonOutput|RollResultType): void {
    let val;

    if ((value instanceof ResultGroup) || (value instanceof RollResults)) {
      // already a valid result object
      val = value;
    } else if ((typeof value === 'string') || isNumeric(value)) {
      // string operator (e.g. '+', '/', etc.), or plain number
      val = value;
    } else {
      throw new TypeError('value must be one of ResultGroup, RollResults, string, or number');
    }

    // add the result to the list
    this.#results.push(val as RollResultType);
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{
   *  modifierFlags: string,
   *  modifiers: string[],
   *  results: Array<ResultGroup|RollResults|number|string>,
   *  type: string,
   *  useInTotal: boolean,
   *  value: number
   * }}
   */
  toJSON(): ExpressionResultJsonOutput {
    const {
      calculationValue, isRollGroup, modifierFlags, modifiers, results, useInTotal, value,
    } = this;

    return {
      calculationValue,
      isRollGroup,
      modifierFlags,
      modifiers: [...modifiers],
      results: results
        .map((result) => (typeof result === 'object' ? result.toJSON() : result) as RollResultJsonOutput),
      type: ModelType.ResultGroup,
      useInTotal,
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
    let output;

    if (this.isRollGroup) {
      output = `{${this.results.join(', ')}}`;
    } else {
      output = this.results.join('');
    }

    if (this.modifierFlags) {
      output = `(${output})${this.modifierFlags}`;
    }

    return output;
  }
}

export default ResultGroup;
