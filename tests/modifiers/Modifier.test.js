import { StandardDice } from '../../src/dice/index.ts';
import { Modifier } from '../../src/modifiers/index.ts';
import RollResults from '../../src/results/RollResults.ts';

describe('Modifier', () => {
  describe('Static', () => {
    test('class structure', () => {
      expect(Modifier.order).toEqual(expect.any(Number));
      expect(Modifier.order).toBe(999);
    });

    describe('Order', () => {
      test('can change to an integer', () => {
        expect(Modifier.order).toBe(999);

        Modifier.order = 1;
        expect(Modifier.order).toBe(1);

        Modifier.order = 0;
        expect(Modifier.order).toBe(0);

        Modifier.order = 45;
        expect(Modifier.order).toBe(45);

        Modifier.order = 4526;
        expect(Modifier.order).toBe(4526);
      });

      test('can be negative', () => {
        Modifier.order = -1;
        expect(Modifier.order).toBe(-1);

        Modifier.order = -37;
        expect(Modifier.order).toBe(-37);

        Modifier.order = -65837;
        expect(Modifier.order).toBe(-65837);
      });

      test('can be float', () => {
        Modifier.order = 0.12;
        expect(Modifier.order).toBe(0.12);

        Modifier.order = 678.2;
        expect(Modifier.order).toBe(678.2);

        Modifier.order = -1.62983;
        expect(Modifier.order).toEqual(-1.62983);
      });
    });
  });

  describe('instance', () => {
    let mod;

    beforeEach(() => {
      // reset the modifier order to the default
      Modifier.order = 999;
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

      test('new instance uses current static order', () => {
        Modifier.order = 2;
        mod = new Modifier();
        expect(mod.order).toBe(2);

        Modifier.order = 5619;
        mod = new Modifier();
        expect(mod.order).toBe(5619);
      });

      test('changing static order does not change order for existing instances', () => {
        expect(mod.order).toBe(999);

        Modifier.order = 5;

        expect(mod.order).toBe(999);
      });

      test('changing instance order does not change static order', () => {
        expect(Modifier.order).toBe(999);

        mod.order = 23;

        expect(Modifier.order).toBe(999);
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

      describe('Defaults', () => {
        const testKey = 'testKey';
        const defaultValue = 'defaultValue';

        beforeEach(() => {
          mod.defaults = () => ({ testKey: defaultValue });
        });

        test('uses default if value wasn\'t provided', () => {
          mod.run(results, die);
          expect(mod[testKey]).toEqual(defaultValue);
        });

        test('does not set default if value was provided', () => {
          const providedValue = 'providedValue';
          mod[testKey] = providedValue;

          mod.run(results, die);
          expect(mod[testKey]).toEqual(providedValue);
        });
      });
    });
  });
});
