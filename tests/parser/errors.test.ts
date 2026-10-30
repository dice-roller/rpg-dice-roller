import { NotationError } from "../../src/errors/NotationError.js";
import { ValidationError } from "../../src/errors/ValidationError.js";
import { Parser } from "../../src/parser/Parser.js";

const parser = new Parser();

describe("invalid notation", () => {
  test.each([
    "4d",
    "d0",
    "0d6",
    "4d6k",
    "4d6d",
    "4d6x",
    "4d6 2",
    "2.5d6",
    "dF.3",
    "-4d6",
    "-(2)",
    "(5)d6",
    "(2+(3))d6",
    "(2d6)d6",
    "abs(2, 3)",
    "pow(2)",
    "foo(2)",
    "2 +",
    "{}",
    "{4d6,}",
    " 4d6",
    "4d6 []",
    "4d6 //",
    // `f` only follows a target compare point
    "4d6!=3f=1",
    "1000d6",
  ])("%s throws a NotationError", (notation) => {
    expect(() => parser.parse(notation)).toThrow(NotationError);
  });

  test("the error has the notation and location", () => {
    // `k` needs a qty, so the error is at the end of the notation
    expect.assertions(3);

    try {
      parser.parse("4d6k");
    } catch (error) {
      expect(error).toBeInstanceOf(NotationError);
      expect((error as NotationError).notation).toBe("4d6k");
      expect((error as NotationError).location).toMatchObject({
        offset: 4,
        line: 1,
        column: 5,
      });
    }
  });

  test("the maximum literal qty is configurable", () => {
    expect(() => new Parser({ maxQty: 10 }).parse("11d6")).toThrow(
      "Dice quantity must be between 1 and 10",
    );
    expect(() => new Parser({ maxQty: 2000 }).parse("1000d6")).not.toThrow();
  });

  test.each([
    ["an empty string", ""],
    ["undefined", undefined],
    ["a number", 4],
    ["an object", { notation: "4d6" }],
  ])("%s throws a ValidationError", (_, notation) => {
    expect(() => parser.parse(notation as unknown as string)).toThrow(
      ValidationError,
    );
  });
});
