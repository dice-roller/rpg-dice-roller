import { diceUtils } from '../utilities/utils';
import ExplodeModifier from '../modifiers/ExplodeModifier';
import { generator } from '../utilities/NumberGenerator';
import RollResult from '../results/RollResult';
import RollResults from '../results/RollResults';
import ComparePoint from '../ComparePoint';
import ReRollModifier from '../modifiers/ReRollModifier';
import Modifier from '../modifiers/Modifier';
import RequiredArgumentError from '../exceptions/RequiredArgumentError';

const modifiersSymbol = Symbol('modifiers');
const notationSymbol = Symbol('notation');
const qtySymbol = Symbol('qty');
const sidesSymbol = Symbol('sides');
const minSymbol = Symbol('min-value');
const maxSymbol = Symbol('max-value');

/**
 * A standard numerical die
 */
class StandardDice {
  /**
   * Create a StandardDice
   *
   * @param {string} notation The dice notation (e.g. '4d6')
   * @param {number} sides The number of sides the die has (.e.g 6)
   * @param {number} [qty=1] The number of dice to roll (e.g. 4)
   * @param {Map<string, Modifier>|Modifier[]|{}|null} [modifiers=null]
   * @param {number|null} [min=1] The minimum possible roll value
   * @param {number|null} [max=null] The maximum possible roll value. Defaults to number of sides
   *
   * @throws {RequiredArgumentError} Notation and sides are required
   * @throws {TypeError} qty must be a positive integer, and modifiers must be valid
   */
  constructor(notation, sides, qty = 1, modifiers = null, min = 1, max = null) {
    if (!notation) {
      throw new RequiredArgumentError('notation');
    } else if (!sides) {
      throw new RequiredArgumentError('sides');
    } else if (!diceUtils.isNumeric(qty) || (qty < 1)) {
      throw new TypeError('qty must be a positive integer');
    }

    this[notationSymbol] = notation;
    this[qtySymbol] = parseInt(qty, 10);
    this[sidesSymbol] = sides;

    if (modifiers) {
      this.modifiers = modifiers;
    }

    this[minSymbol] = diceUtils.isNumeric(min) ? parseInt(min, 10) : 1;
    this[maxSymbol] = diceUtils.isNumeric(max) ? parseInt(max, 10) : sides;
  }

  /**
   * The average value that the die can roll (Excluding modifiers)
   *
   * @returns {number}
   */
  get average() {
    return (this.min + this.max) / 2;
  }

  /**
   * The modifiers that affect this dice roll
   *
   * @returns {Map<string, Modifier>|null}
   */
  get modifiers() {
    if (this[modifiersSymbol]) {
      // ensure modifiers are ordered correctly
      return new Map([...this[modifiersSymbol]].sort((a, b) => a[1].order - b[1].order));
    }

    return null;
  }

  /**
   * Sets the modifiers that affect this roll
   *
   * @param {Map<string, Modifier>|Modifier[]|{}|null} value
   *
   * @throws {TypeError} Modifiers should be a Map, array of Modifiers, or an Object
   */
  set modifiers(value) {
    let modifiers;
    if (value instanceof Map) {
      modifiers = value;
    } else if (Array.isArray(value)) {
      // loop through and get the modifier name of each item and use it as the map key
      modifiers = new Map(value.map((modifier) => [modifier.name, modifier]));
    } else if (typeof value === 'object') {
      modifiers = new Map(Object.entries(value));
    } else {
      throw new TypeError('modifiers should be a Map, array, or an Object containing Modifiers');
    }

    if (
      modifiers.size
      && [...modifiers.entries()].some((entry) => !(entry[1] instanceof Modifier))
    ) {
      throw new TypeError('modifiers must only contain Modifier instances');
    }

    this[modifiersSymbol] = modifiers;

    // loop through each modifier and ensure that those that require it have compare points
    // @todo find a better way of defining compare point on modifiers that don't have them
    /* eslint-disable no-param-reassign */
    this[modifiersSymbol].forEach((modifier) => {
      if ((modifier instanceof ExplodeModifier) && !modifier.comparePoint) {
        modifier.comparePoint = new ComparePoint('=', this.max);
      } else if ((modifier instanceof ReRollModifier) && !modifier.comparePoint) {
        modifier.comparePoint = new ComparePoint('=', this.min);
      }
    });
    /* eslint-enable */
  }

  /**
   * The maximum value that can be rolled om the die
   *
   * @returns {number}
   */
  get max() {
    return this[maxSymbol];
  }

  /**
   * Returns the minimum value that can be rolled on the die
   *
   * @returns {number}
   */
  get min() {
    return this[minSymbol];
  }

  /* eslint-disable class-methods-use-this */
  /**
   * Returns the name for the dice
   *
   * @returns {string}
   */
  get name() {
    return 'standard';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * The dice notation for this dice roll
   *
   * @returns {string}
   */
  get notation() {
    return this[notationSymbol];
  }

  /**
   * Returns the number of dice that should be rolled.
   *
   * @returns {number}
   */
  get qty() {
    return this[qtySymbol];
  }

  /**
   * The number of sides the dice has
   *
   * @returns {number}
   */
  get sides() {
    return this[sidesSymbol];
  }

  /**
   * Rolls the dice, for the specified quantity and
   * includes any modifiers, and returns the roll output
   *
   * @returns {RollResults}
   */
  roll() {
    // create a result object to hold the rolls
    const rollResult = new RollResults();

    // loop for the quantity and roll the die
    for (let i = 0; i < this.qty; i++) {
      // add the rolls to the list
      rollResult.addRoll(this.rollOnce());
    }

    // loop through each modifier and carry out its actions
    (this.modifiers || []).forEach((modifier) => {
      modifier.run(rollResult, this);
    });

    return rollResult;
  }

  /**
   * Rolls a single die and returns the output value
   *
   * @returns {RollResult}
   */
  rollOnce() {
    return new RollResult(generator.integer(this.min, this.max));
  }

  /**
   * Returns an object for JSON serialising
   *
   * @returns {{}}
   */
  toJSON() {
    const {
      average, max, min, modifiers, name, notation, qty, sides,
    } = this;

    return {
      average,
      max,
      min,
      modifiers,
      name,
      notation,
      qty,
      sides,
      type: 'die',
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

export default StandardDice;
