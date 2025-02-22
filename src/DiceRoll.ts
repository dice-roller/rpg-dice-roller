import { StandardDice } from './dice/index';
import { DataFormatError, NotationError, RequiredArgumentError } from './exceptions/index';
import { toFixed } from './utilities/math';
import { engines, generator } from './NumberGenerator';
import { isBase64, isJson } from './utilities/utils';
import Parser from './parser/Parser';
import RollGroup from './RollGroup';
import RollResults from './results/RollResults';
import ResultGroup from './results/ResultGroup';
import { HasNotation } from "./types/Interfaces/HasNotation";
import { ExpressionResult } from "./types/Interfaces/Results/ExpressionResult";
import { Engine } from "./types/Interfaces/NumberGenerator/Engines/Engine";
import { RollResultType } from "./types/Types/RollResultType";
import { ExportFormat } from "./types/Enums/ExportFormat";
import { ModelType } from "./types/Enums/ModelType";
import { DiceRollJsonOutput } from "./types/Interfaces/Json/DiceRollJsonOutput";
import { Exportable } from "./types/Interfaces/Exportable";
import { ParserResult } from "./types/Types/ParserResult";
import { RollResultJsonOutput } from "./types/Types/Json/RollResultJsonOutput";
import { DiceRollImport } from "./types/Types/Import/DiceRollImport";
import { RollsImport } from "./types/Types/Import/RollsImport";
import { SingleResult } from "./types/Interfaces/Results/SingleResult";

/**
 * Calculate the total of all the results, fixed to a max of 2 digits after the decimal point.
 *
 * @private
 *
 * @param {ResultGroup} results
 *
 * @returns {Number} the results total
 */
const calculateTotal = (results?: ExpressionResult): number => toFixed(results?.calculationValue ?? 0, 2);

/**
 * A `DiceRoll` handles rolling of a single dice notation and storing the result.
 *
 * @see {@link DiceRoller} if you need to keep a history of rolls
 */
class DiceRoll implements Exportable, Readonly<HasNotation> {
  readonly #expressions: ParserResult;
  readonly #notation!: string;

  #maxTotal?: number;
  #minTotal?: number;
  #rolls?: ExpressionResult;
  #total?: number;

