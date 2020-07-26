import * as parser from './grammars/grammar';
import RequiredArgumentError from '../exceptions/RequiredArgumentErrorError';

/**
 * A DiceParser object that takes notations and parses them to rolls
 */
class Parser {
  /**
   * Parses the given dice notation and returns a list of dice and modifiers found
   *
   * @link https://en.m.wikipedia.org/wiki/Dice_notation
   *
   * @param {string} notation The notation to parse
   *
   * @returns {[]}
   *
   * @throws {RequiredArgumentError} Notation is required
   * @throws {SyntaxError} The notation syntax is invalid
   * @throws {TypeError} Notation must be a string
   */
  static parse(notation) {
    if (!notation) {
      throw new RequiredArgumentError('notation');
    }

    if (typeof notation !== 'string') {
      throw new TypeError('Notation must be a string');
    }

    // parse the notation
    return parser.parse(notation);
  }
}

export default Parser;
