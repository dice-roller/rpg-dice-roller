/**
 * Polyfill for Array.prototype.flat
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat#Polyfill
 */
if (!Array.prototype.flat) {
  Array.prototype.flat = function() {
    var depth = arguments[0];
    depth = depth === undefined ? 1 : Math.floor(depth);
    if (depth < 1) return Array.prototype.slice.call(this);
    return (function flat(arr, depth) {
      var len = arr.length >>> 0;
      var flattened = [];
      var i = 0;
      while (i < len) {
        if (i in arr) {
          var el = arr[i];
          if (Array.isArray(el) && depth > 0)
            flattened = flattened.concat(flat(el, depth - 1));
          else flattened.push(el);
        }
        i++;
      }
      return flattened;
    })(this, depth);
  };
}

/**
 * Polyfill for Array.prototype.flatMap
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap#Polyfill
 */
if (!Array.prototype.flatMap) {
  Array.prototype.flatMap = function() {
    return Array.prototype.map.apply(this, arguments).flat(1);
  };
}

/**
 * Utility helper functions
 *
 * @type {Readonly<{compareNumbers(number, number, string): boolean, toFixed(number, number=): number, generateNumber((number|string), (number|string)): *, isNumeric(*=): boolean, isJson(*=): (*|boolean|undefined), sumArray(Array): number, isBase64(*=): (*|boolean|undefined)}>}
 */
const diceUtils = Object.freeze({
  /**
   * Checks if the given val is a valid number
   *
   * @param val
   * @returns {boolean}
   */
  isNumeric(val){
    return !Array.isArray(val) && !Number.isNaN(val) && Number.isFinite(parseInt(val, 10));
  },
  isBase64(val){
    try{
      return !!(val && (btoa(atob(val)) === val));
    }catch(e){
      return false;
    }
  },
  isJson(val){
    try{
      let parsed = val ? JSON.parse(val) : false;

      return !!(parsed && (typeof parsed === 'object'));
    }catch(e){
      return false;
    }
  },
  /**
   * Generates a random number between the
   * min and max, inclusive
   *
   * @param {number|string} min
   * @param {number|string} max
   * @returns {*}
   */
  generateNumber(min, max){
    min = min ? parseInt(min, 10) : 1;
    max = max ? parseInt(max, 10) : min;

    if(max <= min){
      return min;
    }

    return Math.floor(Math.random() * (max - min + 1) + min);
  },
  /**
   * @returns {function(Array): number}
   */
  get sumArray(){
    /**
     * Takes an array of numbers and adds them together,
     * returning the result
     *
     * @param {Number[]} numbers
     * @returns {number}
     */
    return numbers => (
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
   * @returns {boolean}
   */
  compareNumbers(a, b, operator){
    let result;

    a = parseFloat(a);
    b = parseFloat(b);

    switch(operator){
      case '=':
      case '==':
        result = a === b;
        break;
      case '<':
        result = a < b;
        break;
      case '>':
        result = a > b;
        break;
      case '<=':
        result = a <= b;
        break;
      case '>=':
        result = a >= b;
        break;
      case '!':
      case '!=':
        result = a !== b;
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
   * @param {number} num
   * @param {number=} decPlaces
   * @returns {number}
   */
  toFixed(num, decPlaces){
    // round to the specified decimal places, then convert back to
    // a number to remove trailing zeroes after the decimal point
    return parseFloat(parseFloat(num).toFixed(decPlaces || 0));
  },
});

/**
 * Allowed formats for exporting dice data
 *
 * @type {Readonly<{BASE_64: number, JSON: number, OBJECT: number}>}
 */
const exportFormats = Object.freeze({
  JSON: 0,
  BASE_64: 1,
  OBJECT: 2
});

export { diceUtils, exportFormats };
