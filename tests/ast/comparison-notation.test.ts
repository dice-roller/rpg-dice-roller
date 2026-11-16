import {
  binary,
  comparison,
  group,
  keep,
  pool,
} from "../../src/ast/builders.js";
import { nodeToNotation } from "../../src/ast/notation.js";
import { Parser } from "../../src/parser/Parser.js";
import { Roll } from "../../src/Roll.js";
import { RollSettings } from "../../src/RollSettings.js";

const parser = new Parser();

describe("comparison notation", () => {
  test.each([
    [comparison("<", 1, 2), "1<2"],
    [comparison("=", comparison("<", 1, 2), 1), "(1<2)=1"],
    [comparison("<", 1, comparison(">", 2, 3)), "1<(2>3)"],
    [binary("+", comparison("<", 1, 2), 3), "(1<2)+3"],
    [comparison(">=", pool(2, 6), 5), "(2d6)>=5"],
    [comparison("!=", binary("+", 1, pool(1, 6)), 3), "(1+d6)!=3"],
    [comparison("<>", group([pool(1, 6)]), 3), "({d6})<>3"],
    [
      comparison("=", pool(2, 6, { modifiers: [keep("h", 1)] }), pool(1, 6)),
      "(2d6kh1)=d6",
    ],
  ])("prints comparisons without changing their meaning", (node, notation) => {
    expect(nodeToNotation(node)).toBe(notation);
    const parsed = parser.parse(notation);
    const settings = new RollSettings();
    jest.spyOn(settings.generator, "integer").mockReturnValue(3);
    expect(new Roll(parsed, settings).total).toBe(
      new Roll(node, settings).total,
    );
  });

  test.each(["(d6)>=5", "1<(2<3)", "(1<2)=1", "2d6>=5"])(
    "parsed notation round-trips: %s",
    (notation) => {
      const node = parser.parse(notation);
      expect(parser.parse(nodeToNotation(node))).toEqual(node);
    },
  );
});
