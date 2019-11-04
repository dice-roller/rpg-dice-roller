import {diceUtils} from "../utilities/utils.js";
import ExplodeModifier from "../modifiers/ExplodeModifier.js";
import RollResult from '../results/RollResult.js';
import RollResults from '../results/RollResults.js';
import ComparePoint from '../ComparePoint.js';

/**
 *
 * @type {StandardDice}
 *
 * @property {Modifier[]} modifiers
 * @property {string} notation
 * @property {number|string} sides
 * @property {number} qty
 *
 * @method {RollResults} roll
 * @method {RollResult} rollDie
 */
const StandardDice = (() => {
  const _modifiers = Symbol('modifiers');
  const _notation = Symbol('notation');
  const _qty = Symbol('qty');
  const _sides = Symbol('sides');

  class StandardDice{
    /**
     *
     * @param {string} notation
     * @param {number} sides
     * @param {number} qty
     * @param {[]|null} modifiers
     */
    constructor(notation, sides, qty = 1, modifiers = null){
      if (!notation) {
        throw new TypeError('Dice: Notation is required');
      } else if (!sides) {
        throw new TypeError('Dice: sides is required');
      } else if (!diceUtils.isNumeric(qty) || (qty < 1)) {
        throw new TypeError('qty must be a positive integer');
      }

      this[_notation] = notation;
      this[_qty] = parseInt(qty, 10);
      this[_sides] = sides;

      if (modifiers) {
        // @todo find a better way of defining compare point on modifiers that don't have them
        this[_modifiers] = Object.assign({}, ...Object.keys(modifiers).map(k => {
          const modifier = modifiers[k];
          if ((modifier instanceof ExplodeModifier) && !modifier.comparePoint) {
            modifier.comparePoint = new ComparePoint('=', sides);
          }
          // @todo handle re-roll compare point (Defaults to lowest possible die value, which is usually 1, but fudge dice is -1

          return {[k]: modifier };
        }));
      }
    }

    /**
     * The modifiers that affect this dice roll
     *
     * @returns {{}|null}
     */
    get modifiers(){
      return this[_modifiers] || {};
    }

    /**
     * The maximum value that can be rolled om the die
     *
     * @returns {number}
     */
    get max(){
      return this.sides;
    }

    /**
     * Returns the minimum value that can be rolled on the die
     *
     * @returns {number}
     */
    get min(){
      return 1;
    }

    /**
     * Returns the name for the dice
     *
     * @returns {*}
     */
    get name(){
      return this.constructor.name;
    }

    /**
     * The dice notation for this dice roll
     *
     * @returns {string}
     */
    get notation(){
      return this[_notation];
    }

    /**
     * Returns the number of dice that should be rolled.
     *
     * @returns {number}
     */
    get qty(){
      return this[_qty];
    }

    /**
     * The number of sides the dice has
     *
     * @returns {*}
     */
    get sides(){
      return this[_sides];
    }

    /**
     * Rolls the dice, for the specified quantity and
     * includes any modifiers, and returns the roll output
     *
     * @returns {RollResults}
     */
    roll(){
      // create a result object to hold the rolls
      const rollResult = new RollResults();

      // loop for the quantity and roll the die
      for(let i = 0; i < this.qty; i++){
        // add the rolls to the list
        rollResult.addRoll(this.rollOnce());
      }

      // loop through each modifier and carry out its actions
      Object.entries(this.modifiers).forEach(([name, modifier]) => {
        modifier.run(rollResult, this);
      });

      return rollResult;
    }

    /**
     * Rolls a single die and returns the output value
     *
     * @returns {RollResult}
     */
    rollOnce(){
      return new RollResult(diceUtils.generateNumber(this.min, this.max));
    }

    /**
     * Returns an object for JSON serialising
     *
     * @returns {{}}
     */
    toJSON(){
      const {max, min, modifiers, name, notation, qty, sides} = this;

      return {
        max,
        min,
        modifiers,
        name,
        notation,
        qty,
        sides,
        type: 'die',
      };
    }

    /**
     * Returns the String representation of the object
     *
     * @returns {string}
     */
    toString(){
      return this.notation;
    }
  }

  return StandardDice;
})();

export default StandardDice;
