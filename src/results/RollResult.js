import {diceUtils} from "../utilities/utils.js";

const RollResult = (() => {
  const _calculationValue = Symbol('calculation-value');
  const _modifiers = Symbol('modifiers');
  const _initialValue = Symbol('initial-value');
  const _value = Symbol('value');

  class RollResult{
    /**
     *
     * @param {number|{value: Number, initialValue: number}} value The value rolled
     * @param {string[]=} modifiers List of modifier names that affect this roll
     */
    constructor(value, modifiers){
      if (diceUtils.isNumeric(value)) {
        this[_initialValue] = parseInt(value, 10);
      } else if (value && (typeof value === 'object') && !Array.isArray(value)) {
        // ensure that we have a valid value
        const initialVal = diceUtils.isNumeric(value.initialValue) ? value.initialValue : value.value;
        if (!diceUtils.isNumeric(initialVal)) {
          throw new Error(`Result value is invalid: ${initialVal}`);
        }

        this[_initialValue] = parseInt(initialVal, 10);

        if (diceUtils.isNumeric(value.value) && (parseInt(value.value, 10) !== this[_initialValue])) {
          this.value = value.value;
        }

        if (diceUtils.isNumeric(value.calculationValue) && (parseFloat(value.calculationValue) !== this.value)) {
          this.calculationValue = value.calculationValue;
        }

        if (Array.isArray(value.modifiers) && value.modifiers.length){
          modifiers = value.modifiers;
        }
      } else {
        throw new Error(`Result value is invalid: ${value}`);
      }

      this.modifiers = modifiers || [];
    }

    /**
     * Returns the value to use in calculations
     *
     * @returns {number}
     */
    get calculationValue(){
      return diceUtils.isNumeric(this[_calculationValue]) ? parseFloat(this[_calculationValue]) : this.value;
    }

    /**
     * Sets the value to use in calculations
     *
     * @param value
     */
    set calculationValue(value){
      const isNumeric = diceUtils.isNumeric(value);
      if (value && !isNumeric) {
        throw new Error(`Result calculation value is invalid: ${value}`);
      }

      this[_calculationValue] = isNumeric ? parseFloat(value) : null;
    }

    /**
     * The initial roll value before any modifiers.
     * Not often used, you probably want `value` instead.
     *
     * @returns {Number}
     */
    get initialValue(){
      return this[_initialValue];
    }

    /**
     * Returns the flags for the modifiers that affect the roll
     *
     * @returns {string}
     */
    get modifierFlags(){
      // @todo need a better way of mapping modifiers to symbols
      return this.modifiers.reduce((acc, flag) => {
        switch (flag) {
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
        }

        return acc+flag
      }, '');
    }

    /**
     * Returns the modifiers that affect the roll
     *
     * @returns {string[]}
     */
    get modifiers(){
      return this[_modifiers] || [];
    }

    /**
     * Set the modifiers that affect the roll
     *
     * @param value
     */
    set modifiers(value){
      if ((value || (0 === value)) && (!Array.isArray(value) || value.some(item => typeof item !== 'string'))) {
        throw new Error(`Modifiers must be an array of modifier names: ${value}`);
      }

      this[_modifiers] = value || [];
    }

    /**
     * Roll value after modifiers have affected it
     *
     * @returns {number}
     */
    get value(){
      return diceUtils.isNumeric(this[_value]) ? this[_value] : this[_initialValue];
    }

    /**
     * Sets the value
     *
     * @param value
     */
    set value(value){
      if (!diceUtils.isNumeric(value)) {
        throw new Error(`Result value is invalid: ${value}`);
      }

      this[_value] = parseInt(value, 10);
    }

    /**
     * Returns an object for JSON serialising
     *
     * @returns {{}}
     */
    toJSON(){
      const {calculationValue, initialValue, modifierFlags, modifiers, value} = this;

      return {
        calculationValue,
        initialValue,
        modifierFlags,
        modifiers,
        type: 'result',
        value,
      };
    }

    /**
     * Returns the String representation of the object
     *
     * @returns {string}
     */
    toString(){
      return this.value + this.modifierFlags;
    }
  }

  return RollResult;
})();

export default RollResult;
