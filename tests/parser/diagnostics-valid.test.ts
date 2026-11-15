import { Parser } from "../../src/parser/Parser.js";

const parser = new Parser();

describe("diagnostics do not reject valid alternatives", () => {
  test.each([
    "0",
    "00",
    "01",
    "2.5",
    "-4",
    "-2.5",
    "2-4d6",
    "2--4",
    "2*-4",
    "4d6",
    "d%",
    "dF",
    "dF.1",
    "dF.2",
    "d(2+3)",
    "(2+3)d6",
    "(2+3)d(2*3)",
    "(5)d6",
    "(2+(3))d6",
    "(2d6)d6",
    "(d6)d10",
    "3d(d6)",
    "(max(d4,2))d6",
    "({d4+1,d6}kh1)d8",
    "((d4)d6)d10",
    "(2+(4*2)d(2*d10))d10",
    "((2+3))",
    "2^(3+4)",
    "2**3",
    "2*3",
    "2%3",
    "min(2,3)",
    "max(2,3)",
    "pow(2,3)",
    "abs(-2)",
    "(2d6)",
    "{2d6,d8}kh1",
    "d{0}",
    "d{-1,0,+1}",
    "d{1.5,2.5}",
    "d{-2:2}",
    "d{1...3}",
    "d{4:2:8}",
    "d{3:-1:1}",
    "d{0:0.25:1}",
    "d{1:1}",
    "4d6k1",
    "4d6kh2",
    "4d6kl3",
    "4d6d1",
    "4d6dl2",
    "4d6dh3",
    "d6!",
    "d6!!",
    "d6!p",
    "d6!!p",
    "d6!3",
    "d6!3>=5",
    "d6!!p2=6",
    "d6r",
    "d6ro",
    "d6r3",
    "d6r3<2",
    "d6u",
    "d6uo",
    "d6u2",
    "d6u2=5",
    "d6cs",
    "d6cf",
    "d6sa",
    "d6sd",
    "d6cs>=5cf=1",
    "d6>=-1",
    "d6!=3",
    "d6<>3",
    "d6=4:2",
    "d6=4:01",
    "d6>=4:2f=1:3",
    "d6min-1.5max5.5",
    "d6 [description]",
    "d6 /* description */",
    "d6 // description",
    "d6 # description",
  ])("%s still parses", (notation) => {
    expect(() => parser.parse(notation)).not.toThrow();
  });

  test.each([
    ["4d6k2", "keep", { qty: 2, end: "h" }],
    ["4d6dl2", "drop", { qty: 2, end: "l" }],
    ["d6!3", "explode", { limit: 3 }],
    ["d6r3", "re-roll", { limit: 3, once: false }],
    ["d6ro", "re-roll", { once: true }],
    ["d6u2", "unique", { limit: 2, once: false }],
    ["d6uo", "unique", { once: true }],
    ["d6min-1.5", "min", { value: -1.5 }],
  ])("%s keeps its modifier values", (notation, name, values) => {
    expect(parser.parse(notation)).toMatchObject({
      type: "pool",
      modifiers: [{ name, ...values }],
    });
  });

  test("leading zeros in target amounts retain their existing meaning", () => {
    expect(parser.parse("d6=4:01")).toEqual(parser.parse("d6=4:1"));
  });

  test("diagnostic quantity checks respect configured limits", () => {
    expect(() => new Parser({ maxQty: 2000 }).parse("1000d6")).not.toThrow();
    expect(() => new Parser({ maxQty: 10 }).parse("11d6")).toThrow(
      "Dice quantity must be between 1 and 10",
    );
  });
});
