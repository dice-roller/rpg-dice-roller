/**
 * A basic JS based dice roller
 *
 * GreenImp Web - greenimp.co.uk
 */

;(function(){
  "use strict";

  window.DiceRoller = function(){
    var lib = this;

    /*
     * history of log rolls
     *
     * {array}
     */
    this.log  = [];


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
     * @param {Array} numbers
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
     * @param {Array} rolls
     * @returns {number}
     */
    var getRollTotals   = function(rolls){
      if(rolls && Array.isArray(rolls) && rolls.length){
        // add the totals together
        return rolls.reduce(function(prev, current){
          return (current.total || 0) + prev;
        }, 0);
      }else{
        // no valid rolls defined - return zero
        return 0;
      }
    };


    /**
     * Returns the String representation of the object
     *
     * @returns {string}
     */
    this.toString = function(){
      var response  = '';

      if(lib.log.length){
        // loop through each dice log and build the response
        lib.log.forEach(function(item, index, array){
          item.forEach(function(elm, iIndex, iArray){
            // add the rolls to the string
            response += elm.die + ': ' + elm.rolls.join(', ') + ' = ' + elm.total + '; ';
          });

          response += 'Total = ' + getRollTotals(item);

          if(index < array.length-1){
            response += '|';
          }
        });
      }else{
        // no rolls stored in the log
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

        if(val > 0){
          die = val;
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
      var pDice = lib.parseDice(dice),
          log   = [];

      // loop through each dice and roll it
      pDice.forEach(function(elm, index, array){
        var sides   = elm.sides || elm, // number of sides the die has
            qty     = elm.qty || 1,     // number of times to roll the die
            rolls   = [];               // list of roll results

        // only continue if the number of sides is valid
        if(sides){
          // loop through and roll for the quantity
          for(var i = 0; i < qty; i++){
            rolls.push(generateNumber(1, sides));
          }

          // add the roll results to our log
          log.push({
            die:    qty + 'd' + sides,
            rolls:  rolls,
            total:  totalNumbers(rolls)
          });
        }
      });

      // add the roll log to our global log
      lib.log.push(log);

      // return the log
      return log;
    };
  }
}(window));
