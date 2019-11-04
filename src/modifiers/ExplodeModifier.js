import ComparisonModifier from "./ComparisonModifier.js";
import ComparePoint from '../ComparePoint.js';
import {diceUtils} from "../utilities/utils.js";
import RollResult from "../results/RollResult.js";

const ExplodeModifier = (() => {
  const _compound = Symbol('compound');
  const _penetrate = Symbol('penetrate');

  class ExplodeModifier extends ComparisonModifier{
    /**
     *
     * @param {string} notation
     * @param {ComparePoint} comparePoint
     * @param {boolean=} compound Defaults to false
     * @param {boolean=} penetrate Defaults to false
     */
    constructor(notation, comparePoint = null, compound = false, penetrate = false){
      super(notation, comparePoint);

      this[_compound] = !!compound;
      this[_penetrate] = !!penetrate;
    }

    /**
     * Whether the modifier should compound the results or not
     *
     * @type {boolean}
     */
    get compound(){
      return this[_compound];
    }

    /**
     * Whether the modifier should penetrate the results or not
     *
     * @returns {boolean}
     */
    get penetrate(){
      return this[_penetrate];
    }

    /**
     * Runs the modifier on the rolls
     *
     * @param {RollResults} results
     * @param {StandardDice} dice
     *
     * @returns {RollResults}
     */
    run(results, dice){
      // ensure that the dice can explode without going into an infinite loop
      if (dice.min === dice.max) {
        throw new Error(`Die must have more than 1 side to explode: ${dice}`);
      }

      results.rolls = results.rolls
        .map(roll => {
          const subRolls = [roll];
          let compareValue = roll.value;

          while (this.isComparePoint(compareValue)) {
            const prevRoll = subRolls[subRolls.length-1];
            // roll the dice
            const rollResult = dice.rollOnce();

            // update the value to check against
            compareValue = rollResult.value;

            // add the explode modifier flag
            prevRoll.modifiers.push('explode');

            // add the penetrate modifier flag and decrement the value
            if (this.penetrate) {
              prevRoll.modifiers.push('penetrate');
              rollResult.value--;
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
              roll.modifiers.push('penetrate');
            }

            return roll;
          }

          return subRolls;
        })
        .flat();

      return results;
    }

    /**
     * Returns an object for JSON serialising
     *
     * @returns {{}}
     */
    toJSON(){
      const {compound, penetrate} = this;

      return Object.assign(
        super.toJSON(),
        {
          compound,
          penetrate,
        }
      );
    }
  }

  return ExplodeModifier;
})();

export default ExplodeModifier;
