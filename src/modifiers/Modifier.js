const Modifier = (() => {
  class Modifier {
    /**
     *
     * @param {string} notation
     */
    constructor(notation){
      if (!notation) {
        throw new Error('Notation is required');
      }

      this.notation = notation;
    }

    /**
     * Returns the name for the modifier
     *
     * @returns {*}
     */
    get name(){
      return this.constructor.name;
    }

    /**
     * Runs the modifier on the rolls
     *
     * @param {RollResults} results
     * @param {StandardDice} dice
     *
     * @returns {RollResults}
     */
    run(results, dice){
      return results;
    }

    /**
     * Returns an object for JSON serialising
     *
     * @returns {{}}
     */
    toJSON(){
      const {notation, name} = this;

      return {
        name,
        notation,
        type: 'modifier',
      };
    }

    /**
     * Returns the String representation of the object
     *
     * @returns {string}
     */
    toString(){
      return this.notation;
    }
  }

  return Modifier;
})();

export default Modifier;
