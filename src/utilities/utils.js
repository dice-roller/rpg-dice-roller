/**
 * Utility helper functions
 *
 * @readonly
 *
 * @type {Readonly<{
 *  compareNumbers(a: number, b: number, operator: string): boolean,
 *  generateNumber(min: number, max: number): number,
 *  isBase64(val: string): boolean,
 *  isNumeric(val: *): boolean,
 *  isJson(val: string): boolean,
 *  isSafeNumber(val: *): boolean,
 *  readonly sumArray(numbers: number[]): number,
 *  toFixed(num: number, decPlaces: number=): number
 * }>}
 */
const diceUtils = Object.freeze({
  /**
   * Checks if the given value is a valid finite number
   *
   * @param {*} val
   *
   * @returns {boolean}
   */
  isNumeric(val) {
    if ((typeof val !== 'number') && (typeof val !== 'string')) {
      return false;
    }

    return !Number.isNaN(val) && Number.isFinite(Number(val));
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
   * Checks if the given value is a "safe" number.
   * This means that it falls within the `Number.MAX_SAFE_INTEGER` and `Number.MIN_SAFE_INTEGER`
   * values (Inclusive).
   *
   * @param {*} val
   *
   * @returns {boolean}
   */
  isSafeNumber(val) {
    if (!this.isNumeric(val)) {
      return false;
    }

    const castVal = Number(val);

    return (castVal <= Number.MAX_SAFE_INTEGER) && (castVal >= Number.MIN_SAFE_INTEGER);
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
   *
   * @param {number|string} a The number to compare with `b`
   * @param {number|string} b The number to compare with `a`
   * @param {string} operator A valid comparative operator (=, <, >, <=, >=, !=)
   *
   * @returns {boolean}
   */
  compareNumbers(a, b, operator) {
    const aNum = Number(a);
    const bNum = Number(b);
    let result;

    if (Number.isNaN(aNum) || Number.isNaN(bNum)) {
      return false;
    }

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
  BASE_64: 1,
  JSON: 0,
  OBJECT: 2,
});

export { diceUtils, exportFormats };
