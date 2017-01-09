var customMatchers = {
  toBeWithinRange: function(util,customEqualityTesters){
    return {
      compare: function(actual, expected){
        var result = {pass: true};

        if((actual < expected.min) || (actual > expected.max)){
          result.pass = false;
          result.message = 'Expected ' + actual + ' to be within range: ' + expected.min + ' - ' + expected.max;
        }

        return result;
      }
    };
  },
  toArraySumEqualTo: function(util,customEqualityTesters){
    return {
      compare: function(actual, expected){
        //expect(roll.rolls[0].reduce(function(a, b){ return a+b; })).toEqual(total);
        var result = {pass: true},
            reduce = function(obj){
              if(Array.isArray(obj)){
                return obj.reduce(function(a, b){

                  return reduce(a) + reduce(b);
                }, 0);
              }else{
                return obj;
              }
            },
            sum = reduce(actual);

        if(sum !== expected){
          result.pass = false;
          result.message = 'Expected Array sum ' + sum + ' to equal ' + actual;
        }

        return result;
      }
    };
  },
  toHaveRolls: function(util,customEqualityTesters){
    return {
      compare: function(actual, expected){
        var result = {pass: true},
            rolls = actual.rolls,
            rollsReq = expected ? expected.rolls : null,
            rollI;

        if(!rolls.length) {
          result.pass = false;
          result.message = 'Expected "' + actual + '" to have rolls';
        }else if(rollsReq && (rollsReq.length != rolls.length)){
          result.pass = false;
          result.message = 'Expected "' + actual + '" to have ' + rollsReq.length + ' rolls';
        }else{
          // loop through each roll and ensure that it has rolls (multiples for exploded)
          for(rollI in rolls){
            if(!rolls[rollI].length){
              result.pass = false;
              result.message = 'Expected "' + actual + '" roll index "' + rollI + '" to have roll values'
            }else if(rollsReq && rollsReq[rollI] && (rollsReq[rollI] != '*') && (rollsReq[rollI] != rolls[rollI].length)){
              // roll length doesn't match expected (Ignore *, which means unlimited)
              result.message = 'Expected "' + actual + '" roll index "' + rollI + '" to have ' + rollsReq[rollI] + ' rolls'
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
        var result = {pass: true},
            rollList = actual,
            rollI,
            max = expected.max || null,
            min = expected.min || null,
            penetrating = !!expected.penetrate;

        if(!max || !min){
          result.pass = false;
          result.message = "Expected explode argument to provide max and min";
        }else{
          for(rollI in rollList){
            var value = rollList[rollI];

            if(penetrating && (rollI == 1)){
              // we need to compensate for the -1 on consecutive rolls when penetrating
              max--;
              min--;
            }

            if(value > max){
              // rolled over max
              result.pass = false;
              result.message = "Expected " + value + ' to be less than max';
            }else if (value < min){
              // rolled under min
              result.pass = false;
              result.message = "Expected " + value + ' to be greater than min';
            }else if((value == max) && (rollList.length === (rollI+1))){
              // rolled max, but didn't explode
              result.pass = false;
              result.message = "Expected " + value + ' to explode';
            }else if((value < max) && (rollList.length > (rollI+1))){
              // rolled under max, but exploded
              result.pass = false;
              result.message = "Expected " + value + ' to NOT explode';
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
        var result = {pass: true},
            toMatch = expected.notation + ': ' + expected.rolls + ' = ' + expected.total;

        if(actual != toMatch){
          result.pass = false;
          result.message = 'Expected "' + actual + '" to match parsed notation "' + toMatch + '"';
        }

        return result;
      }
    };
  }
};

/*global describe it expect */
describe('basic dice', function(){
  'use strict';

  // create a new instance of the DiceRoller
  var diceRoller;

  beforeEach(function(){
    jasmine.addMatchers(customMatchers);

    diceRoller = new DiceRoller();
  });

  it('should be no dice rolled', function(){
    expect(diceRoller.getLog()).toEqual([]);
  });

  it('should return between 1 and 6 for `1d6`', function(){
    var notation = '1d6',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

    // check value is within allowed range
    expect(total).toBeWithinRange({min: 1, max: 6});

    // check the rolls list is correct
    expect(roll).toHaveRolls({rolls: [[1]]});
    expect(roll.rolls).toArraySumEqualTo(total);

    // check the output string
    expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + total + ']', total: total});
  });

  it('should return between 1 and 10 for `1d10`', function(){
    var notation = '1d10',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

    // check value is within allowed range
    expect(total).toBeWithinRange({min: 1, max: 10});

    // check the rolls list is correct
    expect(roll).toHaveRolls({rolls: [[1]]});
    expect(roll.rolls).toArraySumEqualTo(total);

    // check the output string
    expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + total + ']', total: total});
  });

  it('should return between 1 and 20 for `1d20`', function(){
    var notation = '1d20',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

    // check value is within allowed range
    expect(total).toBeWithinRange({min: 1, max: 20});

    // check the rolls list is correct
    expect(roll).toHaveRolls({rolls: [[1]]});
    expect(roll.rolls).toArraySumEqualTo(total);

    // check the output string
    expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + total + ']', total: total});
  });

  it('should be a percentage for `1d%`', function(){
    var notation = '1d%',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

    // check value is within allowed range
    expect(total).toBeWithinRange({min: 0, max: 100});

    // check the rolls list is correct
    expect(roll).toHaveRolls({rolls: [[1]]});
    expect(roll.rolls).toArraySumEqualTo(total);

    // check the output string
    expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + total + ']', total: total});
  });
});

