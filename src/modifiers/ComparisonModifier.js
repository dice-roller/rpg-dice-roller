import Modifier from './Modifier.js';
import ComparePoint from '../ComparePoint.js';

const comparePointSymbol = Symbol('compare-point');

/**
 * A `ComparisonModifier` is the base modifier class for comparing values.
 *
 * ::: warning Abstract class
 * This is meant as an abstract class and should not be used directly.
 * You can use one of the extended modifiers, or extend the class yourself.
 * :::
 *
 * @abstract
 *
 * @extends Modifier
 *
 * @see {@link CriticalFailureModifier}
 * @see {@link CriticalSuccessModifier}
 * @see {@link ExplodeModifier}
 * @see {@link ReRollModifier}
 * @see {@link TargetModifier}
 */
class ComparisonModifier extends Modifier {
  /**
   * Create a `ComparisonModifier` instance.
   *
   * @param {ComparePoint} [comparePoint] The comparison object
   * @param {number|null} [limit=null] The maximum iteration limit per roll.
   *
   * @throws {TypeError} `comparePoint` must be an instance of `ComparePoint` or `undefined`
   */
  constructor(comparePoint, limit = null) {
    super(limit);

    if (comparePoint) {
      this.comparePoint = comparePoint;
    }
  }

  /**
   * The compare point.
   *
   * @returns {ComparePoint|undefined}
   */
  get comparePoint() {
    return this[comparePointSymbol];
  }

  /**
   * Set the compare point.
   *
   * @param {ComparePoint} comparePoint
   *
   * @throws {TypeError} value must be an instance of `ComparePoint`
   */
  set comparePoint(comparePoint) {
    if (!(comparePoint instanceof ComparePoint)) {
      throw new TypeError('comparePoint must be instance of ComparePoint');
    }

    this[comparePointSymbol] = comparePoint;
  }

  /* eslint-disable class-methods-use-this */
  /**
   * The name of the modifier.
   *
   * @returns {string} 'comparison'
   */
  get name() {
    return 'comparison';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  get notation() {
    return `${this.comparePoint || ''}`;
  }

  /**
   * Check whether value matches the compare point or not.
   *
   * @param {number} value The value to compare with
   *
   * @returns {boolean} `true` if the value matches, `false` otherwise
   */
  isComparePoint(value) {
    if (!this.comparePoint) {
      return false;
    }

    return this.comparePoint.isMatch(value);
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{
   *  notation: string,
   *  name: string,
   *  type: string,
   *  comparePoint: (ComparePoint|undefined)
   * }}
   */
  toJSON() {
    const { comparePoint } = this;

    return Object.assign(
      super.toJSON(),
      {
        comparePoint,
      },
    );
  }
}

export default ComparisonModifier;
