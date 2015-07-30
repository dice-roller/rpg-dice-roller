/**
 * A JS based dice roller that uses limited standard dice notation
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

    this.notation = '';
    this.rolls    = [];


    /**
     * Parses the notation and rolls the dice
     *
     * @param notation
     */
    var init          = function(notation){
      var pDice = parseNotation(notation || lib.notation);

      // store the notation
      lib.notation  = notation || lib.notation;
      // empty the current rolls
      lib.rolls = [];
      // zero the current total
      total = 0;

      // loop through each dice and roll it
      pDice.forEach(function(elm, index, array){
        var sides = elm.sides || elm, // number of sides the die has
            qty   = elm.qty || 1,     // number of times to roll the die
            rolls = [];               // list of roll results

        // only continue if the number of sides is valid
        if(sides){
          // loop through and roll for the quantity
          for(var i = 0; i < qty; i++){
            rolls.push(generateNumber(1, sides));
          }

          // add the roll results to our log
          lib.rolls.push(rolls);
        }
      });
    };

    /**
     * Parses the given value for a single die
     * and returns the number of die sides and
     * required quantity
     *
     * @param val
     * @returns {number|object}
     */
    var parseDie      = function(val){
      var die;

      if(!val){
        return die;
      }else if(isNumeric(val)){
        // value is a number - ensure that it's an integer
        val = parseInt(val, 10);

        if(val > 0){
          die = val;
        }
      }else if(typeof val === 'string'){
        if(val.indexOf('d') >= 0){
          // just a single die
          var parts = val.split(/d/),
              sides = parseDie(parts[(parts.length == 2) ? 1 : 0]),
              qty   = ((parts.length == 2) && isNumeric(parts[0])) ? parseInt(parts[0], 10) : 1;

          // only define the die if the sides are valid
          if(sides){
            if(qty > 1){
              die = {
                sides: sides,
                qty: (parts.length == 2) ? parseInt(parts[0], 10) : 1
              };
            }else{
              die = sides;
            }
          }
        }
      }

      return die;
    };

    /**
     * Parses the given value for specified dice
     * and returns a list of dice found
     *
     * @param {string|number|Array} val
     * @returns {Array}
     */
    var parseNotation = function(val){
      var dice  = [];

      // ensure that val is valid and an array
      if(!val){
        // val is falsey - return empty result
        return dice;
      }else if(!Array.isArray(val)){
        // val is NOT an array
        if((typeof val === 'string') && (val.indexOf('+') >= 0)){
          // val is a string with concatenated dice values - split by the join
          val = val.split(/\+/);
        }else{
          // convert to an array
          val = [val];
        }
      }

      // loop through the given dice list and parse them
      val.forEach(function(elm, index, array){
        var die = parseDie(elm);

        // only add the die if it is valid
        if(die){
          dice.push(die);
        }
      });

      // return the list of dice
      return dice;
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
    // TODO - this currently assumes all dice all added (ie; 1d6+2d10)
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
