import RollResult from '../results/RollResult';
import StandardDice from './StandardDice';
import { diceUtils } from '../utilities/utils';

class FudgeDice extends StandardDice {
  constructor(notation, nonBlanks = 2, qty = 1, modifiers = null) {
    let numNonBlanks = nonBlanks;

    if (!numNonBlanks && (numNonBlanks !== 0)) {
      numNonBlanks = 2;
    } else if ((numNonBlanks !== 1) && (numNonBlanks !== 2)) {
      throw new RangeError('nonBlanks must be 1 or 2');
    }

    super(notation, numNonBlanks, qty, modifiers, -1, 1);
  }

  get nonBlanks() {
    return super.sides;
  }

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
      total = diceUtils.generateNumber(1, 3) - 2;
    } else if (this.nonBlanks === 1) {
      // only 1 of each non-blank
      // on 1d6 a roll of 1 = -1, 6 = +1, others = 0
      const num = diceUtils.generateNumber(1, 6);
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
