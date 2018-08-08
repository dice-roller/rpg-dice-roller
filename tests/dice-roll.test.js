/*global beforeEach, describe, DiceRoller, DiceRoll, expect, jasmine, it, utils */
;(() => {
  'use strict';

  const loopCount = 1000;

  describe('basic dice', () => {
    const dice = [4, 6, 10, 20, '%'];
    let diceRoller;

    beforeEach(() => {
      // create a new instance of the DiceRoller
      diceRoller = new DiceRoller();
    });

    // loop through and run the tests for the dice
    for(let i = 0; i < dice.length; i++){
      const die = dice[i],
            sides = die === '%' ? 100 : die,
            notation = 'd' + die;

      it(`should return between 1 and ${sides} for \`${notation}\``, () => {
        // run the tests multiple times for consistency
        for(let j = 0; j < loopCount; j++){
          const roll = diceRoller.roll(notation);

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

  describe('fudge dice', () => {
    const dice = ['dF', 'dF.2', 'dF.1'];
    let diceRoller;

    beforeEach(() => {
      // create a new instance of the DiceRoller
      diceRoller = new DiceRoller();
    });

    // loop through and run the tests for the dice
    for(let i = 0; i < dice.length; i++){
      const die = dice[i],
            notation = die;

      // Fudge dice always provide a value between -1 and 1
      it(`should be between -1 and 1 for \`${notation}\``, () => {
        // run the tests multiple times for consistency
        for(let j = 0; j < loopCount; j++){
          const roll = diceRoller.roll(notation);

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

  describe('multiple dice', () => {
    const dice = [
      {sides: 6, rolls: 4},
      {sides: 10, rolls: 8},
      {sides: 20, rolls: 5}
    ];
    let diceRoller;

    beforeEach(() => {
      // create a new instance of the DiceRoller
      diceRoller = new DiceRoller();
    });

    for(let i = 0; i < dice.length; i++){
      const die = dice[i],
            notation = `${die.rolls}d${die.sides}`;

      it(`should roll a ${die.sides} sided die ${die.rolls} times`, () => {
        // run the tests multiple times for consistency
        for(let j = 0; j < loopCount; j++){
          const roll = diceRoller.roll(notation);

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

    it('should compute multiple dice rolls for `1d6+2d10`', () => {
      const notation = '1d6+2d10',
            roll = diceRoller.roll(notation),
            total = roll.total;

      expect(roll).toEqual(jasmine.any(DiceRoll));

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 3, max: 26});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [1,2]});

      expect(roll.rolls[0]).toHaveValuesWithinRange({min: 1, max: 6});
      expect(roll.rolls[1]).toHaveValuesWithinRange({min: 1, max: 10});

      expect(roll.rolls).toArraySumEqualTo(total);

      // check the output string
      expect(roll).toMatchParsedNotation({
        notation: notation,
        rolls: `[${roll.rolls[0].join(',')}]+[${roll.rolls[1].join(',')}]`,
        total: total,
      });
    });

    it('should compute multiple dice rolls for `3d6*2d10-L`', () => {
      const notation = '3d6*2d10-L',
            roll = diceRoller.roll(notation),
            total = roll.total;

      expect(roll).toEqual(jasmine.any(DiceRoll));

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 3, max: 180});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [3,2]});

      expect(roll.rolls[0]).toHaveValuesWithinRange({min: 1, max: 6});
      expect(roll.rolls[1]).toHaveValuesWithinRange({min: 1, max: 10});

      expect(utils.reduceArray(roll.rolls[0]) * (utils.reduceArray(roll.rolls[1]) - utils.getMin(roll.rolls[1]))).toArraySumEqualTo(total);

      // check the output string
      expect(roll).toMatchParsedNotation({
        notation: notation,
        rolls: `[${roll.rolls[0].join(',')}]*[${roll.rolls[1].join(',')}]-L`,
        total: total,
      });
    });

    it('should compute multiple dice rolls for `4d6/2d3`', () => {
      const notation = '4d6/2d3',
            roll = diceRoller.roll(notation),
            total = roll.total;

      expect(roll).toEqual(jasmine.any(DiceRoll));

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 0.66, max: 12});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [4,2]});

      expect(roll.rolls[0]).toHaveValuesWithinRange({min: 1, max: 6});
      expect(roll.rolls[1]).toHaveValuesWithinRange({min: 1, max: 3});

      expect(utils.reduceArray(roll.rolls[0]) / utils.reduceArray(roll.rolls[1])).toArraySumEqualTo(total);

      // check the output string
      expect(roll).toMatchParsedNotation({
        notation: notation,
        rolls: `[${roll.rolls[0].join(',')}]/[${roll.rolls[1].join(',')}]`,
        total: total,
      });
    });
  });

  describe('exploding, compounding, and penetrating', () => {
    let diceRoller;

    beforeEach(() => {
      // create a new instance of the DiceRoller
      diceRoller = new DiceRoller();
    });

    it('should explode for `1d2!`', () => {
      const notation = '1d2!';
      let hasExploded = false;

      // loop this roll for consistency
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              total = roll.total;

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        expect(roll.rolls[0]).toExplode({min: 1, max: 2});

        // check the output string
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${roll.rolls[0].join('!,')}]`,
          total: total,
        });

        // determine whether this roll exploded by checking the amount of rolls
        hasExploded = hasExploded || (roll.rolls[0].length > 1);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasExploded).toBeTruthy();
    });

    it('should compound explode for `1d2!!`', () => {
      const notation = '1d2!!';
      let hasCompounded = false;

      // loop this roll for consistency
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              total = roll.total;

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        // check the output string
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${total}${(total > 2) ? '!!' : ''}]`,
          total: total,
        });

        // determine whether this roll compounded by checking the value of the roll
        hasCompounded = hasCompounded || (total > 2);
      }

      // if we run many rolls, we should expect at least one to have compounded
      expect(hasCompounded).toBeTruthy();
    });

    it('should penetrate for `1d2!p`', () => {
      const notation = '1d2!p';
      let hasExploded = false;

      // loop this roll for consistency
      for(let i = 0; i < loopCount; i++) {
        const roll = diceRoller.roll(notation),
              total = roll.total;

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        expect(roll.rolls[0]).toExplode({min: 1, max: 2, penetrate: true});

        // check the output string
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${roll.rolls[0].join('!p,')}]`,
          total: total,
        });

        // determine whether this roll exploded by checking the amount of rolls
        hasExploded = hasExploded || (roll.rolls[0].length > 1);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasExploded).toBeTruthy();
    });

    it('should penetrate compound for `1d2!!p`', () => {
      const notation = '1d2!!p';
      let hasCompounded = false;

      // loop this roll for consistency
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              total = roll.total;

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        // check the output string (check for total >= 2, as penetrating subtracts 1, so a second roll of one, would be zero)
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${total}${(total >= 2) ? '!!p' : ''}]`,
          total: total,
        });

        // determine whether this roll compounded by checking the value of the roll
        hasCompounded = hasCompounded || (total >= 2);
      }

      // if we run many rolls, we should expect at least one to have compounded
      expect(hasCompounded).toBeTruthy();
    });

    it('should penetrate compound for `2d2!!p', () => {
      const notation = '2d2!!p';
      let hasCompounded = false;

      // loop this roll for consistency
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              total = roll.total;

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

    it('should explode if higher than 1 for `1d6!>1`', () => {
      const notation = '1d6!>1';
      let hasExploded = false;

      // loop this roll for consistency
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              total = roll.total;

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        expect(roll.rolls[0]).toExplode({
          min: 1,
          max: 6,
          comparePoint: {
            operator: '>',
            value: 1,
          },
        });

        // check the output string
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${roll.rolls[0].join('!,')}]`,
          total: total,
        });

        // determine whether this roll exploded by checking the amount of rolls
        hasExploded = hasExploded || (roll.rolls[0].length > 1);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasExploded).toBeTruthy();
    });

    it('should explode if less than 2 for `1d2!<2`', () => {
      const notation = '1d2!<2';
      let hasExploded = false;

      // loop this roll for consistency
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              total = roll.total;

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        expect(roll.rolls[0]).toExplode({
          min: 1,
          max: 2,
          comparePoint: {
            operator: '<',
            value: 2,
          },
        });

        // check the output string
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${roll.rolls[0].join('!,')}]`,
          total: total,
        });

        // determine whether this roll exploded by checking the amount of rolls
        hasExploded = hasExploded || (roll.rolls[0].length > 1);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasExploded).toBeTruthy();
    });

    it('should explode if equal to 2 for `1d3!=2`', () => {
      const notation = '1d3!=2';
      let hasExploded = false;

      // loop this roll for consistency
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              total = roll.total;

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        expect(roll.rolls[0]).toExplode({
          min: 1,
          max: 3,
          comparePoint: {
            operator: '=',
            value: 2,
          },
        });

        // check the output string
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${roll.rolls[0].join('!,')}]`,
          total: total,
        });

        // determine whether this roll exploded by checking the amount of rolls
        hasExploded = hasExploded || (roll.rolls[0].length > 1);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasExploded).toBeTruthy();
    });

    it('should compound if higher than 1 for `1d6!!>1`', () => {
      const notation = '1d6!!>1';
      let hasCompounded = false;

      // loop this roll for consistency
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              total = roll.total;

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        // check the output string (Compounds if over 1, so any total of 2 or more means that it must have compounded)
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${total}${(total >= 2) ? '!!' : ''}]`,
          total: total,
        });

        // determine whether this roll compounded by checking the value of the roll
        hasCompounded = hasCompounded || (total >= 2);
      }

      // if we run many rolls, we should expect at least one to have compounded
      expect(hasCompounded).toBeTruthy();
    });

    it('should compound if less than 2 for `1d2!!<2`', () => {
      const notation = '1d2!!<2';
      let hasCompounded = false;

      // loop this roll for consistency
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              total = roll.total;

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        // check the output string (Compounds only on a roll of 1 - if we roll a 1, we roll again;
        // if we then roll a 2, we get a total of 3, if we roll a 1 we get 2 and roll again - so a minimum of 3 if compounding)
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${total}${(total > 2) ? '!!' : ''}]`,
          total: total,
        });

        // determine whether this roll compounded by checking the value of the roll
        hasCompounded = hasCompounded || (total > 2);
      }

      // if we run many rolls, we should expect at least one to have compounded
      expect(hasCompounded).toBeTruthy();
    });

    it('should compound if equal to 2 for `1d2!!=2`', () => {
      const notation = '1d2!!=2';
      let hasCompounded = false;

      // loop this roll for consistency
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              total = roll.total;

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check value is within allowed range
        expect(total).toBeGreaterThan(0);

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: ['*']});
        expect(roll.rolls).toArraySumEqualTo(total);

        // check the output string (Compounds only on a roll of 2 - if we roll a 2, we roll again;
        // if we then roll a 1, we get a total of 3, if we roll a 2 we get 4 and roll again - so a minimum of 5 if compounding)
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${total}${(total > 2) ? '!!' : ''}]`,
          total: total,
        });

        // determine whether this roll compounded by checking the value of the roll
        hasCompounded = hasCompounded || (total > 2);
      }

      // if we run many rolls, we should expect at least one to have compounded
      expect(hasCompounded).toBeTruthy();
    });
  });

  describe('basic equations', () => {
    let diceRoller;

    beforeEach(() => {
      // create a new instance of the DiceRoller
      diceRoller = new DiceRoller();
    });

    it('should return between 3 and 8 for `1d6+2`', () => {
      const notation = '1d6+2',
            roll = diceRoller.roll(notation),
            total = roll.total;

      expect(roll).toEqual(jasmine.any(DiceRoll));

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 3, max: 8});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [1]});
      expect(roll.rolls).toArraySumEqualTo(total-2);

      // check the output string
      expect(roll).toMatchParsedNotation({
        notation: notation,
        rolls: `[${total-2}]+2`,
        total: total,
      });
    });

    it('should return between -1 and 2 for `1d4-2`', () => {
      const notation = '1d4-2',
            roll = diceRoller.roll(notation),
            total = roll.total;

      expect(roll).toEqual(jasmine.any(DiceRoll));

      // check value is within allowed range
      expect(total).toBeWithinRange({min: -1, max: 2});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [1]});
      expect(roll.rolls).toArraySumEqualTo(total+2);

      // check the output string
      expect(roll).toMatchParsedNotation({
        notation: notation,
        rolls: `[${total+2}]-2`,
        total: total,
      });
    });

    it('should return between 2 and 20 for `1d10*2`', () => {
      const notation = '1d10*2',
            roll = diceRoller.roll(notation),
            total = roll.total;

      expect(roll).toEqual(jasmine.any(DiceRoll));

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 2, max: 20});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [1]});
      expect(roll.rolls).toArraySumEqualTo(total/2);

      // check the output string
      expect(roll).toMatchParsedNotation({
        notation: notation,
        rolls: `[${total/2}]*2`,
        total: total,
      });
    });

    it('should return between 0.5 and 4 for `1d8/2`', () => {
      const notation = '1d8/2',
            roll = diceRoller.roll(notation),
            total = roll.total;

      expect(roll).toEqual(jasmine.any(DiceRoll));

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 0.5, max: 4});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [1]});
      expect(roll.rolls).toArraySumEqualTo(total*2);

      // check the output string
      expect(roll).toMatchParsedNotation({
        notation: notation,
        rolls: `[${total*2}]/2`,
        total: total,
      });
    });

    it('should subtract the LOWEST roll for `4d6-L', () => {
      const notation = '4d6-L',
            roll = diceRoller.roll(notation),
            total = roll.total;

      expect(roll).toEqual(jasmine.any(DiceRoll));

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 3, max: 18});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [4]});
      // check if the sum of the rolls (before lowest is subtracted) is equal to the total, with the lowest added
      expect(roll.rolls).toArraySumEqualTo(total + utils.getMin(roll.rolls[0]));

      // check the output string
      expect(roll).toMatchParsedNotation({
        notation: notation,
        rolls: `[${roll.rolls[0].join(',')}]-L`,
        total: total,
      });
    });

    it('should add the LOWEST roll for `4d6+L', () => {
      const notation = '4d6+L',
            roll = diceRoller.roll(notation),
            total = roll.total;

      expect(roll).toEqual(jasmine.any(DiceRoll));

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 5, max: 30});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [4]});
      // check if the sum of the rolls (before lowest is added) is equal to the total, with the lowest subtracted
      expect(roll.rolls).toArraySumEqualTo(total - utils.getMin(roll.rolls[0]));

      // check the output string
      expect(roll).toMatchParsedNotation({
        notation: notation,
        rolls: `[${roll.rolls[0].join(',')}]+L`,
        total: total,
      });
    });

    it('should multiply by the LOWEST roll for `4d6*L', () => {
      const notation = '4d6*L',
            roll = diceRoller.roll(notation),
            total = roll.total;

      expect(roll).toEqual(jasmine.any(DiceRoll));

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 4, max: 144});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [4]});
      // check if the sum of the rolls (before multiplied by lowest) is equal to the total, divided by the lowest
      expect(roll.rolls).toArraySumEqualTo(total / utils.getMin(roll.rolls[0]));

      // check the output string
      expect(roll).toMatchParsedNotation({
        notation: notation,
        rolls: `[${roll.rolls[0].join(',')}]*L`,
        total: total,
      });
    });

    it('should divide by the LOWEST roll for `4d6/L', () => {
      const notation = '4d6/L',
            roll = diceRoller.roll(notation),
            total = roll.total;

      expect(roll).toEqual(jasmine.any(DiceRoll));

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 4, max: 19});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [4]});
      // check if the sum of the rolls (before divided by lowest) is equal to the total, multiplied by the lowest
      expect(roll.rolls).toArraySumEqualTo(total * utils.getMin(roll.rolls[0]));

      // check the output string
      expect(roll).toMatchParsedNotation({
        notation: notation,
        rolls: `[${roll.rolls[0].join(',')}]/L`,
        total: total,
      });
    });

    it('should subtract the HIGHEST roll for `4d6-H', () => {
      const notation = '4d6-H',
            roll = diceRoller.roll(notation),
            total = roll.total;

      expect(roll).toEqual(jasmine.any(DiceRoll));

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 3, max: 18});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [4]});
      // check if the sum of the rolls (before highest is subtracted) is equal to the total, with the highest added
      expect(roll.rolls).toArraySumEqualTo(total + utils.getMax(roll.rolls[0]));

      // check the output string
      expect(roll).toMatchParsedNotation({
        notation: notation,
        rolls: `[${roll.rolls[0].join(',')}]-H`,
        total: total,
      });
    });

    it('should add the HIGHEST roll for `4d6+H', () => {
      const notation = '4d6+H',
            roll = diceRoller.roll(notation),
            total = roll.total;

      expect(roll).toEqual(jasmine.any(DiceRoll));

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 5, max: 30});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [4]});
      // check if the sum of the rolls (before highest is added) is equal to the total, with the highest subtracted
      expect(roll.rolls).toArraySumEqualTo(total - utils.getMax(roll.rolls[0]));

      // check the output string
      expect(roll).toMatchParsedNotation({
        notation: notation,
        rolls: `[${roll.rolls[0].join(',')}]+H`,
        total: total,
      });
    });

    it('should multiply by the HIGHEST roll for `4d6*H', () => {
      const notation = '4d6*H',
            roll = diceRoller.roll(notation),
            total = roll.total;

      expect(roll).toEqual(jasmine.any(DiceRoll));

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 4, max: 144});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [4]});
      // check if the sum of the rolls (before multiplied by highest) is equal to the total, divided by the highest
      expect(roll.rolls).toArraySumEqualTo(total / utils.getMax(roll.rolls[0]));

      // check the output string
      expect(roll).toMatchParsedNotation({
        notation: notation,
        rolls: `[${roll.rolls[0].join(',')}]*H`,
        total: total,
      });
    });

    it('should divide by the HIGHEST roll for `4d6/H', () => {
      const notation = '4d6/H',
            roll = diceRoller.roll(notation),
            total = roll.total;

      expect(roll).toEqual(jasmine.any(DiceRoll));

      // check value is within allowed range
      expect(total).toBeWithinRange({min: 1.5, max: 4});

      // check the rolls list is correct
      expect(roll).toHaveRolls({rolls: [4]});
      // check if the sum of the rolls (before divided by highest) is equal to the total, multiplied by the highest
      expect(roll.rolls).toArraySumEqualTo(total * utils.getMax(roll.rolls[0]));

      // check the output string
      expect(roll).toMatchParsedNotation({
        notation: notation,
        rolls: `[${roll.rolls[0].join(',')}]/H`,
        total: total,
      });
    });

    it('should subtract the LOWEST explode roll for `d6!-L`', () => {
      const notation = 'd6!-L';
      let hasExploded = false;

      // loop this roll for consistency (We need it to have exploded at least once)
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              total = roll.total;

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check value is within allowed range
        expect(total).toBeGreaterThan(-1);

        // check if the sum of the rolls (before lowest is subtracted) is equal to the total, with the lowest added
        expect(roll.rolls).toArraySumEqualTo(total + utils.getMin(roll.rolls[0]));

        // check the output string
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${roll.rolls[0].join('!,')}]-L`,
          total: total,
        });

        // determine whether this roll exploded by checking the amount of rolls
        hasExploded = hasExploded || (roll.rolls[0].length > 1);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasExploded).toBeTruthy();
    });

    it('should subtract the Highest explode roll for `d6!-H`', () => {
      const notation = 'd6!-H';
      let hasExploded = false;

      // loop this roll for consistency (We need it to have exploded at least once)
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              total = roll.total;

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check value is within allowed range
        expect(total).toBeGreaterThan(-1);

        // check if the sum of the rolls (before lowest is subtracted) is equal to the total, with the lowest added
        expect(roll.rolls).toArraySumEqualTo(total + utils.getMax(roll.rolls[0]));

        // check the output string
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${roll.rolls[0].join('!,')}]-H`,
          total: total,
        });

        // determine whether this roll exploded by checking the amount of rolls
        hasExploded = hasExploded || (roll.rolls[0].length > 1);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasExploded).toBeTruthy();
    });

    it('should subtract the LOWEST compound roll for `d6!!-L`', () => {
      const notation = 'd6!!-L';
      let hasCompounded = false;

      // loop this roll for consistency (We need it to have exploded at least once)
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              total = roll.total,
              rollsTotal = utils.reduceArray(roll.rolls);

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check value is within allowed range
        expect(total).toEqual(0);

        // check if the rolls actually exist
        expect(rollsTotal).toBeGreaterThan(0);

        // check the output string
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${rollsTotal}${rollsTotal > 6 ? '!!' : ''}]-L`,
          total: total,
        });

        // determine whether this roll exploded by checking if the value is greater than the max
        hasCompounded = hasCompounded || (rollsTotal > 6);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasCompounded).toBeTruthy();
    });

    it('should subtract the HIGHEST compound roll for `d6!!-H`', () => {
      const notation = 'd6!!-H';
      let hasCompounded = false;

      // loop this roll for consistency (We need it to have exploded at least once)
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              total = roll.total,
              rollsTotal = utils.reduceArray(roll.rolls);

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check value is within allowed range
        expect(total).toEqual(0);

        // check if the rolls actually exist
        expect(rollsTotal).toBeGreaterThan(0);

        // check the output string
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${rollsTotal}${rollsTotal > 6 ? '!!' : ''}]-H`,
          total: total,
        });

        // determine whether this roll exploded by checking if the value is greater than the max
        hasCompounded = hasCompounded || (rollsTotal > 6);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasCompounded).toBeTruthy();
    });

    it('should subtract the LOWEST penetrating roll for `d6!p-L`', () => {
      const notation = 'd6!p-L';
      let hasExploded = false;

      // loop this roll for consistency (We need it to have exploded at least once)
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              total = roll.total;

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check value is within allowed range
        expect(total).toBeGreaterThan(-1);

        // check if the sum of the rolls (before lowest is subtracted) is equal to the total, with the lowest added
        expect(roll.rolls).toArraySumEqualTo(total + utils.getMin(roll.rolls[0]));

        // check the output string
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${roll.rolls[0].join('!p,')}]-L`,
          total: total,
        });

        // determine whether this roll exploded by checking the amount of rolls
        hasExploded = hasExploded || (roll.rolls[0].length > 1);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasExploded).toBeTruthy();
    });

    it('should subtract the HIGHEST penetrating roll for `d6!p-H`', () => {
      const notation = 'd6!p-H';
      let hasExploded = false;

      // loop this roll for consistency (We need it to have exploded at least once)
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              total = roll.total;

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check value is within allowed range
        expect(total).toBeGreaterThan(-1);

        // check if the sum of the rolls (before lowest is subtracted) is equal to the total, with the lowest added
        expect(roll.rolls).toArraySumEqualTo(total + utils.getMax(roll.rolls[0]));

        // check the output string
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${roll.rolls[0].join('!p,')}]-H`,
          total: total,
        });

        // determine whether this roll exploded by checking the amount of rolls
        hasExploded = hasExploded || (roll.rolls[0].length > 1);
      }

      // if we run many rolls, we should expect at least one to have exploded
      expect(hasExploded).toBeTruthy();
    });
  });

  describe('pool dice', () => {
    let diceRoller,
        expectedSuccesses,
        hasSucceeded = false;

    beforeEach(() => {
      diceRoller = new DiceRoller();
      hasSucceeded = false;
    });

    it('should return number of successes for `4d6=6`', () => {
      const notation = '4d6=6';

      // run the tests multiple times for consistency
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              rollNote = roll.rolls[0].map(num => num + (num === 6 ? '*' : '')).join(',');

        expectedSuccesses = roll.rolls[0].filter(num => num === 6).length;

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: [4]});

        expect(roll).toHaveSuccesses(expectedSuccesses);

        // check the output string
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${rollNote}]`,
          total: (expectedSuccesses || 0)
        });

        hasSucceeded = hasSucceeded || (expectedSuccesses > 0);
      }

      // if we run many rolls, we should expect at least one to have succeeded at least once
      expect(hasSucceeded).toBeTruthy();
    });

    it('should return number of successes for `4d6<3`', () => {
      const notation = '4d6<3';

      // run the tests multiple times for consistency
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              rollNote = roll.rolls[0].map(num => num + (num < 3 ? '*' : '')).join(',');

        expectedSuccesses = roll.rolls[0].filter(num => num < 3).length;

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: [4]});

        expect(roll).toHaveSuccesses(expectedSuccesses);

        // check the output string
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${rollNote}]`,
          total: (expectedSuccesses || 0)
        });

        hasSucceeded = hasSucceeded || (expectedSuccesses > 0);
      }

      // if we run many rolls, we should expect at least one to have succeeded at least once
      expect(hasSucceeded).toBeTruthy();
    });

    it('should return number of successes for `4d6>=4`', () => {
      const notation = '4d6>=4';

      // run the tests multiple times for consistency
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              rollNote = roll.rolls[0].map(num => num + (num >= 4 ? '*' : '')).join(',');

        expectedSuccesses = roll.rolls[0].filter(num => num >= 4).length;

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: [4]});

        expect(roll).toHaveSuccesses(expectedSuccesses);

        // check the output string
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${rollNote}]`,
          total: (expectedSuccesses || 0)
        });

        hasSucceeded = hasSucceeded || (expectedSuccesses > 0);
      }

      // if we run many rolls, we should expect at least one to have succeeded at least once
      expect(hasSucceeded).toBeTruthy();
    });

    it('should return number of successes for `13d10>=5`', () => {
      const notation = '13d10>=5';

      // run the tests multiple times for consistency
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              rollNote = roll.rolls[0].map(num => num + (num >= 5 ? '*' : '')).join(',');

        expectedSuccesses = roll.rolls[0].filter(num => num >= 5).length;

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: [13]});

        expect(roll).toHaveSuccesses(expectedSuccesses);

        // check the output string
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${rollNote}]`,
          total: (expectedSuccesses || 0)
        });

        hasSucceeded = hasSucceeded || (expectedSuccesses > 0);
      }

      // if we run many rolls, we should expect at least one to have succeeded at least once
      expect(hasSucceeded).toBeTruthy();
    });

    it('should return number of successes for `13d10>=5-H`', () => {
      const notation = '13d10>=5-H';

      // run the tests multiple times for consistency
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              rollNote = roll.rolls[0].map(num => num + (num >= 5 ? '*' : '')).join(',');
        let hSuccessVal = Math.max(...roll.rolls[0]) >= 5 ? 1 : 0;

        expectedSuccesses = roll.rolls[0].filter(num => num >= 5).length - hSuccessVal;

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: [13]});

        expect(roll).toHaveSuccesses(expectedSuccesses);

        // check the output string
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${rollNote}]-H`,
          total: (expectedSuccesses || 0)
        });

        hasSucceeded = hasSucceeded || (expectedSuccesses > 0);
      }

      // if we run many rolls, we should expect at least one to have succeeded at least once
      expect(hasSucceeded).toBeTruthy();
    });

    it('should return number of successes for `6d10>=5*2`', () => {
      const notation = '6d10>=5*2';

      // run the tests multiple times for consistency
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              rollNote = roll.rolls[0].map(num => num + (num >= 5 ? '*' : '')).join(',');

        expectedSuccesses = roll.rolls[0].filter(num => num >= 5).length * 2;

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: [6]});

        expect(roll).toHaveSuccesses(expectedSuccesses);

        // check the output string
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${rollNote}]*2`,
          total: (expectedSuccesses || 0)
        });

        hasSucceeded = hasSucceeded || (expectedSuccesses > 0);
      }

      // if we run many rolls, we should expect at least one to have succeeded at least once
      expect(hasSucceeded).toBeTruthy();
    });

    it('should return number of successes + value for `2d10>=5+3d6`', () => {
      const notation = '2d10>=5+3d6';

      // run the tests multiple times for consistency
      for(let i = 0; i < loopCount; i++){
        const roll = diceRoller.roll(notation),
              rollNote = roll.rolls[0].map(num => num + (num >= 5 ? '*' : '')).join(',');

        expectedSuccesses = roll.rolls[0].filter(num => num >= 5).length;

        // calculate expected totals
        const total = expectedSuccesses + diceUtils.sumArray(roll.rolls[1]);

        expect(roll).toEqual(jasmine.any(DiceRoll));

        // check the rolls list is correct
        expect(roll).toHaveRolls({rolls: [2, 3]});

        expect(roll).toHaveSuccesses(expectedSuccesses);

        // check the output string
        expect(roll).toMatchParsedNotation({
          notation: notation,
          rolls: `[${rollNote}]+[${roll.rolls[1]}]`,
          total: total
        });

        hasSucceeded = hasSucceeded || (expectedSuccesses > 0);
      }

      // if we run many rolls, we should expect at least one to have succeeded at least once
      expect(hasSucceeded).toBeTruthy();
    });

    describe('non-pool dice rolls', () => {
      it('should return no successes for `4d6`', () => {
        const notation = '4d6';

        // run the tests multiple times for consistency
        for(let i = 0; i < loopCount; i++){
          const roll = diceRoller.roll(notation);

          expect(roll).not.toHaveSuccesses();
          // explicitly check against zero, just be be certain
          expect(roll).toHaveSuccesses(0);
        }
      });

      it('should return no successes for `5d10!`', () => {
        const notation = '5d10!';

        // run the tests multiple times for consistency
        for(let i = 0; i < loopCount; i++){
          const roll = diceRoller.roll(notation);

          expect(roll).not.toHaveSuccesses();
          // explicitly check against zero, just be be certain
          expect(roll).toHaveSuccesses(0);
        }
      });

      it('should return no successes for `2d6!!`', () => {
        const notation = '2d6!!';

        // run the tests multiple times for consistency
        for(let i = 0; i < loopCount; i++){
          const roll = diceRoller.roll(notation);

          expect(roll).not.toHaveSuccesses();
          // explicitly check against zero, just be be certain
          expect(roll).toHaveSuccesses(0);
        }
      });
    });
  });

  describe('roll log', () => {
    let diceRoller;

    beforeEach(() => {
      // create a new instance of the DiceRoller
      diceRoller = new DiceRoller();
    });

    it('should be no dice rolled', () => {
      expect(diceRoller).not.toHaveLogLength();
      expect(diceRoller.output).toEqual('');
    });

    it('should have 1 dice rolled', () => {
      diceRoller.roll('d6');

      expect(diceRoller).toHaveLogLength(1);
    });

    it('should be cleared log', () => {
      diceRoller.roll('d6');
      diceRoller.clearLog();

      expect(diceRoller).not.toHaveLogLength();
      expect(diceRoller.output).toEqual('');
    });

    it('should have 2 dice rolled', () => {
      diceRoller.roll('1d6');
      diceRoller.roll('d10');

      expect(diceRoller).toHaveLogLength(2);
    });

    it('should contain DiceRolls', () => {
      diceRoller.roll('1d6');
      diceRoller.roll('8d10');
      diceRoller.roll('dF');

      // loop through and check that each item in the log is actually a DiceRoll
      diceRoller.log.forEach(roll => {
        expect(roll).toEqual(jasmine.any(DiceRoll));
      });
    });
  });

  describe('invalid rolls', function(){
    var diceRoller;

    beforeEach(function(){
      // create a new instance of the DiceRoller
      diceRoller = new DiceRoller();
    });

    it('should throw an error calling `DiceRoller.roll()` with no notation defined', function(){
      expect(function(){
        diceRoller.roll();
      }).toThrowError(/No notation specified/);

      expect(function(){
        diceRoller.roll(undefined);
      }).toThrowError(/No notation specified/);

      expect(function(){
        diceRoller.roll(null);
      }).toThrowError(/No notation specified/);

      expect(function(){
        diceRoller.roll(false);
      }).toThrowError(/No notation specified/);
    });

    it('should throw error calling `DiceRoller.roll()` with number', function(){
      expect(function(){
        diceRoller.roll(1);
      }).toThrowError(/Notation is not valid/);

      expect(function(){
        diceRoller.roll(0);
      }).toThrowError(/No notation specified/);

      expect(function(){
        diceRoller.roll(100);
      }).toThrowError(/Notation is not valid/);

      expect(function(){
        diceRoller.roll(-100);
      }).toThrowError(/Notation is not valid/);

      expect(function(){
        diceRoller.roll(23.45);
      }).toThrowError(/Notation is not valid/);
    });

    it('should throw error calling `DiceRoller.roll()` with array of rolls', function(){
      expect(function(){
        diceRoller.roll(['1d6', 'd10']);
      }).toThrowError(/Object has no notation/);
    });

    it('should throw an error calling `DiceRoller.rollMany()` with no notation defined', function(){
      expect(function(){
        diceRoller.rollMany();
      }).toThrowError(/No notations specified/);

      expect(function(){
        diceRoller.rollMany(undefined);
      }).toThrowError(/No notations specified/);

      expect(function(){
        diceRoller.rollMany(null);
      }).toThrowError(/No notations specified/);

      expect(function(){
        diceRoller.rollMany(false);
      }).toThrowError(/No notations specified/);
    });

    it('should throw error calling `DiceRoller.rollMany()` without Array', function(){
      expect(function(){
        diceRoller.rollMany('1d6');
      }).toThrowError(/Notations are not valid/);

      expect(function(){
        diceRoller.rollMany(1);
      }).toThrowError(/Notations are not valid/);

      expect(function(){
        diceRoller.rollMany({foo: 'bar'});
      }).toThrowError(/Notations are not valid/);

      expect(function(){
        diceRoller.rollMany(0);
      }).toThrowError(/No notations specified/);
    });
  });

  describe('multiple rolls', function(){
    var diceRoller;

    beforeEach(function(){
      // create a new instance of the DiceRoller
      diceRoller = new DiceRoller();
    });

    it('should roll multiple notations at the same time', function(){
      diceRoller.rollMany(['1d6', 'd10']);

      expect(diceRoller).toHaveLogLength(2);
    });

    it('should roll single notation in array if passed to `rollMultiple`', function(){
      diceRoller.rollMany(['1d6']);

      expect(diceRoller).toHaveLogLength(1);
    });
  });
})();
