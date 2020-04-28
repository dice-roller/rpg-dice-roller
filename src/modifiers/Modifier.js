class Modifier {
  /**
   *
   * @param {string} notation
   */
  constructor(notation) {
    if (!notation) {
      throw new Error('Notation is required');
    }

    // set the modifier's notation
    this.notation = notation;

    // set the modifier's sort order
    this.order = 999;
  }

  /**
   * Returns the name for the modifier
   *
   * @returns {*}
   */
  get name() {
    return this.constructor.name;
  }

  /* eslint-disable class-methods-use-this */
  /**
   * Runs the modifier on the rolls
   *
   * @param {RollResults} results
   * @param {StandardDice} _dice
   *
   * @returns {RollResults}
   */
  run(results, _dice) {
    return results;
  }
  /* eslint-enable class-methods-use-this */

  /**
   * Returns an object for JSON serialising
   *
   * @returns {{}}
   */
  toJSON() {
    const { notation, name } = this;

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
  toString() {
    return this.notation;
  }
}

export default Modifier;