describe('fudge dice', function(){
  'use strict';

  // create a new instance of the DiceRoller
  var diceRoller;

  beforeEach(function(){
    jasmine.addMatchers(customMatchers);

    diceRoller = new DiceRoller();
  });

  // `dF` or `dF.2` equates mathematically to `1d3 - 2`
  it('should be between -1 and 1 for `dF`', function(){
    var notation = 'dF',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

    // check value is within allowed range
    expect(total).toBeWithinRange({min: -1, max: 1});

    // check the rolls list is correct
    expect(roll).toHaveRolls({rolls: [[1]]});
    expect(roll.rolls).toArraySumEqualTo(total);

    // check the output string
    expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + total + ']', total: total});
  });

  // `dF` or `dF.2` equates mathematically to `1d3 - 2`
  it('should be between -1 and 1 for `dF.2`', function(){
    var notation = 'dF.2',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

    // check value is within allowed range
    expect(total).toBeWithinRange({min: -1, max: 1});

    // check the rolls list is correct
    expect(roll).toHaveRolls({rolls: [[1]]});
    expect(roll.rolls).toArraySumEqualTo(total);

    // check the output string
    expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + total + ']', total: total});
  });

  it('should be between -1 and 1 for `dF.1`', function(){
    var notation = 'dF.1',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

    // check value is within allowed range
    expect(total).toBeWithinRange({min: -1, max: 1});

    // check the rolls list is correct
    expect(roll).toHaveRolls({rolls: [[1]]});
    expect(roll.rolls).toArraySumEqualTo(total);

    // check the output string
    expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + total + ']', total: total});
  });
});

describe('basic equations', function(){
  'use strict';

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
    expect(roll).toHaveRolls({rolls: [[1]]});
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
    expect(roll).toHaveRolls({rolls: [[1]]});
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
    expect(roll).toHaveRolls({rolls: [[1]]});
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
    expect(roll).toHaveRolls({rolls: [[1]]});
    expect(roll.rolls).toArraySumEqualTo(total*2);

    // check the output string
    expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + (total*2) + ']/2', total: total});
  });
});

describe('exploding, compounding, and penetrating', function(){
  'use strict';

  // create a new instance of the DiceRoller
  var diceRoller;

  beforeEach(function(){
    jasmine.addMatchers(customMatchers);

    diceRoller = new DiceRoller();
  });

  // TODO - can we force this to explode
  it('could explode for `1d2!`', function(){
    var notation = '1d2!',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

    // check value is within allowed range
    expect(total).toBeGreaterThan(0);

    // check the rolls list is correct
    expect(roll).toHaveRolls({rolls: [['*']]});
    expect(roll.rolls).toArraySumEqualTo(total);

    expect(roll.rolls[0]).toExplode({min: 1, max: 2});

    // check the output string
    expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + roll.rolls[0].join('!,') + ']', total: total});
  });

  // TODO - can we force this to compound
  it('could compound explode for `1d2!!`', function(){
    var notation = '1d2!!',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

    // check value is within allowed range
    expect(total).toBeGreaterThan(0);

    // check the rolls list is correct
    expect(roll).toHaveRolls({rolls: [[1]]});
    expect(roll.rolls).toArraySumEqualTo(total);

    // check the output string
    expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + total + ((total > 2) ? '!!' : '') + ']', total: total});
  });

  // TODO - can we force this to penetrate
  it('could penetrate for `1d2!p`', function(){
    var notation = '1d2!p',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

    // check value is within allowed range
    expect(total).toBeGreaterThan(0);

    // check the rolls list is correct
    expect(roll).toHaveRolls({rolls: [['*']]});
    expect(roll.rolls).toArraySumEqualTo(total);

    expect(roll.rolls[0]).toExplode({min: 1, max: 2, penetrate: true});

    // check the output string
    expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + roll.rolls[0][0] + (roll.rolls[0].length > 1 ? '!p,' + roll.rolls[0].slice(1).join(',') : '') + ']', total: total});
  });

  // TODO - can we force this to penetrate compound
  it('could penetrate compound for `1d2!!p`', function(){
    var notation = '1d2!!p',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

    // check value is within allowed range
    expect(total).toBeGreaterThan(0);

    // check the rolls list is correct
    expect(roll).toHaveRolls({rolls: [[1]]});
    expect(roll.rolls).toArraySumEqualTo(total);

    // check the output string (check for total >= 2, as penetrating subtracts 1, so a second roll of one, would be zero)
    expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + total + ((total >= 2) ? '!!p' : '') + ']', total: total});
  });
});

// TODO - test log clearing
// TODO - check H|L dice
// TODO - test compare point
// TODO - test multiple dice in single equation
