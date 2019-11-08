import Modifier from "./Modifier.js";

const SortingModifier = (() => {
  const _direction = Symbol('direction');

  class SortingModifier extends Modifier{
    /**
     *
     * @param {string} notation
     * @param {string} direction Either `a|d`
     */
    constructor(notation, direction = 'a'){
      super(notation);

      this.direction = direction || 'a';
    }

    /**
     * Returns the sort direction
     *
     * @returns {string}
     */
    get direction(){
      return this[_direction];
    }

    /**
     * Sets the sort direction
     *
     * @param {string} value
     */
    set direction(value){
      if ((value !== 'a') && (value !== 'd')) {
        throw new Error('Direction must be "a" (Ascending) or "d" (Descending)');
      }

      this[_direction] = value;
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
      results.rolls = results.rolls.sort((a, b) => {
        if (this.direction === 'd') {
          return b.value - a.value
        }

        return a.value - b.value
      });

      return results;
    }

    /**
     * Returns an object for JSON serialising
     *
     * @returns {{}}
     */
    toJSON(){
      const {direction} = this;

      return Object.assign(
        super.toJSON(),
        {
          direction,
        }
      );
    }
  }

  return SortingModifier;
})();

export default SortingModifier;
