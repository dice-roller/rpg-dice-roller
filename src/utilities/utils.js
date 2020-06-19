if (!Array.prototype.flat) {
  /* eslint-disable */
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
  /* eslint-disable */
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

class PRNG {
  /**
   * Class for generating high quality random numbers.  Defaults to
   * the cryptographically secure window.crypto.getRandomValues.  If that is
   * not available, uses Mersenne Twister if that is installed.  Failing all
   * that, it falls back to Math.random()
   */

  /**
   * Selects the random number generator based on what's available.
   */
  constructor(seed) {
    try {
      this.forceCrypto();
      return;
    } catch (ex) {}
    try {
      this.forceMersenneTwister(seed);
      return;
    } catch (ex) {}
    this.forceMath();
  }

  /**
   * Forces system to use window.crypto
   * 
   * Throws an execption if it is not found.
   */
  forceCrypto() {
    if(window && window.toString() === "[object Window]") {
      if(window.crypto) {
        this.method = "crypto";
        this.randFunction = this.cryptoGetRandomInt;
        return;
      }
    }
    throw 'window.crypto not found';
  }

  /**
   * Forces system to use Mersenne Twister
   * also Reseeds the mersenne-twister PRNG.
   * 
   * Throws an execption if it is not found.
   * @param {number} [seed] - optional
   */
  forceMersenneTwister(seed) {
    var MersenneTwister = require("mersenne-twister");
    this.method = "mersenne-twister";
    if(seed) {
      this.mtgenerator = new MersenneTwister(seed);
    } else {
      this.mtgenerator = new MersenneTwister(Math.random())
    }
    this.randFunction = this.mersenneTwisterGetRandomInt;
  }

  /**
   * Forces system to use Math.random
   * 
   * Throws an execption if it is not found.
   */
  forceMath() {
    this.method = "math";
    this.randFunction = this.mathGetRandomInt;
  }

  /**
   * 
   * @param {number|string} min
   * @param {number|string} max
   * @returns {*}
   */
  randomInt(min, max) {
    const minNumber = min ? parseInt(min, 10) : 1;
    const maxNumber = max ? parseInt(max, 10) : min;

    if (maxNumber <= minNumber) {
      return minNumber;
    }
    return this.randFunction(minNumber, maxNumber);
  }

  /**
   * Generates a cryptographically secure (Read: High quality) random number
   * 
   * @param {number|string} min
   * @param {number|string} max
   * @returns {*}
   */
  cryptoGetRandomInt(min, max) {
    var byteArray = new Uint8Array(1);
    window.crypto.getRandomValues(byteArray);
    var randomNum = '0.' + byteArray[0].toString();
    randomNum = Math.floor(randomNum * (max - min + 1)) + min;
    return randomNum;
  }

  /**
   * Generates a high quality number from the Mersenne twister PRNG.
   * This was seeded by the constructor, but can be re-seeded by calling
   * mersenneTwisterResetSeed.
   * 
   * If there is no generator, it will attempt to seed one.  Warning, this
   * can raise an exception if called directly.
   * 
   * @param {number|string} min
   * @param {number|string} max
   * @returns {*}
   */
  mersenneTwisterGetRandomInt(min, max) {
    if (!this.mtgenerator) {
      forceMersenneTwister()
    }
    return Math.floor(this.mtgenerator.random() * (max - min + 1) + min);
  }

  /**
   * Produces a low quality random number from Math.random
   * 
   * @param {number|string} min
   * @param {number|string} max
   * @returns {*}
   */
  mathGetRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
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
  isNumeric(val) {
    return !Array.isArray(val) && !Number.isNaN(val) && Number.isFinite(parseInt(val, 10));
  },
  isBase64(val) {
    try {
      return !!(val && (btoa(atob(val)) === val));
    } catch (e) {
      return false;
    }
  },
  isJson(val) {
    try {
      const parsed = val ? JSON.parse(val) : false;

      return !!(parsed && (typeof parsed === 'object'));
    } catch (e) {
      return false;
    }
  },
  prng: new PRNG(),
  /**
   * Generates a random number between the
   * min and max, inclusive
   *
   * @param {number|string} min
   * @param {number|string} max
   * @returns {*}
   */
  generateNumber(min, max) {
    return this.prng.randomInt(min, max)
  },
  /**
   * @returns {function(Array): number}
   */
  get sumArray() {
    /**
     * Takes an array of numbers and adds them together,
     * returning the result
     *
     * @param {Number[]} numbers
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
   * @param {number} num
   * @param {number=} decPlaces
   * @returns {number}
   */
  toFixed(num, decPlaces) {
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
  OBJECT: 2,
});

export { diceUtils, exportFormats };
