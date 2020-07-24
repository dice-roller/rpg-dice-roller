import math from 'mathjs-expression-parser';
import { diceUtils, exportFormats } from './utilities/utils';
import { engines, generator } from './utilities/NumberGenerator';
import DataFormatError from './exceptions/DataFormatError';
import NotationError from './exceptions/NotationError';
import Parser from './parser/Parser';
import RequiredArgumentError from './exceptions/RequiredArgumentErrorError';
import RollGroup from './RollGroup';
import RollResults from './results/RollResults';
import StandardDice from './dice/StandardDice';

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

class DiceRoll {
  /**
   * Parses the notation and rolls the dice
   *
   * @param notation
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
          throw new TypeError(`Rolls must be an Array: ${notation.rolls}`);
        } else {
          // if roll is a RollResults, return it, otherwise try to convert to a RollResults object
          this[rollsSymbol] = notation.rolls
            .map((roll) => {
              if (roll instanceof RollResults) {
                // already a RollResults object
                return roll;
              } if (Array.isArray(roll)) {
                // array of values
                return new RollResults(roll);
              } if ((roll instanceof Object) && Array.isArray(roll.rolls)) {
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

  /** ***********************
   * Static Methods
   ************************ */

  /**
   * Imports the given dice roll data and builds an object from it.
   *
   * Throws Error on failure
   *
   * @param {{}|string|DiceRoll} data The data to import
   *
   * @throws Error
   *
   * @returns {DiceRoll}
   */
  static import(data) {
    if (!data) {
      throw new RequiredArgumentError('data');
    } else if (diceUtils.isJson(data)) {
      // data is JSON format - parse and import
      return DiceRoll.import(JSON.parse(data));
    } else if (diceUtils.isBase64(data)) {
      // data is base64 encoded - decode and import
      return DiceRoll.import(atob(data));
    } else if (typeof data === 'object') {
      // if data is a `DiceRoll` return it, otherwise build it
      return (data instanceof DiceRoll) ? data : new DiceRoll(data);
    } else {
      throw new DataFormatError(data);
    }
  }

  /** ***********************
   * Public Properties
   ************************ */

  /**
   * Returns the average possible total for the notation
   *
   * @returns {number}
   */
  get averageTotal() {
    return (this.maxTotal + this.minTotal) / 2;
  }

  /**
   * Returns the maximum possible total for the notation
   *
   * @returns {number}
   */
  get maxTotal() {
    // only calculate the total if it has not already been done
    if (!this[maxTotalSymbol] && this[parsedNotationSymbol]) {
      // roll the dice, forcing values to their maximum
      const rolls = this[rollMethodSymbol](engines.max);

      // calculate the total
      this[maxTotalSymbol] = this[calculateTotalSymbol](rolls);
    }

    // return the total
    return this[maxTotalSymbol] || 0;
  }

  /**
   * Returns the minimum possible total for the notation
   *
   * @returns {number}
   */
  get minTotal() {
    // only calculate the total if it has not already been done
    if (!this[minTotalSymbol] && this[parsedNotationSymbol]) {
      // roll the dice, forcing values to their minimum
      const rolls = this[rollMethodSymbol](engines.min);

      // calculate the total
      this[minTotalSymbol] = this[calculateTotalSymbol](rolls);
    }

    // return the total
    return this[minTotalSymbol] || 0;
  }

  /**
   * The dice notation
   *
   * @returns {string}
   */
  get notation() {
    return this[notationSymbol] || '';
  }

  /**
   * Returns the roll notation and rolls in the format of:
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
   * Returns the roll total
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

  /** ***********************
   * Public methods
   ************************ */

  /**
   * Exports the DiceRoll in the given format.
   * If no format is specified, JSON is returned.
   *
   * @throws Error
   * @param {exportFormats=} format The format to export the data as (ie. JSON, base64)
   * @returns {string|null}
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
   * Returns whether the object has rolled dice or not
   *
   * @returns {boolean}
   */
  hasRolls() {
    return !!(this[parsedNotationSymbol] && Array.isArray(this.rolls) && this.rolls.length);
  }

  /**
   * Rolls the dice for the existing notation.
   * This is useful if you want to re-roll the dice,
   * for some reason, but it's usually better to
   * create a new DiceRoll instance instead.
   *
   * @returns {Array}
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
   * Returns an object for JSON serialising
   *
   * @returns {{}}
   */
  toJSON() {
    const {
      maxTotal, minTotal, notation, output, rolls, total,
    } = this;

    return {
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
   * Returns the String representation
   * of the object as the roll notation
   *
   * @returns {string}
   */
  toString() {
    return this.output;
  }

  /** ***********************
   * Private Methods
   ************************ */

  /**
   * Calculates the total roll value and returns it
   *
   * @returns {Number}
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
    return formula ? diceUtils.toFixed(math.eval(formula), 2) : 0;
  }

  /**
   * Rolls the dice and returns the result.
   * If the engine is passed, it will be used for the
   * number generation. The engine will be reset after use.
   *
   * @param {Engine|{}=} engine
   *
   * @returns {*}
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
