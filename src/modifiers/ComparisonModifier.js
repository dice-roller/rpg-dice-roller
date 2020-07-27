import Modifier from './Modifier';
import ComparePoint from '../ComparePoint';

const comparePointSymbol = Symbol('compare-point');

/**
 * A comparison modifier
 */
class ComparisonModifier extends Modifier {
  /**
   * Create a ComparisonModifier
   *
   * @param {string} notation The modifier notation
   * @param {ComparePoint} comparePoint The comparison object
   *
   * @throws {RequiredArgumentError} Notation is required
   * @throws {TypeError} comparePoint must be a ComparePoint object
   */
  constructor(notation, comparePoint) {
    super(notation);

    if (comparePoint) {
      this.comparePoint = comparePoint;
    }
  }

  /**
   * Returns the compare point for the object
   *
   * @returns {ComparePoint}
   */
  get comparePoint() {
    return this[comparePointSymbol];
  }

  /**
   * Sets the compare point
   *
   * @param {ComparePoint} comparePoint
   *
   * @throws {TypeError} value must be a ComparePoint object
   */
  set comparePoint(comparePoint) {
    if (!(comparePoint instanceof ComparePoint)) {
      throw new TypeError('comparePoint must be instance of ComparePoint');
    }

    this[comparePointSymbol] = comparePoint;
  }

  /* eslint-disable class-methods-use-this */
  /**
   * Returns the name for the modifier
   *
   * @returns {string}
   */
  get name() {
    return 'comparison';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * Checks whether value matches the compare point
   *
   * @param {number} value The value to compare with
   *
   * @returns {boolean}
   */
  isComparePoint(value) {
    if (!this.comparePoint) {
      return false;
    }

    return this.comparePoint.isMatch(value);
  }

  /**
   * Returns an object for JSON serialising
   *
   * @returns {{}}
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
