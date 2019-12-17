import StandardDice from "./dice/StandardDice.js";
import Modifier from "./modifiers/Modifier.js";

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
    this[_notation] = notation;
    this[_expressions] = expressions;
    this[_modifiers] = modifiers;
  }

  /**
   * The modifiers that affect this group
   *
   * @returns {Modifier[]|null}
   */
  get modifiers(){
    return this[_modifiers];
  }

  /**
   * The dice notation for this group
   *
   * @returns {string}
   */
  get notation(){
    return this[_notation];
  }

  /**
   * The expressions in this group
   *
   * @returns {StandardDice[]}
   */
  get expressions(){
    return this[_expressions];
  }

  roll(){
    const rollResult = new RollResult();

    this.expressions.forEach(expression => {
      if (typeof expression.roll === 'function') {
        expression.roll();
      }
    });

    return rollResult;
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
}

export default RollGroup;
