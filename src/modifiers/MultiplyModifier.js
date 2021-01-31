import { isNumeric } from '../utilities/math.js';
import ComparisonModifier from './ComparisonModifier.js';

const factorSymbol = Symbol('factor');

class MultiplyModifier extends ComparisonModifier {
  constructor(factor, comparePoint = null) {
    super(comparePoint);

    this.factor = factor;

    // set the modifier's sort order
    this.order = 8;
  }

  /**
   * The multiplication factor.
   *
   * @return {Number}
   */
  get factor() {
    return this[factorSymbol];
  }

  /**
   * Set the multiplication factor.
   *
   * @param {number} value
   */
  set factor(value) {
    if (!isNumeric(value)) {
      throw new TypeError('factor must be a positive, non-zero number');
    }
    this[factorSymbol] = value;
  }

  /* eslint-disable class-methods-use-this */
  /**
   * The name of the modifier.
   *
   * @returns {string} 'max'
   */
  get name() {
    return 'multiply';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * The modifier's notation.
   *
   * @returns {string}
   */
  get notation() {
    return `mul${this.factor}${super.notation}`;
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
    const { rolls } = results;

    /* eslint-disable no-param-reassign */
    rolls.forEach((roll) => {
      // if there's no compare point, or the compare point matches then multiply the value
      if (!this.comparePoint || this.isComparePoint(roll.value)) {
        roll.modifiers.add('multiply');
        roll.calculationValue *= this.factor;
      }
    });
    /* eslint-enable */

    return results;
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @return {{
   *  notation: string,
   *  name: string,
   *  type: string,
   *  comparePoint: (ComparePoint|undefined),
   *  factor: Number
   * }}
   */
  toJSON() {
    const { factor } = this;

    return Object.assign(
      super.toJSON(),
      {
        factor,
      },
    );
  }
}

export default MultiplyModifier;
