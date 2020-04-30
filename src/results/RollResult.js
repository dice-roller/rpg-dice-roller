import { diceUtils } from '../utilities/utils';

const calculationValueSymbol = Symbol('calculation-value');
const modifiersSymbol = Symbol('modifiers');
const initialValueSymbol = Symbol('initial-value');
const useInTotalSymbol = Symbol('use-in-total');
const valueSymbol = Symbol('value');

class RollResult {
  /**
   *
   * @param {number|{value: Number, initialValue: number}} value The value rolled
   * @param {string[]=} modifiers List of modifier names that affect this roll
   * @param {boolean=} useInTotal Whether to include the roll value when calculating totals
   */
  constructor(value, modifiers, useInTotal = true) {
    if (diceUtils.isNumeric(value)) {
      this[initialValueSymbol] = parseInt(value, 10);

      this.modifiers = modifiers || [];
      this.useInTotal = useInTotal;
    } else if (value && (typeof value === 'object') && !Array.isArray(value)) {
      // ensure that we have a valid value
      const initialVal = diceUtils.isNumeric(value.initialValue) ? value.initialValue : value.value;
      if (!diceUtils.isNumeric(initialVal)) {
        throw new Error(`Result value is invalid: ${initialVal}`);
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

      this.modifiers = Array.isArray(value.modifiers) ? value.modifiers : (modifiers || []);
      this.useInTotal = (typeof value.useInTotal === 'boolean') ? value.useInTotal : (useInTotal || false);
    } else {
      throw new Error(`Result value is invalid: ${value}`);
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
   * @param value
   */
  set calculationValue(value) {
    const isNumeric = diceUtils.isNumeric(value);
    if (value && !isNumeric) {
      throw new Error(`Result calculation value is invalid: ${value}`);
    }

    this[calculationValueSymbol] = isNumeric ? parseFloat(value) : null;
  }

  /**
   * The initial roll value before any modifiers.
   * Not often used, you probably want `value` instead.
   *
   * @returns {Number}
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
    return this.modifiers.reduce((acc, modifier) => {
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
   * @returns {string[]}
   */
  get modifiers() {
    return this[modifiersSymbol] || [];
  }

  /**
   * Set the modifiers that affect the roll
   *
   * @param value
   */
  set modifiers(value) {
    if ((value || (value === 0)) && (!Array.isArray(value) || value.some((item) => typeof item !== 'string'))) {
      throw new Error(`Modifiers must be an array of modifier names: ${value}`);
    }

    this[modifiersSymbol] = value || [];
  }

  /**
   * Returns the useInTotal flag
   *
   * @returns {boolean}
   */
  get useInTotal() {
    return !!this[useInTotalSymbol];
  }

  /**
   * Sets the useInTotal flag
   *
   * @param {boolean} value
   */
  set useInTotal(value) {
    this[useInTotalSymbol] = !!value;
  }

  /**
   * Roll value after modifiers have affected it
   *
   * @returns {number}
   */
  get value() {
    return diceUtils.isNumeric(this[valueSymbol]) ? this[valueSymbol] : this[initialValueSymbol];
  }

  /**
   * Sets the value
   *
   * @param value
   */
  set value(value) {
    if (!diceUtils.isNumeric(value)) {
      throw new Error(`Result value is invalid: ${value}`);
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
      modifiers,
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
