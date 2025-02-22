import { DataFormatError, RequiredArgumentError } from './exceptions/index';
import { isBase64, isJson } from './utilities/utils';
import DiceRoll from './DiceRoll';
import { ExportFormat } from "./types/Enums/ExportFormat";
import { Exportable } from "./types/Interfaces/Exportable";
import { Importable } from "./types/Interfaces/Importable";
import NotationError from "./exceptions/NotationError";
import { DiceRollerJsonOutput } from "./types/Interfaces/Json/DiceRollerJsonOutput";
import { DiceRollJsonOutput } from "./types/Interfaces/Json/DiceRollJsonOutput";
import { ModelType } from "./types/Enums/ModelType";

/**
 * A `DiceRoller` handles dice rolling functionality, keeps a history of rolls and can output logs
 * etc.
 *
 * @see {@link DiceRoll} if you don't need to keep a log history of rolls
 */
class DiceRoller implements Exportable, Importable<DiceRollJsonOutput[]|DiceRollerJsonOutput|string, DiceRoll[]> {
  readonly #log:DiceRoll[] = [];

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
  constructor(data?: DiceRoll[]|DiceRollJsonOutput[]|DiceRollerJsonOutput) {
    this.#log = [];

    if (data) {
      this.import(data);
    }
  }

  /**
   * The list of roll logs.
   *
   * @returns {DiceRoll[]}
   */
  get log(): DiceRoll[] {
    return this.#log;
  }

  /**
   * String representation of the rolls in the log
   *
   * @example
   * 2d20+1d6: [20,2]+[2] = 24; 1d8: [6] = 6
   *
   * @returns {string}
   */
  get output(): string {
    return this.toString();
  }

  /**
   * The sum of all the rolls in the log
   *
   * @see {@link DiceRoller#log}
   *
   * @returns {number}
   */
  get total(): number {
    return this
      .log
      .reduce(
        (prev, current) => prev + current.total,
        0,
      );
  }

  /**
   * Clear the roll history log.
   *
   * @see {@link DiceRoller#log}
   */
  clearLog(): void {
    this.#log.length = 0;
  }

  /**
   * Export the object in the given format.
   * If no format is specified, JSON is returned.
   *
   * @see {@link DiceRoller#toJSON}
   *
   * @param {ExportFormat} [format=ExportFormat#Json] The format to export the data as
   *
   * @returns {string|null} The exported data, in the specified format
   *
   * @throws {TypeError} Invalid export format
   */
  export(format: ExportFormat = ExportFormat.Json): DiceRollerJsonOutput|string {
    switch (format) {
      case ExportFormat.Base64:
        // JSON encode, then base64
        return btoa(this.export(ExportFormat.Json) as string);
      case ExportFormat.Json:
        return JSON.stringify(this);
      case ExportFormat.Object:
        return JSON.parse(this.export(ExportFormat.Json) as string) as DiceRollerJsonOutput;
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
  import(data: {log: DiceRoll[]}|DiceRoll[]|DiceRollJsonOutput[]|DiceRollerJsonOutput|string): DiceRoll[] {
    if (!data) {
      throw new RequiredArgumentError('data');
    }

    if (isJson(data as string)) {
      // data is JSON - parse and import
      return this.import(JSON.parse(data as string) as DiceRollJsonOutput[]|DiceRollerJsonOutput);
    }

    if (isBase64(data as string)) {
      // data is base64 encoded - decode an import
      return this.import(atob(data as string));
    }

    if (Array.isArray(data)) {
      return this.import({log: data as DiceRoll[]});
    }

    if (typeof data === 'object') {
      if (Array.isArray(data.log)) {
        // loop through each log entry and import it
        data.log.forEach((roll) => {
          this.#log.push(DiceRoll.import(roll));
        });

        return this.log;
      }

      if (data.log as unknown) {
        throw new TypeError('log must be an array');
      }
    }

    throw new DataFormatError(data);
  }

  /**
   * Roll the given dice notation(s) and return the corresponding `DiceRoll` objects.
   *
   * You can roll a single notation, or multiple at once.
   *
   * @example <caption>Single notation</caption>
   * diceRoller.roll('2d6');
   *
   * @example <caption>Multiple notations</caption>
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
  roll(...notations: string[]): DiceRoll|DiceRoll[] {
    const filteredNotations = notations.filter(Boolean);

    if (filteredNotations.length === 0) {
      throw new RequiredArgumentError('notations');
    }

    const rolls = filteredNotations.map((notation) => {
      const diceRoll = new DiceRoll(notation);

      // add the roll log to our global log
      this.#log.push(diceRoll);

      // return the current DiceRoll
      return diceRoll;
    });

    if(rolls.length === 0) {
      throw new NotationError(notations.join(', '));
    }

    return (rolls.length > 1) ? rolls : (rolls[0] as DiceRoll);
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{output: string, total: number, log: DiceRoll[], type: string}}
   */
  toJSON() {
    return {
      log: this.log,
      output: this.toString(),
      total: this.total,
      type: ModelType.DiceRoller,
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
  toString(): string {
    return this.log.join('; ');
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
  static import(data: DiceRollJsonOutput[]|DiceRollerJsonOutput|string): DiceRoller {
    // create a new DiceRoller object
    const diceRoller = new DiceRoller();

    // import the data
    diceRoller.import(data);

    // return the DiceRoller
    return diceRoller;
  }
}

export default DiceRoller;
