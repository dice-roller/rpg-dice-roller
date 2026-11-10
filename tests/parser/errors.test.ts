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
    "4d6k0",
    "4d6d0",
    "d6!0",
    "d6!01",
    "d6!1.5",
    "d6!9007199254740992",
    "d6!!p0",
    "d6r0",
    "d6r01",
    "d6r1.5",
    "d6r9007199254740992",
    "d6ro3",
    "d6r3o",
    "d6u0",
    "d6u01",
    "d6u1.5",
    "d6u9007199254740992",
    "d6uo3",
    "d6u3o",
    "4d6k1.5",
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
    "d{}",
    "d{,1}",
    "d{1,}",
    "d{1,,2}",
    "d{1..3}",
    "d{1:}",
    "d{:2}",
    "d{1:2:}",
    "d{1:2:3:4}",
    "d{1,2...4}",
    "d{1:2,3}",
    "d{1+1}",
    "d{0:0:2}",
    "d{0:0.00001:0.00003}",
    "d{450359962737.0496:450359962737.0496}",
    "d{0:450359962737.0496:0}",
    "d{3:1}",
    "d{3...1}",
    "d{0:1:1000}",
    "d{9007199254740992:1:9007199254740994}",
    // `f` only follows a target compare point
    "4d6!=3f=1",
    "1000d6",
  ])("%s throws a NotationError", (notation) => {
    expect(() => parser.parse(notation)).toThrow(NotationError);
  });

  test("a non-finite custom-die bound throws a NotationError", () => {
    expect(() => parser.parse(`d{${"9".repeat(309)}}`)).toThrow(NotationError);
  });

  test("a custom face list over the notation limit throws a NotationError", () => {
    const values = Array(1_001).fill("1").join(",");

    expect(() => parser.parse(`d{${values}}`)).toThrow(NotationError);
  });

  test.each([
    [
      "a fifth fractional place",
      "d{0:0.00001:0.0001}",
      "Custom die step cannot have more than 4 decimal places",
    ],
    [
      "an expanded bound above the magnitude limit",
      "d{450359962737.0496:450359962737.0496}",
      "Custom die range start cannot exceed an absolute value of 450359962737.0495",
    ],
  ])("%s retains a useful message and location", (_, notation, message) => {
    let error: unknown;

    try {
      parser.parse(notation);
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(NotationError);
    expect((error as NotationError).message).toContain(message);
    expect((error as NotationError).location).toBeDefined();
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
