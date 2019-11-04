import StandardDice from "./StandardDice.js";

const PercentileDice = (() => {
  class PercentileDice extends StandardDice{
    constructor(notation, qty = 1 , modifiers = null){
      super(notation, 100, qty, modifiers);
    }

    /**
     * The maximum value that can be rolled om the die
     *
     * @returns {number}
     */
    get max(){
      return 100;
    }

    get sides(){
      return '%';
    }
  }

  return PercentileDice;
})();

export default PercentileDice;
