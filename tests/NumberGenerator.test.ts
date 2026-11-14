import { NumberGenerator } from "../src/random/NumberGenerator.js";
import type { RandomEngine } from "../src/random/RandomEngine.js";

const TWO_TO_53 = Number.MAX_SAFE_INTEGER + 1;

describe("NumberGenerator", () => {
  test("floors integer bounds and returns the minimum for inverted or equal bounds", () => {
    const queued = queuedEngine([-0x8000_0000]);
    const generator = new NumberGenerator(queued.engine);

    expect(generator.integer(1.9, 4.2)).toBe(1);
    expect(generator.integer(4.9, 1.1)).toBe(4);
    expect(generator.integer(3.9, 3.2)).toBe(3);
    expect(queued.calls).toBe(1);
  });

  test("uses rejection sampling for unbiased integer ranges", () => {
    const queued = queuedEngine([0x7fff_ffff, -0x8000_0000]);

    expect(new NumberGenerator(queued.engine).integer(0, 2)).toBe(0);
    expect(queued.calls).toBe(2);
  });

  test("supports integer bounds through plus and minus 2^53", () => {
    const queued = queuedEngine([-0x8000_0000, -0x8000_0000]);
    const generator = new NumberGenerator(queued.engine);

    expect(generator.integer(-TWO_TO_53, -TWO_TO_53)).toBe(-TWO_TO_53);
    expect(generator.integer(TWO_TO_53, TWO_TO_53)).toBe(TWO_TO_53);
    expect(generator.integer(-TWO_TO_53, TWO_TO_53)).toBe(-TWO_TO_53);
  });

  test("preserves odd values when sampling the widest integer range", () => {
    const queued = queuedEngine([-0x7fe0_0000, -0x7fff_ffff]);

    expect(
      new NumberGenerator(queued.engine).integer(-TWO_TO_53, TWO_TO_53),
    ).toBe(1);
  });

  test.each([
    [-TWO_TO_53 - 2, 0],
    [0, TWO_TO_53 + 2],
    [Number.NaN, 0],
    [0, Number.POSITIVE_INFINITY],
  ])("rejects invalid integer bounds %p", (min, max) => {
    expect(() => new NumberGenerator().integer(min, max)).toThrow(RangeError);
  });

  test("real sampling includes the lower endpoint and excludes the upper endpoint by default", () => {
    const lower = new NumberGenerator(
      queuedEngine([-0x8000_0000, -0x8000_0000]).engine,
    );
    const upper = new NumberGenerator(
      queuedEngine([-0x7fe0_0001, 0x7fff_ffff]).engine,
    );

    expect(lower.real(-1, 1)).toBe(-1);
    expect(upper.real(0, 1)).toBeLessThan(1);
  });

  test("inclusive real sampling can return the upper endpoint", () => {
    const queued = queuedEngine([-0x7fe0_0000, -0x8000_0000]);

    expect(new NumberGenerator(queued.engine).real(4, 8, true)).toBe(8);
  });

  test.each([
    [Number.NaN, 1],
    [0, Number.POSITIVE_INFINITY],
  ])("rejects invalid real bounds %p", (min, max) => {
    expect(() => new NumberGenerator().real(min, max)).toThrow(RangeError);
  });
});

function queuedEngine(values: number[]): {
  engine: RandomEngine;
  calls: number;
} {
  let index = 0;
  const engine: RandomEngine = {
    next(): number {
      const value = values[index++];

      if (value === undefined) {
        throw new Error("No controlled random values remain");
      }

      return value;
    },
  };

  return {
    engine,
    get calls(): number {
      return index;
    },
  };
}
