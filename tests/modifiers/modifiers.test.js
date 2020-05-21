import StandardDice from '../../src/dice/StandardDice';
import DiceRoller from '../../src/DiceRoller';

describe('Modifiers', () => {
  let roller;

  beforeEach(() => {
    roller = new DiceRoller();
  });

  test('does not duplicate drop modifier', () => {
    const notation = '3d6kh2dl1';
    const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
      .mockImplementationOnce(() => 1)
      .mockImplementationOnce(() => 4)
      .mockImplementationOnce(() => 6);
    const roll = roller.roll(notation).rolls[0];

    expect(roll.rolls).toHaveLength(3);

    expect(roll.rolls[0].value).toBe(1);
    expect(roll.rolls[0].useInTotal).toBe(false);
    expect(roll.rolls[0].modifiers.size).toBe(1);
    expect([...roll.rolls[0].modifiers][0]).toEqual('drop');

    expect(roll.rolls[1].value).toBe(4);
    expect(roll.rolls[1].useInTotal).toBe(true);
    expect(roll.rolls[1].modifiers.size).toBe(0);

    expect(roll.rolls[2].value).toBe(6);
    expect(roll.rolls[2].useInTotal).toBe(true);
    expect(roll.rolls[2].modifiers.size).toBe(0);

    // remove the spy
    spy.mockRestore();
  });
});
