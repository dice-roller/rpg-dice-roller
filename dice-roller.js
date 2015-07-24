/**
 * A basic JS based dice roller
 *
 * GreenImp Web - greenimp.co.uk
 * Date: 17/07/15 23:26
 */

;(function(){
  "use strict";

  window.DiceRoller = function(){
    var lib = this,
        diceRange = Object.freeze({
          MIN: 3,
          MAX: 100
        });

    this.log  = []; // a history of rolls


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
     * Takes an array of numbers adds them
     * together and returns the total
     *
     * @param {array} numbers
     * @returns {number}
     */
    var totalNumbers    = function(numbers){
      return numbers.reduce(function(prev, current){
        return current + prev;
      }, 0);
    };

    /**
     * Takes a list of dice rolls and returns
     * the total value.
     * If no `rolls` is defined, the log is used
     *
     * @param {Array=} rolls
     * @returns {number}
     */
    var getRollTotals   = function(rolls){
      rolls = (rolls && Array.isArray(rolls)) ? rolls : lib.log;

      // add the totals together
      return rolls.reduce(function(prev, current){
        return (current.total || 0) + (prev.total || 0);
      });
    };


    /**
     * Returns the String representation of the object
     *
     * @returns {string}
     */
    this.toString = function(){
      var response  = '';

      // loop through each dice log and build the response
      lib.log.forEach(function(elm, index, array){
        // add the rolls to the string
        response += elm.die + ': ' + elm.rolls.join(', ') + ' = ' + elm.total + '; ';
      });

      // output the total
      if(lib.log.length){
        response += 'Total = ' + getRollTotals();
      }else{
        response = 'No dice rolled';
      }

      // return the response
      return response;
    };

    /**
     * Parses the given value for a single die
     * and returns the number of die sides and
     * required quantity
     *
     * @param val
     * @returns {number|object}
     */
    this.parseDie   = function(val){
      var die;

      if(!val){
        return die;
      }else if(isNumeric(val)){
        // value is a number - ensure that it's an integer
        val = parseInt(val, 10);

        // TODO - should we throw a warning and NOT parse if val is outside the range?
        if(val >= diceRange.MIN){
          // value is above or equal to the minimum.
          // if it's equal to or less than the maximum, return it.
          // otherwise, return the maximum.
          die = (val <= diceRange.MAX) ? val : diceRange.MAX;
        }else{
          // value id below the minimum allowed - return the minimum
          die = diceRange.MIN;
        }
      }else if(typeof val === 'string'){
        if(val.indexOf('d') >= 0){
          // just a single die
          var parts = val.split(/d/),
              sides = lib.parseDie(parts[(parts.length == 2) ? 1 : 0]),
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
    this.parseDice   = function(val){
      var dice  = [];

      // ensure that val is valid and an array
      if(!val){
        // val is falsey - return empty result
        return dice;
      }else if(!Array.isArray(val)){
        // val is NOt an array
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
        var die = lib.parseDie(elm);

        // only add the die if it is valid
        if(die){
          dice.push(die);
        }
      });

      // return the list of dice
      return dice;
    };

    /**
     * Rolls the given dice sides for the
     * set amount of rolls.
     * Returns a list of results
     *
     * @param {string} dice
     * @returns {Array}
     */
    this.roll = function(dice){
      var pDice = lib.parseDice(dice);

      lib.log  = [];

      pDice.forEach(function(elm, index, array){
        var sides   = elm.sides || elm,
            qty     = elm.qty || 1,
            rolls   = [];

        if(sides){
          for(var i = 0; i < qty; i++){
            rolls.push(generateNumber(1, sides));
          }

          lib.log.push({
            die:    qty + 'd' + sides,
            rolls:  rolls,
            total:  totalNumbers(rolls)
          });
        }
      });

      return lib.log;
    };
  }
}(window));
