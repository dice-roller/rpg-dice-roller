/**
 * A JS based dice roller that uses limited standard dice notation,
 * as described here: https://en.m.wikipedia.org/wiki/Dice_notation
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
    var total = 0;

    var regexes = new function(){
      var strings = {
        operator: '[+\\-*\\/]',
        dice:     '(\\d*)d(\\d+)'
      };

      strings.addition  = '(' + strings.operator + ')(\\d+(?!d)|H|L)';
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

    this.notation = '';
    this.rolls    = [];


    /**
     * Parses the notation and rolls the dice
     *
     * @param notation
     */
    var init          = function(notation){
      var parsed = parseNotation(notation || lib.notation);

      console.log('parsed:', parsed);

      // store the notation
      lib.notation  = notation || lib.notation;
      // empty the current rolls
      lib.rolls = [];
      // zero the current total
      total = 0;

      // loop through each dice and roll it
      parsed.forEach(function(elm, index, array){
        var sides = elm.sides,                    // number of sides the die has
            qty   = (elm.qty > 0) ? elm.qty : 1,  // number of times to roll the die
            rolls = [];                           // list of roll results

        // only continue if the number of sides is valid
        if(sides > 0){
          // loop through and roll for the quantity
          for(var i = 0; i < qty; i++){
            rolls.push(generateNumber(1, sides));
          }

          // add the roll results to our log
          lib.rolls.push(rolls);

          // TODO - handle additions
        }
      });
    };

    /**
     * Parses the given value for a single die
     * and returns the number of die sides and
     * required quantity
     *
     * @param {string} notation
     * @returns {object|undefined}
     */
    var parseDie      = function(notation){
      return lib.parseNotation(notation).shift();
    };

    /**
     * Parses the given value for specified dice
     * and returns a list of dice found
     *
     * @param {string} notation
     * @returns {Array}
     */
    var parseNotation = function(notation){
      var parsed  = [];

      // parse the notation and find each valid dice (and any attributes)
      var match;
      while((match = regexes.get('notation').exec(notation)) !== null){
        var die = {
          operator:   match[1],                               // dice operator for concatenating with previous rolls (+, -, /, *)
          qty:        match[2] ? parseInt(match[2], 10) : 1,  // number of times to roll the die
          sides:      parseInt(match[3], 10),                 // how many sides the die has
          additions:  []                                      // any additions (ie. +2, -L)
        };

        if(match[4]){
          // we have additions (ie. +2, -L)
          var additionMatch;
          while((additionMatch = regexes.get('addition').exec(match[4]))){
            // add the addition to the list
            die.additions.push([additionMatch[1], isNumeric(additionMatch[2]) ? parseFloat(additionMatch[2]) : additionMatch[2]]);
          }
        }

        parsed.push(die);
      }

      // return the parsed dice
      return parsed;
    };


    /**
     * Returns the String representation of the object,
     * in the format of:
     * 2d20+1d6: [20,2]+[2] = 24
     *
     * @returns {string}
     */
    // TODO - this currently assumes all dice all added (ie; 1d6+2d10)
    this.toString     = function(){
      var output  = this.notation + ': ';

      if(this.rolls.length){
        // loop through and build the string for die rolled
        this.rolls.forEach(function(item, index, array){
          output += '[' + item.join(',') + ']' + ((index < array.length-1) ? '+' : '');
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
     * @returns {*}
     */
    // TODO - this currently assumes all dice are added (ie; 1d6+2d10)
    this.getTotal     = function(){
      if(!total && Array.isArray(lib.rolls) && lib.rolls.length){
        // no total stored already - calculate it
        total = lib.rolls
          // loop through and turn all the roll arrays into a single flat array
          .reduce(function(prev, current){
            return current.concat(prev);
          })
          // sum the new flat array of rolls
          .reduce(function(prev, current){
            return current + prev;
          });
      }

      // return the total
      return total || 0;
    };


    // initialise the object
    init(notation);
  };
}(window));
