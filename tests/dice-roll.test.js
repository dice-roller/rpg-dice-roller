/*global beforeEach, describe, DiceRoller, DiceRoll, expect, jasmine, it, utils */
;(function(){
  'use strict';

  describe('basic dice', function(){
    // create a new instance of the DiceRoller
    var diceRoller,
        dice = [4, 6, 10, 20, '%'],
        loopCount = 1000,
        i, j;

    beforeEach(function(){
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
        var roll;

        // run the tests multiple times for consistency
        for(j = 0; j < loopCount; j++){
          roll = diceRoller.roll(notation);

          expect(roll).toEqual(jasmine.any(DiceRoll));

          expect(roll).toBeDiceRoll({
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
        var roll;

        // run the tests multiple times for consistency
        for(j = 0; j < loopCount; j++){
          roll = diceRoller.roll(notation);

          expect(roll).toEqual(jasmine.any(DiceRoll));

          expect(roll).toBeDiceRoll({
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
      diceRoller = new DiceRoller();
      i = 0;
      j = 0;
    });

    for(i = 0; i < dice.length; i++){
      var die = dice[i],
          notation = die.rolls + 'd' + die.sides;

      it('should roll a ' + die.sides + ' sided die ' + die.rolls + ' times', function(){
        var roll;

        // run the tests multiple times for consistency
        for(j = 0; j < loopCount; j++){
          roll = diceRoller.roll(notation);

          expect(roll).toEqual(jasmine.any(DiceRoll));

          expect(roll).toBeDiceRoll({
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

      expect(roll).toEqual(jasmine.any(DiceRoll));

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

      expect(roll).toEqual(jasmine.any(DiceRoll));

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

      expect(roll).toEqual(jasmine.any(DiceRoll));

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
      diceRoller = new DiceRoller();
      i = 0;
    });

    it('should explode for `1d2!`', function(){
      var notation = '1d2!',
          hasExploded = false,
          roll, total;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++){
        roll = diceRoller.roll(notation);
        total = roll.getTotal();

        expect(roll).toEqual(jasmine.any(DiceRoll));

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
          hasCompounded = false,
          roll, total;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++){
        roll = diceRoller.roll(notation);
        total = roll.getTotal();

        expect(roll).toEqual(jasmine.any(DiceRoll));

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
          hasExploded = false,
          roll, total;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++) {
        roll = diceRoller.roll(notation);
        total = roll.getTotal();

        expect(roll).toEqual(jasmine.any(DiceRoll));

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
          hasCompounded = false,
          roll, total;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++){
        roll = diceRoller.roll(notation);
        total = roll.getTotal();

        expect(roll).toEqual(jasmine.any(DiceRoll));

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

    it('should penetrate compound for `2d2!!p', function(){
      var notation = '2d2!!p',
          hasCompounded = false,
          roll, total;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++){
        roll = diceRoller.roll(notation);
        total = roll.getTotal();

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        // ideally we should check notation output here, but I can't see a sensible way of doing this correctly

        // determine whether this roll compounded by checking the value of the roll
        hasCompounded = hasCompounded || (total >= 4);
      }

      // if we run many rolls, we should expect at least one to have compounded
      expect(hasCompounded).toBeTruthy();
    });

    it('should explode if higher than 1 for `1d6!>1`', function(){
      var notation = '1d6!>1',
          hasExploded = false,
          roll, total;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++){
        roll = diceRoller.roll(notation);
        total = roll.getTotal();

        expect(roll).toEqual(jasmine.any(DiceRoll));

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
          hasExploded = false,
          roll, total;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++){
        roll = diceRoller.roll(notation);
        total = roll.getTotal();

        expect(roll).toEqual(jasmine.any(DiceRoll));

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
          hasExploded = false,
          roll, total;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++){
        roll = diceRoller.roll(notation);
        total = roll.getTotal();

        expect(roll).toEqual(jasmine.any(DiceRoll));

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
          hasCompounded = false,
          roll, total;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++){
        roll = diceRoller.roll(notation);
        total = roll.getTotal();

        expect(roll).toEqual(jasmine.any(DiceRoll));

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
          hasCompounded = false,
          roll, total;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++){
        roll = diceRoller.roll(notation);
        total = roll.getTotal();

        expect(roll).toEqual(jasmine.any(DiceRoll));

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
          hasCompounded = false,
          roll, total;

      // loop this roll for consistency
      for(i = 0; i < loopCount; i++){
        roll = diceRoller.roll(notation);
        total = roll.getTotal();

        expect(roll).toEqual(jasmine.any(DiceRoll));

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
      diceRoller = new DiceRoller();
    });

    it('should return between 3 and 8 for `1d6+2`', function(){
      var notation = '1d6+2',
          roll = diceRoller.roll(notation),
          total = roll.getTotal();

      expect(roll).toEqual(jasmine.any(DiceRoll));

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

      expect(roll).toEqual(jasmine.any(DiceRoll));

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

      expect(roll).toEqual(jasmine.any(DiceRoll));

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

      expect(roll).toEqual(jasmine.any(DiceRoll));

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

      expect(roll).toEqual(jasmine.any(DiceRoll));

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

      expect(roll).toEqual(jasmine.any(DiceRoll));

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

      expect(roll).toEqual(jasmine.any(DiceRoll));

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

      expect(roll).toEqual(jasmine.any(DiceRoll));

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

      expect(roll).toEqual(jasmine.any(DiceRoll));

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

      expect(roll).toEqual(jasmine.any(DiceRoll));

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

      expect(roll).toEqual(jasmine.any(DiceRoll));

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

      expect(roll).toEqual(jasmine.any(DiceRoll));

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
        i, roll, total;

      // loop this roll for consistency (We need it to have exploded at least once)
      for(i = 0; i < loopCount; i++){
        roll = diceRoller.roll(notation);
        total = roll.getTotal();

        expect(roll).toEqual(jasmine.any(DiceRoll));

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
        i, roll, total;

      // loop this roll for consistency (We need it to have exploded at least once)
      for(i = 0; i < loopCount; i++){
        roll = diceRoller.roll(notation);
        total = roll.getTotal();

        expect(roll).toEqual(jasmine.any(DiceRoll));

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
        i, roll, total, rollsTotal;

      // loop this roll for consistency (We need it to have exploded at least once)
      for(i = 0; i < loopCount; i++){
        roll = diceRoller.roll(notation);
        total = roll.getTotal();
        rollsTotal = utils.reduceArray(roll.rolls);

        expect(roll).toEqual(jasmine.any(DiceRoll));

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
        i, roll, total, rollsTotal;

      // loop this roll for consistency (We need it to have exploded at least once)
      for(i = 0; i < loopCount; i++){
        roll = diceRoller.roll(notation);
        total = roll.getTotal();
        rollsTotal = utils.reduceArray(roll.rolls);

        expect(roll).toEqual(jasmine.any(DiceRoll));

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
        i, roll, total;

      // loop this roll for consistency (We need it to have exploded at least once)
      for(i = 0; i < loopCount; i++){
        roll = diceRoller.roll(notation);
        total = roll.getTotal();

        expect(roll).toEqual(jasmine.any(DiceRoll));

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
        i, roll, total;

      // loop this roll for consistency (We need it to have exploded at least once)
      for(i = 0; i < loopCount; i++){
        roll = diceRoller.roll(notation);
        total = roll.getTotal();

        expect(roll).toEqual(jasmine.any(DiceRoll));

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
    var diceRoller;

    beforeEach(function(){
      // create a new instance of the DiceRoller
      diceRoller = new DiceRoller();
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

    it('should contain DiceRolls', function(){
      diceRoller.roll('1d6');
      diceRoller.roll('8d10');
      diceRoller.roll('dF');

      // loop through and check that each item in the log is actually a DiceRoll
      diceRoller.getLog().forEach(function(roll){
        expect(roll).toEqual(jasmine.any(DiceRoll));
      });
    });
  });
}());
