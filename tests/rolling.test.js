import DiceRoller from '../src/DiceRoller.js';
import DiceRoll from '../src/DiceRoll.js';
import RollResults from '../src/results/RollResults.js';
import StandardDice from '../src/dice/StandardDice.js';
import RollResult from "../src/results/RollResult";

describe('Rolling', () => {
  let roller;

  beforeEach(() => {
    roller = new DiceRoller();
  });

  test('roll `2d7 + (5d4 * 2)`', () => {
    const rolls = [
      new RollResults([5, 2]),
      new RollResults([4, 2, 1, 3, 3])
    ];
    const spy = jest.spyOn(StandardDice.prototype, 'roll')
      .mockImplementationOnce(() => rolls[0])
      .mockImplementationOnce(() => rolls[1]);
    const roll = roller.roll('2d7 + (5d4 * 2)');

    expect(roll).toBeInstanceOf(DiceRoll);
    expect(roll).toEqual(expect.objectContaining({
      notation: '2d7 + (5d4 * 2)',
      rolls: rolls,
      output: '2d7 + (5d4 * 2): [5, 2]+([4, 2, 1, 3, 3]*2) = 33',
      total: 33,
    }));
  });

  test('roll `floor(2.56 * d7)`', () => {
    const rolls = new RollResults([5]);
    const spy = jest.spyOn(StandardDice.prototype, 'roll')
      .mockImplementationOnce(() => rolls);
    const roll = roller.roll('floor(2.56 * d7)');

    expect(roll).toBeInstanceOf(DiceRoll);
    expect(roll).toEqual(expect.objectContaining({
      notation: 'floor(2.56 * d7)',
      rolls: [rolls],
      output: 'floor(2.56 * d7): floor(2.56*[5]) = 12',
      total: 12,
    }));
  });

  test('roll `ceil(2.56 * d7)`', () => {
    const rolls = new RollResults([5]);
    const spy = jest.spyOn(StandardDice.prototype, 'roll')
      .mockImplementationOnce(() => rolls);
    const roll = roller.roll('ceil(2.56 * d7)');

    expect(roll).toBeInstanceOf(DiceRoll);
    expect(roll).toEqual(expect.objectContaining({
      notation: 'ceil(2.56 * d7)',
      rolls: [rolls],
      output: 'ceil(2.56 * d7): ceil(2.56*[5]) = 13',
      total: 13,
    }));
  });

  test('roll `max(2 * (d7/2), 1d7)`', () => {
    const rollsFirst = new RollResults([5]);
    const rollsSecond = new RollResults([2]);
    const spy = jest.spyOn(StandardDice.prototype, 'roll')
    .mockImplementationOnce(() => rollsFirst)
    .mockImplementationOnce(() => rollsSecond);
    const roll = roller.roll('max(2 * (d7/2), 1d7)');

    expect(roll).toBeInstanceOf(DiceRoll);
    expect(roll).toEqual(expect.objectContaining({
      notation: 'max(2 * (d7/2), 1d7)',
      rolls: [rollsFirst, rollsSecond],
      output: 'max(2 * (d7/2), 1d7): max(2*([5]/2),[2]) = 5',
      total: 5,
    }));
  });

  test('roll `min(2 * (d7/2), 1d7)`', () => {
    const rollsFirst = new RollResults([5]);
    const rollsSecond = new RollResults([2]);
    const spy = jest.spyOn(StandardDice.prototype, 'roll')
    .mockImplementationOnce(() => rollsFirst)
    .mockImplementationOnce(() => rollsSecond);
    const roll = roller.roll('min(2 * (d7/2), 1d7)');

    expect(roll).toBeInstanceOf(DiceRoll);
    expect(roll).toEqual(expect.objectContaining({
      notation: 'min(2 * (d7/2), 1d7)',
      rolls: [rollsFirst, rollsSecond],
      output: 'min(2 * (d7/2), 1d7): min(2*([5]/2),[2]) = 2',
      total: 2,
    }));
  });

  test('roll `3d6cs>3cf<3`', () => {
    const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
      .mockImplementationOnce(() => 5)
      .mockImplementationOnce(() => 4)
      .mockImplementationOnce(() => 1);
    const roll = roller.roll('3d6cs>3cf<3');

    expect(roll).toBeInstanceOf(DiceRoll);
    expect(roll).toEqual(expect.objectContaining({
      notation: '3d6cs>3cf<3',
      output: '3d6cs>3cf<3: [5**, 4**, 1__] = 10',
      total: 10,
    }));
  });

  test('roll `4d6sd`', () => {
    const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
      .mockImplementationOnce(() => 4)
      .mockImplementationOnce(() => 6)
      .mockImplementationOnce(() => 5)
      .mockImplementationOnce(() => 1);
    const roll = roller.roll('4d6sd');

    expect(roll).toBeInstanceOf(DiceRoll);
    expect(roll).toEqual(expect.objectContaining({
      notation: '4d6sd',
      output: '4d6sd: [6, 5, 4, 1] = 16',
      total: 16,
    }));
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
    expect(roll).toEqual(expect.objectContaining({
      notation: '2d6r<=4',
      output: '2d6r<=4: [6r, 5] = 11',
      total: 11,
    }));
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
    expect(roll).toEqual(expect.objectContaining({
      notation: '6d10>=8!>=9',
      output: '6d10>=8!>=9: [4, 5, 6, 3, 10!*, 6, 8*] = 2',
      total: 2,
    }));
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
    expect(roll).toEqual(expect.objectContaining({
      notation: '6d10!>=9>=8',
      output: '6d10!>=9>=8: [4, 5, 6, 3, 10!*, 6, 8*] = 2',
      total: 2,
    }));
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
    expect(roll).toEqual(expect.objectContaining({
      notation: '(4d10^7)*6d(3*2)',
      output: '(4d10^7)*6d(3*2): ([4, 5, 6, 10]^7)*[3, 4, 6, 4, 1, 3] = 128173828125',
      total: 128173828125,
    }));
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
    expect(roll).toEqual(expect.objectContaining({
      notation: '5d6%2d20',
      output: '5d6%2d20: [4, 5, 6, 3, 2]%[9, 20] = 20',
      total: 20,
    }));
  });

  test('roll `1d20+-5`', () => {
    const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
      .mockImplementationOnce(() => new RollResult(20));
    const roll = roller.roll('1d20+-5');

    expect(roll).toBeInstanceOf(DiceRoll);
    expect(roll).toEqual(expect.objectContaining({
      notation: '1d20+-5',
      output: '1d20+-5: [20]+-5 = 15',
      total: 15,
    }));

    // remove the spy
    spy.mockRestore();
  });

  test('roll `1d20--6`', () => {
    const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
      .mockImplementationOnce(() => new RollResult(20));
    const roll = roller.roll('1d20--6');

    expect(roll).toBeInstanceOf(DiceRoll);
    expect(roll).toEqual(expect.objectContaining({
      notation: '1d20--6',
      output: '1d20--6: [20]--6 = 26',
      total: 26,
    }));

    // remove the spy
    spy.mockRestore();
  });
});
