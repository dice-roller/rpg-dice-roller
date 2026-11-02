import { createComparePoint } from "../../src/ast/factory.js";
import type { CompareOperator, ComparePoint } from "../../src/ast/nodes.js";
import { ValidationError } from "../../src/errors/ValidationError.js";
import { matchesComparePoint } from "../../src/modifiers/compare-point.js";

describe("matchesComparePoint", () => {
  // the values 4, 5 and 6 compared against 5
  test.each<[CompareOperator, [boolean, boolean, boolean]]>([
    ["=", [false, true, false]],
    ["!=", [true, false, true]],
    ["<>", [true, false, true]],
    ["<", [true, false, false]],
    [">", [false, false, true]],
    ["<=", [true, true, false]],
    [">=", [false, true, true]],
  ])("%s5", (operator, expected) => {
    const point = createComparePoint(operator, 5);

    expect([4, 5, 6].map((value) => matchesComparePoint(point, value))).toEqual(
      expected,
    );
  });

  test.each<[ComparePoint, number, boolean]>([
    [createComparePoint(">", -2), -1, true],
    [createComparePoint("<=", 1.5), 1.5, true],
    [createComparePoint("=", 0), -0, true],
    [createComparePoint(">=", 8), Number.POSITIVE_INFINITY, true],
    [createComparePoint("<", 1), Number.NEGATIVE_INFINITY, true],
  ])("%o matches %d: %p", (point, value, expected) => {
    expect(matchesComparePoint(point, value)).toBe(expected);
  });

  test("an unknown operator throws a ValidationError", () => {
    const point = { operator: "~", value: 1 } as unknown as ComparePoint;

    expect(() => matchesComparePoint(point, 1)).toThrow(ValidationError);
  });
});
