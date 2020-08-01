import { StandardDice } from '../../src/dice';
import { Modifier } from '../../src/modifiers';
import RollResults from '../../src/results/RollResults';

describe('Modifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const mod = new Modifier();

      expect(mod).toBeInstanceOf(Modifier);
      expect(mod).toEqual(expect.objectContaining({
        maxIterations: 1000,
        name: 'modifier',
        notation: '',
        run: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });
  });

  describe('Output', () => {
    test('JSON output is correct', () => {
      const mod = new Modifier();

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
      const mod = new Modifier();

      expect(mod.toString()).toEqual('');
    });
  });

  describe('Run', () => {
    let mod;
    let die;
    let results;

    beforeEach(() => {
      results = new RollResults([
        8, 4, 2, 1, 6, 10,
      ]);
      die = new StandardDice(10, 6);
      mod = new Modifier();
    });

    test('returns RollResults object', () => {
      expect(mod.run(results, die)).toBe(results);
    });
  });
});
