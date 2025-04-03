import Min from '../../../../src/NumberGenerator/Engines/Min';

describe('Min', () => {
  describe('Initialisation', () => {
    test('Can be initialised', () => {
      const engine = new Min();

      expect(engine).toBeDefined();
    });
  });

  describe('Clone', () => {
    test('Can clone engine', () => {
      const engine = new Min();
      const clone = engine.clone();

      expect(clone).toBeDefined();
      expect(clone).toBeInstanceOf(Min);
    });
  });

  describe('Next', () => {
    test('Always returns index min range value', () => {
      const engine = new Min();
      const expected = -0x80000000;

      // test for consistency
      for (let i = 0; i < 100; i++) {
        expect(engine.next()).toBe(expected);
      }
    })
  });
});
