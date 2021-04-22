import { StandardDice } from '../../src/dice/index.js';
import { Modifier } from '../../src/modifiers/index.js';
import RollResults from '../../src/results/RollResults.js';

describe('Modifier', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const mod = new Modifier();

      expect(mod).toBeInstanceOf(Modifier);
      expect(mod).toEqual(expect.objectContaining({
        maxIterations: Modifier.defaultMaxIterations,
        name: 'modifier',
        notation: '',
        run: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));

      expect(Modifier.defaultMaxIterations).toBe(1000);
    });
  });

  describe('Iterations', () => {
    test('Gets set in constructor', () => {
      const mod = new Modifier(4);

      expect(mod.maxIterations).toBe(4);
    });

    test('must be numeric', () => {
      let mod = new Modifier(789);
      expect(mod.maxIterations).toBe(789);

      mod = new Modifier(145);
      expect(mod.maxIterations).toBe(145);

      mod = new Modifier('64');
      expect(mod.maxIterations).toBe(64);

      expect(() => {
        new Modifier([678]);
      }).toThrow(TypeError);

      expect(() => {
        new Modifier('foo');
      }).toThrow(TypeError);

      expect(() => {
        new Modifier(true);
      }).toThrow(TypeError);

      expect(() => {
        new Modifier({});
      }).toThrow(TypeError);
    });

    test('must be positive non-zero', () => {
      expect(() => {
        new Modifier(0);
      }).toThrow(RangeError);

      expect(() => {
        new Modifier(-1);
      }).toThrow(RangeError);

      expect(() => {
        new Modifier(-657);
      }).toThrow(RangeError);

      expect(() => {
        new Modifier(-41798643);
      }).toThrow(RangeError);
    });

    test('float gets floored to integer', () => {
      let mod = new Modifier(5.76);
      expect(mod.maxIterations).toBe(5);

      mod = new Modifier(16.3783);
      expect(mod.maxIterations).toBe(16);

      mod = new Modifier(179.1);
      expect(mod.maxIterations).toBe(179);
    });

    test('greater than default max is set to default max', () => {
      let mod = new Modifier(Modifier.defaultMaxIterations - 1);
      expect(mod.maxIterations).toBe(Modifier.defaultMaxIterations - 1);

      mod = new Modifier(Modifier.defaultMaxIterations);
      expect(mod.maxIterations).toBe(Modifier.defaultMaxIterations);

      mod = new Modifier(Modifier.defaultMaxIterations + 1);
      expect(mod.maxIterations).toBe(Modifier.defaultMaxIterations);

      mod = new Modifier(Modifier.defaultMaxIterations + 3894);
      expect(mod.maxIterations).toBe(Modifier.defaultMaxIterations);

      mod = new Modifier(Modifier.defaultMaxIterations + 7865915);
      expect(mod.maxIterations).toBe(Modifier.defaultMaxIterations);
    });

    test('falsey is set to default max', () => {
      let mod = new Modifier(false);
      expect(mod.maxIterations).toBe(Modifier.defaultMaxIterations);

      mod = new Modifier(null);
      expect(mod.maxIterations).toBe(Modifier.defaultMaxIterations);

      mod = new Modifier(undefined);
      expect(mod.maxIterations).toBe(Modifier.defaultMaxIterations);
    });

    test('can be changed', () => {
      const mod = new Modifier(45);
      expect(mod.maxIterations).toBe(45);

      mod.maxIterations = 178;
      expect(mod.maxIterations).toBe(178);

      mod.maxIterations = 1;
      expect(mod.maxIterations).toBe(1);

      mod.maxIterations = 893;
      expect(mod.maxIterations).toBe(893);
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
