import { Parser } from "../../src/parser/Parser.js";

const parser = new Parser();

describe("descriptions", () => {
  test.each([
    ["4d6 // fire damage", { text: "fire damage", style: "inline" }],
    ["4d6 # fire damage", { text: "fire damage", style: "inline" }],
    ["4d6 /* fire damage */", { text: "fire damage", style: "block" }],
    ["4d6 [fire damage]", { text: "fire damage", style: "block" }],
    ["4d6kh3[fire]", { text: "fire", style: "block" }],
  ])("%s", (notation, description) => {
    expect(parser.parse(notation)).toMatchObject({ type: "pool", description });
  });

  test("the first description is used", () => {
    expect(parser.parse("4d6 [first] [second]")).toMatchObject({
      description: { text: "first", style: "block" },
    });
  });

  test("roll groups take descriptions", () => {
    expect(parser.parse("{4d6, 2d8} [attacks]")).toMatchObject({
      type: "group",
      description: { text: "attacks", style: "block" },
    });
  });

  test("a description can be followed by more notation", () => {
    expect(parser.parse("2d6 [slashing] + 1d4 [fire]")).toMatchObject({
      type: "binary",
      left: { description: { text: "slashing" } },
      right: { description: { text: "fire" } },
    });
    expect(parser.parse("2d6 // slashing\n+ 1d4")).toMatchObject({
      type: "binary",
      left: { description: { text: "slashing", style: "inline" } },
    });
  });

  test("pools without a description have no description property", () => {
    expect(parser.parse("4d6")).not.toHaveProperty("description");
  });
});
