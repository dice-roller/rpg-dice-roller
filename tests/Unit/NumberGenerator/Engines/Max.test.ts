import Max from "../../../../src/NumberGenerator/Engines/Max";

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

  describe('Next', () => {
    test('Always returns index `0` if no range specified', () => {
      const engine = new Max();

      // test for consistency
      for (let i = 0; i < 100; i++) {
        expect(engine.next()).toBe(0);
      }
    });

    test('Always returns max index', () => {
      let engine = new Max(6, 10);

      // test for consistency
      for (let i = 0; i < 100; i++) {
        expect(engine.next()).toBe(4);
      }

      engine = new Max(-3, 45);

      // test for consistency
      for (let i = 0; i < 100; i++) {
        expect(engine.next()).toBe(48);
      }

      engine = new Max(367, 9816);

      // test for consistency
      for (let i = 0; i < 100; i++) {
        expect(engine.next()).toBe(9449);
      }
    });

    test('Returns negative index if min is greater than max', () => {
      const engine = new Max(56, 24);

      // test for consistency
      for (let i = 0; i < 100; i++) {
        expect(engine.next()).toBe(-32);
      }
    });
  });
});