  readonly name = 'dice-roll';

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
   * @param {string|{notation: string, rolls: ResultGroup|Array.<ResultGroup|RollResults|string|number>}} notation The notation to roll
   * @param {string} notation.notation If `notation is an object; the notation to roll
   * @param {ResultGroup|Array.<ResultGroup|RollResults|string|number>} [notation.rolls] If
   * `notation` is an object; the rolls to import
   *
   * @throws {NotationError} notation is invalid
   * @throws {RequiredArgumentError} notation is required
   * @throws {TypeError} Rolls must be a valid result object, or an array
   */
  constructor(notation: DiceRollImport) {
    if (!notation) {
      throw new RequiredArgumentError('notation');
    }

    // initialise the parsed dice array
    this.#expressions = [];

    if ((typeof notation === 'object') && !Array.isArray(notation)) {
      // validate object
      // @todo see if we can assert that the notation is valid
      if (!notation.notation) {
        // object doesn't contain a notation property
        throw new RequiredArgumentError('notation');
      } else if (typeof notation.notation !== 'string') {
        throw new NotationError(notation.notation);
      } else if (notation.rolls) {
        // we have rolls - store them
        this.#setRolls(notation.rolls as RollsImport|RollResultJsonOutput);
      }

      // store the notation
      this.#notation = notation.notation;

      // parse the notation
      this.#expressions = Parser.parse(this.notation);

      if (!this.hasRolls()) {
        // no rolls - roll the dice
        this.roll();
      }
    } else if (typeof notation === 'string') {
      // @todo see if we can assert that the notation is valid
      // store the notation
      this.#notation = notation;

      // parse the notation
      this.#expressions = Parser.parse(this.notation);

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
  get averageTotal(): number {
    return (this.maxTotal + this.minTotal) / 2;
  }

  /**
   * The maximum possible total for the notation.
   *
   * @since 4.3.0
   *
   * @returns {number}
   */
  get maxTotal(): number {
    if (!this.hasExpressions()) {
      return 0;
    }

    // only calculate the total if it has not already been done
    if (!this.#maxTotal) {
      // roll the dice, forcing values to their maximum
      const rolls = this.#rollExpressions(engines.Max);

      // calculate the total
      this.#maxTotal = calculateTotal(rolls);
    }

    // return the total
    return this.#maxTotal;
  }

  /**
   * The minimum possible total for the notation.
   *
   * @since 4.3.0
   *
   * @returns {number}
   */
  get minTotal(): number {
    if (!this.hasExpressions()) {
      return 0;
    }

    // only calculate the total if it has not already been done
    if (!this.#minTotal) {
      // roll the dice, forcing values to their minimum
      const rolls = this.#rollExpressions(engines.Min);

      // calculate the total
      this.#minTotal = calculateTotal(rolls);
    }

    // return the total
    return this.#minTotal;
  }

  /**
   * The dice notation.
   *
   * @returns {string}
   */
  get notation(): string {
    return this.#notation;
  }

  /**
   * String representation of the rolls
   *
   * @example
   * 2d20+1d6: [20,2]+[2] = 24
   *
   * @returns {string}
   */
  get output(): string {
    return this.toString();
  }

  /**
   * The dice rolled for the notation
   *
   * @returns {Array.<ResultGroup|RollResults|string|number>}
   */
  get rolls(): RollResultType[] {
    return this.#rolls ? this.#rolls.results : [];
  }

  /**
   * The roll total
   *
   * @returns {number}
   */
  get total(): number {
    // only calculate the total if it has not already been done
    if (!this.#total && this.hasRolls()) {
      this.#total = calculateTotal(this.#rolls);
    }

    // return the total
    return this.#total ?? 0;
  }

  /**
   * Export the object in the given format.
   * If no format is specified, JSON is returned.
   *
   * @see {@link DiceRoll#toJSON}
   *
   * @param {ExportFormat} [format=exportFormats.JSON] The format to export the data as
   *
   * @returns {string|null} The exported data, in the specified format
   *
   * @throws {TypeError} Invalid export format
   */
  export(format: ExportFormat = ExportFormat.Json): string|DiceRollJsonOutput {
    switch (format) {
      case ExportFormat.Base64:
        // JSON encode then base64, else it exports the string representation of the roll output
        return btoa(this.export(ExportFormat.Json) as string);
      case ExportFormat.Json:
        return JSON.stringify(this);
      case ExportFormat.Object:
        return JSON.parse(this.export(ExportFormat.Json) as string) as DiceRollJsonOutput;
      default:
        throw new TypeError(`Invalid export format "${format}"`);
    }
  }

  /**
   * Check whether the DiceRoll has expressions or not.
   *
   * @returns {boolean} `true` if the object has expressions, `false` otherwise
   */
  hasExpressions(): boolean {
    return this.#expressions.length > 0;
  }

  /**
   * Check whether the object has rolled dice or not
   *
   * @returns {boolean} `true` if the object has rolls, `false` otherwise
   */
  hasRolls(): boolean {
    return this.hasExpressions() && (this.rolls.length > 0);
  }

  /**
   * Roll the dice for the stored notation.
   *
   * This is called in the constructor, so you'll only need this if you want to re-roll the
   * notation. However, it's usually better to create a new `DiceRoll` instance instead.
   *
   * @returns {RollResults[]} The results of the rolls
   */
  roll(): RollResultType[] {
    // reset the cached total
    this.#total = 0;

    // save the rolls to the log
    this.#rolls = this.#rollExpressions();

    // return the rolls;
    return this.rolls;
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
  toJSON(): DiceRollJsonOutput {
    const {
      averageTotal,
      maxTotal,
      minTotal,
      notation,
      rolls,
      total,
    } = this;

    return {
      averageTotal,
      maxTotal,
      minTotal,
      name: this.name,
      notation,
      output: this.toString(),
      rolls: rolls.map((result) => (
        typeof result === 'object'
          ? result.toJSON() :
          result
      ) as RollResultJsonOutput),
      total,
      type: ModelType.DiceRoll,
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
  toString(): string {
    let output = `${this.notation}: `;

    if (this.hasRolls()) {
      output += `${this.#rolls} = ${this.total}`;
    } else {
      output += 'No dice rolled';
    }

