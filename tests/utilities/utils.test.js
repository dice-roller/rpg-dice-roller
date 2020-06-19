import { diceUtils } from '../../src/utilities/utils';

describe('diceUtils', () => {
  describe('prng', () => {
    test('selected rng', () => {
      const { method } = diceUtils.prng;
      expect(method).toEqual('mersenne-twister');
    });

    test('set seed for mersenne twister', () => {
      diceUtils.prng.forceMersenneTwister(521);
      const result1 = diceUtils.generateNumber(1, 10);
      const result2 = diceUtils.generateNumber(1, 10);
      const result3 = diceUtils.generateNumber(1, 10);
      expect(result1).toEqual(8);
      expect(result2).toEqual(7);
      expect(result3).toEqual(6);
    });

    test('force Math.random()', () => {
      diceUtils.prng.forceMath();
      const { method } = diceUtils.prng;
      expect(method).toEqual('math');
      const result = diceUtils.generateNumber(1, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    });
  });
});
