import StandardDice from "./StandardDice.js";

const PercentileDice = (() => {
  class PercentileDice extends StandardDice{
    constructor(notation, qty = 1 , modifiers = null){
      super(notation, 100, qty, modifiers);
    }

    /**
     * The maximum value that can be rolled on the die
     *
     * @returns {number}
     */
    get max(){
      return 100;
    }

    /**
     * The number of sides the dice has
     *
     * @returns {string}s
     */
    get sides(){
      return '%';
    }
  }

  return PercentileDice;
})();

export default PercentileDice;
