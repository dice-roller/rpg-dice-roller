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
    var roll = diceRoller.roll('1d6');

    expect(roll.getTotal()).toEqual(jasmine.any(Number));
    expect(roll.getTotal()).toBeGreaterThan(0);
    expect(roll.getTotal()).toBeLessThan(7);
    expect(roll).toMatch(/1d6: \[([1-6])\] = \1/);
  });

  it('should return between 1 and 10 for `1d10`', function(){
    var roll = diceRoller.roll('1d10');

    expect(roll.getTotal()).toEqual(jasmine.any(Number));
    expect(roll.getTotal()).toBeGreaterThan(0);
    expect(roll.getTotal()).toBeLessThan(11);
    expect(roll).toMatch(/1d10: \[([1-9]|10)\] = \1/);
  });

  it('should return between 1 and 20 for `1d20`', function(){
    var roll = diceRoller.roll('1d20');

    expect(roll.getTotal()).toEqual(jasmine.any(Number));
    expect(roll.getTotal()).toBeGreaterThan(0);
    expect(roll.getTotal()).toBeLessThan(21);
    expect(roll).toMatch(/1d20: \[(1?[1-9]|[1-2]0)\] = \1/);
  });

  it('should be a percentage for `1d%`', function(){
    var roll = diceRoller.roll('1d%');

    expect(roll.getTotal()).toEqual(jasmine.any(Number));
    expect(roll.getTotal()).toBeGreaterThan(-1);
    expect(roll.getTotal()).toBeLessThan(101);
    expect(roll).toMatch(/1d%: \[(0|[1-9][0-9]|100)\] = \1/);
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
    var roll = diceRoller.roll('dF');

    expect(roll.getTotal()).toEqual(jasmine.any(Number));
    expect(roll.getTotal()).toBeGreaterThan(-2);
    expect(roll.getTotal()).toBeLessThan(2);
    expect(roll).toMatch(/dF: \[(-?1|0)\] = \1/);
  });

  // `dF` or `dF.2` equates mathematically to `1d3 - 2`
  it('should be between -1 and 1 for `dF.2`', function(){
    var roll = diceRoller.roll('dF.2');

    expect(roll.getTotal()).toEqual(jasmine.any(Number));
    expect(roll.getTotal()).toBeGreaterThan(-2);
    expect(roll.getTotal()).toBeLessThan(2);
    expect(roll).toMatch(/dF.2: \[(-?1|0)\] = \1/);
  });

  it('should be between -1 and 1 for `dF.1`', function(){
    var roll = diceRoller.roll('dF.1');

    expect(roll.getTotal()).toEqual(jasmine.any(Number));
    expect(roll.getTotal()).toBeGreaterThan(-2);
    expect(roll.getTotal()).toBeLessThan(2);
    expect(roll).toMatch(/dF.1: \[(-?1|0)\] = \1/);
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
    var roll = diceRoller.roll('1d6+2');

    expect(roll.getTotal()).toEqual(jasmine.any(Number));
    expect(roll.getTotal()).toBeGreaterThan(2);
    expect(roll.getTotal()).toBeLessThan(9);
    expect(roll).toMatch(/1d6\+2: \[([1-6])\]\+2 = [3-8]/);
    // check for a single roll recorded
    expect(roll.rolls.length && roll.rolls[0].length).toEqual(1);
    // check that the roll is equal to the total minus 2
    expect(roll.getTotal() - 2).toEqual(roll.rolls[0][0]);
  });

  it('should return between -1 and 2 for `1d4-2`', function(){
    var roll = diceRoller.roll('1d4-2');

    expect(roll.getTotal()).toEqual(jasmine.any(Number));
    expect(roll.getTotal()).toBeGreaterThan(-2);
    expect(roll.getTotal()).toBeLessThan(3);
    expect(roll).toMatch(/1d4-2: \[([1-4])\]-2 = (-1|[0-2])/);
    // check for a single roll recorded
    expect(roll.rolls.length && roll.rolls[0].length).toEqual(1);
    // check that the roll is equal to the total * 2
    expect(roll.getTotal() + 2).toEqual(roll.rolls[0][0]);
  });

  it('should return between 2 and 20 for `1d10*2`', function(){
    var roll = diceRoller.roll('1d10*2');

    expect(roll.getTotal()).toEqual(jasmine.any(Number));
    expect(roll.getTotal()).toBeGreaterThan(1);
    expect(roll.getTotal()).toBeLessThan(21);
    expect(roll).toMatch(/1d10\*2: \[([1-9]|10)\]\*2 = ([2-9]|1[0-9]|20)/);
    // check for a single roll recorded
    expect(roll.rolls.length && roll.rolls[0].length).toEqual(1);
    // check that the roll is equal to the total / 2
    expect(roll.getTotal() / 2).toEqual(roll.rolls[0][0]);
  });

  it('should return between 0.5 and 4 for `1d8/2`', function(){
    var roll = diceRoller.roll('1d8/2');

    expect(roll.getTotal()).toEqual(jasmine.any(Number));
    expect(roll.getTotal()).toBeGreaterThan(0.4);
    expect(roll.getTotal()).toBeLessThan(4.1);
    expect(roll).toMatch(/1d8\/2: \[([1-8])\]\/2 = (0.5|[1-3](.[1-9]+)?|4)/);
    // check for a single roll recorded
    expect(roll.rolls.length && roll.rolls[0].length).toEqual(1);
    // check that the roll is equal to the total * 2
    expect(roll.getTotal() * 2).toEqual(roll.rolls[0][0]);
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
    var roll = diceRoller.roll('1d2!');

    expect(roll.getTotal()).toEqual(jasmine.any(Number));
    expect(roll.getTotal()).toBeGreaterThan(0);
    expect(roll).toMatch(/1d2!: \[([1-6](!,[1-6])*)\] = [1-9][0-9]*/);
    // check for a rolls recorded
    expect(roll.rolls.length && roll.rolls[0].length).toBeTruthy(1);
    // check that the individual rolls are equal to the total
    expect(roll.getTotal()).toEqual(roll.rolls[0].reduce(function(a, b){ return a+b; }));
  });

  // TODO - can we force this to compound
  it('could compound for `1d2!!`', function(){
    var roll = diceRoller.roll('1d2!!');

    expect(roll.getTotal()).toEqual(jasmine.any(Number));
    expect(roll.getTotal()).toBeGreaterThan(0);
    expect(roll).toMatch(/1d2!!: \[(?:([1-9][0-9]*)(?:!!)?)\] = \1/);
    // check for a rolls recorded
    expect(roll.rolls.length && roll.rolls[0].length).toBeTruthy(1);
    // check that the individual rolls are equal to the total
    expect(roll.getTotal()).toEqual(roll.rolls[0][0]);
  });

  // TODO - can we force this to penetrate
  it('could penetrate for `1d2!p`', function(){
    var roll = diceRoller.roll('1d2!p');

    expect(roll.getTotal()).toEqual(jasmine.any(Number));
    expect(roll.getTotal()).toBeGreaterThan(0);
    expect(roll).toMatch(/1d2!p: \[([1-6](?:(?:!p)?,[0-6])*)\] = [1-9][0-9]*/);
    // check for a rolls recorded
    expect(roll.rolls.length && roll.rolls[0].length).toBeTruthy(1);
    // check that the individual rolls are equal to the total
    expect(roll.getTotal()).toEqual(roll.rolls[0].reduce(function(a, b){ return a+b; }));
  });

  // TODO - can we force this to penetrate compound
  it('could penetrate compound for `1d2!!p`', function(){
    var roll = diceRoller.roll('1d2!!p');

    expect(roll.getTotal()).toEqual(jasmine.any(Number));
    expect(roll.getTotal()).toBeGreaterThan(0);
    expect(roll).toMatch(/1d2!!p: \[(?:([1-9][0-9]*)(?:!!p)?)\] = \1/);
    // check for a rolls recorded
    expect(roll.rolls.length && roll.rolls[0].length).toBeTruthy(1);
    // check that the individual rolls are equal to the total
    expect(roll.getTotal()).toEqual(roll.rolls[0][0]);
  });
});

// TODO - test log clearing
// TODO - check H|L dice
// TODO - test compare point
// TODO - test multiple dice in single equation
