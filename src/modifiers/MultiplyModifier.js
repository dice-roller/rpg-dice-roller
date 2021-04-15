import { isNumeric } from '../utilities/math.js';
import ComparisonModifier from './ComparisonModifier.js';

const factorSymbol = Symbol('factor');

/*
const notation = '5d10>=7mul2=10';
const roll = roller.roll(notation);

expect(roll).toBeInstanceOf(DiceRoll);
expect(roll.notation).toEqual(notation);
expect(roll.output).toEqual(`${notation}: [10+*, 3, 7+, 2, 8+] = 4`);
*/
/**
 * A `MultiplyModifier` multiplies individual roles by a given factor.
 *
 * @extends ComparisonModifier
 */
class MultiplyModifier extends ComparisonModifier {
  /**
   * Create a `MultiplyModifier` instance.
   *
   * Unlike the multiplication operator (e.g. `2d6*3`), which would multiply the total by the
   * factor, this multiplies each individual roll, before adding them together.
   *
   * It also works with {@link TargetModifier}, to multiply the success / failure values.
   *
   * @example <caption>`5d6mul3`</caption>
   * new MultiplyModifier(3);
   *
   * @param {Number} factor The multiplication factor
   * @param {ComparePoint} [comparePoint] The comparison object
   */
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
