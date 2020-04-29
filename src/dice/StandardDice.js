import {diceUtils} from "../utilities/utils.js";
import ExplodeModifier from "../modifiers/ExplodeModifier.js";
import RollResult from '../results/RollResult.js';
import RollResults from '../results/RollResults.js';
import ComparePoint from '../ComparePoint.js';
import ReRollModifier from "../modifiers/ReRollModifier.js";
import Modifier from "../modifiers/Modifier.js";

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
   * @param {Map|{}|Map[]|null} modifiers
   */
  constructor(notation, sides, qty = 1, modifiers = null){
    if (!notation) {
      throw new TypeError('Notation is required');
    } else if (!sides) {
      throw new TypeError('Sides is required');
    } else if (!diceUtils.isNumeric(qty) || (qty < 1)) {
      throw new TypeError('qty must be a positive integer');
    }

    this[_notation] = notation;
    this[_qty] = parseInt(qty, 10);
    this[_sides] = sides;

    if (modifiers) {
      this.modifiers = modifiers;
    }
  }

  /**
   * The modifiers that affect this dice roll
   *
   * @returns {Map|null}
   */
  get modifiers(){
    // ensure modifiers are ordered correctly
    return this[_modifiers] ? new Map([...this[_modifiers]].sort((a, b) => a[1].order - b[1].order)) : null;
  }

  /**
   * Sets the modifiers that affect this roll
   *
   * @param value
   */
  set modifiers(value){
    let modifiers;
    if (value instanceof Map) {
      modifiers = value;
    } else if (Array.isArray(value)) {
      // loop through and get the modifier name of each item and use it as the map key
      modifiers = new Map(value.map(modifier => [modifier.name, modifier]));
    } else if (typeof value === 'object') {
      modifiers = new Map(Object.entries(value));
    } else {
      throw new Error('modifiers should be a Map, an Array, or an Object');
    }

    if (modifiers.size && [...modifiers.entries()].some(entry => !(entry[1] instanceof Modifier))) {
      throw new Error('modifiers is invalid. List must only contain Modifier instances');
    }

    this[_modifiers] = modifiers;

    // loop through each modifier and ensure that those that require it have compare points
    // @todo find a better way of defining compare point on modifiers that don't have them
    this[_modifiers].forEach((modifier) => {
      if ((modifier instanceof ExplodeModifier) && !modifier.comparePoint) {
        modifier.comparePoint = new ComparePoint('=', this.max);
      } else if ((modifier instanceof ReRollModifier) && !modifier.comparePoint) {
        modifier.comparePoint = new ComparePoint('=', this.min);
      }
    });
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
    (this.modifiers || []).forEach(modifier => {
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

export default StandardDice;
