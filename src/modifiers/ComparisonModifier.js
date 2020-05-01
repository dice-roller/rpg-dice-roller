import Modifier from './Modifier';
import ComparePoint from '../ComparePoint';

const comparePointSymbol = Symbol('compare-point');

class ComparisonModifier extends Modifier {
  /**
   *
   * @param {string} notation
   * @param {ComparePoint} comparePoint
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
   * @param comparePoint
   */
  set comparePoint(comparePoint) {
    if (!(comparePoint instanceof ComparePoint)) {
      throw new TypeError('comparePoint must be instance of ComparePoint');
    }

    this[comparePointSymbol] = comparePoint;
  }

  /**
   * Checks whether value matches the compare point
   *
   * @param {number} value
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
