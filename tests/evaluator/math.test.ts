import { EvaluationError } from "../../src/errors/EvaluationError.js";
import { functions, negate, operators } from "../../src/evaluator/math.js";

describe("math", () => {
  test.each([
    ["+", 2, 3, 5],
    ["-", 2, 3, -1],
    ["*", 2, 3, 6],
    ["/", 3, 2, 1.5],
    ["%", 5, -3, -1],
    ["%", -5, 3, 1],
    ["%", 5, 0, 5],
    ["^", 2, 3, 8],
    ["^", -8, 1 / 3, -2],
    ["/", 1, 0, Infinity],
  ] as const)("operator %s with %p and %p = %p", (op, a, b, expected) => {
    expect(operators[op](a, b)).toBeCloseTo(expected);
  });

  test("negate", () => {
    expect(negate(2)).toBe(-2);
  });

  test.each([
    ["abs", [-2], 2],
    ["ceil", [(0.1 + 0.2) * 10], 3],
    ["cos", [0], 1],
    ["exp", [0], 1],
    ["floor", [-2.5], -3],
    ["log", [Math.E], 1],
    ["round", [-2.5], -3],
    ["round", [2.5], 3],
    ["sign", [-4], -1],
    ["sin", [0], 0],
    ["sqrt", [9], 3],
    ["tan", [0], 0],
    ["pow", [2, 10], 1024],
    ["max", [1, 5, 3], 5],
    ["min", [4, 2, 6], 2],
  ] as const)("%s(%p) = %d", (name, args, expected) => {
    expect(functions[name](...args)).toBeCloseTo(expected);
  });

  test.each([
    ["sqrt(-4)", () => functions.sqrt(-4)],
    ["log(-1)", () => functions.log(-1)],
    ["0/0", () => operators["/"](0, 0)],
  ])("%s has no real result", (_, calculate) => {
    expect(calculate).toThrow(EvaluationError);
  });
});
