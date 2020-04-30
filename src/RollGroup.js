const modifiersSymbol = Symbol('modifiers');
const notationSymbol = Symbol('notation');
const expressionsSymbol = Symbol('expressions');

class RollGroup {
  /**
   *
   * @param {string} notation
   * @param {StandardDice[]} expressions
   * @param {[]|null} modifiers
   */
  constructor(notation, expressions, modifiers = null) {
    this[notationSymbol] = notation;
    this[expressionsSymbol] = expressions;
    this[modifiersSymbol] = modifiers;
  }

  /**
   * The modifiers that affect this group
   *
   * @returns {Modifier[]|null}
   */
  get modifiers() {
    return this[modifiersSymbol];
  }

  /**
   * The dice notation for this group
   *
   * @returns {string}
   */
  get notation() {
    return this[notationSymbol];
  }

  /**
   * The expressions in this group
   *
   * @returns {StandardDice[]}
   */
  get expressions() {
    return this[expressionsSymbol];
  }

  /**
   * Returns an object for JSON serialising
   *
   * @returns {{}}
   */
  toJSON() {
    const { modifiers, notation, expressions } = this;

    return {
      expressions,
      modifiers,
      notation,
      type: 'group',
    };
  }
}

export default RollGroup;
