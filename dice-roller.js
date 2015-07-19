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
     * Returns the String representation of the object
     *
     * @returns {string}
     */
    this.toString = function(){
      var response  = '';

      for(var item in lib.log){
        if(lib.log.hasOwnProperty(item)){
          response += lib.log[item].die + ': ' + lib.log[item].rolls.join(', ') + '; ';
        }
      }

      return response.substring(0, response.length-2);
    };

    /**
     * Parses the given value and returns
     * the number of die sides
     *
     * @param val
     * @returns {number|object}
     */
    this.parseDie   = function(val){
      var dieNum;

      if(!val){
        return dieNum;
      }else if(isNumeric(val)){
        // value is a number - ensure that it's an integer
        val = parseInt(val, 10);

        if(val >= diceRange.MIN){
          // value is above or equal to the minimum.
          // if it's equal to or less than the maximum, return it.
          // otherwise, return the maximum.
          dieNum  = (val <= diceRange.MAX) ? val : diceRange.MAX;
        }else{
          // value id below the minimum allowed - return the minimum
          dieNum  = diceRange.MIN;
        }
      }else{
        var parts = val.split(/d/),
            sides = lib.parseDie(parts[(parts.length == 2) ? 1 : 0]),
            qty   = (parts.length == 2) ? parseInt(parts[0], 10) : 1;

        if(qty > 1){
          dieNum = {
            sides: sides,
            qty:   (parts.length == 2) ? parseInt(parts[0], 10) : 1
          };
        }else{
          dieNum = sides;
        }
      }

      return dieNum;
    };

    /**
     * Parses the given value for specified die
     * and returns a list of die found
     *
     * @param {string|number} val
     * @returns {Array}
     */
    this.parseDice  = function(val){
      var dice  = [];

      if(val){
        if(isNumeric(val)){
          dice.push(lib.parseDie(val));
        }else if(typeof val === 'string'){
          dice =  val
              // split value by addition symbol
              .split(/\+/)
              .map(lib.parseDie)
              ;//.reduce(function(a,b){return a + b;});
        }
      }

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

      for(var die in pDice){
        if(pDice.hasOwnProperty(die)){
          var sides   = pDice[die].sides || pDice[die] || null,
              qty     = pDice[die].qty || 1,
              rolls   = [];

          if(sides){
            for(var i = 0; i < qty; i++){
              rolls.push(generateNumber(1, sides));
            }

            lib.log.push({
              die:        qty + 'd' + sides,
              rollNumber: i + 1,
              rolls:      rolls
            });
          }
        }
      }

      return lib.log;
    };
  }
}(window));
