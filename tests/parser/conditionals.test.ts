import { NotationError } from "../../src/errors/NotationError.js";
import { ValidationError } from "../../src/errors/ValidationError.js";
import { Parser } from "../../src/parser/Parser.js";
import { nodeToNotation } from "../../src/ast/notation.js";

const parser = new Parser();

describe("conditional expressions", () => {
  test("parses a full conditional and a scoped condition reference", () => {
    const node = parser.parse("(2) ? ($condition+3) : (4)");

    expect(node).toEqual({
      type: "conditional",
      condition: { type: "number", value: 2 },
      trueBranch: {
        type: "binary",
        op: "+",
        left: { type: "condition-reference" },
        right: { type: "number", value: 3 },
      },
      falseBranch: { type: "number", value: 4 },
    });
    expect(nodeToNotation(node)).toBe("(2)?($condition+3):(4)");
    expect(parser.parse(nodeToNotation(node))).toEqual(node);
  });

  test("retains the shorthand distinction and requires the contiguous token", () => {
    const node = parser.parse("(d6=3) ?: (10)");

    expect(node).toMatchObject({
      type: "conditional",
      trueBranch: null,
      falseBranch: { type: "number", value: 10 },
    });
    expect(nodeToNotation(node)).toBe("(d6=3)?:(10)");
    expect(() => parser.parse("(2) ? : (10)")).toThrow(NotationError);
  });

  test("allows nested conditionals and conditional composition", () => {
    expect(() =>
      parser.parse("(1) ? ((2) ?: ($condition)) : (3) + (4)"),
    ).not.toThrow();
    expect(() =>
      parser.parse("((2) ? (3) : (4))d(1+((2) ?: (6)))"),
    ).not.toThrow();
  });

  test.each([
    "2 ? (3) : (4)",
    "(2) ? 3 : (4)",
    "(2) ? (3) : 4",
    "(2) ? (3)",
    "(2) ?:",
    "(2) ?: (3) ?",
  ])(
    "requires parenthesized expressions and a false branch: %s",
    (notation) => {
      expect(() => parser.parse(notation)).toThrow(NotationError);
    },
  );

  test.each(["$condition", "($condition) ? (2) : (3)"])(
    "rejects an out-of-scope reference: %s",
    (notation) => {
      expect(() => parser.parse(notation)).toThrow(ValidationError);
    },
  );

  test("reports an unknown variable helpfully", () => {
    expect(() => parser.parse("($other) ?: (1)")).toThrow(
      "Unknown variable `$other`",
    );
  });
});
