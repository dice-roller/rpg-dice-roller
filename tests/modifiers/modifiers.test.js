import { StandardDice } from '../../src/dice/index.js';
import DiceRoll from '../../src/DiceRoll.js';

describe('Modifiers', () => {
  test('does not duplicate drop modifier', () => {
    const notation = '3d6kh2dl1';
    const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
      .mockImplementationOnce(() => 1)
      .mockImplementationOnce(() => 4)
      .mockImplementationOnce(() => 6);
    const roll = new DiceRoll(notation).rolls[0];
    const results = roll.rolls;

    expect(results).toBeInstanceOf(Array);
    expect(results).toHaveLength(3);

    expect(results[0].value).toBe(1);
    expect(results[0].useInTotal).toBe(false);
    expect(results[0].modifiers.size).toBe(1);
    expect([...results[0].modifiers][0]).toEqual('drop');

    expect(results[1].value).toBe(4);
    expect(results[1].useInTotal).toBe(true);
    expect(results[1].modifiers.size).toBe(0);

    expect(results[2].value).toBe(6);
    expect(results[2].useInTotal).toBe(true);
    expect(results[2].modifiers.size).toBe(0);

    // remove the spy
    spy.mockRestore();
  });

  test('drop and keep together does not drop too many', () => {
    const notation = '3d6kh2dl1';
    const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
      .mockImplementationOnce(() => 5)
      .mockImplementationOnce(() => 6)
      .mockImplementationOnce(() => 5);
    const roll = new DiceRoll(notation).rolls[0];
    const results = roll.rolls;

    expect(results).toHaveLength(3);

    expect(results[0].value).toBe(5);
    expect(results[0].useInTotal).toBe(false);
    expect(results[0].modifiers.size).toBe(1);
    expect([...results[0].modifiers][0]).toEqual('drop');

    expect(results[1].value).toBe(6);
    expect(results[1].useInTotal).toBe(true);
    expect(results[1].modifiers.size).toBe(0);

    expect(results[2].value).toBe(5);
    expect(results[2].useInTotal).toBe(true);
    expect(results[2].modifiers.size).toBe(0);

    // remove the spy
    spy.mockRestore();
  });
});
