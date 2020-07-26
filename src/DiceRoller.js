import DiceRoll from './DiceRoll';
import { diceUtils, exportFormats } from './utilities/utils';
import RequiredArgumentError from './exceptions/RequiredArgumentError';
import DataFormatError from './exceptions/DataFormatError';

/**
 * history of log rolls
 *
 * @type {symbol}
 */
const logSymbol = Symbol('log');

/**
 * A DiceRoller handles dice rolling functionality, keeps track of rolls and can output logs etc.
 */
class DiceRoller {
  /**
   * Create a DiceRoller
   *
   * @param {{log: []}|[]} [data] The data to import
   *
   * @throws {TypeError} data.log must be an array
   */
  constructor(data) {
    this[logSymbol] = [];

    if (data) {
      this.import(data);
    }
  }

  /**
   * Returns the current roll log
   *
   * @returns {DiceRoll[]}
   */
  get log() {
    return this[logSymbol] || [];
  }

  /**
   * Returns the roll notation and rolls in the format of:
   * 2d20+1d6: [20,2]+[2] = 24; 1d8: [6] = 6
   *
   * @returns {string}
   */
  get output() {
    // return the log as a joined string
    return this.log.join('; ');
  }

  /**
   * Returns the total for all the rolls
   *
   * @returns {number}
   */
  get total() {
    return this.log.reduce((prev, current) => prev + current.total, 0);
  }

  /**
   * Takes the given data, imports it into a new DiceRoller instance
   * and returns the DiceRoller
   *
   * @param data
   *
   * @param {string|{log: []}|[]} data
   *
   * @returns {DiceRoller}
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

  /**
   * Clears the roll history log
   */
  clearLog() {
    this[logSymbol].length = 0;
  }

  /**
   * Exports the roll log in the given format.
   * If no format is specified, JSON is returned.
   *
   * @param {number} [format=exportFormats.JSON] The format to export the data to
   *
   * @returns {string|null}
   *
   * @throws {TypeError} Invalid export format
   */
  export(format) {
    switch (format || exportFormats.JSON) {
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
   * Takes the given roll data and imports it into
   * the existing DiceRoller, appending the rolls
   * to the current roll log.
   * Returns the roll log.
   *
   * @param {string|{log: []}|[]} data
   *
   * @returns {DiceRoll[]}
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
   * Returns an object for JSON serialising
   *
   * @returns {{}}
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
   * Returns the String representation
   * of the object as the roll notations
   *
   * @returns {string}
   */
  toString() {
    return this.output;
  }

  /**
   * Rolls the given dice notation(s) and returns them.
   *
   * You can roll multiple, separate notations at once by passing them as separate arguments like:
   *
   * ```
   * roll('2d6', '4d10', 'd8');
   * ```
   *
   * If only a single notation is passed, a single DiceRoll object will be returned.
   * If multiple are provided then it will return an array of DiceRoll objects.
   *
   * @param {...string} notations The notations to roll
   *
   * @returns {DiceRoll|DiceRoll[]}
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
}

export default DiceRoller;
