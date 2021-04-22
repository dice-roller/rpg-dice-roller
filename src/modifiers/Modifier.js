import { isNumeric } from '../utilities/math.js';

const maxIterationsSymbol = Symbol('max-iterations');

/**
 * A `Modifier` is the base modifier class that all others extend from.
 *
 * ::: warning Abstract class
 * This is meant as an abstract class and should not be used directly.
 * :::
 *
 * @abstract
 */
class Modifier {
  /**
   * Create a `Modifier` instance.
   *
   * @param {number|null} [limit=null] The maximum iteration limit per roll.
   */
  constructor(limit = null) {
    // set the maximum iteration limit
    this.maxIterations = limit;

    // set the modifier's sort order
    this.order = 999;
  }

  /* eslint-disable class-methods-use-this */
  /**
   * The name of the modifier.
   *
   * @returns {string} 'modifier'
   */
  get name() {
    return 'modifier';
  }
  /* eslint-enable class-methods-use-this */

  /* eslint-disable class-methods-use-this */
  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  get notation() {
    return '';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * The maximum number of iterations that the modifier can apply to a single die roll.
   *
   * @returns {number}
   */
  get maxIterations() {
    return this[maxIterationsSymbol];
  }

  /**
   * Set the maximum number of iterations that the modifier can apply to a single die roll.
   *
   * @param {number} value
   */
  set maxIterations(value) {
    const absoluteMax = this.constructor.defaultMaxIterations;

    // if falsey, then set to the default max
    if (!value && (value !== 0)) {
      this[maxIterationsSymbol] = absoluteMax;
      return;
    }

    if (!isNumeric(value)) {
      throw new TypeError('maxIterations must be a number');
    }

    if ((value === Infinity) || (value < 1)) {
      throw new RangeError(`maxIterations must be a number between 1 and ${absoluteMax}`);
    }

    this[maxIterationsSymbol] = Math.floor(Math.min(value, absoluteMax));
  }

  /**
   * The default number of max iterations.
   *
   * @return {number}
   */
  static get defaultMaxIterations() {
    return 1000;
  }

  /* eslint-disable class-methods-use-this */
  /**
   * Run the modifier on the results.
   *
   * @param {RollResults} results The results to run the modifier against
   * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
   *
   * @returns {RollResults} The modified results
   */
  run(results, _context) {
    return results;
  }
  /* eslint-enable class-methods-use-this */

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{notation: string, name: string, type: string}}
   */
  toJSON() {
    const { notation, name } = this;

    return {
      name,
      notation,
      type: 'modifier',
    };
  }

  /**
   * Return the String representation of the object.
   *
   * This is called automatically when casting the object to a string.
   *
   * @see {@link Modifier#notation}
   *
   * @returns {string}
   */
  toString() {
    return this.notation;
  }
}

export default Modifier;
