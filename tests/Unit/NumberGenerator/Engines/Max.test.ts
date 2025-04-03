import Max from '../../../../src/NumberGenerator/Engines/Max';

describe('Max', () => {
  describe('Initialisation', () => {
    test('Can be initialised without min and max', () => {
      const engine = new Max();

      expect(engine).toBeDefined();
      expect(engine.range).toBeInstanceOf(Array);
      expect(engine.range).toHaveLength(0);
    });

    test('Can set min and max in constructor', () => {
      const engine = new Max(2, 45);

      expect(engine).toBeDefined();
      expect(engine.range).toBeInstanceOf(Array);
      expect(engine.range).toHaveLength(2);
      expect(engine.range).toEqual([2, 45]);
    });

    test('Can set min and max as negative', () => {
      const engine = new Max(-67, -12);

      expect(engine).toBeDefined();
      expect(engine.range).toBeInstanceOf(Array);
      expect(engine.range).toHaveLength(2);
      expect(engine.range).toEqual([-67, -12]);
    });

    test('Only sets min if max is defined', () => {
      const engine = new Max(2);

      expect(engine).toBeDefined();
      expect(engine.range).toBeInstanceOf(Array);
      expect(engine.range).toHaveLength(0);
    });

    test('Only sets max if min is defined', () => {
      const engine = new Max(undefined, 5);

      expect(engine).toBeDefined();
      expect(engine.range).toBeInstanceOf(Array);
      expect(engine.range).toHaveLength(0);
    });
  });

  describe('Range', () => {
    test('Can set range', () => {
      const engine = new Max();

      engine.range = [1, 2];

      expect(engine.range).toBeInstanceOf(Array);
      expect(engine.range).toHaveLength(2);
      expect(engine.range).toEqual([1, 2]);
    });

    test('Can change range', () => {
      const engine = new Max(3, 7);

      expect(engine.range).toBeInstanceOf(Array);
      expect(engine.range).toHaveLength(2);
      expect(engine.range).toEqual([3, 7]);

      engine.range = [60, 569];

      expect(engine.range).toBeInstanceOf(Array);
      expect(engine.range).toHaveLength(2);
      expect(engine.range).toEqual([60, 569]);

      engine.range = [12, 62];

      expect(engine.range).toBeInstanceOf(Array);
      expect(engine.range).toHaveLength(2);
      expect(engine.range).toEqual([12, 62]);
    });

    test('Can be negative', () => {
      const engine = new Max();

      engine.range = [-45, -12];

      expect(engine.range).toBeInstanceOf(Array);
      expect(engine.range).toHaveLength(2);
      expect(engine.range).toEqual([-45, -12]);
    });
  });

  describe('Clone', () => {
    test('Can clone engine', () => {
      const engine = new Max(2, 45);
      const clone = engine.clone();

      expect(clone).toBeDefined();
      expect(clone).toBeInstanceOf(Max);
      expect(clone.range).toBeInstanceOf(Array);
      expect(clone.range).toHaveLength(2);
      expect(clone.range).toEqual([2, 45]);
    });

    test('Changing clone does not affect original', () => {
      const engine = new Max(2, 45);
      const clone = engine.clone();

      expect(engine.range).toBeInstanceOf(Array);
      expect(engine.range).toHaveLength(2);
      expect(engine.range).toEqual([2, 45]);

      clone.range = [1, 2];

      expect(clone.range).toBeInstanceOf(Array);
      expect(clone.range).toHaveLength(2);
      expect(clone.range).toEqual([1, 2]);

      expect(engine.range).toBeInstanceOf(Array);
      expect(engine.range).toHaveLength(2);
      expect(engine.range).toEqual([2, 45]);
    });
  });

  describe('Next', () => {
    test('Always returns index max range value if no range specified', () => {
      const engine = new Max();
      const expected = 0xFFFFFFFF - 1 - 0x80000000;

      // test for consistency
      for (let i = 0; i < 100; i++) {
        expect(engine.next()).toBe(expected);
      }
    });

    test('Always returns max range value', () => {
      let engine = new Max(6, 10);
      let expected = 0xFFFFFFFF - 1 - 0x80000000;

      // test for consistency
      for (let i = 0; i < 100; i++) {
        expect(engine.next()).toBe(expected);
      }

      engine = new Max(-3, 45);
      expected = 2147483608;

      // test for consistency
      for (let i = 0; i < 100; i++) {
        expect(engine.next()).toBe(expected);
      }

      engine = new Max(367, 9816);
      expected = 2147475201;

      // test for consistency
      for (let i = 0; i < 100; i++) {
        expect(engine.next()).toBe(expected);
      }
    });

    test('Returns index max range if min is greater than max', () => {
      const engine = new Max(56, 24);
      const expected = 0xFFFFFFFF - 1 - 0x80000000;

      // test for consistency
      for (let i = 0; i < 100; i++) {
        expect(engine.next()).toBe(expected);
      }
    });
  });
});
