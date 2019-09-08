import {diceUtils, exportFormats} from "./utilities/utils.js";
import * as Modifiers from './Modifiers.js';
import Parser from "./parser/Parser.js";
import RollGroup from './RollGroup.js';
import StandardDice from './dice/StandardDice.js';
import math from "mathjs-expression-parser";
import RollResults from "./results/RollResults";
import RollResult from "./results/RollResult";

const DiceRoll = (() => {
  /**
   * The notation
   *
   * @type {symbol}
   *
   * @private
   */
  const _notation = Symbol('notation');

  /**
   * List of dice definition objects
   *
   * @type {symbol}
   *
   * @private
   */
  const _parsedNotation = Symbol('parsed-notation');

  /**
   * List of rolls
   *
   * @type {symbol}
   *
   * @private
   */
  const _rolls = Symbol('rolls');


  // @todo determine which of these are still needed during refactoring
  const _calculateTotal = Symbol('calculateTotals');

  const _resetTotals = Symbol('resetTotals');

  /**
   * The roll total
   *
   * @type {symbol}
   *
   * @private
   */
  const _total = Symbol('totals');


  class DiceRoll{
    /**
     * Parses the notation and rolls the dice
     *
     * @param notation
     */
    constructor(notation){
      if (!notation) {
        throw new Error('Notation is required');
      }

      // zero the current total
      this[_resetTotals]();

      // initialise the parsed dice array
      this[_parsedNotation] = [];

      if ((notation instanceof Object) && !Array.isArray(notation)) {
        // validate object
        // @todo see if we can assert that the notation is valid
        if(!notation.notation) {
          // object doesn't contain a notation property
          throw new Error('Notation is required');
        } else if (typeof notation.notation !== 'string') {
          throw new Error(`Notation is not valid: ${notation.notation}`);
        } else if (notation.rolls) {
          // we have rolls - validate them
          if (!Array.isArray(notation.rolls)) {
            // rolls is not an array
            throw new Error(`Rolls must be an Array: ${notation.rolls}`);
          } else {
            // if roll is a RollResults, return it, otherwise try to convert to a RollResults object
            this[_rolls] = notation.rolls.map(roll => {
              if (roll instanceof RollResults) {
                // already a RollResults object
                return roll;
              } else if (Array.isArray(roll)) {
                // array of values
                return new RollResults(roll);
              } else if ((roll instanceof Object) && Array.isArray(roll.rolls)) {
                // object with list of rolls
                return new RollResults(roll.rolls);
              }
            });
          }
        }

        // store the notation
        this[_notation] = notation.notation;

        // parse the notation
        this[_parsedNotation] = Parser.parse(this.notation);

        if (!this[_rolls] || !this[_rolls].length) {
          // ensure rolls is an empty array
          this[_rolls] = [];

          // roll the dice
          this.roll();
        }
      } else if (typeof notation === 'string') {
        // @todo see if we can assert that the notation is valid
        // store the notation
        this[_notation] = notation;
        // empty the current rolls
        this[_rolls] = [];

        // parse the notation
        this[_parsedNotation] = Parser.parse(this.notation);

        // roll the dice
        this.roll();
      } else {
        throw new Error(`Notation is not valid: ${notation}`);
      }
    }


    /*************************
     * Static Methods
     *************************/

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
    static import(data){
      if(!data){
        throw new Error('No data to import');
      }else if(diceUtils.isJson(data)){
        // data is JSON format - parse and import
        return DiceRoll.import(JSON.parse(data));
      }else if(diceUtils.isBase64(data)) {
        // data is base64 encoded - decode and import
        return DiceRoll.import(atob(data));
      }else if(typeof data === 'object'){
        // if data is a `DiceRoll` return it, otherwise build it
        return (data instanceof DiceRoll) ? data : new DiceRoll(data);
      }else{
        throw new Error(`Unrecognised import format for data: ${data}`);
      }
    }


    /*************************
     * Public Properties
     *************************/

    /**
     * The dice notation
     *
     * @returns {string}
     */
    get notation(){
      return this[_notation] || '';
    }

    /**
     * The dice rolled for the notation
     *
     * @returns {RollResults[]}
     */
    get rolls(){
      return this[_rolls] || [];
    }


    /*************************
     * Public methods
     *************************/

    /**
     * Exports the DiceRoll in the given format.
     * If no format is specified, JSON is returned.
     *
     * @throws Error
     * @param {exportFormats=} format The format to export the data as (ie. JSON, base64)
     * @returns {string|null}
     */
    export(format = exportFormats.JSON){
      switch(format){
        case exportFormats.BASE_64:
          // JSON encode, then base64, otherwise it exports the string representation of the roll output
          return btoa(this.export(exportFormats.JSON));
        case exportFormats.JSON:
          return JSON.stringify(this);
        case exportFormats.OBJECT:
          return JSON.parse(this.export(exportFormats.JSON));
        default:
          throw new Error(`Unrecognised export format: ${format}`);
      }
    }

    /**
     * Returns whether the object has rolled dice or not
     *
     * @returns {boolean}
     */
    hasRolls(){
      return !!(this[_parsedNotation] && Array.isArray(this.rolls) && this.rolls.length);
    }

    /**
     * Rolls the dice for the existing notation.
     * This is useful if you want to re-roll the dice,
     * for some reason, but it's usually better to
     * create a new DiceRoll instance instead.
     *
     * @returns {Array}
     */
    roll(){
      // clear the roll log
      this[_rolls] = [];

      // reset the cached total
      this[_resetTotals]();

      // saved the rolls to the log
      this[_rolls] = this[_parsedNotation].map(item => {
        if ((item instanceof StandardDice) || (item instanceof RollGroup)) {
          // roll the object and return the value
          return item.roll();
        }
      }).filter(Boolean);

      // return the rolls;
      return this[_rolls];
    }

    /**
     * Returns an object for JSON serialising
     *
     * @returns {{}}
     */
    toJSON(){
      const {notation, rolls,} = this;

      return {
        notation,
        rolls,
        type: 'dice-roll',
      };
    }

    /**
     * Returns the String representation
     * of the object as the roll notation
     *
     * @returns {string}
     */
    toString(){
      return this.output;
    }


    /*************************
     * INCOMPLETE / NEEDS REFACTORING
     *************************/

    /**
     * Calculates the total roll value and returns it
     *
     * @returns {Number}
     */
    [_calculateTotal](){
      let rollIndex = 0;

      // reset the totals and successes
      this[_resetTotals]();

      /**
       * Recursively loops through the dice and builds
       * a formula string using the roll values instead
       * of the notation
       *
       * @param parsedItem
       */
      const buildFormulas = parsedItem => {
        let formula = '';

        // loop through each roll and calculate the totals
        parsedItem.forEach(item => {
          if (Array.isArray(item)) {
            // this is a parenthesis group - loop recursively
            formula += buildFormulas(item);
          } else if (item instanceof StandardDice) {
            // @todo should roll results be stored on their relevant parsed object?
            // item is a die - get the rolls for it
            let results = this.rolls[rollIndex] || [];

            // @todo success/failure modifier should be handled within the RollResult(s) object
            const successModifier = item.modifiers['TargetModifier'] || null;
            if (successModifier) {
              // pool dice are success/failure so we don't want the actual dice roll
              // we need to convert each roll to 1 (success), -1 (failure), or 0 (neither)
              formula += diceUtils.sumArray(results.rolls.map(value => successModifier.getStateValue(value)));
            } else {
              formula += results.value;
            }

            // increment the roll index and store the previous rolls / parsed die
            rollIndex++;
          } else {
            formula += item;
          }
        });

        return formula;
      };

      // calculate the total recursively (looping through parenthesis groups)
      let formula = this.hasRolls() ? buildFormulas(this[_parsedNotation]) : null;

      // if a total formula has been produced, evaluate it and round it to max 2 decimal places
      if (formula) {
        this[_total] = diceUtils.toFixed(math.eval(formula), 2);
      }

      return this[_total];
    }

    /**
     * Resets the current total and success count
     *
     * @private
     */
    [_resetTotals](){
      this[_total] = 0;
    }

    /**
     * Returns the roll notation and rolls in the format of:
     * 2d20+1d6: [20,2]+[2] = 24
     *
     * @returns {string}
     */
    get output(){
      let rollIndex = 0;
      let output  = `${this.notation}: `;

      if(this.hasRolls()){
        output += this[_parsedNotation]
          .map(item => {
            if (item instanceof StandardDice) {
              const rollResults = this.rolls[rollIndex] || null;

              // @todo handle modifier flags on output
              /*let rollOutput = '';

              let explode = false;
              let penetrate = false;
              let comparePoint = null;
              let compound = false;
              item.modifiers.forEach(modifier => {
                if (modifier instanceof Modifiers.ComparisonModifier) {
                  comparePoint = modifier;
                }

                if (modifier instanceof Modifiers.ExplodeModifier) {
                  explode = true;
                  compound = modifier.compound;
                  penetrate = modifier.penetrate;
                }
              });

              // current roll total - used for totalling compounding rolls
              let currentRoll = 0;

              // output the rolls
              rolls.forEach((roll, rIndex, array) => {
                // get the roll value to compare to (If penetrating and not the first roll, add 1, to compensate for the penetration)
                const rollVal = (penetrate && currentRoll) ? roll + 1 : roll,
                  hasMatchedCP = comparePoint && comparePoint.isComparePoint(rollVal);

                let delimit = rIndex !== array.length - 1;

                if (explode && hasMatchedCP) {
                  // this die roll exploded (Either matched the explode value or is greater than the max - exploded and compounded)

                  // add the current roll to the roll total
                  currentRoll += roll;

                  if (compound) {
                    // Compounding - do NOT add the delimiter after this roll as we're not outputting it
                    delimit = false;
                  } else {
                    // exploding but not compounding
                    rollOutput += `${roll}!${(penetrate ? 'p' : '')}`;
                  }
                } else if (hasMatchedCP) {
                  // not exploding but we've matched a compare point - this is a pool dice (success or failure)
                  rollOutput += `${roll}*`;
                } else if (compound && currentRoll) {
                  // last roll in a compounding set (This one didn't compound)
                  rollOutput += `${roll + currentRoll}!!${penetrate ? 'p' : ''}`;

                  // reset current roll total
                  currentRoll = 0;
                } else {
                  // just a normal roll
                  rollOutput += roll;

                  // reset current roll total
                  currentRoll = 0;
                }

                if (delimit) {
                  rollOutput += ',';
                }
              });*/

              // increment the roll index
              rollIndex++;

              return rollResults;
            } else if (item instanceof RollGroup) {
              // @todo handle roll groups
            }

            return item;
          })
          // remove any empty values
          .filter(Boolean)
          // join into a single string
          .join('');

        // add the total
        // @todo calculate total
        output += ` = ${this.total}`;
      }else{
        output += 'No dice rolled';
      }

      return output;
    }

    /**
     * Returns the roll total
     *
     * @returns {number}
     */
    get total(){
      // only calculate the total if it has not already been done
      if(!this[_total] && this.hasRolls()){
        this[_calculateTotal]();
      }

      // return the total
      return this[_total] || 0;
    }
  }

  return DiceRoll;
})();

export default DiceRoll;
