import ArbitraryDice from '../../src/dice/ArbitraryDice.js';

describe('ArbitraryDice', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const die = new ArbitraryDice([6, {start: 5, end: 67, step: 0.5}], 4);

      expect(die).toBeInstanceOf(ArbitraryDice);
      expect(die).toEqual(expect.objectContaining({
        description: null,
        notation: '4d{6,5:0.5:67}',
        qty: 4,
        modifiers: null,
        max: 67,
        min: 5,
        name: 'arbitrary',
        roll: expect.any(Function),
        rollOnce: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));

      expect(die.sides).toEqual(
        6,
        {
          start: 5,
          end: 67,
          step: 0.5,
        });
    });
  });
});
