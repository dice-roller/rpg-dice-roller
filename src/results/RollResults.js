import RollResult from './RollResult.js';

const RollResults = (() => {
  const _rolls = Symbol('rolls');

  class RollResults{
    /**
     * @param {RollResult[]=} rolls
     */
    constructor(rolls){
      this.rolls = rolls || [];
    }

    /**
     * Returns the numbers of rolls
     *
     * @returns {number}
     */
    get length(){
      return this.rolls.length || 0;
    }

    /**
     * Returns the rolls
     *
     * @returns {RollResult[]}
     */
    get rolls(){
      return [...(this[_rolls] || [])];
    }

    /**
     * Sets the rolls
     *
     * @param {RollResult[]|number[]} rolls
     *
     * @throws Error
     */
    set rolls(rolls){
      if (!rolls || !Array.isArray(rolls)) {
        // roll is not an array
        throw new Error(`Rolls must be an array: ${rolls}`);
      }

      // loop through each result and add it to the rolls list
      this[_rolls] = [];
      rolls.forEach(result => {
        this.addRoll(result);
      });
    }

    /**
     * The total value of the rolls, taking in to consideration modifiers
     *
     * @returns {number}
     */
    get value(){
      return this.rolls.reduce((v, roll) => v+roll.calculationValue, 0);
    }

    /**
     * Adds a single roll to the list
     *
     * @param {RollResult|number} value
     */
    addRoll(value){
      const result = (value instanceof RollResult) ? value : new RollResult(value);

      this[_rolls].push(result);
    }

    /**
     * Returns an object for JSON serialising
     *
     * @returns {{}}
     */
    toJSON(){
      const {rolls, value} = this;

      return {
        rolls,
        value,
      };
    }

    /**
     * Returns the String representation of the object
     *
     * @returns {string}
     */
    toString(){
      return `[${this.rolls.join(', ')}]`;
    }
  }

  return RollResults;
})();

export default RollResults;
