/**
 * A JS based dice roller that uses dice notation, as described here:
 * https://en.m.wikipedia.org/wiki/Dice_notation
 *
 * GreenImp Web - greenimp.co.uk
 */

;(function(){
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
   * @param {string} operator A valid numerical operator (+, -, /, *)
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


  window.DiceRoller = function(){
    var lib = this;

    /*
     * history of log rolls
     *
     * @type {Array}
     */
    this.log  = [];


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
     * Rolls the given dice sides for the
     * set amount of rolls.
     * Returns a list of results
     *
     * @param {string} notation
     * @returns {Window.DiceRoll}
     */
    this.roll     = function(notation){
      var diceRoll  = new DiceRoll(notation);

      // add the roll log to our global log
      lib.log.push(diceRoll);

      // return the current DiceRoll
      return diceRoll;
    };

    /**
     * Clears the roll history log
     */
    this.clearLog = function(){
      lib.log  = [];
    };

    /**
     * Returns the current roll log
     *
     * @returns {Array}
     */
    this.getLog   = function(){
      return lib.log || [];
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
      operator: '[+\\-*\\/]',
      dice:     '([1-9][0-9]*)?d([1-9][0-9]*|%|F(?:\\.[12])?)'
    };

    strings.addition  = '(' + strings.operator + ')([1-9]+(?!d)|H|L)';
    /**
     * this matches a standard dice notation. i.e;
     * 3d10-2
     * 4d20-L
     * 2d7/4
     * 3d8*2
     * 2d3+4-1
     * 2d10-H*1d6/2
     *
     * @type {string}
     */
    strings.notation  = '(' + strings.operator + ')?' + strings.dice + '((?:' + strings.addition + ')*)';


    var regExp  = {};

    /**
     *
     * @param name
     * @returns {RegExp}
     */
    this.get  = function(name){
      if(!regExp[name]){
        regExp[name]  = new RegExp(strings[name], 'g');
      }

      return regExp[name];
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

    // parse the notation and find each valid dice (and any attributes)
    var match;
    while((match = DiceRoller.notationPatterns.get('notation').exec(notation)) !== null){
      var die = {
        operator:   match[1] || '+',                                          // dice operator for concatenating with previous rolls (+, -, /, *)
        qty:        match[2] ? parseInt(match[2], 10) : 1,                    // number of times to roll the die
        sides:      isNumeric(match[3]) ? parseInt(match[3], 10) : match[3],  // how many sides the die has - only parse numerical values to Int
        additions:  []                                                        // any additions (ie. +2, -L)
      };

      if(match[4]){
        // we have additions (ie. +2, -L)
        var additionMatch;
        while((additionMatch = DiceRoller.notationPatterns.get('addition').exec(match[4]))){
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
  window.DiceRoll   = function(notation){
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

    /**
     * The dice notation
     *
     * @type {string}
     */
    this.notation   = '';

    /**
     * Rolls for the notation.
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
      // store the notation
      lib.notation  = notation;

      // parse the notation
      parsedDice = DiceRoller.parseNotation(notation);

      console.log('notation:', notation);
      console.log('parsed:', parsedDice);

      // empty the current rolls
      lib.rolls = [];
      // zero the current total
      total = 0;

      // roll the dice
      lib.roll(parsedDice);

      console.log('current roll:', lib);
    };

    /**
     * Rolls the dice for the existing notation
     *
     * @returns {Array}
     */
    this.roll         = function(dice){
      var rolls = [];

      // reset the cached total
      total = 0;

      // loop through each die and roll it
      parsedDice.forEach(function(elm, index, array){
        var sides     = (elm.sides == '%') ? 100 : elm.sides, // number of sides the die has - convert percentile to 100 sides
            qty       = (elm.qty > 0) ? elm.qty : 1,          // number of times to roll the die
            dieRolls  = [];                                   // list of roll results for the die

        // only continue if the number of sides is valid
        if(sides > 0){
          // loop through and roll for the quantity
          for(var i = 0; i < qty; i++){
            dieRolls.push(generateNumber(1, sides));
          }
        }

        // add the roll results to our log
        rolls.push(dieRolls);
      });

      // store the rolls
      lib.rolls = rolls;

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
          var rolls = lib.rolls[index] || [];

          output += ((index > 0) ? item.operator : '') + '[' + rolls.join(',') + ']';

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
}(window));
