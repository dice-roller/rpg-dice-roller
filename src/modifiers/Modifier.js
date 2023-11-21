/**
 * A `Modifier` is the base modifier class that all others extend from.
 *
 * @abstract
 */
class Modifier {
  /**
   * The default modifier execution order.
   *
   * @type {number}
   */
  static order = 999;

  /**
   * Create a `Modifier` instance.
   */
  constructor() {
    // set the modifier's sort order
    this.order = this.constructor.order;
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

  /* eslint-disable class-methods-use-this */
  /**
   * The maximum number of iterations that the modifier can apply to a single die roll
   *
   * @returns {number} `1000`
   */
  get maxIterations() {
    return 1000;
  }

  /**
   * No default values present
   *
   * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
   *
   * @returns {object}
   */
  defaults(_context) {
    return {};
  }
  /* eslint-enable class-methods-use-this */

  /**
   * Processing default values definitions
   *
   * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
   *
   * @returns {void}
   */
  ensureParameters(_context) {
    Object.entries(this.defaults(_context)).forEach(([field, value]) => {
      if (!this[field]) {
        this[field] = value;
      }
    });
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
    this.ensureParameters(_context);
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
