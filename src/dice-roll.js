import {diceUtils, exportFormats} from './utils.js';
import XRegExp from 'xregexp';
var Parser = require('expr-eval').Parser;

/**
 * A DiceRoll object, which takes a notation
 * and parses it in to rolls
 *
 * @type {DiceRoll}
 */
const DiceRoll = (() => {
  const _calculateTotal = Symbol('calculateTotals');

  /**
   * The dice notation
   *
   * @type {symbol}
   */
  const _notation = Symbol('notation');

  /**
   * The parsed notation array
   *
   * @type {symbol}
   */
  const _parsedDice = Symbol('parsedDice');

  const _resetTotals = Symbol('resetTotals');

  const _rolls = Symbol('rolls');

  /**
   * The count of success rolls
   *
   * @type {symbol}
   */
  const _successes = Symbol('successes');

  /**
   * The roll total
   *
   * @type {symbol}
   */
  const _total = Symbol('totals');


  /**
   * List of callbacks used for rolling dice types
   *
   * @type {{default(*=): *, fudge(number): number}}
   */
  const diceRollMethods = {
    /**
     * Rolls a standard die
     *
     * @param sides
     * @returns {*}
     */
    default(sides){
      return diceUtils.generateNumber(1, sides);
    },
    /**
     * Rolls a fudge die
     *
     * @param {number} numNonBlanks
     * @returns {number}
     */
    fudge(numNonBlanks){
      let total = 0;

      if(numNonBlanks === 2){
        // default fudge (2 of each non-blank) = 1d3 - 2
        total = diceUtils.generateNumber(1, 3) - 2;
      }else if(numNonBlanks === 1){
        // only 1 of each non-blank
        // on 1d6 a roll of 1 = -1, 6 = +1, others = 0
        const num = diceUtils.generateNumber(1, 6);
        if(num === 1){
          total = -1;
        }else if(num === 6){
          total = 1;
        }
      }

      return total;
    }
  };

  /**
   * Checks whether value matches the given compare point
   *
   * @param {object} comparePoint
   * @param {number} value
   * @returns {boolean}
   */
  const isComparePoint = (comparePoint, value) => {
    return comparePoint ? diceUtils.compareNumbers(value, comparePoint.value, comparePoint.operator) : false;
  };

  /**
   * Checks whether the value matches the given compare point
   * and returns the corresponding success / failure state value
   * success = 1, fail = 0
   *
   * @param {number} value
   * @param {object} comparePoint
   * @returns {number}
   */
  const getSuccessStateValue = (value, comparePoint) => {
    return isComparePoint(comparePoint, value) ? 1 : 0;
  };

  const parseDie = (notation) => {
    const parsed = [];

    // parse the notation and find each valid dice (and any attributes)
    const pattern = DiceRoll.notationPatterns.get('notation', 'g');

    let match;
    while((match = pattern.exec(notation)) !== null){
      const die = {
        qty: match[2] ? parseInt(match[2], 10) : 1,                    // number of times to roll the die
        sides: diceUtils.isNumeric(match[3]) ? parseInt(match[3], 10) : match[3],  // how many sides the die has - only parse numerical values to Int
        fudge: false,                                                    // if fudge die this is set to the fudge notation match
        explode: !!match[5],                                               // flag - whether to explode the dice rolls or not
        penetrate: (match[5] === '!p') || (match[5] === '!!p'),              // flag - whether to penetrate the dice rolls or not
        compound: (match[5] === '!!') || (match[5] === '!!p'),              // flag - whether to compound exploding dice or not
        comparePoint: false,                                                    // the compare point for exploding/penetrating dice
        /**
         * flag - whether it's a pool die or not
         * @returns {boolean}
         */
        get pool(){
          // check if this is a pool die (If we have a compare point, but aren't exploding)
          return !!(!this.explode && this.comparePoint);
        },
      };

      // check if it's a fudge die
      if(typeof die.sides === 'string'){
        die.fudge = die.sides.match(DiceRoll.notationPatterns.get('fudge', null, true)) || false;
      }

      // check if we have a compare point
      if(match[6]){
        die.comparePoint = {
          operator: match[6],
          value: parseInt(match[7], 10)
        };
      }else if(die.explode){
        // we are exploding the dice so we need a compare point, but none has been defined
        die.comparePoint = {
          operator: '=',
          value: die.fudge ? 1 : ((die.sides === '%') ? 100 : die.sides)
        };
      }

      parsed.push(die);
    }

    return parsed;
  };

  /**
   * Rolls a single die for its quantity
   * and returns an array of the results
   *
   * @param {object} die
   * @returns {Array}
   */
  const rollDie = die => {
    const dieRolls = []; // list of roll results for the die

    let sides = die.sides,                  // number of sides the die has - convert percentile to 100 sides
      callback = diceRollMethods.default; // callback method for rolling the die

    // ensure that the roll quantity is valid
    die.qty = (die.qty > 0) ? die.qty : 1;

    // check for non-numerical dice formats
    if(die.fudge){
      // we have a fudge dice - define the callback to return the `fudge` roll method
      callback = diceRollMethods.fudge;
      // set the `sides` to the correct value for the fudge type
      sides = diceUtils.isNumeric(die.fudge[1]) ? parseInt(die.fudge[1], 10) : 2;
    }else if(typeof die.sides === 'string'){
      if(die.sides === '%'){
        // convert percentile to 100 sided die
        sides = 100;
      }
    }


    // only continue if the number of sides is valid
    if(sides){
      // loop through and roll for the quantity
      for(let i = 0; i < die.qty; i++){
        const reRolls = []; // the rolls for the current die (only multiple rolls if exploding)

        let rollCount = 0,  // count of rolls for this die roll (Only > 1 if exploding)
          roll,           // the total rolled
          index;          // re-roll index

        // roll the die once, then check if it exploded and keep rolling until it stops
        do{
          // the reRolls index to use
          index = reRolls.length;

          // get the total rolled on this die
          roll = callback.call(die, sides);

          // add the roll to our list
          reRolls[index] = (reRolls[index] || 0) + roll;

          // subtract 1 from penetrated rolls (only consecutive rolls, after initial roll are subtracted)
          if(die.penetrate && (rollCount > 0)){
            reRolls[index]--;
          }

          rollCount++;
        }while(die.explode && isComparePoint(die.comparePoint, roll));

        // add the rolls
        dieRolls.push(...reRolls);
      }
    }

    return dieRolls;
  };


  /**
   * A DiceRoll object, which takes a notation
   * and parses it in to rolls
   *
   * @param {string|Object} notation  The dice notation or object
   */
  class DiceRoll{
    /**
     * Parses the notation and rolls the dice
     *
     * @param notation
     */
    constructor(notation){
      if(!notation){
        throw new Error('DiceRoll: No notation specified');
      }

      // zero the current total
      this[_resetTotals]();

      // initialise the parsed dice array
      this[_parsedDice] = [];

      if(notation instanceof Object){
        // validate object
        if(!notation.notation){
          // object doesn't contain a notation property
          throw new Error('DiceRoll: Object has no notation: ' + notation);
        }else if(notation.rolls){
          // we have rolls - validate them
          if(!Array.isArray(notation.rolls)){
            // rolls is not an array
            throw new Error('DiceRoll: Rolls must be an Array: ' + notation.rolls);
          }else{
            // loop through each rolls, make sure they're valid
            notation.rolls.forEach((roll, i) => {
              if(!Array.isArray(roll) || roll.some(isNaN)){
                // not all rolls are valid
                throw new Error('DiceRoll: Rolls are invalid at index [' + i + ']: ' + roll);
              }
            });
          }
        }

        // store the notation
        this[_notation] = notation.notation;
        // store the rolls
        this[_rolls] = notation.rolls || [];

        // parse the notation
        this[_parsedDice] = DiceRoll.parseNotation(this.notation);
      }else if(typeof notation === 'string'){
        // store the notation
        this[_notation] = notation.replace(/\s+/g,'');
        // empty the current rolls
        this[_rolls] = [];

        // parse the notation
        this[_parsedDice] = DiceRoll.parseNotation(this.notation);

        // roll the dice
        this.roll();
      }else{
        throw new Error('DiceRoll: Notation is not valid');
      }
    }


    /** Private methods **/

    /**
     * @returns {Number}
     */
    [_calculateTotal](){
      let rollIndex = 0,
        prevRolls;

      // reset the totals and successes
      this[_resetTotals]();

      /**
       * Recursively loops through the dice and builds
       * a formula string using the roll values instead
       * of the notation
       *
       * @param parsedDiceI
       */
      const buildFormulas = parsedDiceI => {
        const formulas = {
          total: '',
          successes: '',
        };

        // loop through each roll and calculate the totals
        parsedDiceI.forEach(item => {
          if(Array.isArray(item)){
            // this is a parenthesis group - loop recursively
            const segmentFormulas = buildFormulas(item),
              successFormula = diceUtils.trimOperator(segmentFormulas.successes);

            formulas.total += segmentFormulas.total ? `(${segmentFormulas.total})`: '';
            formulas.successes += successFormula ? `(${successFormula})` : '';
          }else if(typeof item === 'object'){
            // item is a die
            let rolls = this.rolls[rollIndex] || [],
              rollValues = [],
              dieTotal;

            if(item.pool){
              // pool dice are success/failure so we don't want the actual dice roll
              // we need to convert each roll to 1 (success) or 0 (failure)
              rollValues = rolls.map(value => getSuccessStateValue(value, item.comparePoint));
            } else {
              rollValues = rolls;
            }

            // add all the rolls together to get the total
            dieTotal = diceUtils.sumArray(rollValues);

            // if this is a pool dice, add it's successes to the success count
            if(item.pool) {
              formulas.successes += dieTotal;
            }

            // add the total to the list
            formulas.total += dieTotal;

            // increment the roll index and store the previous rolls / parsed die
            rollIndex++;
            prevRolls = {
              parsedDice: item,
              rolls: rolls,
            };
          }else{
            let prevRollsValues = [],
              value = item,
              isPool = false,
              isPoolModifier = false;

            // determine the previous roll details for handling things like H/L modifiers
            if(prevRolls){
              isPool = prevRolls.parsedDice && prevRolls.parsedDice.pool;

              if(prevRolls.rolls){
                prevRollsValues = (prevRolls.parsedDice && prevRolls.parsedDice.compound) ? [diceUtils.sumArray(prevRolls.rolls)] : prevRolls.rolls;
              }
            }

            if(item === 'H'){
              // 'H' is equivalent to the highest roll
              value = Math.max(...prevRollsValues);

              // flag that this value needs to be modified to a success/failure value
              isPoolModifier = true;
            }else if(value === 'L'){
              // 'L' is equivalent to the lowest roll
              value = Math.min(...prevRollsValues);

              // flag that this value needs to be modified to a success/failure value
              isPoolModifier = true;
            }else if(isPool && DiceRoll.notationPatterns.get('arithmeticOperator', '', true).test(value)){
              // value is an operator - store it for reference
              formulas.successes += value;
            }

            if(isPool && (isPoolModifier || diceUtils.isNumeric(value))){
              if(isPoolModifier){
                // pool dice are either success or failure, so value is converted to 1 or 0
                value = getSuccessStateValue(value, prevRolls.parsedDice.comparePoint);
              }

              // add the pool dice modifier
              formulas.successes += value;
            }

            // add the value to the list
            formulas.total += value;
          }
        });

        // ensure successes string doesn't end in an operator (ie. `3+5*`)
        formulas.successes = diceUtils.trimOperator(formulas.successes);

        return formulas;
      };

      // calculate the total recursively (looping through parenthesis groups)
      let formulas = buildFormulas(this[_parsedDice]);

      var parser = new Parser();

      // if a total formula has been produced, evaluate it and round it to max 2 decimal places
      if(formulas.total){
        const expr = parser.parse(formulas.total);
        this[_total] = diceUtils.toFixed(expr.evaluate({}), 2);
      }
      // if a success formula has been produced, evaluate it and round tit to a max 2 decimal places
      if(formulas.successes){
        const expr = parser.parse(formulas.successes);
        this[_successes] = diceUtils.toFixed(expr.evaluate({}), 2);
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
      this[_successes] = 0;
    }


    /** Public methods **/

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

      /**
       * Recursively loops through the parsed dice groups and rolls the dice,
       * flattening the results so they're no longer grouped
       *
       * @param group
       * @returns {Array[]|any[]}
       */
      const rollGroups = group => {
        if(Array.isArray(group)){
          // recursively loop through each parenthesis group and roll them
          // flatten the result so rolls aren't grouped - we only care about numerical position
          return group.flatMap(elm => {
            return rollGroups(elm);
          }).filter(Boolean);
        }else if(typeof group === 'object'){
          // roll the dice and return it
          return [rollDie(group)];
        }
      };

      // saved the rolls to the log
      this[_rolls] = rollGroups(this[_parsedDice]);

      // return the rolls;
      return this[_rolls];
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

      if(this[_parsedDice] && Array.isArray(this.rolls) && this.rolls.length){
        // recursively loop through and build the string for dice rolled
        const outputRecursive = (parsedDiceI) => {
          return parsedDiceI.map(item => {
            if(Array.isArray(item)){
              // this is a parenthesis group - loop recursively
              return `(${outputRecursive(item)})`;
            }else if(typeof item === 'object'){
              const rolls = this.rolls[rollIndex] || [],
                hasComparePoint = item.comparePoint;
              let rollOutput = '';

              // current roll total - used for totalling compounding rolls
              let currentRoll = 0;

              rollOutput += '[';

              // output the rolls
              rolls.forEach((roll, rIndex, array) => {
                // get the roll value to compare to (If penetrating and not the first roll, add 1, to compensate for the penetration)
                const rollVal = (item.penetrate && currentRoll) ? roll + 1 : roll,
                  hasMatchedCP = hasComparePoint && isComparePoint(item.comparePoint, rollVal);

                let delimit = rIndex !== array.length-1;

                if(item.explode && hasMatchedCP){
                  // this die roll exploded (Either matched the explode value or is greater than the max - exploded and compounded)

                  // add the current roll to the roll total
                  currentRoll += roll;

                  if(item.compound){
                    // Compounding - do NOT add the delimiter after this roll as we're not outputting it
                    delimit = false;
                  }else{
                    // exploding but not compounding
                    rollOutput += `${roll}!${(item.penetrate ? 'p' : '')}`;
                  }
                }else if(hasMatchedCP){
                  // not exploding but we've matched a compare point - this is a pool dice (success or failure)
                  rollOutput += `${roll}*`;
                }else if(item.compound && currentRoll) {
                  // last roll in a compounding set (This one didn't compound)
                  rollOutput += `${roll + currentRoll}!!${item.penetrate ? 'p' : ''}`;

                  // reset current roll total
                  currentRoll = 0;
                }else{
                  // just a normal roll
                  rollOutput += roll;

                  // reset current roll total
                  currentRoll = 0;
                }

                if(delimit){
                  rollOutput += ',';
                }
              });

              rollOutput += ']';


              // increment the roll index
              rollIndex++;

              return rollOutput;
            }else{
              return item;
            }
          }).join('');
        };

        // add the total
        output += `${outputRecursive(this[_parsedDice])} = ${this.total}`;
      }else{
        output += 'No dice rolled';
      }

      return output;
    }

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
     * @returns {Array}
     */
    get rolls(){
      return this[_rolls] || [];
    }

    /**
     * Returns the count of successes for the roll
     *
     * @returns {number}
     */
    get successes(){
      if(!this[_successes]){
        // no successes found - calculate the totals, which also calculates the successes
        // calling the `total` property calculates the total
        this[_calculateTotal]();
      }

      return this[_successes] || 0;
    }

    /**
     * Returns the roll total
     *
     * @returns {number}
     */
    get total(){
      // only calculate the total if it has not already been done
      if(!this[_total] && this[_parsedDice] && Array.isArray(this.rolls) && this.rolls.length){
        this[_calculateTotal]();
      }

      // return the total
      return this[_total] || 0;
    }

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
          throw new Error('DiceRoll: Unrecognised export format specified: ' + format);
      }
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
      };
    }


    /**
     * Imports the given dice roll data and builds a `DiceRoll` object
     * from it.
     *
     * Throws Error on failure
     *
     * @throws Error
     * @param {*} data The data to import
     * @returns {DiceRoll}
     */
    static import(data){
      if(!data){
        throw new Error('DiceRoll: No data to import');
      }else if(diceUtils.isJson(data)){
        // data is JSON format - parse and import
        return DiceRoll.import(JSON.parse(data));
      }else if(diceUtils.isBase64(data)) {
        // data is base64 encoded - decode and import
        return DiceRoll.import(atob(data));
      }else if(typeof data === 'object'){
        if(data.constructor.name === 'DiceRoll'){
          // already a DiceRoll object
          return data;
        }else{
          return new DiceRoll(data);
        }
      }else{
        throw new Error('DiceRoll: Unrecognised import format for data: ' + data);
      }
    }

    /**
     * Parses the given dice notation
     * and returns a list of dice found
     *
     * @link https://en.m.wikipedia.org/wiki/Dice_notation
     * @param {string} notation
     * @returns {Array}
     */
    static parseNotation(notation){
      const parsed = [];

      // only continue if a notation was passed
      if(notation) {
        // build the regex for matching a die (including exploding and pool dice etc. notation)
        const dieRegex = DiceRoll.notationPatterns.get('dieFull', 'g');

        // split the notation into its parenthesis groupings
        const groups = XRegExp.matchRecursive(
          notation,
          '\\(', '\\)',
          'g',
          {
            valueNames: [
              'between', 'left', 'match', 'right',
            ],
          }
        );

        // loop through each group and parse it
        groups.forEach(group => {
          if (group.name === 'match') {
            // this is a match within the parenthesis group (ie. `3d6+2` in `(3d6+2)*4`
            // recursively parse it in case it has nested parenthesis
            parsed.push(DiceRoll.parseNotation(group.value));
          } else if (group.name === 'between') {
            // this is a match outside of a parenthesis group (ie. the `+2` in `(3d6)+2`, or `d6` in `(2d4+2)*d6`)
            // or it could be that no parenthesis group exists (ie. the whole notation in `3d6+2`)
            // this also happens when recursively parsing down to a level with no parenthesis

            // split the notation by operator (include operators in the returned segments)
            const segments = group.value.split(/([+\-\/*])/).filter(Boolean);

            // loop through each segment and determine what it is
            segments.map(segment => {
              // determine if the segment is a die or not
              if (XRegExp.test(segment, dieRegex)) {
                // this is a die - parse it into an object and add to the list
                parsed.push(...parseDie(segment));
              } else {
                // not a die (ie. number, operator)
                if(diceUtils.isNumeric(segment)){
                  segment = parseFloat(segment);
                }

                // add to the list
                parsed.push(segment);
              }
            });
          }
        });
      }

      // return the parsed dice
      return parsed;
    }
  }


  /**
   * Stores a list of regular expression
   * patterns for dice notations.
   * They can be retrieved, by name, using
   * the `get(name)` method
   *
   * @type {{get}}
   */
  DiceRoll.notationPatterns = (() => {
    const strings = {
      /**
       * Matches a basic arithmetic operator
       *
       * @type {string}
       */
      arithmeticOperator: '[+\\-*\\/]',
      /**
       * Matches a basic comparison operator
       *
       * @type {string}
       */
      comparisonOperators: '[<>!]?={1,3}|[<>]',
      /**
       * Matches the numbers for a 'fudge' die (ie. F, F.2)
       *
       * @type {string}
       */
      fudge: 'F(?:\\.([12]))?',
      /**
       * Matches a number comparison (ie. <=4, =5, >3, !=1, < 2.6)
       *
       * @type {string}
       */
      get numberComparison() {
        return `(${this.comparisonOperators})(${this.numberDecimal})`;
      },
      /**
       * Matches exploding/penetrating dice notation
       *
       * @type {string}
       */
      explode: '(!{1,2}p?)',
      /**
       * Matches a die (ie. 2d6, d10, d%, dF, dF.2)
       *
       * @returns {string}
       */
      get die() {
        return `([1-9]\\d*)?d([1-9]\\d*|%|${this.fudge})`;
      },
      /**
       * Matches a die, optional exploding/penetrating notation and roll comparison
       *
       * @type {string}
       */
      get dieFull() {
        return `${this.die}${this.explode}?(?:${this.numberComparison})?`;
      },
      /**
       * Matches the operation to a die (ie. +4, -10, *2, -L)
       *
       * @type {string}
       */
      get operation() {
        return `(${this.arithmeticOperator})(${this.numberDecimal}(?!\\d*d)|H|L)`;
      },
      /**
       * Matches a standard dice notation. i.e;
       * 3d10-2
       * 4d20-L
       * 2d7/4
       * 3d8*2
       * 2d3+4-1
       * 2d10-H*1d6/2
       *
       * @type {string}
       */
      get notation() {
        return `(${this.arithmeticOperator})?${this.dieFull}((?:${this.operation})*)`;
      },
      numberDecimal: '\\d+(?:\\.\\d+)?',
    };

    // list of cached patterns
    const regExp = {};

    return {
      /**
       * @param {string} name
       * @param {string=} flags
       * @param {boolean=} matchWhole
       * @returns {RegExp}
       */
      get(name, flags, matchWhole = false){
        const cacheName = name + '_' + flags + '_' + (matchWhole ? 't' : 'f');

        if(!name){
          throw new Error('DiceRoller: Notation pattern name not defined');
        }else if((typeof name !== 'string') || !strings[name]){
          throw new Error(`DiceRoller: Notation pattern name not found: ${name}`);
        }else if(!regExp[cacheName]){
          // no cached version - create it
          regExp[cacheName] = new RegExp((matchWhole ? '^' : '') + strings[name] + (matchWhole ? '$' : ''), flags || undefined);
        }

        return regExp[cacheName];
      }
    };
  })();


  return DiceRoll;
})();

export default DiceRoll;
