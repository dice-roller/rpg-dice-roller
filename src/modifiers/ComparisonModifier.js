import Modifier from "./Modifier.js";
import ComparePoint from "../ComparePoint.js";

const _comparePoint = Symbol('compare-point');

class ComparisonModifier extends Modifier{
  /**
   *
   * @param {string} notation
   * @param {ComparePoint} comparePoint
   */
  constructor(notation, comparePoint){
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
  get comparePoint(){
    return this[_comparePoint];
  }

  /**
   * Sets the compare point
   *
   * @param comparePoint
   */
  set comparePoint(comparePoint){
    if (!(comparePoint instanceof ComparePoint)) {
      throw TypeError('comparePoint must be instance of ComparePoint');
    }

    this[_comparePoint] = comparePoint;
  }

  /**
   * Checks whether value matches the compare point
   *
   * @param {number} value
   *
   * @returns {boolean}
   */
  isComparePoint(value){
    if (!this.comparePoint) {
      console.warn('No Compare Point specified');

      return false;
    }

    return this.comparePoint.isMatch(value);
  }

  /**
   * Returns an object for JSON serialising
   *
   * @returns {{}}
   */
  toJSON(){
    const {comparePoint} = this;

    return Object.assign(
      super.toJSON(),
      {
        comparePoint,
      }
    );
  }
}

export default ComparisonModifier;
