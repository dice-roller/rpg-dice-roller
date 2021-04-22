import { StandardDice } from '../src/dice/index.js';
import DiceRoll from '../src/DiceRoll.js';
import DiceRoller from '../src/DiceRoller.js';
import RollResult from '../src/results/RollResult.js';
import RollResults from '../src/results/RollResults.js';

describe('Rolling', () => {
  let roller;

  beforeEach(() => {
    roller = new DiceRoller();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic rolls', () => {
    test('roll `2d7 + (5d4 * 2)`', () => {
      const rolls = [
        new RollResults([5, 2]),
        new RollResults([4, 2, 1, 3, 3]),
      ];
      jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => rolls[0])
        .mockImplementationOnce(() => rolls[1]);
      const roll = roller.roll('2d7 + (5d4 * 2)');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('2d7 + (5d4 * 2)');
      expect(roll.rolls).toEqual([rolls[0], '+', '(', rolls[1], '*', 2, ')']);
      expect(roll.total).toBe(33);
      expect(roll.output).toEqual('2d7 + (5d4 * 2): [5, 2]+([4, 2, 1, 3, 3]*2) = 33');
    });

    test('roll `floor(2.56 * d7)`', () => {
      const rolls = new RollResults([5]);
      jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => rolls);
      const roll = roller.roll('floor(2.56 * d7)');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('floor(2.56 * d7)');
      expect(roll.rolls).toEqual(['floor(', 2.56, '*', rolls, ')']);
      expect(roll.total).toBe(12);
      expect(roll.output).toEqual('floor(2.56 * d7): floor(2.56*[5]) = 12');
    });

    test('roll `ceil(2.56 * d7)`', () => {
      const rolls = new RollResults([5]);
      jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => rolls);
      const roll = roller.roll('ceil(2.56 * d7)');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('ceil(2.56 * d7)');
      expect(roll.rolls).toEqual(['ceil(', 2.56, '*', rolls, ')']);
      expect(roll.total).toBe(13);
      expect(roll.output).toEqual('ceil(2.56 * d7): ceil(2.56*[5]) = 13');
    });

    test('roll `max(2 * (d7/2), 1d7)`', () => {
      const rollsFirst = new RollResults([5]);
      const rollsSecond = new RollResults([2]);
      jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => rollsFirst)
        .mockImplementationOnce(() => rollsSecond);
      const roll = roller.roll('max(2 * (d7/2), 1d7)');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('max(2 * (d7/2), 1d7)');
      expect(roll.rolls).toEqual([
        'max(',
        2,
        '*',
        '(',
        rollsFirst,
        '/',
        2,
        ')',
        ',',
        rollsSecond,
        ')',
      ]);
      expect(roll.total).toBe(5);
      expect(roll.output).toEqual('max(2 * (d7/2), 1d7): max(2*([5]/2),[2]) = 5');
    });

    test('roll `min(2 * (d7/2), 1d7)`', () => {
      const rollsFirst = new RollResults([5]);
      const rollsSecond = new RollResults([2]);
      jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => rollsFirst)
        .mockImplementationOnce(() => rollsSecond);
      const roll = roller.roll('min(2 * (d7/2), 1d7)');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('min(2 * (d7/2), 1d7)');
      expect(roll.total).toBe(2);
      expect(roll.output).toEqual('min(2 * (d7/2), 1d7): min(2*([5]/2),[2]) = 2');
      expect(roll.rolls).toEqual([
        'min(',
        2,
        '*',
        '(',
        rollsFirst,
        '/',
        2,
        ')',
        ',',
        rollsSecond,
        ')',
      ]);
    });

    test('roll `3d6cs>3cf<3`', () => {
      jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => 5)
        .mockImplementationOnce(() => 4)
        .mockImplementationOnce(() => 1);
      const roll = roller.roll('3d6cs>3cf<3');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('3d6cs>3cf<3');
      expect(roll.total).toBe(10);
      expect(roll.output).toEqual('3d6cs>3cf<3: [5**, 4**, 1__] = 10');
    });

    test('roll `4d6sd`', () => {
      jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => 4)
        .mockImplementationOnce(() => 6)
        .mockImplementationOnce(() => 5)
        .mockImplementationOnce(() => 1);
      const roll = roller.roll('4d6sd');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('4d6sd');
      expect(roll.total).toBe(16);
      expect(roll.output).toEqual('4d6sd: [6, 5, 4, 1] = 16');
    });

    test('roll `2d6r<=4`', () => {
      jest.spyOn(StandardDice.prototype, 'rollOnce')
        // die 1
        .mockImplementationOnce(() => new RollResult(4))
        // die 2
        .mockImplementationOnce(() => new RollResult(5))
        // re-roll
        .mockImplementationOnce(() => new RollResult(6));
      const roll = roller.roll('2d6r<=4');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('2d6r<=4');
      expect(roll.total).toBe(11);
      expect(roll.output).toEqual('2d6r<=4: [6r, 5] = 11');
    });

    test('roll `6d10>=8!>=9`', () => {
      jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => new RollResult(4))
        .mockImplementationOnce(() => new RollResult(5))
        .mockImplementationOnce(() => new RollResult(6))
        .mockImplementationOnce(() => new RollResult(3))
        .mockImplementationOnce(() => new RollResult(10))
        .mockImplementationOnce(() => new RollResult(8))
        // explode
        .mockImplementationOnce(() => new RollResult(6));
      const roll = roller.roll('6d10>=8!>=9');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('6d10>=8!>=9');
      expect(roll.total).toBe(2);
      expect(roll.output).toEqual('6d10>=8!>=9: [4, 5, 6, 3, 10!*, 6, 8*] = 2');
    });

    test('roll `6d10!>=9>=8`', () => {
      jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => new RollResult(4))
        .mockImplementationOnce(() => new RollResult(5))
        .mockImplementationOnce(() => new RollResult(6))
        .mockImplementationOnce(() => new RollResult(3))
        .mockImplementationOnce(() => new RollResult(10))
        .mockImplementationOnce(() => new RollResult(8))
        // explode
        .mockImplementationOnce(() => new RollResult(6));
      const roll = roller.roll('6d10!>=9>=8');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('6d10!>=9>=8');
      expect(roll.total).toBe(2);
      expect(roll.output).toEqual('6d10!>=9>=8: [4, 5, 6, 3, 10!*, 6, 8*] = 2');
    });

    test('roll `6d10!4`', () => {
      const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => new RollResult(4))
        .mockImplementationOnce(() => new RollResult(5))
        .mockImplementationOnce(() => new RollResult(6))
        .mockImplementationOnce(() => new RollResult(3))
        .mockImplementationOnce(() => new RollResult(8))
        .mockImplementationOnce(() => new RollResult(10))
        // explode
        .mockImplementationOnce(() => new RollResult(10))
        .mockImplementationOnce(() => new RollResult(10))
        .mockImplementationOnce(() => new RollResult(10))
        .mockImplementationOnce(() => new RollResult(10));
      const roll = roller.roll('6d10!4');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('6d10!4');
      expect(roll.total).toBe(76);
      expect(roll.output).toEqual('6d10!4: [4, 5, 6, 3, 8, 10!, 10!, 10!, 10!, 10] = 76');

      // remove the spy
      spy.mockRestore();
    });

    test('roll `2d5!po`', () => {
      const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => new RollResult(4))
        .mockImplementationOnce(() => new RollResult(5))
        // explode
        .mockImplementationOnce(() => new RollResult(5));
      const roll = roller.roll('2d5!po');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('2d5!po');
      expect(roll.total).toBe(13);
      expect(roll.output).toEqual('2d5!po: [4, 5!p, 4] = 13');

      // remove the spy
      spy.mockRestore();
    });

    test('roll `2d10!<>8`', () => {
      jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => new RollResult(4))
        .mockImplementationOnce(() => new RollResult(5))

        // explode
        .mockImplementationOnce(() => new RollResult(6))
        .mockImplementationOnce(() => new RollResult(3))
        .mockImplementationOnce(() => new RollResult(10))
        .mockImplementationOnce(() => new RollResult(8))
        .mockImplementationOnce(() => new RollResult(8));
      const roll = roller.roll('2d10!<>8');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('2d10!<>8');
      expect(roll.total).toBe(44);
      expect(roll.output).toEqual('2d10!<>8: [4!, 6!, 3!, 10!, 8, 5!, 8] = 44');
    });

    test('roll `(4d10^7)*6d(3*2)`', () => {
      jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => new RollResult(4))
        .mockImplementationOnce(() => new RollResult(5))
        .mockImplementationOnce(() => new RollResult(6))
        .mockImplementationOnce(() => new RollResult(10))
        .mockImplementationOnce(() => new RollResult(3))
        .mockImplementationOnce(() => new RollResult(4))
        .mockImplementationOnce(() => new RollResult(6))
        .mockImplementationOnce(() => new RollResult(4))
        .mockImplementationOnce(() => new RollResult(1))
        .mockImplementationOnce(() => new RollResult(3));
      const roll = roller.roll('(4d10^7)*6d(3*2)');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('(4d10^7)*6d(3*2)');
      expect(roll.hasRolls()).toBe(true);
      expect(roll.total).toBe(128173828125);
      expect(roll.output).toEqual('(4d10^7)*6d(3*2): ([4, 5, 6, 10]^7)*[3, 4, 6, 4, 1, 3] = 128173828125');
    });

    test('roll `5d6%2d20`', () => {
      jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => new RollResult(4))
        .mockImplementationOnce(() => new RollResult(5))
        .mockImplementationOnce(() => new RollResult(6))
        .mockImplementationOnce(() => new RollResult(3))
        .mockImplementationOnce(() => new RollResult(2))
        .mockImplementationOnce(() => new RollResult(9))
        .mockImplementationOnce(() => new RollResult(20));
      const roll = roller.roll('5d6%2d20');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('5d6%2d20');
      expect(roll.output).toEqual('5d6%2d20: [4, 5, 6, 3, 2]%[9, 20] = 20');
      expect(roll.total).toBe(20);
    });

    test('roll `1d20+-5`', () => {
      jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => new RollResult(20));
      const roll = roller.roll('1d20+-5');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('1d20+-5');
      expect(roll.output).toEqual('1d20+-5: [20]+-5 = 15');
      expect(roll.total).toBe(15);
    });

    test('roll `1d20--6`', () => {
      jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => new RollResult(20));
      const roll = roller.roll('1d20--6');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('1d20--6');
      expect(roll.output).toEqual('1d20--6: [20]--6 = 26');
      expect(roll.total).toBe(26);
    });

    test('roll `6d10min3max6', () => {
      jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => new RollResult(10))
        .mockImplementationOnce(() => new RollResult(2))
        .mockImplementationOnce(() => new RollResult(3))
        .mockImplementationOnce(() => new RollResult(7))
        .mockImplementationOnce(() => new RollResult(1))
        .mockImplementationOnce(() => new RollResult(9));
      const roll = roller.roll('6d10min3max6');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('6d10min3max6');
      expect(roll.output).toEqual('6d10min3max6: [6v, 3^, 3, 6v, 3^, 6v] = 27');
      expect(roll.total).toBe(27);
    });

    test('roll `1d20+1.45', () => {
      const rolls = new RollResults([8]);
      jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => rolls);
      const roll = roller.roll('1d20+1.45');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('1d20+1.45');
      expect(roll.rolls).toEqual([rolls, '+', 1.45]);
      expect(roll.total).toBe(9.45);
      expect(roll.output).toEqual('1d20+1.45: [8]+1.45 = 9.45');
    });

    test('roll `1d20*0.20', () => {
      const rolls = new RollResults([8]);
      jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => rolls);
      const roll = roller.roll('1d20*0.20');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('1d20*0.20');
      expect(roll.rolls).toEqual([rolls, '*', 0.20]);
      expect(roll.total).toBe(1.6);
      expect(roll.output).toEqual('1d20*0.20: [8]*0.2 = 1.6');
    });

    test('roll `1d20/6.02', () => {
      const rolls = new RollResults([8]);
      jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => rolls);
      const roll = roller.roll('1d20/6.02');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('1d20/6.02');
      expect(roll.rolls).toEqual([rolls, '/', 6.02]);
      expect(roll.total).toBe(1.33);
      expect(roll.output).toEqual('1d20/6.02: [8]/6.02 = 1.33');
    });

    test('roll `1d20+0', () => {
      const rolls = new RollResults([8]);
      jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => rolls);
      const roll = roller.roll('1d20+0');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('1d20+0');

      expect(roll.rolls).toHaveLength(3);
      expect(roll.rolls[0]).toEqual(rolls);
      expect(roll.rolls[1]).toEqual('+');
      expect(roll.rolls[2]).toBe(0);

      expect(roll.total).toBe(8);
      expect(roll.output).toEqual('1d20+0: [8]+0 = 8');
    });

    test('roll `2d6u`', () => {
      jest.spyOn(StandardDice.prototype, 'rollOnce')
        // die 1
        .mockImplementationOnce(() => new RollResult(4))
        // die 2
        .mockImplementationOnce(() => new RollResult(4))
        // re-rolls
        .mockImplementationOnce(() => new RollResult(4))
        .mockImplementationOnce(() => new RollResult(6));
      const roll = roller.roll('2d6u');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('2d6u');
      expect(roll.total).toBe(10);
      expect(roll.output).toEqual('2d6u: [4, 6u] = 10');
    });

    test('roll `2d6uo`', () => {
      jest.spyOn(StandardDice.prototype, 'rollOnce')
        // die 1
        .mockImplementationOnce(() => new RollResult(4))
        // die 2
        .mockImplementationOnce(() => new RollResult(4))
        // re-rolls
        .mockImplementationOnce(() => new RollResult(4))
        .mockImplementationOnce(() => new RollResult(8));
      const roll = roller.roll('2d6uo');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('2d6uo');
      expect(roll.total).toBe(8);
      expect(roll.output).toEqual('2d6uo: [4, 4uo] = 8');
    });
  });

  describe('Group rolls', () => {
    describe('No modifiers', () => {
      test('roll `{4d6}`', () => {
        jest.spyOn(StandardDice.prototype, 'roll')
          .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]));
        const notation = '{4d6}';
        const roll = roller.roll(notation);

        expect(roll).toBeInstanceOf(DiceRoll);
        expect(roll.notation).toEqual(notation);
        expect(roll.output).toEqual(`${notation}: {[4, 5, 1, 3]} = 13`);
        expect(roll.total).toBe(13);
      });

      test('roll `{4d6, 2d10, d4}`', () => {
        jest.spyOn(StandardDice.prototype, 'roll')
          .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]))
          .mockImplementationOnce(() => new RollResults([8, 6]))
          .mockImplementationOnce(() => new RollResults([3]));
        const notation = '{4d6, 2d10, d4}';
        const roll = roller.roll(notation);

        expect(roll).toBeInstanceOf(DiceRoll);
        expect(roll.notation).toEqual(notation);
        expect(roll.output).toEqual(`${notation}: {[4, 5, 1, 3], [8, 6], [3]} = 30`);
        expect(roll.total).toBe(30);
      });

      test('roll `{4d6+5, 20/2d10, d4-1}`', () => {
        jest.spyOn(StandardDice.prototype, 'roll')
          .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]))
          .mockImplementationOnce(() => new RollResults([8, 6]))
          .mockImplementationOnce(() => new RollResults([3]));
        const notation = '{4d6+5, 20/2d10, d4-1}';
        const roll = roller.roll(notation);

        expect(roll).toBeInstanceOf(DiceRoll);
        expect(roll.notation).toEqual(notation);
        expect(roll.output).toEqual(`${notation}: {[4, 5, 1, 3]+5, 20/[8, 6], [3]-1} = 21.43`);
        expect(roll.total).toBeCloseTo(21.43);
      });
    });

    describe('With modifiers', () => {
      describe('Keep modifier', () => {
        test('roll `{4d10*5d6}k2`', () => {
          jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([10, 5, 3, 4]))
            .mockImplementationOnce(() => new RollResults([2, 4, 3, 6, 1]));
          const notation = '{4d10*5d6}k2';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {[10, 5d, 3d, 4d]*[2d, 4d, 3d, 6, 1d]} = 60`);
          expect(roll.total).toBe(60);
        });

        test('roll `{4d10*5d6}kl3`', () => {
          jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([10, 5, 7, 1]))
            .mockImplementationOnce(() => new RollResults([2, 4, 3, 6, 4]));
          const notation = '{4d10*5d6}kl3';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {[10d, 5d, 7d, 1]*[2, 4d, 3, 6d, 4d]} = 5`);
          expect(roll.total).toBe(5);
        });

        test('roll `{4d10*2, 5d6+10}k1`', () => {
          jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([10, 5, 3, 4]))
            .mockImplementationOnce(() => new RollResults([2, 4, 3, 6, 1]));
          const notation = '{4d10*2, 5d6+10}k1';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {[10, 5, 3, 4]*2, ([2, 4, 3, 6, 1]+10)d} = 44`);
          expect(roll.total).toBe(44);
        });

        test('roll `{4d10*2, 5d6+10}kl1`', () => {
          jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([10, 5, 3, 4]))
            .mockImplementationOnce(() => new RollResults([2, 4, 3, 6, 1]));
          const notation = '{4d10*2, 5d6+10}kl1';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {([10, 5, 3, 4]*2)d, [2, 4, 3, 6, 1]+10} = 26`);
          expect(roll.total).toBe(26);
        });
      });

      describe('Drop modifier', () => {
        test('roll `{4d10*5d6}d2`', () => {
          jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([10, 2, 3, 4]))
            .mockImplementationOnce(() => new RollResults([5, 4, 3, 6, 1]));
          const notation = '{4d10*5d6}d2';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {[10, 2d, 3, 4]*[5, 4, 3, 6, 1d]} = 306`);
          expect(roll.total).toBe(306);
        });

        test('roll `{4d10*5d6}dh3`', () => {
          jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([10, 5, 7, 1]))
            .mockImplementationOnce(() => new RollResults([2, 4, 3, 6, 4]));
          const notation = '{4d10*5d6}dh3';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {[10d, 5, 7d, 1]*[2, 4, 3, 6d, 4]} = 78`);
          expect(roll.total).toBe(78);
        });

        test('roll `{4d10*2, 5d6+10}d1`', () => {
          jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([10, 5, 3, 4]))
            .mockImplementationOnce(() => new RollResults([2, 4, 3, 6, 1]));
          const notation = '{4d10*2, 5d6+10}d1';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {[10, 5, 3, 4]*2, ([2, 4, 3, 6, 1]+10)d} = 44`);
          expect(roll.total).toBe(44);
        });

        test('roll `{4d10*2, 5d6+10}dh1`', () => {
          jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([10, 5, 3, 4]))
            .mockImplementationOnce(() => new RollResults([2, 4, 3, 6, 1]));
          const notation = '{4d10*2, 5d6+10}dh1';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {([10, 5, 3, 4]*2)d, [2, 4, 3, 6, 1]+10} = 26`);
          expect(roll.total).toBe(26);
        });
      });

      describe('Sorting modifier', () => {
        test('roll `{4d6}s`', () => {
          jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]));
          const notation = '{4d6}s';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {[1, 3, 4, 5]} = 13`);
          expect(roll.total).toBe(13);
        });

        test('roll `{4d6}sd`', () => {
          jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]));
          const notation = '{4d6}sd';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {[5, 4, 3, 1]} = 13`);
          expect(roll.total).toBe(13);
        });

        test('roll `{4d6, 2d10, d4}s`', () => {
          jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]))
            .mockImplementationOnce(() => new RollResults([8, 6]))
            .mockImplementationOnce(() => new RollResults([3]));
          const notation = '{4d6, 2d10, d4}s';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {[3], [1, 3, 4, 5], [6, 8]} = 30`);
          expect(roll.total).toBe(30);
        });

        test('roll `{4d6+5, 20/2d10, d4-1}sd`', () => {
          jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]))
            .mockImplementationOnce(() => new RollResults([8, 6]))
            .mockImplementationOnce(() => new RollResults([3]));
          const notation = '{4d6+5, 20/2d10, d4-1}sd';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {[5, 4, 3, 1]+5, [3]-1, 20/[8, 6]} = 21.43`);
          expect(roll.total).toBeCloseTo(21.43);
        });
      });

      describe('Target modifier', () => {
        describe('Success', () => {
          test('roll `{4d6}>10`', () => {
            jest.spyOn(StandardDice.prototype, 'roll')
              .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]));
            const notation = '{4d6}>10';
            const roll = roller.roll(notation);

            expect(roll).toBeInstanceOf(DiceRoll);
            expect(roll.notation).toEqual(notation);
            expect(roll.output).toEqual(`${notation}: {([4, 5, 1, 3])*} = 1`);
            expect(roll.total).toBe(1);
          });

          test('roll `{4d6}<10`', () => {
            jest.spyOn(StandardDice.prototype, 'roll')
              .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]));
            const notation = '{4d6}<10';
            const roll = roller.roll(notation);

            expect(roll).toBeInstanceOf(DiceRoll);
            expect(roll.notation).toEqual(notation);
            expect(roll.output).toEqual(`${notation}: {[4, 5, 1, 3]} = 0`);
            expect(roll.total).toBe(0);
          });

          test('roll `{4d6+5, 20/2d10, d4-1}>10`', () => {
            jest.spyOn(StandardDice.prototype, 'roll')
              .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]))
              .mockImplementationOnce(() => new RollResults([8, 6]))
              .mockImplementationOnce(() => new RollResults([3]));
            const notation = '{4d6+5, 20/2d10, d4-1}>10';
            const roll = roller.roll(notation);

            expect(roll).toBeInstanceOf(DiceRoll);
            expect(roll.notation).toEqual(notation);
            expect(roll.output).toEqual(`${notation}: {([4, 5, 1, 3]+5)*, 20/[8, 6], [3]-1} = 1`);
            expect(roll.total).toBeCloseTo(1);
          });

          test('roll `{4d6+5, 20/2d10, d4-1}<10`', () => {
            jest.spyOn(StandardDice.prototype, 'roll')
              .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]))
              .mockImplementationOnce(() => new RollResults([8, 6]))
              .mockImplementationOnce(() => new RollResults([3]));
            const notation = '{4d6+5, 20/2d10, d4-1}<10';
            const roll = roller.roll(notation);

            expect(roll).toBeInstanceOf(DiceRoll);
            expect(roll.notation).toEqual(notation);
            expect(roll.output).toEqual(`${notation}: {[4, 5, 1, 3]+5, (20/[8, 6])*, ([3]-1)*} = 2`);
            expect(roll.total).toBeCloseTo(2);
          });
        });

        describe('Failure', () => {
          test('roll `{4d6}>20f<15`', () => {
            jest.spyOn(StandardDice.prototype, 'roll')
              .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]));
            const notation = '{4d6}>20f<15';
            const roll = roller.roll(notation);

            expect(roll).toBeInstanceOf(DiceRoll);
            expect(roll.notation).toEqual(notation);
            expect(roll.output).toEqual(`${notation}: {([4, 5, 1, 3])_} = -1`);
            expect(roll.total).toBe(-1);
          });

          test('roll `{4d6+5, 20/2d10, d4-1}>10f<10`', () => {
            jest.spyOn(StandardDice.prototype, 'roll')
              .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]))
              .mockImplementationOnce(() => new RollResults([8, 6]))
              .mockImplementationOnce(() => new RollResults([3]));
            const notation = '{4d6+5, 20/2d10, d4-1}>10f<10';
            const roll = roller.roll(notation);

            expect(roll).toBeInstanceOf(DiceRoll);
            expect(roll.notation).toEqual(notation);
            expect(roll.output).toEqual(`${notation}: {([4, 5, 1, 3]+5)*, (20/[8, 6])_, ([3]-1)_} = -1`);
            expect(roll.total).toBeCloseTo(-1);
          });
        });

        describe('neutral', () => {
          test('roll `{4d6}>20f<10`', () => {
            jest.spyOn(StandardDice.prototype, 'roll')
              .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]));
            const notation = '{4d6}>20f<10';
            const roll = roller.roll(notation);

            expect(roll).toBeInstanceOf(DiceRoll);
            expect(roll.notation).toEqual(notation);
            expect(roll.output).toEqual(`${notation}: {[4, 5, 1, 3]} = 0`);
            expect(roll.total).toBe(0);
          });

          test('roll `{4d6+5, 20/2d10, d4-1}>10f<2`', () => {
            jest.spyOn(StandardDice.prototype, 'roll')
              .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]))
              .mockImplementationOnce(() => new RollResults([8, 6]))
              .mockImplementationOnce(() => new RollResults([3]));
            const notation = '{4d6+5, 20/2d10, d4-1}>10f<2';
            const roll = roller.roll(notation);

            expect(roll).toBeInstanceOf(DiceRoll);
            expect(roll.notation).toEqual(notation);
            expect(roll.output).toEqual(`${notation}: {([4, 5, 1, 3]+5)*, (20/[8, 6])_, [3]-1} = 0`);
            expect(roll.total).toBeCloseTo(0);
          });
        });
      });
    });
  });
});
