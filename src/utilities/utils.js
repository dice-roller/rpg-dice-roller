import { generator } from './NumberGenerator';

/* eslint-disable */
if (!Array.prototype.flat) {
  /**
   * Polyfill for Array.prototype.flat (Required for node < 11)
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat#Polyfill
   *
   * @returns {unknown[]|[]}
   */
  Array.prototype.flat = function () {
    let depth = arguments[0];
    depth = depth === undefined ? 1 : Math.floor(depth);
    if (depth < 1) return Array.prototype.slice.call(this);
    return (function flat(arr, depth) {
      const len = arr.length >>> 0;
      let flattened = [];
      let i = 0;
      while (i < len) {
        if (i in arr) {
          const el = arr[i];
          if (Array.isArray(el) && depth > 0) flattened = flattened.concat(flat(el, depth - 1));
          else flattened.push(el);
        }
        i++;
      }
      return flattened;
    }(this, depth));
  };
}

if (!Array.prototype.flatMap) {
  /**
   * Polyfill for Array.prototype.flatMap (Required for node < 11)
   *
   *  @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap#Polyfill
   *
   * @returns {[]}
   */
  Array.prototype.flatMap = function () {
    return Array.prototype.map.apply(this, arguments).flat(1);
  };
}
/* eslint-enable */

/**
 * Utility helper functions
 *
 * @readonly
 *
 * @type {Readonly<{
 *  compareNumbers(a: number, b: number, operator: string): boolean,
 *  toFixed(num: number, decPlaces: number=): number,
 *  generateNumber(min: number, max: number): number,
 *  isNumeric(val: *): boolean,
 *  isJson(val: string): boolean,
 *  readonly sumArray(numbers: number[]): number,
 *  isBase64(val: string): boolean}>
 * }
 */
const diceUtils = Object.freeze({
  /**
   * Checks if the given value is a valid number
   *
   * @param {*} val
   *
   * @returns {boolean}
   */
  isNumeric(val) {
    return !Array.isArray(val) && !Number.isNaN(val) && Number.isFinite(parseInt(val, 10));
  },
  /**
   * Checks if the string is valid base64 encoded
   *
   * @param {string} val
   *
   * @returns {boolean}
   */
  isBase64(val) {
    try {
      return !!(val && (btoa(atob(val)) === val));
    } catch (e) {
      return false;
    }
  },
  /**
   * Checks if the string is valid JSON
   *
   * @param {string} val
   *
   * @returns {boolean}
   */
  isJson(val) {
    try {
      const parsed = val ? JSON.parse(val) : false;

      return !!(parsed && (typeof parsed === 'object'));
    } catch (e) {
      return false;
    }
  },
  /**
   * Generates a random number between the
   * min and max, inclusive
   *
   * @param {number} min
   * @param {number} max
   *
   * @returns {number}
   *
   * @deprecated use `NumberGenerator.generator.integer()` instead
   */
  generateNumber(min, max) {
    // eslint-disable-next-line no-console
    console.warn('diceUtils.generateNumber is deprecated, use NumberGenerator.generator.integer() instead');

    return generator.integer(min, max);
  },
  /**
   * @returns {function(number[]): number}
   */
  get sumArray() {
    /**
     * Takes an array of numbers and adds them together,
     * returning the result
     *
     * @param {number[]} numbers
     *
     * @returns {number}
     */
    return (numbers) => (
      !Array.isArray(numbers) ? 0 : numbers.reduce((prev, current) => (
        prev + (this.isNumeric(current) ? parseFloat(current) : 0)
      ), 0)
    );
  },
  /**
   * Checks if `a` is comparative to `b` with the given operator.
   * Returns true or false.
   *
   * @param {number} a
   * @param {number} b
   * @param {string} operator A valid comparative operator (=, <, >, <=, >=, !=)
   *
   * @returns {boolean}
   */
  compareNumbers(a, b, operator) {
    const aNum = parseFloat(a);
    const bNum = parseFloat(b);
    let result;

    switch (operator) {
      case '=':
      case '==':
        result = aNum === bNum;
        break;
      case '<':
        result = aNum < bNum;
        break;
      case '>':
        result = aNum > bNum;
        break;
      case '<=':
        result = aNum <= bNum;
        break;
      case '>=':
        result = aNum >= bNum;
        break;
      case '!':
      case '!=':
        result = aNum !== bNum;
        break;
      default:
        result = false;
        break;
    }

    return result;
  },
  /**
   * Rounds a number to the given number of decimal places,
   * removing any trailing zeros after the decimal point.
   *
   * `toFixed(1.236, 2) == 1.24`
   * `toFixed(30.1, 2) == 30.1`
   * `toFixed(4.0000000004, 3) == 4`
   *
   * @param {number} num The number to round
   * @param {number} [decPlaces=0] The number of digits after the decimal point
   *
   * @returns {number}
   */
  toFixed(num, decPlaces = 0) {
    // round to the specified decimal places, then convert back to
    // a number to remove trailing zeroes after the decimal point
    return parseFloat(parseFloat(num).toFixed(decPlaces || 0));
  },
});

/**
 * Allowed formats for exporting dice data
 *
 * @readonly
 *
 * @type {Readonly<{BASE_64: number, JSON: number, OBJECT: number}>}
 */
const exportFormats = Object.freeze({
  JSON: 0,
  BASE_64: 1,
  OBJECT: 2,
});

export { diceUtils, exportFormats };
