import Modifier from './Modifier.js';

const directionSymbol = Symbol('direction');

/**
 * A `SortingModifier` sorts roll results by their value, either ascending or descending.
 *
 * @extends ComparisonModifier
 */
class SortingModifier extends Modifier {
  /**
   * Create a `SortingModifier` instance.
   *
   * @param {string} [direction=a] The direction to sort in; 'a' (Ascending) or 'd' (Descending)
   *
   * @throws {RangeError} Direction must be 'a' or 'd'
   */
  constructor(direction = 'a') {
    super();

    this.direction = direction;

    // set the modifier's sort order
    this.order = 10;
  }

  /**
   * The sort direction.
   *
   * @returns {string} Either 'a' or 'd'
   */
  get direction() {
    return this[directionSymbol];
  }

  /**
   * Set the sort direction.
   *
   * @param {string} value Either 'a' (Ascending) or 'd' (Descending)
   *
   * @throws {RangeError} Direction must be 'a' or 'd'
   */
  set direction(value) {
    if ((value !== 'a') && (value !== 'd')) {
      throw new RangeError('Direction must be "a" (Ascending) or "d" (Descending)');
    }

    this[directionSymbol] = value;
  }

  /* eslint-disable class-methods-use-this */
  /**
   * The name of the modifier.
   *
   * @returns {string} 'sorting'
   */
  get name() {
    return 'sorting';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  get notation() {
    return `s${this.direction}`;
  }

  /**
   * Run the modifier on the results.
   *
   * @param {RollResults} results The results to run the modifier against
   * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
   *
   * @returns {RollResults} The modified results
   */
  run(results, _context) {
    const sortedResults = results;

    sortedResults.rolls = results.rolls.sort((a, b) => {
      if (this.direction === 'd') {
        return b.value - a.value;
      }

      return a.value - b.value;
    });

    return sortedResults;
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{notation: string, name: string, type: string, direction: string}}
   */
  toJSON() {
    const { direction } = this;

    return Object.assign(
      super.toJSON(),
      {
        direction,
      },
    );
  }
}

export default SortingModifier;
