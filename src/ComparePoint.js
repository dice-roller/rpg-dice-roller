import {diceUtils} from "./utilities/utils.js";

const ComparePoint = (() => {
  const _operator = Symbol('operator');
  const _value = Symbol('value');

  class ComparePoint{
    /**
     *
     * @param {string} operator
     * @param {number} value
     */
    constructor(operator, value){
      if(!operator){
        throw new Error('ComparePoint: No compare operator specified');
      } else if(!value && (value !== 0)){
        throw new Error('ComparePoint: No compare value specified');
      }

      this.operator = operator;
      this.value = value;
    }

    /**
     * Checks if the operator is valid
     *
     * @param {string} operator
     *
     * @returns {boolean}
     */
    static isValidOperator(operator){
      return (typeof operator === 'string') && /^(?:[<>!]?=|[<>])$/.test(operator);
    }

    /**
     * Sets the operator value
     *
     * @param {string} operator
     *
     * @throws Error
     */
    set operator(operator){
      if (!this.constructor.isValidOperator(operator)) {
        throw new Error(`ComparePoint: operator "${operator}" is not valid`);
      }

      this[_operator] = operator;
    }

    /**
     * Returns the comparison operator
     *
     * @returns {string}
     */
    get operator(){
      return this[_operator];
    }

    /**
     * Sets the value
     *
     * @param {number} value
     *
     * @throws Error
     */
    set value(value){
      if (!diceUtils.isNumeric(value)) {
        throw new Error('ComparePoint: value must be numeric');
      }

      this[_value] = parseInt(value, 10);
    }

    /**
     * Returns the comparison value
     *
     * @returns {number}
     */
    get value(){
      return this[_value];
    }

    /**
     * Checks whether value matches the compare point
     *
     * @param {number} value
     *
     * @returns {boolean}
     */
    isMatch(value){
      return diceUtils.compareNumbers(value, this.value, this.operator);
    }

    /**
     * Returns an object for JSON serialising
     *
     * @returns {{}}
     */
    toJSON(){
      const {operator, value} = this;

      return {
        operator,
        type: 'compare-point',
        value,
      };
    }

    /**
     * Returns the String representation of the object
     *
     * @returns {string}
     */
    toString(){
      return `${this.operator}${this.value}`;
    }
  }

  return ComparePoint;
})();

export default ComparePoint;
