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

  describe('Basic rolls', () => {
    test('roll `2d7 + (5d4 * 2)`', () => {
      const rolls = [
        new RollResults([5, 2]),
        new RollResults([4, 2, 1, 3, 3]),
      ];
      const spy = jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => rolls[0])
        .mockImplementationOnce(() => rolls[1]);
      const roll = roller.roll('2d7 + (5d4 * 2)');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('2d7 + (5d4 * 2)');
      expect(roll.rolls).toEqual([rolls[0], '+', '(', rolls[1], '*', 2, ')']);
      expect(roll.total).toBe(33);
      expect(roll.output).toEqual('2d7 + (5d4 * 2): [5, 2]+([4, 2, 1, 3, 3]*2) = 33');

      // remove the spy
      spy.mockRestore();
    });

    test('roll `floor(2.56 * d7)`', () => {
      const rolls = new RollResults([5]);
      const spy = jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => rolls);
      const roll = roller.roll('floor(2.56 * d7)');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('floor(2.56 * d7)');
      expect(roll.rolls).toEqual(['floor(', 2.56, '*', rolls, ')']);
      expect(roll.total).toBe(12);
      expect(roll.output).toEqual('floor(2.56 * d7): floor(2.56*[5]) = 12');

      // remove the spy
      spy.mockRestore();
    });

    test('roll `ceil(2.56 * d7)`', () => {
      const rolls = new RollResults([5]);
      const spy = jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => rolls);
      const roll = roller.roll('ceil(2.56 * d7)');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('ceil(2.56 * d7)');
      expect(roll.rolls).toEqual(['ceil(', 2.56, '*', rolls, ')']);
      expect(roll.total).toBe(13);
      expect(roll.output).toEqual('ceil(2.56 * d7): ceil(2.56*[5]) = 13');

      // remove the spy
      spy.mockRestore();
    });

    test('roll `max(2 * (d7/2), 1d7)`', () => {
      const rollsFirst = new RollResults([5]);
      const rollsSecond = new RollResults([2]);
      const spy = jest.spyOn(StandardDice.prototype, 'roll')
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

      // remove the spy
      spy.mockRestore();
    });

    test('roll `min(2 * (d7/2), 1d7)`', () => {
      const rollsFirst = new RollResults([5]);
      const rollsSecond = new RollResults([2]);
      const spy = jest.spyOn(StandardDice.prototype, 'roll')
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

      // remove the spy
      spy.mockRestore();
    });

    test('roll `(4d10^7)*6d(3*2)`', () => {
      const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
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

      // remove the spy
      spy.mockRestore();
    });

    test('roll `5d6%2d20`', () => {
      const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
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

      // remove the spy
      spy.mockRestore();
    });

    test('roll `1d20+-5`', () => {
      const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => new RollResult(20));
      const roll = roller.roll('1d20+-5');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('1d20+-5');
      expect(roll.output).toEqual('1d20+-5: [20]+-5 = 15');
      expect(roll.total).toBe(15);

      // remove the spy
      spy.mockRestore();
    });

    test('roll `1d20--6`', () => {
      const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => new RollResult(20));
      const roll = roller.roll('1d20--6');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('1d20--6');
      expect(roll.output).toEqual('1d20--6: [20]--6 = 26');
      expect(roll.total).toBe(26);

      // remove the spy
      spy.mockRestore();
    });

    test('roll `1d20+1.45', () => {
      const rolls = new RollResults([8]);
      const spy = jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => rolls);
      const roll = roller.roll('1d20+1.45');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('1d20+1.45');
      expect(roll.rolls).toEqual([rolls, '+', 1.45]);
      expect(roll.total).toBe(9.45);
      expect(roll.output).toEqual('1d20+1.45: [8]+1.45 = 9.45');

      // remove the spy
      spy.mockRestore();
    });

    test('roll `1d20*0.20', () => {
      const rolls = new RollResults([8]);
      const spy = jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => rolls);
      const roll = roller.roll('1d20*0.20');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('1d20*0.20');
      expect(roll.rolls).toEqual([rolls, '*', 0.20]);
      expect(roll.total).toBe(1.6);
      expect(roll.output).toEqual('1d20*0.20: [8]*0.2 = 1.6');

      // remove the spy
      spy.mockRestore();
    });

    test('roll `1d20/6.02', () => {
      const rolls = new RollResults([8]);
      const spy = jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => rolls);
      const roll = roller.roll('1d20/6.02');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('1d20/6.02');
      expect(roll.rolls).toEqual([rolls, '/', 6.02]);
      expect(roll.total).toBe(1.33);
      expect(roll.output).toEqual('1d20/6.02: [8]/6.02 = 1.33');

      // remove the spy
      spy.mockRestore();
    });

    test('roll `1d20+0', () => {
      const rolls = new RollResults([8]);
      const spy = jest.spyOn(StandardDice.prototype, 'roll')
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

      // remove the spy
      spy.mockRestore();
    });

    describe('modifiers', () => {
      test('roll `3d6cs>3cf<3`', () => {
        const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
          .mockImplementationOnce(() => 5)
          .mockImplementationOnce(() => 4)
          .mockImplementationOnce(() => 1);
        const roll = roller.roll('3d6cs>3cf<3');

        expect(roll).toBeInstanceOf(DiceRoll);
        expect(roll.notation).toEqual('3d6cs>3cf<3');
        expect(roll.total).toBe(10);
        expect(roll.output).toEqual('3d6cs>3cf<3: [5**, 4**, 1__] = 10');

        // remove the spy
        spy.mockRestore();
      });

      test('roll `4d6sd`', () => {
        const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
          .mockImplementationOnce(() => 4)
          .mockImplementationOnce(() => 6)
          .mockImplementationOnce(() => 5)
          .mockImplementationOnce(() => 1);
        const roll = roller.roll('4d6sd');

        expect(roll).toBeInstanceOf(DiceRoll);
        expect(roll.notation).toEqual('4d6sd');
        expect(roll.total).toBe(16);
        expect(roll.output).toEqual('4d6sd: [6, 5, 4, 1] = 16');

        // remove the spy
        spy.mockRestore();
      });

      test('roll `2d6r<=4`', () => {
        const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
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

        // remove the spy
        spy.mockRestore();
      });

      test('roll `6d10>=8!>=9`', () => {
        const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
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
        expect(roll.output).toEqual('6d10>=8!>=9: [4, 5, 6, 3, 10!+, 6, 8+] = 2');

        // remove the spy
        spy.mockRestore();
      });

      test('roll `6d10!>=9>=8`', () => {
        const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
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
        expect(roll.output).toEqual('6d10!>=9>=8: [4, 5, 6, 3, 10!+, 6, 8+] = 2');

        // remove the spy
        spy.mockRestore();
      });

      test('roll `6d10min3max6`', () => {
        const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
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

        // remove the spy
        spy.mockRestore();
      });

      test('roll `3d8mul6`', () => {
        const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
          .mockImplementationOnce(() => new RollResult(5))
          .mockImplementationOnce(() => new RollResult(3))
          .mockImplementationOnce(() => new RollResult(7));
        const notation = '3d8mul6';
        const roll = roller.roll(notation);

        expect(roll).toBeInstanceOf(DiceRoll);
        expect(roll.notation).toEqual(notation);
        expect(roll.output).toEqual(`${notation}: [5*, 3*, 7*] = 90`);
        expect(roll.total).toBe(90);

        // remove the spy
        spy.mockRestore();
      });

      test('roll `5d10>=7mul2=10`', () => {
        const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
          .mockImplementationOnce(() => new RollResult(10))
          .mockImplementationOnce(() => new RollResult(3))
          .mockImplementationOnce(() => new RollResult(7))
          .mockImplementationOnce(() => new RollResult(2))
          .mockImplementationOnce(() => new RollResult(8));
        const notation = '5d10>=7mul2=10';
        const roll = roller.roll(notation);

        expect(roll).toBeInstanceOf(DiceRoll);
        expect(roll.notation).toEqual(notation);
        expect(roll.output).toEqual(`${notation}: [10+*, 3, 7+, 2, 8+] = 4`);
        expect(roll.total).toBe(4);

        // remove the spy
        spy.mockRestore();
      });
    });
  });

  describe('Group rolls', () => {
    describe('No modifiers', () => {
      test('roll `{4d6}`', () => {
        const spy = jest.spyOn(StandardDice.prototype, 'roll')
          .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]));
        const notation = '{4d6}';
        const roll = roller.roll(notation);

        expect(roll).toBeInstanceOf(DiceRoll);
        expect(roll.notation).toEqual(notation);
        expect(roll.output).toEqual(`${notation}: {[4, 5, 1, 3]} = 13`);
        expect(roll.total).toBe(13);

        // remove the spy
        spy.mockRestore();
      });

      test('roll `{4d6, 2d10, d4}`', () => {
        const spy = jest.spyOn(StandardDice.prototype, 'roll')
          .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]))
          .mockImplementationOnce(() => new RollResults([8, 6]))
          .mockImplementationOnce(() => new RollResults([3]));
        const notation = '{4d6, 2d10, d4}';
        const roll = roller.roll(notation);

        expect(roll).toBeInstanceOf(DiceRoll);
        expect(roll.notation).toEqual(notation);
        expect(roll.output).toEqual(`${notation}: {[4, 5, 1, 3], [8, 6], [3]} = 30`);
        expect(roll.total).toBe(30);

        // remove the spy
        spy.mockRestore();
      });

      test('roll `{4d6+5, 20/2d10, d4-1}`', () => {
        const spy = jest.spyOn(StandardDice.prototype, 'roll')
          .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]))
          .mockImplementationOnce(() => new RollResults([8, 6]))
          .mockImplementationOnce(() => new RollResults([3]));
        const notation = '{4d6+5, 20/2d10, d4-1}';
        const roll = roller.roll(notation);

        expect(roll).toBeInstanceOf(DiceRoll);
        expect(roll.notation).toEqual(notation);
        expect(roll.output).toEqual(`${notation}: {[4, 5, 1, 3]+5, 20/[8, 6], [3]-1} = 21.43`);
        expect(roll.total).toBeCloseTo(21.43);

        // remove the spy
        spy.mockRestore();
      });
    });

    describe('With modifiers', () => {
      describe('Keep modifier', () => {
        test('roll `{4d10*5d6}k2`', () => {
          const spy = jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([10, 5, 3, 4]))
            .mockImplementationOnce(() => new RollResults([2, 4, 3, 6, 1]));
          const notation = '{4d10*5d6}k2';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {[10, 5d, 3d, 4d]*[2d, 4d, 3d, 6, 1d]} = 60`);
          expect(roll.total).toBe(60);

          // remove the spy
          spy.mockRestore();
        });

        test('roll `{4d10*5d6}kl3`', () => {
          const spy = jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([10, 5, 7, 1]))
            .mockImplementationOnce(() => new RollResults([2, 4, 3, 6, 4]));
          const notation = '{4d10*5d6}kl3';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {[10d, 5d, 7d, 1]*[2, 4d, 3, 6d, 4d]} = 5`);
          expect(roll.total).toBe(5);

          // remove the spy
          spy.mockRestore();
        });

        test('roll `{4d10*2, 5d6+10}k1`', () => {
          const spy = jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([10, 5, 3, 4]))
            .mockImplementationOnce(() => new RollResults([2, 4, 3, 6, 1]));
          const notation = '{4d10*2, 5d6+10}k1';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {[10, 5, 3, 4]*2, ([2, 4, 3, 6, 1]+10)d} = 44`);
          expect(roll.total).toBe(44);

          // remove the spy
          spy.mockRestore();
        });

        test('roll `{4d10*2, 5d6+10}kl1`', () => {
          const spy = jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([10, 5, 3, 4]))
            .mockImplementationOnce(() => new RollResults([2, 4, 3, 6, 1]));
          const notation = '{4d10*2, 5d6+10}kl1';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {([10, 5, 3, 4]*2)d, [2, 4, 3, 6, 1]+10} = 26`);
          expect(roll.total).toBe(26);

          // remove the spy
          spy.mockRestore();
        });
      });

      describe('Drop modifier', () => {
        test('roll `{4d10*5d6}d2`', () => {
          const spy = jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([10, 2, 3, 4]))
            .mockImplementationOnce(() => new RollResults([5, 4, 3, 6, 1]));
          const notation = '{4d10*5d6}d2';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {[10, 2d, 3, 4]*[5, 4, 3, 6, 1d]} = 306`);
          expect(roll.total).toBe(306);

          // remove the spy
          spy.mockRestore();
        });

        test('roll `{4d10*5d6}dh3`', () => {
          const spy = jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([10, 5, 7, 1]))
            .mockImplementationOnce(() => new RollResults([2, 4, 3, 6, 4]));
          const notation = '{4d10*5d6}dh3';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {[10d, 5, 7d, 1]*[2, 4, 3, 6d, 4]} = 78`);
          expect(roll.total).toBe(78);

          // remove the spy
          spy.mockRestore();
        });

        test('roll `{4d10*2, 5d6+10}d1`', () => {
          const spy = jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([10, 5, 3, 4]))
            .mockImplementationOnce(() => new RollResults([2, 4, 3, 6, 1]));
          const notation = '{4d10*2, 5d6+10}d1';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {[10, 5, 3, 4]*2, ([2, 4, 3, 6, 1]+10)d} = 44`);
          expect(roll.total).toBe(44);

          // remove the spy
          spy.mockRestore();
        });

        test('roll `{4d10*2, 5d6+10}dh1`', () => {
          const spy = jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([10, 5, 3, 4]))
            .mockImplementationOnce(() => new RollResults([2, 4, 3, 6, 1]));
          const notation = '{4d10*2, 5d6+10}dh1';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {([10, 5, 3, 4]*2)d, [2, 4, 3, 6, 1]+10} = 26`);
          expect(roll.total).toBe(26);

          // remove the spy
          spy.mockRestore();
        });
      });

      describe('Sorting modifier', () => {
        test('roll `{4d6}s`', () => {
          const spy = jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]));
          const notation = '{4d6}s';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {[1, 3, 4, 5]} = 13`);
          expect(roll.total).toBe(13);

          // remove the spy
          spy.mockRestore();
        });

        test('roll `{4d6}sd`', () => {
          const spy = jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]));
          const notation = '{4d6}sd';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {[5, 4, 3, 1]} = 13`);
          expect(roll.total).toBe(13);

          // remove the spy
          spy.mockRestore();
        });

        test('roll `{4d6, 2d10, d4}s`', () => {
          const spy = jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]))
            .mockImplementationOnce(() => new RollResults([8, 6]))
            .mockImplementationOnce(() => new RollResults([3]));
          const notation = '{4d6, 2d10, d4}s';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {[3], [1, 3, 4, 5], [6, 8]} = 30`);
          expect(roll.total).toBe(30);

          // remove the spy
          spy.mockRestore();
        });

        test('roll `{4d6+5, 20/2d10, d4-1}sd`', () => {
          const spy = jest.spyOn(StandardDice.prototype, 'roll')
            .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]))
            .mockImplementationOnce(() => new RollResults([8, 6]))
            .mockImplementationOnce(() => new RollResults([3]));
          const notation = '{4d6+5, 20/2d10, d4-1}sd';
          const roll = roller.roll(notation);

          expect(roll).toBeInstanceOf(DiceRoll);
          expect(roll.notation).toEqual(notation);
          expect(roll.output).toEqual(`${notation}: {[5, 4, 3, 1]+5, [3]-1, 20/[8, 6]} = 21.43`);
          expect(roll.total).toBeCloseTo(21.43);

          // remove the spy
          spy.mockRestore();
        });
      });

      describe('Target modifier', () => {
        describe('Success', () => {
          test('roll `{4d6}>10`', () => {
            const spy = jest.spyOn(StandardDice.prototype, 'roll')
              .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]));
            const notation = '{4d6}>10';
            const roll = roller.roll(notation);

            expect(roll).toBeInstanceOf(DiceRoll);
            expect(roll.notation).toEqual(notation);
            expect(roll.output).toEqual(`${notation}: {([4, 5, 1, 3])+} = 1`);
            expect(roll.total).toBe(1);

            // remove the spy
            spy.mockRestore();
          });

          test('roll `{4d6}<10`', () => {
            const spy = jest.spyOn(StandardDice.prototype, 'roll')
              .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]));
            const notation = '{4d6}<10';
            const roll = roller.roll(notation);

            expect(roll).toBeInstanceOf(DiceRoll);
            expect(roll.notation).toEqual(notation);
            expect(roll.output).toEqual(`${notation}: {[4, 5, 1, 3]} = 0`);
            expect(roll.total).toBe(0);

            // remove the spy
            spy.mockRestore();
          });

          test('roll `{4d6+5, 20/2d10, d4-1}>10`', () => {
            const spy = jest.spyOn(StandardDice.prototype, 'roll')
              .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]))
              .mockImplementationOnce(() => new RollResults([8, 6]))
              .mockImplementationOnce(() => new RollResults([3]));
            const notation = '{4d6+5, 20/2d10, d4-1}>10';
            const roll = roller.roll(notation);

            expect(roll).toBeInstanceOf(DiceRoll);
            expect(roll.notation).toEqual(notation);
            expect(roll.output).toEqual(`${notation}: {([4, 5, 1, 3]+5)+, 20/[8, 6], [3]-1} = 1`);
            expect(roll.total).toBeCloseTo(1);

            // remove the spy
            spy.mockRestore();
          });

          test('roll `{4d6+5, 20/2d10, d4-1}<10`', () => {
            const spy = jest.spyOn(StandardDice.prototype, 'roll')
              .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]))
              .mockImplementationOnce(() => new RollResults([8, 6]))
              .mockImplementationOnce(() => new RollResults([3]));
            const notation = '{4d6+5, 20/2d10, d4-1}<10';
            const roll = roller.roll(notation);

            expect(roll).toBeInstanceOf(DiceRoll);
            expect(roll.notation).toEqual(notation);
            expect(roll.output).toEqual(`${notation}: {[4, 5, 1, 3]+5, (20/[8, 6])+, ([3]-1)+} = 2`);
            expect(roll.total).toBeCloseTo(2);

            // remove the spy
            spy.mockRestore();
          });
        });

        describe('Failure', () => {
          test('roll `{4d6}>20f<15`', () => {
            const spy = jest.spyOn(StandardDice.prototype, 'roll')
              .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]));
            const notation = '{4d6}>20f<15';
            const roll = roller.roll(notation);

            expect(roll).toBeInstanceOf(DiceRoll);
            expect(roll.notation).toEqual(notation);
            expect(roll.output).toEqual(`${notation}: {([4, 5, 1, 3])-} = -1`);
            expect(roll.total).toBe(-1);

            // remove the spy
            spy.mockRestore();
          });

          test('roll `{4d6+5, 20/2d10, d4-1}>10f<10`', () => {
            const spy = jest.spyOn(StandardDice.prototype, 'roll')
              .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]))
              .mockImplementationOnce(() => new RollResults([8, 6]))
              .mockImplementationOnce(() => new RollResults([3]));
            const notation = '{4d6+5, 20/2d10, d4-1}>10f<10';
            const roll = roller.roll(notation);

            expect(roll).toBeInstanceOf(DiceRoll);
            expect(roll.notation).toEqual(notation);
            expect(roll.output).toEqual(`${notation}: {([4, 5, 1, 3]+5)+, (20/[8, 6])-, ([3]-1)-} = -1`);
            expect(roll.total).toBeCloseTo(-1);

            // remove the spy
            spy.mockRestore();
          });
        });

        describe('neutral', () => {
          test('roll `{4d6}>20f<10`', () => {
            const spy = jest.spyOn(StandardDice.prototype, 'roll')
              .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]));
            const notation = '{4d6}>20f<10';
            const roll = roller.roll(notation);

            expect(roll).toBeInstanceOf(DiceRoll);
            expect(roll.notation).toEqual(notation);
            expect(roll.output).toEqual(`${notation}: {[4, 5, 1, 3]} = 0`);
            expect(roll.total).toBe(0);

            // remove the spy
            spy.mockRestore();
          });

          test('roll `{4d6+5, 20/2d10, d4-1}>10f<2`', () => {
            const spy = jest.spyOn(StandardDice.prototype, 'roll')
              .mockImplementationOnce(() => new RollResults([4, 5, 1, 3]))
              .mockImplementationOnce(() => new RollResults([8, 6]))
              .mockImplementationOnce(() => new RollResults([3]));
            const notation = '{4d6+5, 20/2d10, d4-1}>10f<2';
            const roll = roller.roll(notation);

            expect(roll).toBeInstanceOf(DiceRoll);
            expect(roll.notation).toEqual(notation);
            expect(roll.output).toEqual(`${notation}: {([4, 5, 1, 3]+5)+, (20/[8, 6])-, [3]-1} = 0`);
            expect(roll.total).toBeCloseTo(0);

            // remove the spy
            spy.mockRestore();
          });
        });
      });
    });
  });
});
