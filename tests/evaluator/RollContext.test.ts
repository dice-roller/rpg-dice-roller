import { ValidationError } from "../../src/errors/ValidationError.js";
import { RollSettings } from "../../src/RollSettings.js";
import {
  createRollContext,
  DEFAULT_ROLL_LIMITS,
} from "../../src/evaluator/RollContext.js";
import type { RollLimits } from "../../src/evaluator/RollContext.js";

const limitNames = ["maxQty", "maxIterations"] as const;

const invalidValues: readonly [string, unknown][] = [
  ["zero", 0],
  ["negative", -1],
  ["fraction", 1.5],
  ["NaN", NaN],
  ["positive infinity", Infinity],
  ["negative infinity", -Infinity],
  ["unsafe integer", Number.MAX_SAFE_INTEGER + 1],
  ["undefined", undefined],
  ["null", null],
  ["string", "1"],
  ["boolean", true],
  ["object", {}],
  ["array", []],
  ["bigint", 1n],
  ["symbol", Symbol("limit")],
  ["function", () => 1],
];

describe("roll limits", () => {
  test("use defaults when omitted and retain partial overrides", () => {
    expect(new RollSettings().limits).toEqual(DEFAULT_ROLL_LIMITS);
    expect(createRollContext().limits).toEqual(DEFAULT_ROLL_LIMITS);

    const limits = { maxQty: 3 };

    expect(new RollSettings({ limits }).limits).toEqual({
      maxQty: 3,
      maxIterations: DEFAULT_ROLL_LIMITS.maxIterations,
    });
    expect(createRollContext({ limits }).limits).toEqual({
      maxQty: 3,
      maxIterations: DEFAULT_ROLL_LIMITS.maxIterations,
    });
    expect(Object.isFrozen(new RollSettings({ limits }).limits)).toBe(true);
  });

  test.each(limitNames)(
    "accepts positive safe integer boundaries for %s",
    (limit) => {
      for (const value of [1, Number.MAX_SAFE_INTEGER]) {
        const limits: Partial<RollLimits> = { [limit]: value };
        const expected = { ...DEFAULT_ROLL_LIMITS, ...limits };

        expect(new RollSettings({ limits }).limits).toEqual(expected);
        expect(createRollContext({ limits }).limits).toEqual(expected);
      }
    },
  );

  test.each(invalidValues)("rejects %s for both limits", (_, value) => {
    for (const limit of limitNames) {
      const limits = { [limit]: value } as unknown as Partial<RollLimits>;

      expect(() => new RollSettings({ limits })).toThrow(ValidationError);
      expect(() => new RollSettings({ limits })).toThrow(limit);
      expect(() => createRollContext({ limits })).toThrow(ValidationError);
      expect(() => createRollContext({ limits })).toThrow(limit);
    }
  });
});
