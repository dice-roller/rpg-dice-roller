import ComparisonModifier from './ComparisonModifier';
import { diceUtils } from '../utilities/utils';
import DieActionValueError from '../exceptions/DieActionValueError';

const compoundSymbol = Symbol('compound');
const penetrateSymbol = Symbol('penetrate');

class ExplodeModifier extends ComparisonModifier {
  /**
   *
   * @param {string} notation
   * @param {ComparePoint} comparePoint
   * @param {boolean=} compound Defaults to false
   * @param {boolean=} penetrate Defaults to false
   */
  constructor(notation, comparePoint = null, compound = false, penetrate = false) {
    super(notation, comparePoint);

    this[compoundSymbol] = !!compound;
    this[penetrateSymbol] = !!penetrate;

    // set the modifier's sort order
    this.order = 1;
  }

  /**
   * Whether the modifier should compound the results or not
   *
   * @type {boolean}
   */
  get compound() {
    return this[compoundSymbol];
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
        /* eslint-disable no-param-reassign */
        const subRolls = [roll];
        let compareValue = roll.value;

        while (this.isComparePoint(compareValue)) {
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
        if (this.compound && (subRolls.length > 1)) {
          // update the roll value and modifiers
          roll.value = diceUtils.sumArray(subRolls);
          roll.modifiers = [
            'explode',
            'compound',
          ];

          if (this.penetrate) {
            roll.modifiers.add('penetrate');
          }

          return roll;
        }

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