    return output;
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
   *   rolls: ..., // ResultGroup object or array of roll results
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
  static import(data: DiceRollImport): DiceRoll {
    if (!data) {
      throw new RequiredArgumentError('data');
    }

    if (isJson(data as string)) {
      // data is JSON format - parse and import
      return DiceRoll.import(JSON.parse(data as string) as DiceRollJsonOutput);
    }

    if (isBase64(data as string)) {
      // data is base64 encoded - decode and import
      return DiceRoll.import(atob(data as string));
    }

    if (typeof data === 'object') {
      // if data is a `DiceRoll` return it, otherwise build it
      return new DiceRoll(data);
    }

    throw new DataFormatError(data);
  }

  /**
   * Roll the dice and return the result.
   *
   * If the engine is passed, it will be used for the number generation for **this roll only**.
   * The engine will be reset after use.
   *
   * @private
   *
   * @param {{next(): number}} [engine] The RNG engine to use for die rolls
   *
   * @returns {ResultGroup} The result of the rolls
   *
   * @throws {TypeError} engine must have function `next()`
   */
  #rollExpressions(engine?: Engine): ExpressionResult {
    let oEngine: Engine|undefined;
    if (engine) {
      // use the selected engine
      oEngine = generator.engine;
      generator.engine = engine;
    }

    // roll the dice
    const results = new ResultGroup(
      this
        .#expressions
        .map((expression) => {
          if ((expression instanceof StandardDice) || (expression instanceof RollGroup)) {
            // roll the object and return the value
            return expression.roll();
          }

          return expression as string|number;
        })
        // filter out empty values (e.g. whitespace)
        .filter((value) => !!value || (value === 0))
    );

    if (engine && oEngine) {
      // reset the engine
      generator.engine = oEngine;
    }

    return results;
  }

  /**
   * Set the rolls.
   *
   * @private
   *
   * @param {ResultGroup|Array.<ResultGroup|RollResults|string|number|{}|Array.<RollResultType|number>>} rolls
   *
   * @throws {TypeError} Rolls must be a valid result object, or an array
   */
  #setRolls(rolls: RollsImport|RollResultJsonOutput): void {
    if (rolls instanceof ResultGroup) {
      this.#rolls = rolls;
    } else if (rolls instanceof RollResults) {
      this.#rolls = new ResultGroup([rolls]);
    } else if (Array.isArray(rolls)) {
      this.#rolls = new ResultGroup(rolls.map((roll) => {
        if ((roll instanceof ResultGroup) || (roll instanceof RollResults)) {
          // already a RollResults object
          return roll;
        }

        // @todo should this be a ResultGroup, or a RollResults?
        if (Array.isArray(roll)) {
          // array of values
          return new RollResults(roll as SingleResult[]);
        }

        if (typeof roll === 'object') {
          // a result group
          if (('results' in roll) && Array.isArray(roll.results)) {
            return new ResultGroup(
              roll.results,
              (roll as Partial<ExpressionResult>).modifiers ?? [],
              (roll as Partial<ExpressionResult>).isRollGroup ?? false,
              (roll as Partial<ExpressionResult>).useInTotal ?? true,
            );
          }

          // roll results
          if (('rolls' in roll) && Array.isArray(roll.rolls)) {
            return new RollResults(roll.rolls);
          }
        }

        return roll as ExpressionResult;
      }));
    } else {
      throw new TypeError('Rolls must be a valid result object, or an array');
    }
  }
}

export default DiceRoll;
