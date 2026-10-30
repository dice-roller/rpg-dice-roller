import {
  createBinary as bin,
  createDie,
  createFunction,
  createGroup,
  createNumber as num,
  createParen,
  createPool,
  createUnary as neg,
} from "../../src/ast/factory.js";
import { MATH_FUNCTION_NAMES } from "../../src/ast/nodes.js";
import { Parser } from "../../src/parser/Parser.js";

const parser = new Parser();
const d = (qty: number, sides: number) =>
  createPool(num(qty), createDie("standard", [num(sides)]));

describe("maths", () => {
  test("2d6+3", () => {
    expect(parser.parse("2d6+3")).toEqual({
      type: "binary",
      op: "+",
      left: {
        type: "pool",
        qty: { type: "number", value: 2 },
        die: {
          type: "die",
          name: "standard",
          args: [{ type: "number", value: 6 }],
        },
        modifiers: [],
      },
      right: { type: "number", value: 3 },
    });
  });

  describe("precedence matches mathjs", () => {
    test.each([
      ["2+3*4^2", bin("+", num(2), bin("*", num(3), bin("^", num(4), num(2))))],
      // right-associative power
      ["2^3^2", bin("^", num(2), bin("^", num(3), num(2)))],
      // power binds tighter than unary minus
      ["-2^2", neg(bin("^", num(2), num(2)))],
      ["2^-1", bin("^", num(2), neg(num(1)))],
      // `* / %` share a left-associative level
      ["10%3*2", bin("*", bin("%", num(10), num(3)), num(2))],
      ["8/4/2", bin("/", bin("/", num(8), num(4)), num(2))],
      // `+ -` are left-associative
      ["5-2-1", bin("-", bin("-", num(5), num(2)), num(1))],
      // modulo with a negative number, not a percentage
      ["5%-3", bin("%", num(5), neg(num(3)))],
      // `**` is `^`
      ["2**3", bin("^", num(2), num(3))],
      // unary minus binds tighter than multiplication
      ["-2*3", bin("*", neg(num(2)), num(3))],
      ["2--3", bin("-", num(2), neg(num(3)))],
      ["1.5 * 2", bin("*", num(1.5), num(2))],
    ])("%s", (notation, expected) => {
      expect(parser.parse(notation)).toEqual(expected);
    });
  });

  test("parentheses are kept, and can be nested", () => {
    expect(parser.parse("((2+3)*4)")).toEqual(
      createParen(bin("*", createParen(bin("+", num(2), num(3))), num(4))),
    );
  });

  test("dice and maths combine", () => {
    expect(parser.parse("(4d6 + 2) * 3d8")).toEqual(
      bin("*", createParen(bin("+", d(4, 6), num(2))), d(3, 8)),
    );
  });

  test.each(
    MATH_FUNCTION_NAMES.filter((name) => !["pow", "max", "min"].includes(name)),
  )("%s(x)", (name) => {
    expect(parser.parse(`${name}(4d6/2)`)).toEqual(
      createFunction(name, [bin("/", d(4, 6), num(2))]),
    );
  });

  test.each(["pow", "max", "min"] as const)("%s(x, y)", (name) => {
    expect(parser.parse(`${name}(4d6, 10)`)).toEqual(
      createFunction(name, [d(4, 6), num(10)]),
    );
  });

  test("roll groups", () => {
    expect(parser.parse("{4d6+2d8, 3d20}")).toEqual(
      createGroup([bin("+", d(4, 6), d(2, 8)), d(3, 20)]),
    );
    expect(parser.parse("{ 2 }")).toEqual(createGroup([num(2)]));
  });
});
