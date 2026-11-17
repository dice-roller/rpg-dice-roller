import { NotationError } from "../../src/errors/NotationError.js";
import { Parser } from "../../src/parser/Parser.js";
import { nodeToNotation } from "../../src/ast/notation.js";

const parser = new Parser();

describe("conditional expressions", () => {
  test("parses a full conditional and a scoped condition reference", () => {
    const node = parser.parse("(2) ? ($$condition+3) : (4)");

    expect(node).toEqual({
      type: "conditional",
      condition: { type: "number", value: 2 },
      trueBranch: {
        type: "binary",
        op: "+",
        left: { type: "reference", namespace: "system", path: ["condition"] },
        right: { type: "number", value: 3 },
      },
      falseBranch: { type: "number", value: 4 },
    });
    expect(nodeToNotation(node)).toBe("(2)?($$condition+3):(4)");
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
      parser.parse("(1) ? ((2) ?: ($$condition)) : (3) + (4)"),
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

  test.each([
    [
      "$condition",
      { type: "reference", namespace: "data", path: ["condition"] },
    ],
    [
      "$$condition",
      { type: "reference", namespace: "system", path: ["condition"] },
    ],
    ["$other", { type: "reference", namespace: "data", path: ["other"] }],
    ["$$other", { type: "reference", namespace: "system", path: ["other"] }],
    [
      "$character.level",
      {
        type: "reference",
        namespace: "data",
        path: ["character", "level"],
      },
    ],
    [
      "$$character.level",
      {
        type: "reference",
        namespace: "system",
        path: ["character", "level"],
      },
    ],
    [
      "$data.hp",
      { type: "reference", namespace: "data", path: ["data", "hp"] },
    ],
    [
      "$data.character.level",
      {
        type: "reference",
        namespace: "data",
        path: ["data", "character", "level"],
      },
    ],
    ["$data", { type: "reference", namespace: "data", path: ["data"] }],
    ["$$data", { type: "reference", namespace: "system", path: ["data"] }],
    [
      "$condition.current",
      {
        type: "reference",
        namespace: "data",
        path: ["condition", "current"],
      },
    ],
    [
      "$$condition.current",
      {
        type: "reference",
        namespace: "system",
        path: ["condition", "current"],
      },
    ],
  ])("parses and round-trips the reference %s", (notation, expected) => {
    expect(parser.parse(notation)).toEqual(expected);
    expect(nodeToNotation(parser.parse(notation))).toBe(notation);
    expect(parser.parse(nodeToNotation(parser.parse(notation)))).toEqual(
      parser.parse(notation),
    );
  });

  test.each([
    "$",
    "$$",
    "$.name",
    "$$.name",
    "$character.",
    "$$character.",
    "$character..level",
    "$$character..level",
    "$has-dash",
    "$$has-dash",
  ])("rejects malformed reference notation %s", (notation) => {
    expect(() => parser.parse(notation)).toThrow(NotationError);
  });

  test("accepts condition references structurally outside a branch", () => {
    expect(() => parser.parse("$$condition")).not.toThrow();
    expect(() => parser.parse("($$condition) ? (2) : (3)")).not.toThrow();
  });
});
