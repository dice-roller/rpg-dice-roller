import StandardDice from './dice/StandardDice.js';
import Modifier from './modifiers/Modifier.js';
import ExplodeModifier from './modifiers/ExplodeModifier.js';
import ComparePoint from './ComparePoint.js';
import ReRollModifier from './modifiers/ReRollModifier.js';

const _modifiers = Symbol('modifiers');
const _notation = Symbol('notation');
const _expressions = Symbol('expressions');

class RollGroup{
  /**
   *
   * @param {string} notation
   * @param {StandardDice[]} expressions
   * @param {[]|null} modifiers
   */
  constructor(notation, expressions, modifiers = null){
    if (!notation) {
      throw new TypeError('Notation is required');
    }

    this[_notation] = notation;
    this.expressions = expressions;
    this.modifiers = modifiers || [];
  }

  /**
   * The expressions in this group
   *
   * @returns {[]}
   */
  get expressions(){
    return [...(this[_expressions] || []) ];
  }

  /**
   * Sets the expressions
   *
   * @param {[]} expressions
   */
  set expressions(expressions){
    if (!expressions || !Array.isArray(expressions)) {
      throw new Error(`Expressions must be an array: ${expressions}`);
    } else if (expressions.length == 0) {
      throw new Error(`Expressions cannot be empty: ${expressions}`);
    }

    expressions.forEach((e) => {
      if (!e || !Array.isArray(e)) {
        throw new Error(`Expressions must be an array of arrays: ${expressions}`);
      } else if (e.length == 0) {
        throw new Error(`Sub expressions cannot be empty: ${expressions}`);
      }
    });

    // loop through each expression and add it to the list
    this[_expressions] = [];
    expressions.forEach(expression => {
      this.addExpression(expression);
    });
  }

  /**
   * The modifiers that affect this group
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
   * The dice notation for this group
   *
   * @returns {string}
   */
  get notation(){
    return this[_notation];
  }

  addExpression(value){
    this[_expressions].push(value);
  }

  /**
   * Returns an object for JSON serialising
   *
   * @returns {{}}
   */
  toJSON(){
    const {modifiers,notation,expressions,} = this;

    return {
      expressions,
      modifiers,
      notation,
      type: 'group',
    };
  }

  toString(){
    return this.notation;
  }
}

export default RollGroup;
