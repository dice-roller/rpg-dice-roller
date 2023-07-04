import { StandardDice } from '../../src/dice/index.js';
import { Modifier } from '../../src/modifiers/index.js';
import RollResults from '../../src/results/RollResults.js';

describe('Modifier', () => {
  let mod;

  beforeEach(() => {
    mod = new Modifier();
  });

  describe('Initialisation', () => {
    test('model structure', () => {
      expect(mod).toBeInstanceOf(Modifier);
      expect(mod).toEqual(expect.objectContaining({
        maxIterations: 1000,
        name: 'modifier',
        notation: '',
        order: 999,
        run: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });
  });

  describe('Order', () => {
    test('can change to an integer', () => {
      expect(mod.order).toBe(999);

      mod.order = 1;
      expect(mod.order).toBe(1);

      mod.order = 0;
      expect(mod.order).toBe(0);

      mod.order = 45;
      expect(mod.order).toBe(45);

      mod.order = 4526;
      expect(mod.order).toBe(4526);
    });

    test('can be negative', () => {
      mod.order = -1;
      expect(mod.order).toBe(-1);

      mod.order = -37;
      expect(mod.order).toBe(-37);

      mod.order = -65837;
      expect(mod.order).toBe(-65837);
    });

    test('can be float', () => {
      mod.order = 0.12;
      expect(mod.order).toBe(0.12);

      mod.order = 678.2;
      expect(mod.order).toBe(678.2);

      mod.order = -1.62983;
      expect(mod.order).toEqual(-1.62983);
    });

    test('changing order for one instance does not affect others', () => {
      const mod2 = new Modifier();

      expect(mod.order).toBe(999);
      expect(mod2.order).toBe(999);

      mod2.order = 3;
      expect(mod.order).toBe(999);
      expect(mod2.order).toBe(3);

      mod.order = 56;
      expect(mod.order).toBe(56);
      expect(mod2.order).toBe(3);
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      // json encode, to get the encoded string, then decode so we can compare the object
      // this allows us to check that the output is correct, but ignoring the order of the
      // returned properties
      expect(JSON.parse(JSON.stringify(mod))).toEqual({
        name: 'modifier',
        notation: '',
        type: 'modifier',
      });
    });

    test('toString output is correct', () => {
      expect(mod.toString()).toEqual('');
    });
  });

  describe('Run', () => {
    let die;
    let results;

    beforeEach(() => {
      results = new RollResults([
        8, 4, 2, 1, 6, 10,
      ]);
      die = new StandardDice(10, 6);
    });

    test('returns RollResults object', () => {
      expect(mod.run(results, die)).toBe(results);
    });
  });
});
