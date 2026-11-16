import {
  createBinary as bin,
  createComparison,
  createDie,
  createFunction,
  createGroup,
  createNumber as num,
  createParen,
  createPool,
  createUnary as neg,
} from "../../src/ast/factory.js";
import { MATH_FUNCTION_NAMES } from "../../src/ast/nodes.js";
import { NotationError } from "../../src/errors/NotationError.js";
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

  describe("comparisons", () => {
    test.each(["=", "!=", "<>", "<", ">", "<=", ">="] as const)(
      "parses %s",
      (operator) => {
        expect(parser.parse(`1${operator}2`)).toEqual(
          createComparison(operator, num(1), num(2)),
        );
      },
    );

    test("binds below arithmetic and parses both operands as expressions", () => {
      expect(parser.parse("1+2*3>=7")).toEqual(
        createComparison(
          ">=",
          bin("+", num(1), bin("*", num(2), num(3))),
          num(7),
        ),
      );
      expect(parser.parse("1<2+3")).toEqual(
        createComparison("<", num(1), bin("+", num(2), num(3))),
      );
    });

    test("permits explicitly parenthesized nested comparisons", () => {
      const inner = createComparison("<", num(1), num(2));

      expect(parser.parse("(1<2)=1")).toEqual(
        createComparison("=", createParen(inner), num(1)),
      );
      expect(parser.parse("1<(2<3)")).toEqual(
        createComparison(
          "<",
          num(1),
          createParen(createComparison("<", num(2), num(3))),
        ),
      );
    });

    test("preserves pool modifier precedence and allows comparison of a parenthesized total", () => {
      expect(parser.parse("2d6>=5")).toMatchObject({
        type: "pool",
        modifiers: [{ type: "modifier", name: "target" }],
      });
      expect(parser.parse("(2d6)>=5")).toEqual(
        createComparison(">=", createParen(d(2, 6)), num(5)),
      );
    });

    test("works inside functions, groups, and calculated die parameters", () => {
      expect(parser.parse("abs(1<2)")).toEqual(
        createFunction("abs", [createComparison("<", num(1), num(2))]),
      );
      expect(parser.parse("{1<2, 3>2}")).toEqual(
        createGroup([
          createComparison("<", num(1), num(2)),
          createComparison(">", num(3), num(2)),
        ]),
      );
      expect(parser.parse("d(1<2)")).toEqual(
        createPool(
          num(1),
          createDie("standard", [
            createParen(createComparison("<", num(1), num(2))),
          ]),
        ),
      );
    });

    test.each(["1<2<3", "1<=2>=3", "1<2!=3", "1===2", "1<", "1<2)"])(
      "rejects malformed or chained comparison %s",
      (notation) => {
        expect(() => parser.parse(notation)).toThrow(NotationError);
      },
    );
  });
});
