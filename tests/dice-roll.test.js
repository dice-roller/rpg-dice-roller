/*global beforeEach, describe, DiceRoller, expect, jasmine, it */
;(function(){
  'use strict';

  var utils = {
    /**
     * Reduces an array to a single value
     *
     * @param obj
     * @returns {*}
     */
    reduceArray: function(obj){
      if(Array.isArray(obj)){
        return obj.reduce(function(a, b){
          return utils.reduceArray(a) + utils.reduceArray(b);
        }, 0);
      }else{
        return obj;
      }
    },
    getMin: function(obj){
      return Math.min.apply(this, obj);
    },
    getMax: function(obj){
      return Math.max.apply(this, obj);
    }
  };

  var customMatchers = {
    toBeWithinRange: function(util,customEqualityTesters){
      return {
        compare: function(actual, expected){
          var result = {};

          if((actual < expected.min) || (actual > expected.max)){
            result.pass = false;
            result.message = 'Expected ' + actual + ' to be within range: ' + expected.min + ' - ' + expected.max;
          }else{
            result.pass = true;
            result.message = 'Expected ' + actual + ' NOT to be within range: ' + expected.min + ' - ' + expected.max;
          }

          return result;
        }
      };
    },
    toHaveValuesWithinRange: function(util,customEqualityTesters){
      return {
        compare: function(actual, expected){
          var result = {pass: true},
              i;

          if(!Array.isArray(actual)){
            result.pass = false;
            result.message = 'Expected ' + actual + ' to be an Array';
          }else{
            for(i = 0; i < actual.length; i++){
              if((actual[i] < expected.min) || (actual[i] > expected.max)){
                result.pass = false;
                result.message = 'Expected ' + actual[i] + ' to be within range: ' + expected.min + ' - ' + expected.max;

                // end loop
                i = actual.length;
              }
            }
          }

          return result;
        }
      };
    },
    toArraySumEqualTo: function(util,customEqualityTesters){
      return {
        compare: function(actual, expected){
          var result = {},
              sum = utils.reduceArray(actual);

          if(sum !== expected){
            result.pass = false;
            result.message = 'Expected Array sum ' + sum + ' to equal ' + expected;
          }else{
            result.pass = true;
            result.message = 'Expected Array sum ' + sum + ' NOT to equal ' + expected;
          }

          return result;
        }
      };
    },
    toHaveRolls: function(util,customEqualityTesters){
      return {
        compare: function(actual, expected){
          var result = {pass: true, message: 'Expected "' + actual + '" Not to have rolls'},
              rolls = actual.rolls,
              rollsReq = expected ? expected.rolls : null,
              rollI;

          if(!rolls.length) {
            result.pass = false;
            result.message = 'Expected "' + actual + '" to have rolls';
          }else if(rollsReq && (rollsReq.length !== rolls.length)){
            result.pass = false;
            result.message = 'Expected "' + actual + '" to have ' + rollsReq.length + ' rolls';
          }else{
            // loop through each roll and ensure that it has rolls (multiples for exploded)
            for(rollI = 0; rollI < rolls.length; rollI++){
              if(!rolls[rollI].length){
                result.pass = false;
                result.message = 'Expected "' + actual + '" roll index "' + rollI + '" to have roll values';
              }else if(rollsReq && rollsReq[rollI] && (rollsReq[rollI] !== '*') && (rollsReq[rollI] !== rolls[rollI].length)){
                // roll length doesn't match expected (Ignore *, which means unlimited)
                result.pass = false;
                result.message = 'Expected "' + actual + '" index "' + rollI + '" (' + rolls[rollI].length + ') to have ' + rollsReq[rollI] + ' roll values';
              }

              if(!result.pass){
                // end the loop
                rollI = rolls.length;
              }
            }
          }

          return result;
        }
      };
    },
    toExplode: function(util, customEqualityTesters){
      return {
        compare: function(actual, expected){
          var result = {pass: true, message: 'Expected "' + actual + '" NOT to explode'},
              rollList = actual,
              rollI,
              max = expected.max || null,
              min = expected.min || null,
              comparePoint = expected.comparePoint || {operator: '=', value: max},
              penetrating = !!expected.penetrate;

          if(!max || !min){
            result.pass = false;
            result.message = "Expected explode argument to provide max and min";
          }else{
            for(rollI = 0; rollI < rollList.length; rollList++){
              var value = rollList[rollI];

              if(penetrating && (rollI === 1)){
                // we need to compensate for the -1 on consecutive rolls when penetrating
                max--;
                min--;
              }

              if(value > max){
                // rolled over max
                result.pass = false;
                result.message = "Expected " + value + ' to be less than or equal to max (' + max + ')';
              }else if (value < min){
                // rolled under min
                result.pass = false;
                result.message = "Expected " + value + ' to be greater than or equal to min (' + min + ')';
              }else{
                var didExplode = rollList.length > (rollI+1),
                    shouldExplode = false;

                switch(comparePoint.operator){
                  case '=':
                  case '==':
                    shouldExplode = value === comparePoint.value;
                    break;
                  case '<':
                    shouldExplode = value < comparePoint.value;
                    break;
                  case '>':
                    shouldExplode = value > comparePoint.value;
                    break;
                  case '<=':
                    shouldExplode = value <= comparePoint.value;
                    break;
                  case '>=':
                    shouldExplode = value >= comparePoint.value;
                    break;
                  case '!':
                  case '!=':
                    shouldExplode = value !== comparePoint.value;
                    break;
                }

                if(shouldExplode && !didExplode){
                  // met comparison, but didn't explode
                  result.pass = false;
                  result.message = "Expected " + value + ' to explode at ' + comparePoint.operator + ' ' + comparePoint.value;
                }else if(!shouldExplode && didExplode){
                  // didn't meet comparison, but exploded
                  result.pass = false;
                  result.message = "Expected " + value + ' to NOT explode at ' + comparePoint.operator + ' ' + comparePoint.value;
                }
              }

              if(!result.pass){
                // end the loop
                rollI = rollList.length;
              }
            }
          }

          return result;
        }
      };
    },
    toMatchParsedNotation: function(util, customEqualityTesters){
      return {
        compare: function(actual, expected){
          var result = {},
              toMatch = expected.notation + ': ' + expected.rolls + ' = ' + expected.total;

          if(''+actual !== toMatch){
            result.pass = false;
            result.message = 'Expected "' + actual + '" to match parsed notation "' + toMatch + '"';
          }else{
            result.pass = true;
            result.message = 'Expected "' + actual + '" NOT to match parsed notation "' + toMatch + '"';
          }

          return result;
        }
      };
    },
    toHaveLogLength: function(util, customEqualityTesters){
      return {
        compare: function(actual, expected){
          var result = {},
              logLength = actual.getLog().length;

          if(typeof expected !== 'number'){
            // no length specified - just check if it has a length
            if(!logLength){
              // no length
              result.pass = false;
              result.message = 'Expected log to have a length';
            }else{
              // no length
              result.pass = true;
              result.message = 'Expected log to NOT have a length';
            }
          }else if(logLength === expected){
            result.pass = true;
            result.message = 'Expected log length ' + logLength + ' NOT to be ' + expected;
          }else{
            result.pass = false;
            result.message = 'Expected log length ' + logLength + ' to be ' + expected;
          }

          return result;
        }
      };
    },
    toBeDiceRoll: function(util, customEqualityTesters){
      return {
        compare: function(actual, expected){
          var result = {pass: true, message: 'Expected "' + actual + '" to NOT be a Dice Roll'},
              resultT,
              roll = actual,
              total = roll.getTotal();

          // check value is within allowed range
          resultT = customMatchers.toBeWithinRange().compare(total, {min: expected.totalRange.min, max: expected.totalRange.max});
          if(!resultT.pass){
            result = resultT;
          }

          // check the rolls list is correct
          resultT = customMatchers.toHaveRolls().compare(roll, {rolls: expected.rolls});
          if(!resultT.pass){
            result = resultT;
          }

          resultT = customMatchers.toHaveValuesWithinRange().compare(roll.rolls[0], {min: expected.dieRange.min, max: expected.dieRange.max});
          if(!resultT.pass){
            result = resultT;
          }

          resultT = customMatchers.toArraySumEqualTo().compare(roll.rolls, total);
          if(!resultT.pass){
            result = resultT;
          }

          // check the output string
          resultT = customMatchers.toMatchParsedNotation().compare(roll, {notation: expected.notation, rolls: '[' + roll.rolls[0].join(',') + ']', total: total});
          if(!resultT.pass){
            result = resultT;
          }

          return result;
        }
      };
    }
  };

  describe('basic dice', function(){
    // create a new instance of the DiceRoller
    var diceRoller,
        dice = [4, 6, 10, 20, '%'],
        loopCount = 1000,
        i, j;

    beforeEach(function(){
      jasmine.addMatchers(customMatchers);

      diceRoller = new DiceRoller();
      i = 0;
      j = 0;
    });

    // loop through and run the tests for the dice
    for(i = 0; i < dice.length; i++){
      var die = dice[i],
          sides = die === '%' ? 100 : die,
          notation = 'd' + die;

      it('should return between 1 and ' + sides + ' for `' + notation + '`', function(){
        // run the tests multiple times for consistency
        for(j = 0; j < loopCount; j++){
          expect(diceRoller.roll(notation)).toBeDiceRoll({
            dieRange: {
              min: 1,
              max: sides
            },
            totalRange: {
              min: 1,
              max: sides
            },
            rolls: [1],
            notation: notation
          });
        }
      });
    }
  });

  describe('fudge dice', function(){
    // create a new instance of the DiceRoller
    var diceRoller,
        dice = ['dF', 'dF.2', 'dF.1'],
        loopCount = 1000,
        i, j;

    beforeEach(function(){
      jasmine.addMatchers(customMatchers);

      diceRoller = new DiceRoller();
      i = 0;
      j = 0;
    });

    // loop through and run the tests for the dice
    for(i = 0; i < dice.length; i++){
      var die = dice[i],
          notation = die;

      // Fudge dice always provide a value between -1 and 1
      it('should be between -1 and 1 for `' + notation + '`', function(){
        // run the tests multiple times for consistency
        for(j = 0; j < loopCount; j++){
          expect(diceRoller.roll(notation)).toBeDiceRoll({
            dieRange: {
              min: -1,
              max: 1
            },
            totalRange: {
              min: -1,
              max: 1
            },
            rolls: [1],
            notation: notation
          });
        }
      });
    }
  });

  describe('multiple dice', function(){
    // create a new instance of the DiceRoller
    var diceRoller,
        dice = [
          {sides: 6, rolls: 4},
          {sides: 10, rolls: 8},
          {sides: 20, rolls: 5}
        ],
        loopCount = 1000,
        i, j;

    beforeEach(function(){
      jasmine.addMatchers(customMatchers);

      diceRoller = new DiceRoller();
      i = 0;
      j = 0;
    });

    for(i = 0; i < dice.length; i++){
      var die = dice[i],
          notation = die.rolls + 'd' + die.sides;

      it('should roll a ' + die.sides + ' sided die ' + die.rolls + ' times', function(){
        // run the tests multiple times for consistency
        for(j = 0; j < loopCount; j++){
          expect(diceRoller.roll(notation)).toBeDiceRoll({
            dieRange: {
              min: 1,
              max: die.sides
            },
            totalRange: {
              min: die.rolls,
              max: die.rolls*die.sides
            },
            rolls: [die.rolls],
            notation: notation
          });
        }
      });
    }

    it('should compute multiple dice rolls for `1d6+2d10`', function(){
      var notation = '1d6+2d10',
          roll = diceRoller.roll(notation),
          total = roll.getTotal();

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 3, max: 26});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [1,2]});

      expect(roll.rolls[0]).toHaveValuesWithinRange({min: 1, max: 6});
      expect(roll.rolls[1]).toHaveValuesWithinRange({min: 1, max: 10});

      expect(roll.rolls).toArraySumEqualTo(total);

      // check the output string
      expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + roll.rolls[0].join(',') + ']+[' + roll.rolls[1].join(',') + ']', total: total});
    });

    it('should compute multiple dice rolls for `3d6*2d10-L`', function(){
      var notation = '3d6*2d10-L',
          roll = diceRoller.roll(notation),
          total = roll.getTotal();

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 3, max: 180});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [3,2]});

      expect(roll.rolls[0]).toHaveValuesWithinRange({min: 1, max: 6});
      expect(roll.rolls[1]).toHaveValuesWithinRange({min: 1, max: 10});

      expect(utils.reduceArray(roll.rolls[0]) * (utils.reduceArray(roll.rolls[1]) - utils.getMin(roll.rolls[1]))).toArraySumEqualTo(total);

      // check the output string
      expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + roll.rolls[0].join(',') + ']*[' + roll.rolls[1].join(',') + ']-L', total: total});
    });

    it('should compute multiple dice rolls for `4d6/2d3`', function(){
      var notation = '4d6/2d3',
          roll = diceRoller.roll(notation),
          total = roll.getTotal();

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 0.66, max: 12});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [4,2]});

      expect(roll.rolls[0]).toHaveValuesWithinRange({min: 1, max: 6});
      expect(roll.rolls[1]).toHaveValuesWithinRange({min: 1, max: 3});

      expect(utils.reduceArray(roll.rolls[0]) / utils.reduceArray(roll.rolls[1])).toArraySumEqualTo(total);

      // check the output string
      expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + roll.rolls[0].join(',') + ']/[' + roll.rolls[1].join(',') + ']', total: total});
    });
  });

  describe('exploding, compounding, and penetrating', function(){
    // create a new instance of the DiceRoller
    var diceRoller,
        loopCount = 1000,
        i;

    beforeEach(function(){
      jasmine.addMatchers(customMatchers);

      diceRoller = new DiceRoller();
      i = 0;
    });

    it('should explode for `1d2!`', function(){
      var notation = '1d2!',
          hasExploded = false;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++){
        var roll = diceRoller.roll(notation),
            total = roll.getTotal();

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        expect(roll.rolls[0]).toExplode({min: 1, max: 2});

        // check the output string
        expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + roll.rolls[0].join('!,') + ']', total: total});

        // determine whether this roll exploded by checking the amount of rolls
        hasExploded = hasExploded || (roll.rolls[0].length > 1);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasExploded).toBeTruthy();
    });

    it('should compound explode for `1d2!!`', function(){
      var notation = '1d2!!',
          hasCompounded = false;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++){
        var roll = diceRoller.roll(notation),
            total = roll.getTotal();

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        // check the output string
        expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + total + ((total > 2) ? '!!' : '') + ']', total: total});

        // determine whether this roll compounded by checking the value of the roll
        hasCompounded = hasCompounded || (total > 2);
      }

      // if we run many rolls, we should expect at least one to have compounded
      expect(hasCompounded).toBeTruthy();
    });

    it('should penetrate for `1d2!p`', function(){
      var notation = '1d2!p',
          hasExploded = false;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++) {
        var roll = diceRoller.roll(notation),
            total = roll.getTotal();

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        expect(roll.rolls[0]).toExplode({min: 1, max: 2, penetrate: true});

        // check the output string
        expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + roll.rolls[0].join('!p,') + ']', total: total});

        // determine whether this roll exploded by checking the amount of rolls
        hasExploded = hasExploded || (roll.rolls[0].length > 1);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasExploded).toBeTruthy();
    });

    it('should penetrate compound for `1d2!!p`', function(){
      var notation = '1d2!!p',
          hasCompounded = false;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++){
        var roll = diceRoller.roll(notation),
            total = roll.getTotal();

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        // check the output string (check for total >= 2, as penetrating subtracts 1, so a second roll of one, would be zero)
        expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + total + ((total >= 2) ? '!!p' : '') + ']', total: total});

        // determine whether this roll compounded by checking the value of the roll
        hasCompounded = hasCompounded || (total >= 2);
      }

      // if we run many rolls, we should expect at least one to have compounded
      expect(hasCompounded).toBeTruthy();
    });

    it('should explode if higher than 1 for `1d6!>1`', function(){
      var notation = '1d6!>1',
          hasExploded = false;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++){
        var roll = diceRoller.roll(notation),
            total = roll.getTotal();

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        expect(roll.rolls[0]).toExplode({min: 1, max: 6, comparePoint: {operator: '>', value: 1}});

        // check the output string
        expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + roll.rolls[0].join('!,') + ']', total: total});

        // determine whether this roll exploded by checking the amount of rolls
        hasExploded = hasExploded || (roll.rolls[0].length > 1);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasExploded).toBeTruthy();
    });

    it('should explode if less than 2 for `1d2!<2`', function(){
      var notation = '1d2!<2',
          hasExploded = false;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++){
        var roll = diceRoller.roll(notation),
            total = roll.getTotal();

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        expect(roll.rolls[0]).toExplode({min: 1, max: 2, comparePoint: {operator: '<', value: 2}});

        // check the output string
        expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + roll.rolls[0].join('!,') + ']', total: total});

        // determine whether this roll exploded by checking the amount of rolls
        hasExploded = hasExploded || (roll.rolls[0].length > 1);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasExploded).toBeTruthy();
    });

    it('should explode if equal to 2 for `1d3!=2`', function(){
      var notation = '1d3!=2',
          hasExploded = false;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++){
        var roll = diceRoller.roll(notation),
            total = roll.getTotal();

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        expect(roll.rolls[0]).toExplode({min: 1, max: 3, comparePoint: {operator: '=', value: 2}});

        // check the output string
        expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + roll.rolls[0].join('!,') + ']', total: total});

        // determine whether this roll exploded by checking the amount of rolls
        hasExploded = hasExploded || (roll.rolls[0].length > 1);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasExploded).toBeTruthy();
    });

    it('should compound if higher than 1 for `1d6!!>1`', function(){
      var notation = '1d6!!>1',
          hasCompounded = false;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++){
        var roll = diceRoller.roll(notation),
            total = roll.getTotal();

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        // check the output string (Compounds if over 1, so any total of 2 or more means that it must have compounded)
        expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + total + ((total >= 2) ? '!!' : '') + ']', total: total});

        // determine whether this roll compounded by checking the value of the roll
        hasCompounded = hasCompounded || (total >= 2);
      }

      // if we run many rolls, we should expect at least one to have compounded
      expect(hasCompounded).toBeTruthy();
    });

    it('should compound if less than 2 for `1d2!!<2`', function(){
      var notation = '1d2!!<2',
          hasCompounded = false;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++){
        var roll = diceRoller.roll(notation),
          total = roll.getTotal();

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        // check the output string (Compounds only on a roll of 1 - if we roll a 1, we roll again;
        // if we then roll a 2, we get a total of 3, if we roll a 1 we get 2 and roll again - so a minimum of 3 if compounding)
        expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + total + ((total > 2) ? '!!' : '') + ']', total: total});

        // determine whether this roll compounded by checking the value of the roll
        hasCompounded = hasCompounded || (total > 2);
      }

      // if we run many rolls, we should expect at least one to have compounded
      expect(hasCompounded).toBeTruthy();
    });

    it('should compound if equal to 2 for `1d2!!=2`', function(){
      var notation = '1d2!!=2',
          hasCompounded = false;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++){
        var roll = diceRoller.roll(notation),
            total = roll.getTotal();

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        // check the output string (Compounds only on a roll of 2 - if we roll a 2, we roll again;
        // if we then roll a 1, we get a total of 3, if we roll a 2 we get 4 and roll again - so a minimum of 5 if compounding)
        expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + total + ((total > 2) ? '!!' : '') + ']', total: total});

        // determine whether this roll compounded by checking the value of the roll
        hasCompounded = hasCompounded || (total > 2);
      }

      // if we run many rolls, we should expect at least one to have compounded
      expect(hasCompounded).toBeTruthy();
    });
  });

  describe('basic equations', function(){
    // create a new instance of the DiceRoller
    var diceRoller;

    beforeEach(function(){
      jasmine.addMatchers(customMatchers);

      diceRoller = new DiceRoller();
    });

    it('should return between 3 and 8 for `1d6+2`', function(){
      var notation = '1d6+2',
          roll = diceRoller.roll(notation),
          total = roll.getTotal();

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 3, max: 8});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [1]});
      expect(roll.rolls).toArraySumEqualTo(total-2);

      // check the output string
      expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + (total-2) + ']+2', total: total});
    });

    it('should return between -1 and 2 for `1d4-2`', function(){
      var notation = '1d4-2',
          roll = diceRoller.roll(notation),
          total = roll.getTotal();

      // check value is within allowed range
      expect(total).toBeWithinRange({min: -1, max: 2});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [1]});
      expect(roll.rolls).toArraySumEqualTo(total+2);

      // check the output string
      expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + (total+2) + ']-2', total: total});
    });

    it('should return between 2 and 20 for `1d10*2`', function(){
      var notation = '1d10*2',
          roll = diceRoller.roll(notation),
          total = roll.getTotal();

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 2, max: 20});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [1]});
      expect(roll.rolls).toArraySumEqualTo(total/2);

      // check the output string
      expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + (total/2) + ']*2', total: total});
    });

    it('should return between 0.5 and 4 for `1d8/2`', function(){
      var notation = '1d8/2',
          roll = diceRoller.roll(notation),
          total = roll.getTotal();

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 0.5, max: 4});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [1]});
      expect(roll.rolls).toArraySumEqualTo(total*2);

      // check the output string
      expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + (total*2) + ']/2', total: total});
    });

    it('should subtract the LOWEST roll for `4d6-L', function(){
      var notation = '4d6-L',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 3, max: 18});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [4]});
      // check if the sum of the rolls (before lowest is subtracted) is equal to the total, with the lowest added
      expect(roll.rolls).toArraySumEqualTo(total + utils.getMin(roll.rolls[0]));

      // check the output string
      expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + (roll.rolls[0].join(',')) + ']-L', total: total});
    });

    it('should add the LOWEST roll for `4d6+L', function(){
      var notation = '4d6+L',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 5, max: 30});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [4]});
      // check if the sum of the rolls (before lowest is added) is equal to the total, with the lowest subtracted
      expect(roll.rolls).toArraySumEqualTo(total - utils.getMin(roll.rolls[0]));

      // check the output string
      expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + (roll.rolls[0].join(',')) + ']+L', total: total});
    });

    it('should multiply by the LOWEST roll for `4d6*L', function(){
      var notation = '4d6*L',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 4, max: 144});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [4]});
      // check if the sum of the rolls (before multiplied by lowest) is equal to the total, divided by the lowest
      expect(roll.rolls).toArraySumEqualTo(total / utils.getMin(roll.rolls[0]));

      // check the output string
      expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + (roll.rolls[0].join(',')) + ']*L', total: total});
    });

    it('should divide by the LOWEST roll for `4d6/L', function(){
      var notation = '4d6/L',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 4, max: 19});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [4]});
      // check if the sum of the rolls (before divided by lowest) is equal to the total, multiplied by the lowest
      expect(roll.rolls).toArraySumEqualTo(total * utils.getMin(roll.rolls[0]));

      // check the output string
      expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + (roll.rolls[0].join(',')) + ']/L', total: total});
    });

    it('should subtract the HIGHEST roll for `4d6-H', function(){
      var notation = '4d6-H',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 3, max: 18});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [4]});
      // check if the sum of the rolls (before highest is subtracted) is equal to the total, with the highest added
      expect(roll.rolls).toArraySumEqualTo(total + utils.getMax(roll.rolls[0]));

      // check the output string
      expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + (roll.rolls[0].join(',')) + ']-H', total: total});
    });

    it('should add the HIGHEST roll for `4d6+H', function(){
      var notation = '4d6+H',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 5, max: 30});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [4]});
      // check if the sum of the rolls (before highest is added) is equal to the total, with the highest subtracted
      expect(roll.rolls).toArraySumEqualTo(total - utils.getMax(roll.rolls[0]));

      // check the output string
      expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + (roll.rolls[0].join(',')) + ']+H', total: total});
    });

    it('should multiply by the HIGHEST roll for `4d6*H', function(){
      var notation = '4d6*H',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 4, max: 144});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [4]});
      // check if the sum of the rolls (before multiplied by highest) is equal to the total, divided by the highest
      expect(roll.rolls).toArraySumEqualTo(total / utils.getMax(roll.rolls[0]));

      // check the output string
      expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + (roll.rolls[0].join(',')) + ']*H', total: total});
    });

    it('should divide by the HIGHEST roll for `4d6/H', function(){
      var notation = '4d6/H',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 1.5, max: 4});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [4]});
      // check if the sum of the rolls (before divided by highest) is equal to the total, multiplied by the highest
      expect(roll.rolls).toArraySumEqualTo(total * utils.getMax(roll.rolls[0]));

      // check the output string
      expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + (roll.rolls[0].join(',')) + ']/H', total: total});
    });

    it('should subtract the LOWEST explode roll for `d6!-L`', function(){
      var notation = 'd6!-L',
        hasExploded = false,
        loopCount = 1000,
        i;

      // loop this roll for consistency (We need it to have exploded at least once)
      for(i = 0; i < loopCount; i++){
        var roll = diceRoller.roll(notation),
          total = roll.getTotal();

        // check value is within allowed range
        expect(total).toBeGreaterThan(-1);

        // check if the sum of the rolls (before lowest is subtracted) is equal to the total, with the lowest added
        expect(roll.rolls).toArraySumEqualTo(total + utils.getMin(roll.rolls[0]));

        // check the output string
        expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + roll.rolls[0].join('!,') + ']-L', total: total});

        // determine whether this roll exploded by checking the amount of rolls
        hasExploded = hasExploded || (roll.rolls[0].length > 1);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasExploded).toBeTruthy();
    });

    it('should subtract the Highest explode roll for `d6!-H`', function(){
      var notation = 'd6!-H',
        hasExploded = false,
        loopCount = 1000,
        i;

      // loop this roll for consistency (We need it to have exploded at least once)
      for(i = 0; i < loopCount; i++){
        var roll = diceRoller.roll(notation),
          total = roll.getTotal();

        // check value is within allowed range
        expect(total).toBeGreaterThan(-1);

        // check if the sum of the rolls (before lowest is subtracted) is equal to the total, with the lowest added
        expect(roll.rolls).toArraySumEqualTo(total + utils.getMax(roll.rolls[0]));

        // check the output string
        expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + roll.rolls[0].join('!,') + ']-H', total: total});

        // determine whether this roll exploded by checking the amount of rolls
        hasExploded = hasExploded || (roll.rolls[0].length > 1);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasExploded).toBeTruthy();
    });

    it('should subtract the LOWEST compound roll for `d6!!-L`', function(){
      var notation = 'd6!!-L',
        hasCompounded = false,
        loopCount = 1000,
        i;

      // loop this roll for consistency (We need it to have exploded at least once)
      for(i = 0; i < loopCount; i++){
        var roll = diceRoller.roll(notation),
          total = roll.getTotal(),
          rollsTotal = utils.reduceArray(roll.rolls);

        // check value is within allowed range
        expect(total).toEqual(0);

        // check if the rolls actually exist
        expect(rollsTotal).toBeGreaterThan(0);

        // check the output string
        expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + rollsTotal + (rollsTotal > 6 ? '!!' : '') + ']-L', total: total});

        // determine whether this roll exploded by checking if the value is greater than the max
        hasCompounded = hasCompounded || (rollsTotal > 6);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasCompounded).toBeTruthy();
    });

    it('should subtract the HIGHEST compound roll for `d6!!-H`', function(){
      var notation = 'd6!!-H',
        hasCompounded = false,
        loopCount = 1000,
        i;

      // loop this roll for consistency (We need it to have exploded at least once)
      for(i = 0; i < loopCount; i++){
        var roll = diceRoller.roll(notation),
          total = roll.getTotal(),
          rollsTotal = utils.reduceArray(roll.rolls);

        // check value is within allowed range
        expect(total).toEqual(0);

        // check if the rolls actually exist
        expect(rollsTotal).toBeGreaterThan(0);

        // check the output string
        expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + rollsTotal + (rollsTotal > 6 ? '!!' : '') + ']-H', total: total});

        // determine whether this roll exploded by checking if the value is greater than the max
        hasCompounded = hasCompounded || (rollsTotal > 6);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasCompounded).toBeTruthy();
    });

    it('should subtract the LOWEST penetrating roll for `d6!p-L`', function(){
      var notation = 'd6!p-L',
        hasExploded = false,
        loopCount = 1000,
        i;

      // loop this roll for consistency (We need it to have exploded at least once)
      for(i = 0; i < loopCount; i++){
        var roll = diceRoller.roll(notation),
          total = roll.getTotal();

        // check value is within allowed range
        expect(total).toBeGreaterThan(-1);

        // check if the sum of the rolls (before lowest is subtracted) is equal to the total, with the lowest added
        expect(roll.rolls).toArraySumEqualTo(total + utils.getMin(roll.rolls[0]));

        // check the output string
        expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + roll.rolls[0].join('!p,') + ']-L', total: total});

        // determine whether this roll exploded by checking the amount of rolls
        hasExploded = hasExploded || (roll.rolls[0].length > 1);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasExploded).toBeTruthy();
    });

    it('should subtract the HIGHEST penetrating roll for `d6!p-H`', function(){
      var notation = 'd6!p-H',
        hasExploded = false,
        loopCount = 1000,
        i;

      // loop this roll for consistency (We need it to have exploded at least once)
      for(i = 0; i < loopCount; i++){
        var roll = diceRoller.roll(notation),
          total = roll.getTotal();

        // check value is within allowed range
        expect(total).toBeGreaterThan(-1);

        // check if the sum of the rolls (before lowest is subtracted) is equal to the total, with the lowest added
        expect(roll.rolls).toArraySumEqualTo(total + utils.getMax(roll.rolls[0]));

        // check the output string
        expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + roll.rolls[0].join('!p,') + ']-H', total: total});

        // determine whether this roll exploded by checking the amount of rolls
        hasExploded = hasExploded || (roll.rolls[0].length > 1);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasExploded).toBeTruthy();
    });
  });

  describe('roll log', function(){
    // create a new instance of the DiceRoller
    var diceRoller = new DiceRoller();

    beforeEach(function(){
      jasmine.addMatchers(customMatchers);
    });

    it('should be no dice rolled', function(){
      expect(diceRoller).not.toHaveLogLength();
      expect(diceRoller.getNotation()).toEqual('');
    });

    it('should have 1 dice rolled', function(){
      diceRoller.roll('d6');

      expect(diceRoller).toHaveLogLength(1);
    });

    it('should be cleared log', function(){
      diceRoller.roll('d6');
      diceRoller.clearLog();

      expect(diceRoller).not.toHaveLogLength();
      expect(diceRoller.getNotation()).toEqual('');
    });

    it('should have 2 dice rolled', function(){
      diceRoller.roll('1d6');
      diceRoller.roll('d10');

      expect(diceRoller).toHaveLogLength(2);
    });
  });
}());
