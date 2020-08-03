import { DataFormatError, RequiredArgumentError } from './exceptions';
import { diceUtils, exportFormats } from './utilities/utils';
import DiceRoll from './DiceRoll';

/**
 * history of log rolls
 *
 * @type {symbol}
 *
 * @private
 */
const logSymbol = Symbol('log');

/**
 * A `DiceRoller` handles dice rolling functionality, keeps a history of rolls and can output logs
 * etc.
 *
 * @see {@link DiceRoll} if you don't need to keep a log history of rolls
 */
class DiceRoller {
  /**
   * Create a DiceRoller.
   *
   * The optional `data` property should be either an array of `DiceRoll` objects, or an object with
   * a `log` property that contains the `DiceRoll` objects.
   *
   * @param {{log: DiceRoll[]}|DiceRoll[]} [data] The data to import
   * @param {DiceRoll[]} [data.log] If `data` is an object, it must contain an array of `DiceRoll`s
   *
   * @throws {TypeError} if data is an object, it must have a `log[]` property
   */
  constructor(data) {
    this[logSymbol] = [];

    if (data) {
      this.import(data);
    }
  }

  /**
   * The list of roll logs.
   *
   * @returns {DiceRoll[]}
   */
  get log() {
    return this[logSymbol] || [];
  }

  /**
   * String representation of the rolls in the log
   *
   * @example
   * 2d20+1d6: [20,2]+[2] = 24; 1d8: [6] = 6
   *
   * @returns {string}
   */
  get output() {
    return this.log.join('; ');
  }

  /**
   * The sum of all the rolls in the log
   *
   * @see {@link DiceRoller#log}
   *
   * @returns {number}
   */
  get total() {
    return this.log.reduce((prev, current) => prev + current.total, 0);
  }

  /**
   * Clear the roll history log.
   *
   * @see {@link DiceRoller#log}
   */
  clearLog() {
    this[logSymbol].length = 0;
  }

  /**
   * Export the object in the given format.
   * If no format is specified, JSON is returned.
   *
   * @see {@link DiceRoller#toJSON}
   *
   * @param {exportFormats} [format=exportFormats#JSON] The format to export the data as
   *
   * @returns {string|null} The exported data, in the specified format
   *
   * @throws {TypeError} Invalid export format
   */
  export(format = exportFormats.JSON) {
    switch (format) {
      case exportFormats.BASE_64:
        // JSON encode, then base64
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
   * Add the data to the existing [roll log]{@link DiceRoller#log}.
   *
   * `data` can be an array of `DiceRoll` objects, an object with a `log` property that contains
   * `DiceRoll` objects, or a JSON / base64 encoded representation of either.
   *
   * @see {@link DiceRoller#log}
   *
   * @param {string|{log: DiceRoll[]}|DiceRoll[]} data The data to import
   * @param {DiceRoll[]} [data.log] If `data` is an object, it must contain an array of `DiceRoll`s
   *
   * @returns {DiceRoll[]} The roll log
   *
   * @throws {DataFormatError} data format invalid
   * @throws {RequiredArgumentError} data is required
   * @throws {TypeError} log must be an array
   */
  import(data) {
    if (!data) {
      throw new RequiredArgumentError('data');
    } else if (diceUtils.isJson(data)) {
      // data is JSON - parse and import
      return this.import(JSON.parse(data));
    } else if (diceUtils.isBase64(data)) {
      // data is base64 encoded - decode an import
      return this.import(atob(data));
    } else if (typeof data === 'object') {
      let log = data.log || null;

      if (!data.log && Array.isArray(data) && data.length) {
        // if `log` is not defined, but data is an array, use it as the list of logs
        log = data;
      }

      if (log && Array.isArray(log)) {
        // loop through each log entry and import it
        log.forEach((roll) => {
          this[logSymbol].push(DiceRoll.import(roll));
        });
      } else if (log) {
        throw new TypeError('log must be an array');
      }

      return this.log;
    } else {
      throw new DataFormatError(data);
    }
  }

  /**
   * Roll the given dice notation(s) and return the corresponding `DiceRoll` objects.
   *
   * You can roll a single notation, or multiple at once.
   *
   * @example <caption>Single notation</caption>
   * diceRoller.roll('2d6');
   *
   * @example <caption>Multiple notati== ons</caption>
   * roll('2d6', '4d10', 'd8+4d6');
   *
   * @param {...string} notations The notations to roll
   *
   * @returns {DiceRoll|DiceRoll[]} If a single notation is passed, a single `DiceRoll` is returned,
   * otherwise an array of `DiceRoll` objects is returned
   *
   * @throws {NotationError} notation is invalid
   * @throws {RequiredArgumentError} notation is required
   */
  roll(...notations) {
    const filteredNotations = notations.filter(Boolean);

    if (filteredNotations.length === 0) {
      throw new RequiredArgumentError('notations');
    }

    const rolls = filteredNotations.map((notation) => {
      const diceRoll = new DiceRoll(notation);

      // add the roll log to our global log
      this[logSymbol].push(diceRoll);

      // return the current DiceRoll
      return diceRoll;
    });

    return (rolls.length > 1) ? rolls : rolls[0];
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{output: string, total: number, log: DiceRoll[], type: string}}
   */
  toJSON() {
    const { log, output, total } = this;

    return {
      log,
      output,
      total,
      type: 'dice-roller',
    };
  }

  /**
   * Return the String representation of the object.
   *
   * This is called automatically when casting the object to a string.
   *
   * @returns {string}
   *
   * @see {@link DiceRoller#output}
   */
  toString() {
    return this.output;
  }

  /**
   * Create a new `DiceRoller` instance with the given data.
   *
   * `data` can be an array of `DiceRoll` objects, an object with a `log` property that contains the
   * `DiceRoll` objects, or a JSON / base64 encoded representation of either.
   *
   * @see instance method {@link DiceRoller#import}
   *
   * @param {string|{log: DiceRoll[]}|DiceRoll[]} data The data to import
   * @param {DiceRoll[]} [data.log] If `data` is an object, it must contain an array of `DiceRoll`s
   *
   * @returns {DiceRoller} The new `DiceRoller` instance
   *
   * @throws {DataFormatError} data format invalid
   * @throws {RequiredArgumentError} data is required
   * @throws {TypeError} log must be an array
   */
  static import(data) {
    // create a new DiceRoller object
    const diceRoller = new DiceRoller();

    // import the data
    diceRoller.import(data);

    // return the DiceRoller
    return diceRoller;
  }
}

export default DiceRoller;
