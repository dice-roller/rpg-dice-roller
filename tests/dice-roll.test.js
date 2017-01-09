/*global beforeEach, describe, DiceRoller, expect, jasmine, it */
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
  // TODO - this should ensure at least the first die explodes, once we have a way of forcing explode
  toExplode: function(util, customEqualityTesters){
    return {
      compare: function(actual, expected){
        var result = {pass: true, message: 'Expected "' + actual + '" NOT to explode'},
            rollList = actual,
            rollI,
            max = expected.max || null,
            min = expected.min || null,
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
              result.message = "Expected " + value + ' to be less than or equal to max';
            }else if (value < min){
              // rolled under min
              result.pass = false;
              result.message = "Expected " + value + ' to be greater than or equal to min';
            }else if((value === max) && (rollList.length === (rollI+1))){
              // rolled max, but didn't explode
              result.pass = false;
              result.message = "Expected " + value + ' to explode';
            }else if((value < max) && (rollList.length > (rollI+1))){
              // rolled under max, but exploded
              result.pass = false;
              result.message = "Expected " + value + ' to NOT explode';
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
  }
};

describe('basic dice', function(){
  'use strict';

  // create a new instance of the DiceRoller
  var diceRoller;

  beforeEach(function(){
    jasmine.addMatchers(customMatchers);

    diceRoller = new DiceRoller();
  });

  it('should return between 1 and 6 for `d6`', function(){
    var notation = 'd6',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

    // check value is within allowed range
    expect(total).toBeWithinRange({min: 1, max: 6});

    // check the rolls list is correct
    expect(roll).toHaveRolls({rolls: [1]});
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
    expect(roll).toHaveRolls({rolls: [1]});
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
    expect(roll).toHaveRolls({rolls: [1]});
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
    expect(roll).toHaveRolls({rolls: [1]});
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
    expect(roll).toHaveRolls({rolls: [1]});
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
    expect(roll).toHaveRolls({rolls: [1]});
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
    expect(roll).toHaveRolls({rolls: [1]});
    expect(roll.rolls).toArraySumEqualTo(total);

    // check the output string
    expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + total + ']', total: total});
  });
});

describe('multiple dice', function(){
  'use strict';

  // create a new instance of the DiceRoller
  var diceRoller;

  beforeEach(function(){
    jasmine.addMatchers(customMatchers);

    diceRoller = new DiceRoller();
  });

  it('should roll a 6 sided die 4 times', function(){
    var notation = '4d6',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

    // check value is within allowed range
    expect(total).toBeWithinRange({min: 4, max: 24});

    // check the rolls list is correct
    expect(roll).toHaveRolls({rolls: [4]});
    expect(roll.rolls[0]).toHaveValuesWithinRange({min: 1, max: 6});
    expect(roll.rolls).toArraySumEqualTo(total);

    // check the output string
    expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + roll.rolls[0].join(',') + ']', total: total});
  });

  it('should roll a 10 sided die 8 times', function(){
    var notation = '8d10',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

    // check value is within allowed range
    expect(total).toBeWithinRange({min: 8, max: 80});

    // check the rolls list is correct
    expect(roll).toHaveRolls({rolls: [8]});
    expect(roll.rolls[0]).toHaveValuesWithinRange({min: 1, max: 10});
    expect(roll.rolls).toArraySumEqualTo(total);

    // check the output string
    expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + roll.rolls[0].join(',') + ']', total: total});
  });

  it('should roll a 20 sided die 5 times', function(){
    var notation = '5d20',
        roll = diceRoller.roll(notation),
        total = roll.getTotal();

    // check value is within allowed range
    expect(total).toBeWithinRange({min: 5, max: 100});

    // check the rolls list is correct
    expect(roll).toHaveRolls({rolls: [5]});
    expect(roll.rolls[0]).toHaveValuesWithinRange({min: 1, max: 20});
    expect(roll.rolls).toArraySumEqualTo(total);

    // check the output string
    expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + roll.rolls[0].join(',') + ']', total: total});
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
    expect(roll).toHaveRolls({rolls: ['*']});
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
    expect(roll).toHaveRolls({rolls: [1]});
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
    expect(roll).toHaveRolls({rolls: ['*']});
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
    expect(roll).toHaveRolls({rolls: [1]});
    expect(roll.rolls).toArraySumEqualTo(total);

    // check the output string (check for total >= 2, as penetrating subtracts 1, so a second roll of one, would be zero)
    expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + total + ((total >= 2) ? '!!p' : '') + ']', total: total});
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
    expect(roll.rolls).toArraySumEqualTo(total + Math.min.apply(this, roll.rolls[0]));

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
    expect(roll.rolls).toArraySumEqualTo(total - Math.min.apply(this, roll.rolls[0]));

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
    expect(roll.rolls).toArraySumEqualTo(total / Math.min.apply(this, roll.rolls[0]));

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
    expect(roll.rolls).toArraySumEqualTo(total * Math.min.apply(this, roll.rolls[0]));

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
    expect(roll.rolls).toArraySumEqualTo(total + Math.max.apply(this, roll.rolls[0]));

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
    expect(roll.rolls).toArraySumEqualTo(total - Math.max.apply(this, roll.rolls[0]));

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
    expect(roll.rolls).toArraySumEqualTo(total / Math.max.apply(this, roll.rolls[0]));

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
    expect(roll.rolls).toArraySumEqualTo(total * Math.max.apply(this, roll.rolls[0]));

    // check the output string
    expect(roll).toMatchParsedNotation({notation: notation, rolls: '[' + (roll.rolls[0].join(',')) + ']/H', total: total});
  });
});

describe('Roll log', function(){
  'use strict';

  // create a new instance of the DiceRoller
  var diceRoller = new DiceRoller();

  beforeEach(function(){
    jasmine.addMatchers(customMatchers);
  });

  it('should be no dice rolled', function(){
    expect(diceRoller).not.toHaveLogLength();
    expect(diceRoller + '').toEqual('No dice rolled');
  });

  it('should have 1 dice rolled', function(){
    diceRoller.roll('d6');

    expect(diceRoller).toHaveLogLength(1);
  });

  it('should be cleared log', function(){
    diceRoller.roll('d6');
    diceRoller.clearLog();

    expect(diceRoller).not.toHaveLogLength();
    expect(diceRoller + '').toEqual('No dice rolled');
  });

  it('should have 2 dice rolled', function(){
    diceRoller.roll('1d6');
    diceRoller.roll('d10');

    expect(diceRoller).toHaveLogLength(2);
  });
});

// TODO - check H|L dice on exploding, compounding, penetrating, fudge
// TODO - test compare point
// TODO - test notation segments (additional dice, multiplication etc.)
