import { StandardDice } from './dice/index.js';
import { DataFormatError, NotationError, RequiredArgumentError } from './exceptions/index.js';
import { evaluate, toFixed } from './utilities/math.js';
import { engines, generator } from './utilities/NumberGenerator.js';
import { isBase64, isJson } from './utilities/utils.js';
import Parser from './parser/Parser.js';
import RollGroup from './RollGroup.js';
import RollResults from './results/RollResults.js';
import exportFormats from './utilities/ExportFormats.js';

/**
 * Method for calculating the roll total
 *
 * @type {symbol}
 *
 * @private
 */
const calculateTotalSymbol = Symbol('calculateTotal');

/**
 * The notation
 *
 * @type {symbol}
 *
 * @private
 */
const notationSymbol = Symbol('notation');

/**
 * The maximum possible roll total
 *
 * @type {symbol}
 *
 * @private
 */
const maxTotalSymbol = Symbol('maxTotal');

/**
 * The minimum possible roll total
 *
 * @type {symbol}
 *
 * @private
 */
const minTotalSymbol = Symbol('minTotal');

/**
 * List of dice definition objects
 *
 * @type {symbol}
 *
 * @private
 */
const parsedNotationSymbol = Symbol('parsed-notation');

/**
 * Method for rolling dice
 *
 * @type {symbol}
 *
 * @private
 */
const rollMethodSymbol = Symbol('roll-method');

/**
 * List of rolls
 *
 * @type {symbol}
 *
 * @private
 */
const rollsSymbol = Symbol('rolls');

/**
 * The roll total
 *
 * @type {symbol}
 *
 * @private
 */
const totalSymbol = Symbol('total');

/**
 * A `DiceRoll` handles rolling of a single dice notation and storing it's result.
 *
 * @see {@link DiceRoller} if you need to keep a history of rolls
 */
class DiceRoll {
  /**
   * Create a DiceRoll, parse the notation and roll the dice.
   *
   * If `notation` is an object, it must contain a `notation` property that defines the notation.
   * It can also have an optional array of `RollResults`, in the `rolls` property.
   *
   * @example <caption>String notation</caption>
   * const roll = new DiceRoll('4d6');
   *
   * @example <caption>Object</caption>
   * const roll = new DiceRoll({
   *   notation: '4d6',
   *   rolls: ..., // RollResults object or array of roll results
   * });
   *
   * @param {string|{notation: string, rolls: RollResults[]}} notation The notation to roll
   * @param {string} notation.notation If `notation is an object; the notation to roll
   * @param {RollResults[]} [notation.rolls] If `notation is an object; the rolls to import
   *
   * @throws {NotationError} notation is invalid
   * @throws {RequiredArgumentError} notation is required
   * @throws {TypeError} Rolls must be an array
   */
  constructor(notation) {
    if (!notation) {
      throw new RequiredArgumentError('notation');
    }

    // initialise the parsed dice array
    this[parsedNotationSymbol] = [];

    if ((notation instanceof Object) && !Array.isArray(notation)) {
      // validate object
      // @todo see if we can assert that the notation is valid
      if (!notation.notation) {
        // object doesn't contain a notation property
        throw new RequiredArgumentError('notation');
      } else if (typeof notation.notation !== 'string') {
        throw new NotationError(notation.notation);
      } else if (notation.rolls) {
        // we have rolls - validate them
        if (!Array.isArray(notation.rolls)) {
          // rolls is not an array
          throw new TypeError(`Rolls must be an array: ${notation.rolls}`);
        } else {
          // if roll is a RollResults, return it, otherwise try to convert to a RollResults object
          this[rollsSymbol] = notation.rolls
            .map((roll) => {
              if (roll instanceof RollResults) {
                // already a RollResults object
                return roll;
              }
              if (Array.isArray(roll)) {
                // array of values
                return new RollResults(roll);
              }
              if ((roll instanceof Object) && Array.isArray(roll.rolls)) {
                // object with list of rolls
                return new RollResults(roll.rolls);
              }

              return null;
            })
            .filter(Boolean);
        }
      }

      // store the notation
      this[notationSymbol] = notation.notation;

      // parse the notation
      this[parsedNotationSymbol] = Parser.parse(this.notation);

      if (!this[rollsSymbol] || !this[rollsSymbol].length) {
        // ensure rolls is an empty array
        this[rollsSymbol] = [];

        // roll the dice
        this.roll();
      }
    } else if (typeof notation === 'string') {
      // @todo see if we can assert that the notation is valid
      // store the notation
      this[notationSymbol] = notation;
      // empty the current rolls
      this[rollsSymbol] = [];

      // parse the notation
      this[parsedNotationSymbol] = Parser.parse(this.notation);

      // roll the dice
      this.roll();
    } else {
      throw new NotationError(notation);
    }
  }

