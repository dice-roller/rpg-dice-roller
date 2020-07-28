import { diceUtils } from '../utilities/utils';

const calculationValueSymbol = Symbol('calculation-value');
const modifiersSymbol = Symbol('modifiers');
const initialValueSymbol = Symbol('initial-value');
const useInTotalSymbol = Symbol('use-in-total');
const valueSymbol = Symbol('value');

/**
 * A single dice roll result
 */
class RollResult {
  /**
   * Create a RollResult
   *
   * @param {number|{value: Number, initialValue: number}} value The value rolled
   * @param {string[]|Set<string>} [modifiers=[]] List of modifier names that affect this roll
   * @param {boolean} [useInTotal=true] Whether to include the roll value when calculating totals
   *
   * @throws {TypeError} Result value, calculation value, or modifiers are invalid
   */
  constructor(value, modifiers = [], useInTotal = true) {
    if (diceUtils.isNumeric(value)) {
      this[initialValueSymbol] = parseInt(value, 10);

      this.modifiers = modifiers || [];
      this.useInTotal = useInTotal;
    } else if (value && (typeof value === 'object') && !Array.isArray(value)) {
      // ensure that we have a valid value
      const initialVal = diceUtils.isNumeric(value.initialValue) ? value.initialValue : value.value;
      if (!diceUtils.isNumeric(initialVal)) {
        throw new TypeError(`Result value is invalid: ${initialVal}`);
      }

      this[initialValueSymbol] = parseInt(initialVal, 10);

      if (
        diceUtils.isNumeric(value.value)
        && (parseInt(value.value, 10) !== this[initialValueSymbol])
      ) {
        this.value = value.value;
      }

      if (
        diceUtils.isNumeric(value.calculationValue)
        && (parseFloat(value.calculationValue) !== this.value)
      ) {
        this.calculationValue = value.calculationValue;
      }

      this.modifiers = value.modifiers || modifiers || [];
      this.useInTotal = (typeof value.useInTotal === 'boolean') ? value.useInTotal : (useInTotal || false);
    } else {
      throw new TypeError(`Result value is invalid: ${value}`);
    }
  }

  /**
   * Returns the value to use in calculations
   *
   * @returns {number}
   */
  get calculationValue() {
    return diceUtils.isNumeric(this[calculationValueSymbol])
      ? parseFloat(this[calculationValueSymbol])
      : this.value;
  }

  /**
   * Sets the value to use in calculations
   *
   * @param {number} value
   *
   * @throws {TypeError} value is invalid
   */
  set calculationValue(value) {
    const isNumeric = diceUtils.isNumeric(value);
    if (value && !isNumeric) {
      throw new TypeError(`Result calculation value is invalid: ${value}`);
    }

    this[calculationValueSymbol] = isNumeric ? parseFloat(value) : null;
  }

  /**
   * The initial roll value before any modifiers.
   * Not often used, you probably want `value` instead.
   *
   * @returns {number}
   */
  get initialValue() {
    return this[initialValueSymbol];
  }

  /**
   * Returns the flags for the modifiers that affect the roll
   *
   * @returns {string}
   */
  get modifierFlags() {
    // @todo need a better way of mapping modifiers to symbols
    return [...this.modifiers].reduce((acc, modifier) => {
      let flag;

      switch (modifier) {
        case 'compound':
        case 'explode':
          flag = '!';
          break;
        case 'critical-failure':
          flag = '__';
          break;
        case 'critical-success':
          flag = '**';
          break;
        case 'drop':
          flag = 'd';
          break;
        case 'max':
          flag = 'v';
          break;
        case 'min':
          flag = '^';
          break;
        case 'penetrate':
          flag = 'p';
          break;
        case 're-roll':
          flag = 'r';
          break;
        case 're-roll-once':
          flag = 'ro';
          break;
        case 'target-failure':
          flag = '_';
          break;
        case 'target-success':
          flag = '*';
          break;
        default:
          flag = modifier;
          break;
      }

      return acc + flag;
    }, '');
  }

  /**
   * Returns the modifiers that affect the roll
   *
   * @returns {Set<string>}
   */
  get modifiers() {
    return this[modifiersSymbol];
  }

  /**
   * Set the modifiers that affect the roll
   *
   * @param {string[]|Set<string>} value
   *
   * @throws {TypeError} modifiers must be a Set or array of modifier names
   */
  set modifiers(value) {
    if ((Array.isArray(value) || (value instanceof Set)) && [...value].every((item) => typeof item === 'string')) {
      this[modifiersSymbol] = new Set([...value]);

      return;
    }

    if (!value && (value !== 0)) {
      // clear the modifiers
      this[modifiersSymbol] = new Set();

      return;
    }

    throw new TypeError(`modifiers must be a Set or array of modifier names: ${value}`);
  }

  /**
   * Returns whether to use the value in total calculations or not
   *
   * @returns {boolean}
   */
  get useInTotal() {
    return !!this[useInTotalSymbol];
  }

  /**
   * Sets whether to use the value in total calculations or not
   *
   * @param {boolean} value
   */
  set useInTotal(value) {
    this[useInTotalSymbol] = !!value;
  }

  /**
   * Value of the roll after modifiers have affected it
   *
   * @returns {number}
   */
  get value() {
    return diceUtils.isNumeric(this[valueSymbol]) ? this[valueSymbol] : this[initialValueSymbol];
  }

  /**
   * Sets the roll value
   *
   * @param {number} value
   *
   * @throws {TypeError} value is invalid
   */
  set value(value) {
    if (!diceUtils.isNumeric(value)) {
      throw new TypeError(`Result value is invalid: ${value}`);
    }

    this[valueSymbol] = parseInt(value, 10);
  }

  /**
   * Returns an object for JSON serialising
   *
   * @returns {{}}
   */
  toJSON() {
    const {
      calculationValue, initialValue, modifierFlags, modifiers, useInTotal, value,
    } = this;

    return {
      calculationValue,
      initialValue,
      modifierFlags,
      modifiers: [...modifiers],
      type: 'result',
      useInTotal,
      value,
    };
  }

  /**
   * Returns the String representation of the object
   *
   * @returns {string}
   */
  toString() {
    return this.value + this.modifierFlags;
  }
}

export default RollResult;
