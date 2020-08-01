import { generator } from '../utilities/NumberGenerator';
import RollResult from '../results/RollResult';
import StandardDice from './StandardDice';

/**
 * A Fudge / Fate die
 */
class FudgeDice extends StandardDice {
  /**
   * Create a FudgeDice
   *
   * @param {number} [nonBlanks=2] The number of non-blanks the Fudge die should have (1 or 2)
   * @param {number} [qty=1] The number of dice to roll (e.g. 4)
   * @param {Map<string, Modifier>|Modifier[]|{}|null} [modifiers=null]
   *
   * @throws {RangeError} nonBlanks must be 1 or 2
   * @throws {TypeError} modifiers must be valid
   */
  constructor(nonBlanks = 2, qty = 1, modifiers = null) {
    let numNonBlanks = nonBlanks;

    if (!numNonBlanks && (numNonBlanks !== 0)) {
      numNonBlanks = 2;
    } else if ((numNonBlanks !== 1) && (numNonBlanks !== 2)) {
      throw new RangeError('nonBlanks must be 1 or 2');
    }

    super(numNonBlanks, qty, modifiers, -1, 1);
  }

  /* eslint-disable class-methods-use-this */
  /**
   * Returns the name for the dice
   *
   * @returns {string}
   */
  get name() {
    return 'fudge';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * The number of sides that each symbol (+, -) covers
   *
   * @returns {number}
   */
  get nonBlanks() {
    return super.sides;
  }

  /**
   * The number of sides the dice has
   *
   * @returns {string}
   */
  get sides() {
    return `F.${this.nonBlanks}`;
  }

  /**
   * Rolls a single die and returns the output value
   *
   * @returns {RollResult}
   */
  rollOnce() {
    let total = 0;

    if (this.nonBlanks === 2) {
      // default fudge (2 of each non-blank) = 1d3 - 2
      total = generator.integer(1, 3) - 2;
    } else if (this.nonBlanks === 1) {
      // only 1 of each non-blank
      // on 1d6 a roll of 1 = -1, 6 = +1, others = 0
      const num = generator.integer(1, 6);
      if (num === 1) {
        total = -1;
      } else if (num === 6) {
        total = 1;
      }
    }

    return new RollResult(total);
  }
}

export default FudgeDice;
