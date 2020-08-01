import ComparisonModifier from './ComparisonModifier';
import { diceUtils } from '../utilities/utils';
import DieActionValueError from '../exceptions/DieActionValueError';

const compoundSymbol = Symbol('compound');
const penetrateSymbol = Symbol('penetrate');

/**
 * An explode modifier
 */
class ExplodeModifier extends ComparisonModifier {
  /**
   * Create an ExplodeModifier
   *
   * @param {ComparePoint} [comparePoint=null] The comparison object
   * @param {boolean} [compound=false] Whether to compound or not
   * @param {boolean} [penetrate=false] Whether to penetrate or not
   *
   * @throws {TypeError} comparePoint must be a ComparePoint object
   */
  constructor(comparePoint = null, compound = false, penetrate = false) {
    super(comparePoint);

    this[compoundSymbol] = !!compound;
    this[penetrateSymbol] = !!penetrate;

    // set the modifier's sort order
    this.order = 3;
  }

  /**
   * Whether the modifier should compound the results or not
   *
   * @returns {boolean}
   */
  get compound() {
    return this[compoundSymbol];
  }

  /* eslint-disable class-methods-use-this */
  /**
   * Returns the name for the modifier
   *
   * @returns {string}
   */
  get name() {
    return 'explode';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * Returns the modifier notation
   *
   * @returns {string}
   */
  get notation() {
    return `!${this.compound ? '!' : ''}${this.penetrate ? 'p' : ''}${super.notation}`;
  }

  /**
   * Whether the modifier should penetrate the results or not
   *
   * @returns {boolean}
   */
  get penetrate() {
    return this[penetrateSymbol];
  }

  /**
   * Runs the modifier on the rolls
   *
   * @param {RollResults} results
   * @param {StandardDice} _dice
   *
   * @returns {RollResults}
   */
  run(results, _dice) {
    // ensure that the dice can explode without going into an infinite loop
    if (_dice.min === _dice.max) {
      throw new DieActionValueError(_dice, 'explode');
    }

    const parsedResults = results;

    parsedResults.rolls = results.rolls
      .map((roll) => {
        const subRolls = [roll];
        let compareValue = roll.value;

        // explode if the value matches the compare point, and we haven't reached the max iterations
        for (let i = 0; (i < this.maxIterations) && this.isComparePoint(compareValue); i++) {
          const prevRoll = subRolls[subRolls.length - 1];
          // roll the dice
          const rollResult = _dice.rollOnce();

          // update the value to check against
          compareValue = rollResult.value;

          // add the explode modifier flag
          prevRoll.modifiers.add('explode');

          // add the penetrate modifier flag and decrement the value
          if (this.penetrate) {
            prevRoll.modifiers.add('penetrate');
            rollResult.value -= 1;
          }

          // add the rolls to the list
          subRolls.push(rollResult);
        }

        // return the rolls (Compounded if necessary)
        /* eslint-disable  no-param-reassign */
        if (this.compound && (subRolls.length > 1)) {
          // update the roll value and modifiers
          roll.value = diceUtils.sumArray(subRolls.map((result) => result.value));
          roll.modifiers = [
            'explode',
            'compound',
          ];

          if (this.penetrate) {
            roll.modifiers.add('penetrate');
          }

          return roll;
        }
        /* eslint-enable */

        return subRolls;
      })
      .flat();

    return parsedResults;
  }

  /**
   * Returns an object for JSON serialising
   *
   * @returns {{}}
   */
  toJSON() {
    const { compound, penetrate } = this;

    return Object.assign(
      super.toJSON(),
      {
        compound,
        penetrate,
      },
    );
  }
}

export default ExplodeModifier;