  /**
   * The average possible total for the notation.
   *
   * @since 4.3.0
   *
   * @returns {number}
   */
  get averageTotal() {
    return (this.maxTotal + this.minTotal) / 2;
  }

  /**
   * The maximum possible total for the notation.
   *
   * @since 4.3.0
   *
   * @returns {number}
   */
  get maxTotal() {
    if (!this[parsedNotationSymbol]) {
      return 0;
    }

    // only calculate the total if it has not already been done
    if (!this[maxTotalSymbol]) {
      // roll the dice, forcing values to their maximum
      const rolls = this[rollMethodSymbol](engines.max);

      // calculate the total
      this[maxTotalSymbol] = this[calculateTotalSymbol](rolls);
    }

    // return the total
    return this[maxTotalSymbol];
  }

  /**
   * The minimum possible total for the notation.
   *
   * @since 4.3.0
   *
   * @returns {number}
   */
  get minTotal() {
    if (!this[parsedNotationSymbol]) {
      return 0;
    }

    // only calculate the total if it has not already been done
    if (!this[minTotalSymbol]) {
      // roll the dice, forcing values to their minimum
      const rolls = this[rollMethodSymbol](engines.min);

      // calculate the total
      this[minTotalSymbol] = this[calculateTotalSymbol](rolls);
    }

    // return the total
    return this[minTotalSymbol];
  }

  /**
   * The dice notation.
   *
   * @returns {string}
   */
  get notation() {
    return this[notationSymbol];
  }

  /**
   * String representation of the rolls
   *
   * @example
   * 2d20+1d6: [20,2]+[2] = 24
   *
   * @returns {string}
   */
  get output() {
    let rollIndex = 0;
    let output = `${this.notation}: `;

    if (this.hasRolls()) {
      output += this[parsedNotationSymbol]
        .map((item) => {
          if (item instanceof StandardDice) {
            const rollResults = this.rolls[rollIndex] || null;

            // increment the roll index
            rollIndex += 1;

            return rollResults;
          }

          if (item instanceof RollGroup) {
            // @todo handle roll groups
          }

          return item;
        })
        // remove any empty values
        .filter(Boolean)
        // join into a single string
        .join('');

      // add the total
      output += ` = ${this.total}`;
    } else {
      output += 'No dice rolled';
    }

    return output;
  }

  /**
   * The dice rolled for the notation
   *
   * @returns {RollResults[]}
   */
  get rolls() {
    return this[rollsSymbol] || [];
  }

  /**
   * The roll total
   *
   * @returns {number}
   */
  get total() {
    // only calculate the total if it has not already been done
    if (!this[totalSymbol] && this.hasRolls()) {
      this[totalSymbol] = this[calculateTotalSymbol](this.rolls);
    }

    // return the total
    return this[totalSymbol] || 0;
  }

  /**
   * Export the object in the given format.
   * If no format is specified, JSON is returned.
   *
   * @see {@link DiceRoll#toJSON}
   *
   * @param {exportFormats} [format=exportFormats.JSON] The format to export the data as
   *
   * @returns {string|null} The exported data, in the specified format
   *
   * @throws {TypeError} Invalid export format
   */
  export(format = exportFormats.JSON) {
    switch (format) {
      case exportFormats.BASE_64:
        // JSON encode then base64, else it exports the string representation of the roll output
        return btoa(this.export(exportFormats.JSON));
      case exportFormats.JSON:
        return JSON.stringify(this);
      case exportFormats.OBJECT:
        return JSON.parse(this.export(exportFormats.JSON));
      default:
        throw new TypeError(`Invalid export format "${format}"`);
    }
  }

  /**
   * Check whether the object has rolled dice or not
   *
   * @returns {boolean} `True` if the object has rolls, `false` otherwise
   */
  hasRolls() {
    return !!(this[parsedNotationSymbol] && Array.isArray(this.rolls) && this.rolls.length);
  }

