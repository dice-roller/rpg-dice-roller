/*global describe it expect */
describe('basic dice', function(){
  'use strict';

  // create a new instance of the DiceRoller
  var diceRoller;

  beforeEach(function(){
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
