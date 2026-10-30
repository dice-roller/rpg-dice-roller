import {
  createBinary,
  createDie,
  createNumber,
  createParen,
  createPool,
} from "../../src/ast/factory.js";
import { nodeToNotation } from "../../src/ast/notation.js";
import { Parser } from "../../src/parser/Parser.js";

const parser = new Parser();
const num = createNumber;
const standard = (sides: number) => createDie("standard", [num(sides)]);

describe("dice pools", () => {
  test("4d6 is a pool of four standard d6", () => {
    expect(parser.parse("4d6")).toEqual({
      type: "pool",
      qty: { type: "number", value: 4 },
      die: {
        type: "die",
        name: "standard",
        args: [{ type: "number", value: 6 }],
      },
      modifiers: [],
    });
  });

  test.each([
    ["d6", createPool(num(1), standard(6))],
    ["1d6", createPool(num(1), standard(6))],
    ["10d20", createPool(num(10), standard(20))],
    ["999d6", createPool(num(999), standard(6))],
    ["4d100", createPool(num(4), standard(100))],
  ])("%s", (notation, expected) => {
    expect(parser.parse(notation)).toEqual(expected);
  });

  test.each([
    ["d%", 1, createDie("percentile")],
    ["4d%", 4, createDie("percentile")],
    ["dF", 1, createDie("fudge")],
    ["3dF.1", 3, createDie("fudge", [num(1)])],
    ["dF.2", 1, createDie("fudge", [num(2)])],
  ])("%s refers to its die by name, and round-trips", (notation, qty, die) => {
    const node = parser.parse(notation);

    expect(node).toEqual(createPool(num(qty), die));
    expect(nodeToNotation(node)).toBe(notation.replace(/^1d/, "d"));
  });

  test("computed qty and sides become nodes instead of numbers", () => {
    expect(parser.parse("(2+3)d6")).toEqual({
      type: "pool",
      qty: {
        type: "paren",
        expression: {
          type: "binary",
          op: "+",
          left: { type: "number", value: 2 },
          right: { type: "number", value: 3 },
        },
      },
      die: {
        type: "die",
        name: "standard",
        args: [{ type: "number", value: 6 }],
      },
      modifiers: [],
    });

    expect(parser.parse("4d(2*3)")).toEqual(
      createPool(
        num(4),
        createDie("standard", [createParen(createBinary("*", num(2), num(3)))]),
      ),
    );
  });

  test.each(["(1+1)d(2*3)", "( 2 - -1 )d6", "(-2^2+5)d6", "(10/2)d%"])(
    "computed qty / sides: %s",
    (notation) => {
      expect(() => parser.parse(notation)).not.toThrow();
    },
  );
});
