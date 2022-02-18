import { evaluate, isNumeric } from '../utilities/math.js';
import getModifierFlags from '../modifiers/modifier-flags.js';
import RollResults from './RollResults.js';

const calculationValueSymbol = Symbol('calculation-value');
const isRollGroupSymbol = Symbol('is-roll-group');
const modifiersSymbol = Symbol('modifiers');
const resultsSymbol = Symbol('results');
const useInTotalSymbol = Symbol('use-in-total');

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
class ResultGroup {
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
  constructor(results = [], modifiers = [], isRollGroup = false, useInTotal = true) {
    this.isRollGroup = isRollGroup;
    this.modifiers = modifiers;
    this.results = results;
    this.useInTotal = useInTotal;
  }

  /**
   * The value to use in calculations.
   * This may be changed by modifiers.
   *
   * @returns {number}
   */
  get calculationValue() {
    return isNumeric(this[calculationValueSymbol])
      ? parseFloat(this[calculationValueSymbol])
      : this.value;
  }

  /**
   * Set the value to use in calculations.
   *
   * @param {number} value
   *
   * @throws {TypeError} value is invalid
   */
  set calculationValue(value) {
    const isValNumeric = isNumeric(value);
    if (value === Infinity) {
      throw new RangeError('Results calculation value must be a finite number');
    }
    if (value && !isValNumeric) {
      throw new TypeError(`Results calculation value is invalid: ${value}`);
    }

    this[calculationValueSymbol] = isValNumeric ? parseFloat(`${value}`) : null;
  }

  /**
   * Whether the result group represents a roll group or not.
   *
   * @returns {boolean} `true` if it is a roll group, `false` otherwise
   */
  get isRollGroup() {
    return this[isRollGroupSymbol];
  }

  /**
   * Set whether the result group represents a roll group or not.
   *
   * @param {boolean} value
   */
  set isRollGroup(value) {
    this[isRollGroupSymbol] = !!value;
  }

  /**
   * The number of results.
   *
   * @returns {number}
   */
  get length() {
    return this.results.length || 0;
  }

  /**
   * The visual flags for the modifiers that affect the group.
   *
   * @see {@link ResultGroup#modifiers}
   *
   * @returns {string}
   */
  get modifierFlags() {
    return getModifierFlags(...this.modifiers);
  }

  /**
   * The modifier names that affect the group.
   *
   * @returns {Set<string>}
   */
  get modifiers() {
    return this[modifiersSymbol];
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
  set modifiers(value) {
    if ((Array.isArray(value) || (value instanceof Set)) && [...value].every((item) => typeof item === 'string')) {
      this[modifiersSymbol] = new Set([...value]);
    } else if (!value && (value !== 0)) {
      // clear the modifiers
      this[modifiersSymbol] = new Set();
    } else {
      throw new TypeError(`modifiers must be a Set or array of modifier names: ${value}`);
    }
  }

  /**
   * List of results.
   *
   * @returns {Array.<ResultGroup|RollResults|number|string>}
   */
  get results() {
    return [...this[resultsSymbol]];
  }

  /**
   * Set the results.
   *
   * @param {Array.<ResultGroup|RollResults|number|string>} results
   *
   * @throws {TypeError} Results must be an array
   */
  set results(results) {
    if (!results || !Array.isArray(results)) {
      // results is not an array
      throw new TypeError(`results must be an array: ${results}`);
    }

    // loop through each result and add it to the results list
    this[resultsSymbol] = [];
    results.forEach((result) => {
      this.addResult(result);
    });
  }

  /**
   * Whether to use the value in total calculations or not.
   *
   * @returns {boolean}
   */
  get useInTotal() {
    return !!this[useInTotalSymbol];
  }

  /**
   * Set whether to use the value in total calculations or not.
   *
   * @param {boolean} value
   */
  set useInTotal(value) {
    this[useInTotalSymbol] = !!value;
  }

  /**
   * The total value of all the results after modifiers have been applied.
   *
   * @returns {number}
   */
  get value() {
    if (!this.results.length) {
      return 0;
    }

    // loop through the results
    // - get the values of result objects and add any operators and plain numbers
    // we'll either end up with a numerical total (If all results are result objects or numbers)
    // or a string equation (If there are operators)
    const value = this.results.reduce((v, result) => {
      let val = result;

      if (result instanceof ResultGroup) {
        val = result.useInTotal ? result.calculationValue : 0;
      } else if (result instanceof RollResults) {
        val = result.value;
      }

      return v + val;
    }, (typeof this.results[0] === 'string') ? '' : 0);

    // if value is a string that means operators were included, so we need to evaluate the equation
    if (typeof value === 'string') {
      return evaluate(value);
    }

    return value;
  }

  /**
   * Add a single result to the list.
   *
   * @param {ResultGroup|RollResults|Object|number|string} value
   *
   * @throws {TypeError} Value type is invalid
   */
  addResult(value) {
    let val;

    if ((value instanceof ResultGroup) || (value instanceof RollResults)) {
      // already a valid result object
      val = value;
    } else if ((typeof value === 'string') || isNumeric(value)) {
      // string operator (e.g. '+', '/', etc.), or plain number
      val = value;
    } else if (typeof value === 'object') {
      // plain object from importing, so do basic validation and instantiate the rich classes
      if (value.type === 'result-group') {
        val = new ResultGroup(value.results, value.modifiers, value.isRollGroup, value.useInTotal);
      } else if (value.type === 'roll-results') {
        if (value.rolls && Array.isArray(value.rolls)) {
          val = new RollResults(value.rolls);
        } else {
          throw new TypeError('objects with type "roll-results" must have a rolls array');
        }
      } else {
        throw new TypeError(`value.type must be 'result-group' or 'roll-results' but is '${value.type}'`);
      }
    } else {
      throw new TypeError('value must be one of ResultGroup, RollResults, string, or number');
    }

    // add the result to the list
    this[resultsSymbol].push(val);
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
  toJSON() {
    const {
      calculationValue, isRollGroup, modifierFlags, modifiers, results, useInTotal, value,
    } = this;

    return {
      calculationValue,
      isRollGroup,
      modifierFlags,
      modifiers: [...modifiers],
      results,
      type: 'result-group',
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
