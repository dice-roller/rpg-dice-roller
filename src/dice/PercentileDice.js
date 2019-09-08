import RollResult from '../results/RollResult.js';
import StandardDice from "./StandardDice.js";
import {diceUtils} from "../utilities/utils.js";

const PercentileDice = (() => {
  class PercentileDice extends StandardDice{
    constructor(notation, qty = 1 , modifiers = null){
      super(notation, 100, qty, modifiers);
    }

    get sides(){
      return '%';
    }

    /**
     * Rolls a single die and returns the output value
     *
     * @returns {RollResult}
     */
    rollOnce(){
      return new RollResult(diceUtils.generateNumber(1, 100));
    }
  }

  return PercentileDice;
})();

export default PercentileDice;