  /**
   * Rolls the dice for the stored notation.
   *
   * This is called in the constructor, so you'll only need this if you want to re-roll the
   * notation. However, it's usually better to create a new `DiceRoll` instance instead.
   *
   * @returns {RollResults[]} The results of the rolls
   */
  roll() {
    // reset the cached total
    this[totalSymbol] = 0;

    // save the rolls to the log
    this[rollsSymbol] = this[rollMethodSymbol]();

    // return the rolls;
    return this[rollsSymbol];
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{
   *  output: string,
   *  total: number,
   *  minTotal: number,
   *  maxTotal: number,
   *  notation: string,
   *  rolls: RollResults[],
   *  type: string
   * }}
   */
  toJSON() {
    const {
      averageTotal, maxTotal, minTotal, notation, output, rolls, total,
    } = this;

    return {
      averageTotal,
      maxTotal,
      minTotal,
      notation,
      output,
      rolls,
      total,
      type: 'dice-roll',
    };
  }

  /**
   * Return the String representation of the object.
   *
   * This is called automatically when casting the object to a string.
   *
   * @returns {string}
   *
   * @see {@link DiceRoll#output}
   */
  toString() {
    return this.output;
  }

  /**
   * Create a new `DiceRoll` instance with the given data.
   *
   * `data` can be an object of data, a JSON / base64 encoded string of such data.
   *
   * The object must contain a `notation` property that defines the notation and, optionally, an
   * array of RollResults, in the `rolls` property.
   *
   * @example <caption>Object</caption>
   * DiceRoll.import({
   *   notation: '4d6',
   *   rolls: ..., // RollResults object or array of roll results
   * });
   *
   * @example <caption>JSON</caption>
   * DiceRoll.import('{"notation":"4d6","rolls":[...]}');
   *
   * @example <caption>Base64</caption>
   * DiceRoll.import('eyJub3RhdGlvbiI6IjRkNiIsInJvbGxzIjpbXX0=');
   *
   * @param {{notation: string, rolls: RollResults[]}|string} data The data to import
   * @param {string} data.notation If `notation` is an object; the notation to import
   * @param {RollResults[]} [data.rolls] If `notation` is an object; the rolls to import
   *
   * @returns {DiceRoll} The new `DiceRoll` instance
   *
   * @throws {DataFormatError} data format is invalid
   */
  static import(data) {
    if (!data) {
      throw new RequiredArgumentError('data');
    } else if (isJson(data)) {
      // data is JSON format - parse and import
      return DiceRoll.import(JSON.parse(data));
    } else if (isBase64(data)) {
      // data is base64 encoded - decode and import
      return DiceRoll.import(atob(data));
    } else if (typeof data === 'object') {
      // if data is a `DiceRoll` return it, otherwise build it
      return new DiceRoll(data);
    } else {
      throw new DataFormatError(data);
    }
  }

  /**
   * Calculate the total roll value and return it
   *
   * @private
   *
   * @param {RollResults[]} rolls
   *
   * @returns {Number} the roll total
   */
  [calculateTotalSymbol](rolls) {
    let formula = '';
    let rollIndex = 0;

    if (!rolls.length) {
      return 0;
    }

    // loop through each roll and calculate the totals
    this[parsedNotationSymbol].forEach((item) => {
      // @todo need to handle roll groups
      if (item instanceof StandardDice) {
        // @todo should roll results be stored on their relevant parsed object?
        // item is a die - total the rolls for it
        formula += rolls[rollIndex] ? rolls[rollIndex].value : 0;

        // increment the roll index and store the previous rolls / parsed die
        rollIndex += 1;
      } else {
        formula += item;
      }
    });

    // if a total formula has been produced, evaluate it and round it to max 2 decimal places
    return formula ? toFixed(evaluate(formula), 2) : 0;
  }

  /**
   * Roll the dice and return the result.
   *
   * If the engine is passed, it will be used for the number generation for **this roll only**.
   * The engine will be reset after use.
   *
   * @private
   *
   * @param {{next(): number}} [engine]
   *
   * @returns {RollResults[]} The result of the rolls
   *
   * @throws {TypeError} engine must have function `next()`
   */
  [rollMethodSymbol](engine) {
    let oEngine;
    if (engine) {
      // use the selected engine
      oEngine = generator.engine;
      generator.engine = engine;
    }

    // roll the dice
    const rolls = this[parsedNotationSymbol].map((item) => {
      if ((item instanceof StandardDice) || (item instanceof RollGroup)) {
        // roll the object and return the value
        return item.roll();
      }

      return null;
    }).filter(Boolean);

    if (engine) {
      // reset the engine
      generator.engine = oEngine;
    }

    return rolls;
  }
}

export default DiceRoll;
