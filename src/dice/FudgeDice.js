import { generator } from '../utilities/NumberGenerator.js';
import RollResult from '../results/RollResult.js';
import StandardDice from './StandardDice.js';

/**
 * Represents a Fudge / Fate type die.
 *
 * @extends StandardDice
 */
class FudgeDice extends StandardDice {
  /**
   * Create a `FudgeDice` instance.
   *
   * @param {number} [nonBlanks=2] The number of sides each symbol should cover (`1` or `2`)
   * @param {number} [qty=1] The number of dice to roll (e.g. `4`)
   * @param {Map<string, Modifier>|Modifier[]|{}|null} [modifiers] The modifiers that affect the die
   * @param {Description|string|null} [description=null] The roll description.
   *
   * @throws {RangeError} nonBlanks must be 1 or 2
   * @throws {TypeError} modifiers must be valid
   */
  constructor(nonBlanks = 2, qty = 1, modifiers = null, description = null) {
    let numNonBlanks = nonBlanks;

    if (!numNonBlanks && (numNonBlanks !== 0)) {
      numNonBlanks = 2;
    } else if ((numNonBlanks !== 1) && (numNonBlanks !== 2)) {
      throw new RangeError('nonBlanks must be 1 or 2');
    }

    super(numNonBlanks, qty, modifiers, -1, 1, description);
  }

  /* eslint-disable class-methods-use-this */
  /**
   * The name of the die.
   *
   * @returns {string} 'fudge'
   */
  get name() {
    return 'fudge';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * The number of sides that each symbol (+, -) covers.
   *
   * @returns {number} `1` or `2`
   */
  get nonBlanks() {
    return super.sides;
  }

  /**
   * The number of sides the die has.
   *
   * @returns {string} 'F.2' or 'F.1'
   */
  get sides() {
    return `F.${this.nonBlanks}`;
  }

  /**
   * Roll a single die and return the value.
   *
   * @returns {RollResult} The value rolled
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

    const rollResult = new RollResult(total);
    rollResult.dice = this;
    return rollResult;
  }
}

export default FudgeDice;
