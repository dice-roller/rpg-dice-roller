import RollResult from '../results/RollResult.js';
import StandardDice from "./StandardDice.js";
import {diceUtils} from "../utilities/utils.js";

class FudgeDice extends StandardDice{
  constructor(notation, nonBlanks = 2, qty = 1, modifiers = null){
    if (!nonBlanks && (nonBlanks !== 0)) {
      nonBlanks = 2;
    } else if ((nonBlanks !== 1) && (nonBlanks !== 2)) {
      throw new Error('nonBlanks must be 1 or 2');
    }

    super(notation, parseInt(nonBlanks, 10), qty, modifiers);
  }

  /**
   * The maximum value that can be rolled om the die
   *
   * @returns {number}
   */
  get max(){
    return 1;
  }

  /**
   * Returns the minimum value that can be rolled on the die
   *
   * @returns {number}
   */
  get min(){
    return -1;
  }

  get nonBlanks(){
    return super.sides;
  }

  get sides(){
    return `F.${this.nonBlanks}`;
  }

  /**
   * Rolls a single die and returns the output value
   *
   * @returns {RollResult}
   */
  rollOnce(){
    let total = 0;

    if(this.nonBlanks === 2){
      // default fudge (2 of each non-blank) = 1d3 - 2
      total = diceUtils.generateNumber(1, 3) - 2;
    }else if(this.nonBlanks === 1){
      // only 1 of each non-blank
      // on 1d6 a roll of 1 = -1, 6 = +1, others = 0
      const num = diceUtils.generateNumber(1, 6);
      if(num === 1){
        total = -1;
      }else if(num === 6){
        total = 1;
      }
    }

    return new RollResult(total);
  }
}

export default FudgeDice;
