import parser from './grammars/grammar.js';
import * as Dice from '../Dice.js';
import * as Modifiers from '../Modifiers.js';
import RollGroup from '../RollGroup.js';
import ComparePoint from '../ComparePoint.js';

import math from "mathjs-expression-parser";

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
   *
   * @param {string} notation
   *
   * @returns {Array}
   */
  static parse(notation){
    if (!notation) {
      throw Error('Notation is required');
    } else if (typeof notation !== 'string') {
      throw Error('Notation must be a string');
    }

    // parse the notation
    return parser.parse(notation);
  }
}

export default Parser;
