import * as parser from './grammars/grammar.js';
import * as Dice from '../Dice.js';
import * as Modifiers from '../Modifiers.js';
import RollGroup from '../RollGroup';
import ComparePoint from '../ComparePoint';

import math from "mathjs-expression-parser";

/**
 * A DiceParser object, which takes a notation
 * and parses it in to dice and modifiers
 *
 * @type {Parser}
 */
const Parser = (() => {
  /**
   * (Hopefully) temporary method for converting parsed notation
   * into proper class objects.
   * Currently the PEG parser returns generic objects, but we need
   * our class objects like `StandardDice`.
   * Once we have the PEG parser able to return class objects, this
   * method can be removed.
   *
   * @param {*} expression
   * @returns {*}
   */
  const parseExpression = expression => {
    if (Array.isArray(expression)) {
      // loop through each array item and parse it
      return expression.map(item => {
        return parseExpression(item);
      });
    } else if (expression instanceof Object) {
      if (expression.type === 'dice') {
        // @todo calculation of sides and qty should be done in grammar as they should only be simple equations
        let sides = parseExpression(expression.sides);
        sides = Array.isArray(sides) ? sides.join('') : sides;

        let qty = parseExpression(expression.qty);
        qty = math.eval(Array.isArray(qty) ? qty.join('') : qty);

        // parse the modifiers to proper objects
        expression.modifiers = Object.assign({}, ...Object.keys(expression.modifiers).map(k => (
          {[k]: parseExpression(expression.modifiers[k])}
        )));

        switch (expression.subType) {
          case 'standard':
            return new Dice.StandardDice(expression.notation, math.eval(sides), qty, expression.modifiers);
            break;
          case 'percentile':
            return new Dice.PercentileDice(expression.notation, qty, expression.modifiers);
            break;
          case 'fudge':
            return new Dice.FudgeDice(expression.notation, math.eval(sides), qty, expression.modifiers);
            break;
          default:
            throw Error(`Parser: Dice type was not recognised`);
            break;
        }
      } else if (expression.type === 'group') {
        expression.expressions = parseExpression(expression.expressions);
        // parse the modifiers to proper objects
        expression.modifiers = Object.assign({}, ...Object.keys(expression.modifiers).map(k => (
          {[k]: parseExpression(expression.modifiers[k])}
        )));

        return new RollGroup(expression.notation, expression.expressions, expression.modifiers);
      } else if(expression.type === 'modifier') {
        switch (expression.subType) {
          case 'drop':
            return new Modifiers.DropModifier(expression.notation, expression.end, expression.qty);
            break;
          case 'explode':
            expression.comparePoint = parseExpression(expression.comparePoint);

            return new Modifiers.ExplodeModifier(expression.notation, expression.comparePoint, expression.compound, expression.penetrate);
            break;
          case 'keep':
            return new Modifiers.KeepModifier(expression.notation, expression.end, expression.qty);
            break;
          case 'target':
            expression.successCP = parseExpression(expression.successCP);
            expression.failureCP = expression.failureCP ? parseExpression(expression.failureCP) : null;

            return new Modifiers.TargetModifier(expression.notation, expression.successCP, expression.failureCP);
            break;
          case 'reroll':
            // @todo reroll modifier
            break;
          case 'critical-success':
            expression.comparePoint = parseExpression(expression.comparePoint);

            return new Modifiers.CriticalSuccessModifier(expression.notation, expression.comparePoint);
            break;
          case 'critical-failure':
            expression.comparePoint = parseExpression(expression.comparePoint);

            return new Modifiers.CriticalFailureModifier(expression.notation, expression.comparePoint);
            break;
          case 'sort':
            // @todo sort modifier
            break;
        }
      } else if (expression.type === 'compare-point') {
        return new ComparePoint(expression.operator, expression.value)
      }
    }

    return expression;
  };

  /**
   * A DiceParser object, which takes a notation
   * and parses it in to rolls
   *
   * @param {string|Object} notation  The dice notation or object
   */
  class Parser{
    /** Public methods **/

    /**
     * Parses the given dice notation
     * and returns a list of dice and modifiers found
     *
     * @link https://en.m.wikipedia.org/wiki/Dice_notation
     * @param {string} notation
     * @returns {Array}
     */
    static parse(notation){
      if (!notation) {
        throw Error('Notation is required');
      } else if (typeof notation !== 'string') {
        throw Error('Notation must be a string');
      }

      // parse the notation
      const parsed = parser.parse(notation);

      // (Hopefully) temporary solution to parse the generic objects into class instances
      return parseExpression(parsed);
    }
  }

  return Parser;
})();

export default Parser;
