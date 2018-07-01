/**
 * A JS based dice roller that uses dice notation, as described here:
 * https://en.m.wikipedia.org/wiki/Dice_notation
 *
 * @version v1.5.0
 * @author GreenImp - greenimp.co.uk
 * @link https://github.com/GreenImp/rpg-dice-roller
 */
/*global define, exports */
;(function (root, factory) {
  "use strict";

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    // CommonJS
    factory(exports);
  } else {
    // Browser globals
    factory(root);
  }
}(this, function(exports){
  "use strict";

  /**
   *
   * @constructor
   */
  var DiceRoller = function(data){
    var lib = this;

    /*
     * history of log rolls
     *
     * @type {Array}
     */
    var log  = [];

    var init = function(data){
      if(data){
        lib.clearLog();

        if(Array.isArray(data.log)){
          // loop through each log entry and import it
          data.log.forEach(function(roll){
            log.push(DiceRoll.import(roll));
          });
        }else if(data.log){
          throw new Error('DiceRoller: Roll log must be an Array');
        }
      }
    };

    /**
     * Returns the roll notation in the format of:
     * 2d20+1d6: [20,2]+[2] = 24; 1d8: [6] = 6
     *
     * @returns {string}
     */
    this.getNotation = function(){
        // return the log as a joined string
      return lib.getLog().join('; ');
    };

    /**
     * Rolls the given dice notation.
     * Returns a list of results
     *
     * @param {string} notation
     * @returns {DiceRoll}
     */
    this.roll     = function(notation){
      var diceRoll;

      // only continue if a notation was passed
      if(notation){
        diceRoll = new DiceRoll(notation);

        // add the roll log to our global log
        log.push(diceRoll);
      }

      // return the current DiceRoll
      return diceRoll;
    };

    /**
     * Clears the roll history log
     */
    this.clearLog = function(){
      log  = [];
    };

    /**
     * Returns the current roll log
     *
     * @returns {Array}
     */
    this.getLog   = function(){
      return log || [];
    };

    /**
     * Takes the given roll data and imports it into
     * the existing DiceRoller, appending the rolls
     * to the current roll log.
     * Returns the roll log.
     *
     * @throws Error
     * @param data
     * @returns {array}
     */
    this.import = function(data){
      if(!data){
        throw new Error('DiceRoller: No data to import');
      }else if(DiceRoller.utils.isJson(data)){
        // data is JSON - parse and import
        return this.import(JSON.parse(data));
      }else if(DiceRoller.utils.isBase64(data)){
        // data is base64 encoded - decode an import
        return this.import(atob(data));
      }else if(typeof data === 'object'){
        // if `log` is not defined, but data is an array, use it as the list of logs
        if(!data.log && Array.isArray(data) && data.length){
          data = {log: data};
        }

        if(data.log && Array.isArray(data.log)){
          // loop through each log entry and import it
          data.log.forEach(function(roll){
            log.push(DiceRoll.import(roll));
          });
        }else if(data.log){
          throw new Error('DiceRoller: Roll log must be an Array');
        }

        return this.getLog();
      }else{
        throw new Error('DiceRoller: Unrecognised import format for data: ' + data);
      }
    };

    /**
     * Returns the String representation
     * of the object as the roll notations
     *
     * @returns {string}
     */
    this.toString = this.getNotation;

    // initialise the object
    init(data);
  };

  DiceRoller.exportFormats = Object.freeze({
    JSON: 0,
    BASE_64: 1,
    OBJECT: 2
  });

  /**
   * Utility helper functions
   */
  DiceRoller.utils = {
      /**
       * Checks if the given val is a valid number
       *
       * @param val
       * @returns {boolean}
       */
      isNumeric: function(val){
        return !Array.isArray(val) && ((val- parseFloat(val) + 1) >= 0);
      },
      isBase64: function(val){
        try{
          return !!(val && (btoa(atob(val)) === val));
        }catch(e){
          return false;
        }
      },
      isJson: function(val){
        var parsed;

        try{
          parsed = val ? JSON.parse(val) : false;

          return !!(parsed && (typeof parsed === 'object'));
        }catch(e){
          return false;
        }
      },
      /**
       * Generates a random number between the
       * min and max, inclusive
       *
       * @param {number} min
       * @param {number} max
       * @returns {*}
       */
      generateNumber: function(min, max){
        min = min ? parseInt(min, 10) : 1;
        max = max ? parseInt(max, 10) : min;

        if(max <= min){
          return min;
        }

        return Math.floor(Math.random() * (max - min + 1) + min);
      },
      /**
       * Takes an array of numbers and adds them together,
       * returning the result
       *
       * @param {Array} numbers
       * @returns {number}
       */
      sumArray: function(numbers){
        return !Array.isArray(numbers) ? 0 : numbers.reduce(function(prev, current){
          return prev + (DiceRoller.utils.isNumeric(current) ? parseFloat(current) : 0);
        }, 0);
      },
      /**
       * Takes two numbers and runs a
       * mathematical equation on them,
       * using the given operator
       *
       * @param {number} a
       * @param {number} b
       * @param {string} operator A valid arithmetic operator (+, -, /, *)
       * @returns {number}
       */
      equateNumbers: function(a, b, operator){
        // ensure values are numeric
        a = DiceRoller.utils.isNumeric(a) ? parseFloat(a) : 0;
        b = DiceRoller.utils.isNumeric(b) ? parseFloat(b) : 0;

        // only carry out operation if we have both values
        switch (operator){
          case '*':
            // multiply the value
            a *= b;
            break;
          case '/':
            // divide the value (Handle division by zero)
            a = b ? a/b : 0;
            break;
          case '-':
            // subtract from the value
            a -= b;
            break;
          default:
            // add to the value
            a += b;
            break;
        }

        return a;
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
      compareNumbers: function(a, b, operator){
        var result;

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
      }
  };
  
  /**
   * Stores a list of regular expression
   * patterns for dice notations.
   * They can be retrieved, by name, using
   * the `get(name)` method
   *
   * @type {notationPatterns}
   */
  DiceRoller.notationPatterns = (function(){
    var strings = {
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
      fudge:    'F(?:\\.([12]))?'
    };

    /**
     * Matches a number comparison (ie. <=4, =5, >3, !=1)
     *
     * @type {string}
     */
    strings.numberComparison = '(' + strings.comparisonOperators + ')([0-9]+)';

    /**
     * Matches exploding/penetrating dice notation
     *
     * @type {string}
     */
    strings.explode   = '(!{1,2}p?)';

    /**
     * Matches a dice (ie. 2d6, d10, d%, dF, dF.2)
     *
     * @type {string}
     */
    strings.dice      = '([1-9][0-9]*)?d([1-9][0-9]*|%|' + strings.fudge + ')';

    /**
     * Matches a dice, optional exploding/penetrating notation and roll comparison
     *
     * @type {string}
     */
    strings.diceFull  = strings.dice + strings.explode + '?(?:' + strings.numberComparison + ')?';

    /**
     * Matches the addition to a dice (ie. +4, -10, *2, -L)
     *
     * @type {string}
     */
    strings.addition  = '(' + strings.arithmeticOperator + ')([1-9]+0?(?![0-9]*d)|H|L)';

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
    strings.notation  = '(' + strings.arithmeticOperator + ')?' + strings.diceFull + '((?:' + strings.addition + ')*)';


    var regExp  = {};

    return {
      /**
       * @param {string} name
       * @param {string=} flags
       * @param {boolean=} matchWhole
       * @returns {RegExp}
       */
      get: function(name, flags, matchWhole){
        var cacheName = name + '_' + flags + '_' + (matchWhole ? 't' : 'f');
        if(!regExp[cacheName]){
          regExp[cacheName] = new RegExp((matchWhole ? '^' : '') + strings[name] + (matchWhole ? '$' : ''), flags || undefined);
        }

        return regExp[cacheName];
      }
    };
  })();

  /**
   * Parses the given dice notation
   * and returns a list of dice found
   *
   * @link https://en.m.wikipedia.org/wiki/Dice_notation
   * @param {string} notation
   * @returns {Array}
   */
  DiceRoller.parseNotation    = function(notation){
    var parsed  = [];

    // only continue if a notation was passed
    if(notation){
      // parse the notation and find each valid dice (and any attributes)
      var match;
      while((match = DiceRoller.notationPatterns.get('notation', 'g').exec(notation)) !== null){
        var die = {
          operator:     match[1] || '+',                                          // dice operator for concatenating with previous rolls (+, -, /, *)
          qty:          match[2] ? parseInt(match[2], 10) : 1,                    // number of times to roll the die
          sides:        DiceRoller.utils.isNumeric(match[3]) ? parseInt(match[3], 10) : match[3],  // how many sides the die has - only parse numerical values to Int
          fudge:        false,                                                    // if fudge die this is set to the fudge notation match
          explode:      !!match[5],                                               // flag - whether to explode the dice rolls or not
          penetrate:    (match[5] === '!p') || (match[5] === '!!p'),              // flag - whether to penetrate the dice rolls or not
          compound:     (match[5] === '!!') || (match[5] === '!!p'),              // flag - whether to compound exploding dice or not
          comparePoint: false,                                                    // the compare point for exploding/penetrating dice
          additions:    []                                                        // any additions (ie. +2, -L)
        };

        // check if it's a fudge die
        if(typeof die.sides === 'string'){
          die.fudge = die.sides.match(DiceRoller.notationPatterns.get('fudge', null, true)) || false;
        }

        // check if we have a compare point
        if(match[6]){
          die.comparePoint  = {
            operator: match[6],
            value:    parseInt(match[7], 10)
          };
        }else if(die.explode){
          // we are exploding the dice so we need a compare point, but none has been defined
          die.comparePoint  = {
            operator: '=',
            value:    die.fudge ? 1 : ((die.sides === '%') ? 100 : die.sides)
          };
        }

        // check if we have additions
        if(match[8]){
          // we have additions (ie. +2, -L)
          var additionMatch;
          while((additionMatch = DiceRoller.notationPatterns.get('addition', 'g').exec(match[8]))){
            // add the addition to the list
            die.additions.push({
              operator: additionMatch[1],             // addition operator for concatenating with the dice (+, -, /, *)
              value: DiceRoller.utils.isNumeric(additionMatch[2]) ? // addition value - either numerical or string 'L' or 'H'
                parseFloat(additionMatch[2])
                :
                additionMatch[2]
            });
          }
        }

        parsed.push(die);
      }
    }

    // return the parsed dice
    return parsed;
  };

  /**
   * Parses the given notation for a single die
   * and returns the number of die sides, required
   * quantity, etc.
   *
   * @param {string} notation
   * @returns {object|undefined}
   */
  DiceRoller.parseDie         = function(notation){
    // parse the notation and only return the first result
    // (There should only be one result anyway, but it will be in an array and we want the raw result)
    return DiceRoller.parseNotation(notation).shift();
  };

  /**
   * Takes the given data, imports it into a new DiceRoller instance
   * and returns the DiceRoller
   *
   * @throws Error
   * @param data
   * @returns {DiceRoller}
   */
  DiceRoller.import = function(data){
    // create a new DiceRoller object
    var diceRoller = new DiceRoller();

    // import the data
    diceRoller.import(data);

    // return the DiceRoller
    return diceRoller;
  };

  /**
   * Exports the roll log in the given format.
   * If no format is specified, JSON is returned.
   *
   * @throws Error
   * @param {DiceRoller.exportFormats=} format The format to export the data as (ie. JSON, base64)
   * @returns {string|null}
   */
  DiceRoller.prototype.export = function(format){
    switch(format || DiceRoller.exportFormats.JSON){
      case DiceRoller.exportFormats.BASE_64:
        // JSON encode, then base64
        return btoa(this.export(DiceRoller.exportFormats.JSON));
      case DiceRoller.exportFormats.JSON:
        return JSON.stringify(this.getLog());
      default:
        throw new Error('DiceRoller: Unrecognised export format specified: ' + format);
    }
  };



  /**
   * A DiceRoll object, which takes a notation
   * and parses it in to rolls
   *
   * @param {string|Object} notation  The dice notation or object
   * @constructor
   */
  var DiceRoll      = function(notation){
    var lib = this;

    /**
     * The count of success rolls
     *
     * @type {number}
     */
    var successes = 0;

    /**
     * The roll total
     *
     * @type {number}
     */
    var total       = 0;

    /**
     * The parsed notation array
     *
     * @type {Array}
     */
    var parsedDice  = [];

    var diceRollMethods = {
      /**
       * Rolls a standard die
       *
       * @param sides
       * @returns {*}
       */
      default:  function(sides){
        return DiceRoller.utils.generateNumber(1, sides);
      },
      /**
       * Rolls a fudge die
       *
       * @param {number} numNonBlanks
       * @returns {number}
       */
      fudge:    function(numNonBlanks){
        var total = 0;

        if(numNonBlanks === 2){
          // default fudge (2 of each non-blank) = 1d3 - 2
          total = DiceRoller.utils.generateNumber(1, 3) - 2;
        }else if(numNonBlanks === 1){
          // only 1 of each non-blank
          // on 1d6 a roll of 1 = -1, 6 = +1, others = 0
          var num = DiceRoller.utils.generateNumber(1, 6);
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
     * The dice notation
     *
     * @type {string}
     */
    this.notation   = '';

    /**
     * Rolls for the notation
     *
     * @type {Array}
     */
    this.rolls      = [];


    /**
     * Parses the notation and rolls the dice
     *
     * @param notation
     */
    var init          = function(notation){
      if(!notation){
        throw new Error('DiceRoll: No notation specified');
      }

      // zero the current total
      resetTotals();

      if(notation instanceof Object){
        // validate object
        if(!notation.notation){
          // object doesn't contain a notation property
          throw new Error('Object has no notation: ' + notation);
        }else if(notation.rolls){
          // we have rolls - validate them
          if(!Array.isArray(notation.rolls)){
            // rolls is not an array
            throw new Error('Rolls must be an Array: ' + notation.rolls);
          }else{
            // loop through each rolls, make sure they're valid
            notation.rolls.forEach(function(roll, i){
              if(!Array.isArray(roll) || roll.some(isNaN)){
                // not all rolls are valid
                throw new Error('Rolls are invalid at index [' + i + ']: ' + roll);
              }
            });
          }
        }

        // store the notation
        lib.notation = notation.notation;
        // store the rolls
        lib.rolls = notation.rolls || [];

        // parse the notation
        parsedDice = DiceRoller.parseNotation(lib.notation);
      }else{
        // store the notation
        lib.notation = notation;
        // empty the current rolls
        lib.rolls = [];

        // parse the notation
        parsedDice = DiceRoller.parseNotation(lib.notation);

        // roll the dice
        lib.roll();
      }
    };

    /**
     * Checks whether value matches the given compare point
     *
     * @param {object} comparePoint
     * @param {number} value
     * @returns {boolean}
     */
    var isComparePoint = function(comparePoint, value){
      return comparePoint ? DiceRoller.utils.compareNumbers(value, comparePoint.value, comparePoint.operator) : false;
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
    var getSuccessStateValue = function(value, comparePoint){
      return isComparePoint(comparePoint, value) ? 1 : 0;
    };

    /**
     * Resets the current total and success count
     */
    var resetTotals = function(){
      total = 0;
      successes = 0;
    };

    /**
     * Rolls a single die for its quantity
     * and returns an array of the results
     *
     * @param {object} die
     * @returns {Array}
     */
    var rollDie       = function(die){
      var sides     = die.sides,                // number of sides the die has - convert percentile to 100 sides
          dieRolls  = [],                       // list of roll results for the die
          callback  = diceRollMethods.default;  // callback method for rolling the die

      // ensure that the roll quantity is valid
      die.qty = (die.qty > 0) ? die.qty : 1;

      // check for non-numerical dice formats
      if(die.fudge){
        // we have a fudge dice - define the callback to return the `fudge` roll method
        // I'm using an anonymous function to call it instead of setting `sides` to the fudge match
        // in case we want to use the number of sides as well, in the future
        callback = function(sides){
          return diceRollMethods.fudge(DiceRoller.utils.isNumeric(die.fudge[1]) ? parseInt(die.fudge[1], 10) : 2);
        };
      }else if(typeof die.sides === 'string'){
        if(die.sides === '%'){
          // convert percentile to 100 sided die
          sides = 100;
        }
      }


      // only continue if the number of sides is valid
      if(sides){
        // loop through and roll for the quantity
        for(var i = 0; i < die.qty; i++){
          var reRolls   = [], // the rolls for the current die (only multiple rolls if exploding)
              rollCount = 0,  // count of rolls for this die roll (Only > 1 if exploding)
              roll,           // the total rolled
              index;          // re-roll index

          // roll the die once, then check if it exploded and keep rolling until it stops
          do{
            // the reRolls index to use
            index = reRolls.length;

            // get the total rolled on this die
            roll  = callback.call(this, sides);

            // add the roll to our list
            reRolls[index] = (reRolls[index] || 0) + roll;

            // subtract 1 from penetrated rolls (only consecutive rolls, after initial roll are subtracted)
            if(die.penetrate && (rollCount > 0)){
              reRolls[index]--;
            }

            rollCount++;
          }while(die.explode && isComparePoint(die.comparePoint, roll));

          // add the rolls
          dieRolls.push.apply(dieRolls, reRolls);
        }
      }

      return dieRolls;
    };

    /**
     * Rolls the dice for the existing notation
     *
     * @returns {Array}
     */
    this.roll         = function(){
      // clear the roll log
      lib.rolls = [];

      // reset the cached total
      resetTotals();

      // loop through each die and roll it
      parsedDice.forEach(function(elm, index, array){
        // Roll the dice and add it to the log
        lib.rolls.push(rollDie(elm));
      });

      // return the rolls;
      return lib.rolls;
    };


    /**
     * Returns the roll notation in the format of:
     * 2d20+1d6: [20,2]+[2] = 24
     *
     * @returns {string}
     */
    this.getNotation = function(){
      var output  = this.notation + ': ';

      if(parsedDice && Array.isArray(this.rolls) && this.rolls.length){
        // loop through and build the string for die rolled
        parsedDice.forEach(function(item, index, array){
          var rolls       = lib.rolls[index] || [],
              currentRoll = 0, // current roll total - used for totalling compounding rolls
              hasComparePoint = item.comparePoint;

          output += ((index > 0) ? item.operator : '') + '[';

          // output the rolls
          rolls.forEach(function(roll, rIndex, array){
            // get the roll value to compare to (If penetrating and not the first roll, add 1, to compensate for the penetration)
            var rollVal = (item.penetrate && currentRoll) ? roll + 1 : roll,
                delimit = rIndex !== array.length-1,
                hasMatchedCP = hasComparePoint && isComparePoint(item.comparePoint, rollVal);

            if(item.explode && hasMatchedCP){
              // this die roll exploded (Either matched the explode value or is greater than the max - exploded and compounded)

              // add the current roll to the roll total
              currentRoll += roll;

              if(item.compound){
                  // do NOT add the delimiter after this roll as we're not outputting it
                  delimit = false;
              }else{
                // not compounding
                output += roll + '!' + (item.penetrate ? 'p' : '');
              }
            }else if(hasMatchedCP){
              // not exploding but we've matched a compare point - this is a pool dice (success or failure)
              output += roll + '*';
            }else if(item.compound && currentRoll) {
              // last roll in a compounding set (This one didn't compound)
              output += (roll + currentRoll) + '!!' + (item.penetrate ? 'p' : '');

              // reset current roll total
              currentRoll = 0;
            }else{
              // just a normal roll
              output += roll;

              // reset current roll total
              currentRoll = 0;
            }

            if(delimit){
              output += ',';
            }
          });

          output += ']';

          // add any additions
          if(item.additions.length){
            output += item.additions.reduce(function(prev, current){
              return prev + current.operator + current.value;
            }, '');
          }
        });

        // add the total
        output += ' = ' + this.getTotal();
      }else{
        output += 'No dice rolled';
      }

      return output;
    };

    /**
     * Returns the count of successes for the roll
     *
     * @returns {number}
     */
    this.getSuccesses = function(){
      if(!successes){
        // no successes found - calculate the totals, which also calculates the successes
        lib.getTotal();
      }

      return successes || 0;
    };

    /**
     * Returns the roll total
     *
     * @returns {number}
     */
    this.getTotal     = function(){
      // only calculate the total if it has not already been done
      if(!total && parsedDice && Array.isArray(lib.rolls) && lib.rolls.length){
        // reset the success count
        successes = 0;

        // loop through each roll and calculate the totals
        parsedDice.forEach(function(item, index, array){
          var rolls     = lib.rolls[index] || [],
              // actual values of the rolls for the purposes of L/H modifiers
              rollsValues = item.compound ? [rolls.reduce(function(a, b){
                return a + b;
              }, 0)] : rolls,
              dieTotal  = 0,
              isPool = !item.explode && item.comparePoint;

          if(isPool){
            // pool dice are success/failure so we don't want the actual dice roll
            // we need to convert each roll to 1 (success) or 0 (failure)
            rolls = rolls.map(function(value){
              return getSuccessStateValue(value, item.comparePoint);
            });
          }

          // add all the rolls together to get the total
          dieTotal = DiceRoller.utils.sumArray(rolls);


          if(item.additions.length){
            // loop through the additions and handle them
            item.additions.forEach(function(aItem, aIndex, aArray){
              var value = aItem.value,
                  isPoolModifier = false;

              // run any necessary addition value modifications
              if(value === 'H'){
                // 'H' is equivalent to the highest roll
                value = Math.max.apply(null, rollsValues);
                // flag that this value needs to eb modified to a success/failure value
                isPoolModifier = true;
              }else if(value === 'L'){
                // 'L' is equivalent to the lowest roll
                value = Math.min.apply(null, rollsValues);
                // flag that this value needs to eb modified to a success/failure value
                isPoolModifier = true;
              }

              if(isPool && isPoolModifier){
                // pool dice are either success or failure, so value is converted to 1 or 0
                value = getSuccessStateValue(value, item.comparePoint);
              }

              // run the actual mathematical equation
              dieTotal = DiceRoller.utils.equateNumbers(dieTotal, value, aItem.operator);
            });
          }

          // total the value
          total = DiceRoller.utils.equateNumbers(total, dieTotal, item.operator);

          // if this is a pool dice, add it's success count to the count
          if(isPool) {
            successes = DiceRoller.utils.equateNumbers(successes, dieTotal, item.operator);
          }
        });
      }

      // return the total
      return total || 0;
    };

    /**
     * Returns the String representation
     * of the object as the roll notation
     *
     * @returns {string}
     */
    this.toString = this.getNotation;

    // initialise the object
    init(notation);
  };

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
  DiceRoll.import = function(data){
    if(!data){
      throw new Error('DiceRoll: No data to import');
    }else if(DiceRoller.utils.isJson(data)){
      // data is JSON format - parse and import
      return DiceRoll.import(JSON.parse(data));
    }else if(DiceRoller.utils.isBase64(data)) {
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
  };

  /**
   * Exports the DiceRoll in the given format.
   * If no format is specified, JSON is returned.
   *
   * @throws Error
   * @param {DiceRoller.exportFormats=} format The format to export the data as (ie. JSON, base64)
   * @returns {string|null}
   */
  DiceRoll.prototype.export = function(format){
    switch(format || DiceRoller.exportFormats.JSON){
      case DiceRoller.exportFormats.BASE_64:
        // JSON encode, then base64, otherwise it exports the string representation of the roll output
        return btoa(this.export(DiceRoller.exportFormats.JSON));
      case DiceRoller.exportFormats.JSON:
        return JSON.stringify(this);
      case DiceRoller.exportFormats.OBJECT:
        return JSON.parse(this.export(DiceRoller.exportFormats.JSON));
      default:
        throw new Error('DiceRoll: Unrecognised export format specified: ' + format);
    }
  };

  exports.DiceRoller = DiceRoller;
  exports.DiceRoll = DiceRoll;
}));
