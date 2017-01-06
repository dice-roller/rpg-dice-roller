/**
 * A JS based dice roller that uses dice notation, as described here:
 * https://en.m.wikipedia.org/wiki/Dice_notation
 *
 * @version v1.2.3
 * @author GreenImp - greenimp.co.uk
 * @link https://github.com/GreenImp/rpg-dice-roller
 */

;(function (root, factory) {
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
   * Checks if the given val is a valid number
   *
   * @param val
   * @returns {boolean}
   */
  var isNumeric       = function(val){
    return !Array.isArray(val) && ((val- parseFloat(val) + 1) >= 0);
  };

  /**
   * Generates a random number between the
   * min and max, inclusive
   *
   * @param {number} min
   * @param {number} max
   * @returns {*}
   */
  var generateNumber  = function(min, max){
    min = min ? parseInt(min, 10) : 1;
    max = max ? parseInt(max, 10) : min;

    if(max <= min){
      return min;
    }

    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  /**
   * Takes an array of numbers and adds them together,
   * returning the result
   *
   * @param {Array} numbers
   * @returns {number}
   */
  var sumArray        = function(numbers){
    return !Array.isArray(numbers) ? 0 : numbers.reduce(function(prev, current){
      return prev + current;
    }, 0);
  };

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
  var equateNumbers   = function(a, b, operator){
    switch(operator){
      case '*':
        // multiply the value
        return a *= b;
      break;
      case '/':
        // divide the value
        return a /= b;
      break;
      case '-':
        // subtract from the value
        return a -= b;
      break;
      case '+':
      default:
        // add to the value
        return a += b;
      break;
    }
  };

  /**
   * Checks if `a` is comparative to `b` with the given operator.
   * Returns true or false.
   *
   * @param {number} a
   * @param {number} b
   * @param {string} operator A valid comparative operator (=, <, >, <=, >=, !=)
   * @returns {boolean}
   */
  var compareNumbers  = function(a, b, operator){
    switch(operator){
      case '=':
      case '==':
        return a == b;
      break;
      case '<':
        return a < b;
      break;
      case '>':
        return a > b;
      break;
      case '<=':
        return a <= b;
      break;
      case '>=':
        return a >= b;
      break;
      case '!':
      case '!=':
        return a != b;
      break;
      default:
        return false;
      break;
    }
  };


  /**
   *
   * @constructor
   */
  var DiceRoller = function(){
    var lib = this;

    /*
     * history of log rolls
     *
     * @type {Array}
     */
    var log  = [];


    /**
     * Returns the String representation of the object,
     * in the format of:
     * 2d20+1d6: [20,2]+[2] = 24; 1d8: [6] = 6
     *
     * @returns {string}
     */
    this.toString = function(){
      var log = lib.getLog();

      // return the response
      return log.length ? log.join('; ') : 'No dice rolled';
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
  };

  /**
   * Stores a list of regular expression
   * patterns for dice notations.
   * They can be retrieved, by name, using
   * the `get(name)` method
   *
   * @type {notationPatterns}
   */
  DiceRoller.notationPatterns = new function(){
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
     * Matches exploding/penetrating dice notation
     *
     * @type {string}
     */
    strings.explode   = '((!{1,2}p?)((' + strings.comparisonOperators + ')?([0-9]+))?)';

    // matches a dice (ie. 2d6, d10, d%, dF, dF.2)
    strings.dice      = '([1-9][0-9]*)?d([1-9][0-9]*|%|' + strings.fudge + ')' + strings.explode + '?';

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
    strings.notation  = '(' + strings.arithmeticOperator + ')?' + strings.dice + '((?:' + strings.addition + ')*)';


    var regExp  = {};

    /**
     * @param {string} name
     * @param {string=} flags
     * @param {boolean=} matchWhole
     * @returns {RegExp}
     */
    this.get  = function(name, flags, matchWhole){
      var cacheName = name + '_' + flags + '_' + (matchWhole ? 't' : 'f');
      if(!regExp[cacheName]){
        regExp[cacheName] = new RegExp((matchWhole ? '^' : '') + strings[name] + (matchWhole ? '$' : ''), flags || undefined);
      }

      return regExp[cacheName];
    };
  };

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
          sides:        isNumeric(match[3]) ? parseInt(match[3], 10) : match[3],  // how many sides the die has - only parse numerical values to Int
          fudge:        false,                                                    // if fudge die this is set to the fudge notation match
          explode:      match[5],                                                 // flag - whether to explode the dice rolls or not
          penetrate:    (match[6] == '!p') || (match[6] == '!!p'),                // flag - whether to penetrate the dice rolls or not
          compound:     (match[6] == '!!') || (match[6] == '!!p'),                // flag - whether to compound exploding dice or not
          comparePoint: false,                                                    // the compare point for exploding/penetrating dice
          additions:    []                                                        // any additions (ie. +2, -L)
        };

        // check if it's a fudge die
        if(typeof die.sides === 'string'){
          die.fudge = die.sides.match(DiceRoller.notationPatterns.get('fudge', null, true)) || false;
        }

        // check if we have a compare point
        if(match[7]){
          die.comparePoint  = {
            operator: match[8],
            value:    parseInt(match[9], 10)
          };
        }else if(die.explode){
          // we are exploding the dice so we need a compare point, but none has been defined
          die.comparePoint  = {
            operator: '=',
            value:    die.fudge ? 1 : ((die.sides == '%') ? 100 : die.sides)
          };
        }

        // check if we have additions
        if(match[10]){
          // we have additions (ie. +2, -L)
          var additionMatch;
          while((additionMatch = DiceRoller.notationPatterns.get('addition', 'g').exec(match[10]))){
            // add the addition to the list
            die.additions.push({
              operator: additionMatch[1],             // addition operator for concatenating with the dice (+, -, /, *)
              value:    isNumeric(additionMatch[2]) ? // addition value - either numerical or string 'L' or 'H'
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
   * A DiceRoll object, which takes a notation
   * and parses it in to rolls
   *
   * @param {string} notation  The dice notation
   * @constructor
   */
  var DiceRoll      = function(notation){
    var lib = this;

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
        return generateNumber(1, sides);
      },
      /**
       * Rolls a fudge die
       *
       * @param {number} numNonBlanks
       * @returns {number}
       */
      fudge:    function(numNonBlanks){
        var total = 0;

        if(numNonBlanks == 2){
          // default fudge (2 of each non-blank) = 1d3 - 2
          total = generateNumber(1, 3) - 2;
        }else if(numNonBlanks == 1){
          // only 1 of each non-blank
          // on 1d6 a roll of 1 = -1, 6 = +1, others = 0
          var num = generateNumber(1, 6);
          if(num == 1){
            total = -1;
          }else if(num == 6){
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
        throw 'DiceRoll exception: No notation specified';
      }

      // store the notation
      lib.notation  = notation;

      // parse the notation
      parsedDice = DiceRoller.parseNotation(notation);

      // empty the current rolls
      lib.rolls = [];
      // zero the current total
      total = 0;

      // roll the dice
      lib.roll();
    };

    /**
     * Checks whether value matches the given compare point
     *
     * @param {object} comparePoint
     * @param {number} value
     * @returns {boolean}
     */
    var isComparePoint = function(comparePoint, value){
      return comparePoint ? compareNumbers(value, comparePoint.value, comparePoint.operator) : false;
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
          return diceRollMethods.fudge(isNumeric(die.fudge[1]) ? parseInt(die.fudge[1]) : 2);
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
              rollCount = 0;  // count of rolls for this die roll (Only > 1 if exploding)

          // roll the die once, then check if it exploded and keep rolling until it stops
          do{
            // generate the roll total
            var roll  = callback.call(this, sides),         // the total rolled on this die
                index = die.compound ? 0 : reRolls.length;  // the reRolls index to use (if compounding always use `0`, otherwise use next empty index)

            // add the roll to our list
            reRolls[index] = (reRolls[index] || 0) + roll;

            // subtract 1 from penetrated rolls (only consecutive rolls, after initial roll are subtratcted)
            if(die.penetrate && (rollCount > 0)){
              reRolls[index]--;
            }

            rollCount++;
          //}while(die.explode && ((roll == sides) || (die.fudge && (roll == 1))));
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
      total = 0;

      // loop through each die and roll it
      parsedDice.forEach(function(elm, index, array){
        // Roll the dice and add it to the log
        lib.rolls.push(rollDie(elm));
      });

      // return the rolls;
      return lib.rolls;
    };


    /**
     * Returns the String representation of the object,
     * in the format of:
     * 2d20+1d6: [20,2]+[2] = 24
     *
     * @returns {string}
     */
    this.toString     = function(){
      var output  = this.notation + ': ';

      if(parsedDice && Array.isArray(this.rolls) && this.rolls.length){
        // loop through and build the string for die rolled
        parsedDice.forEach(function(item, index, array){
          var rolls       = lib.rolls[index] || [],
              maxVal      = item.fudge ? 1 : item.sides,  // the maximum value rollable on the die
              explodeVal  = maxVal;                       // the value to explode on

          output += ((index > 0) ? item.operator : '') + '[';

          // output the rolls
          rolls.forEach(function(roll, rIndex, array){
            output += roll;

            if(item.explode && (roll == explodeVal) || (roll > maxVal)){
              // this die roll exploded (Either matched the explode value or is greater than the max - exploded and compounded)
              output += '!' + (item.compound ? '!' : '') + (item.penetrate ? 'p' : '');
            }

            if(rIndex != array.length-1){
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
     * Returns the roll total
     *
     * @returns {number}
     */
    this.getTotal     = function(){
      if(!total && parsedDice && Array.isArray(lib.rolls) && lib.rolls.length){
        // no total stored already - calculate it
        parsedDice.forEach(function(item, index, array){
          var rolls     = lib.rolls[index] || [],
              dieTotal  = sumArray(rolls);

          if(item.additions.length){
            // loop through the additions and handle them
            item.additions.forEach(function(aItem, aIndex, aArray){
              var value = aItem.value;

              // run any necessary addition value modifications
              if(value == 'H'){
                // 'H' is equivalent to the highest roll
                value = Math.max.apply(null, rolls);
              }else if(value == 'L'){
                // 'L' is equivalent to the lowest roll
                value = Math.min.apply(null, rolls);
              }

              // run the actual mathematical equation
              dieTotal = equateNumbers(dieTotal, value, aItem.operator);
            });
          }

          // total the value
          total = equateNumbers(total, dieTotal, item.operator);
        });
      }

      // return the total
      return total || 0;
    };


    // initialise the object
    init(notation);
  };

  exports.DiceRoller = DiceRoller;
  exports.DiceRoll = DiceRoll;
}));
