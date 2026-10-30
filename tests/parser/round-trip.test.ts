import {
  createBinary,
  createComparePoint,
  createCriticalFailure,
  createCriticalSuccess,
  createDie,
  createDrop,
  createExplode,
  createKeep,
  createMax,
  createMin,
  createNumber,
  createPool,
  createReRoll,
  createSort,
  createTarget,
  createUnary,
  createUnique,
} from "../../src/ast/factory.js";
import { COMPARE_OPERATORS } from "../../src/ast/nodes.js";
import type {
  ComparePoint,
  ModifierNode,
  PoolNode,
} from "../../src/ast/nodes.js";
import { modifierToNotation, nodeToNotation } from "../../src/ast/notation.js";
import { Parser } from "../../src/parser/Parser.js";

const parser = new Parser();

// every operator, plus negative, decimal and zero values
const comparePoints: ComparePoint[] = [
  ...COMPARE_OPERATORS.map((operator) => createComparePoint(operator, 5)),
  createComparePoint(">", -2),
  createComparePoint("<=", 1.5),
  createComparePoint("=", 0),
];
const optionalComparePoints = [undefined, ...comparePoints];
const booleans = [false, true];
const ends = ["h", "l"] as const;
const values = [5, 0, -2, 1.5, -0.5];

const notEqual = createComparePoint("!=", 5);
const diamond = createComparePoint("<>", 5);

/** Modifiers whose `!=` is written as `<>` (see `comparePoint()` in `ast/notation.ts`). */
function isWrittenAsDiamond(modifier: ModifierNode): boolean {
  switch (modifier.name) {
    case "explode":
      return (
        !modifier.compound &&
        !modifier.penetrate &&
        modifier.comparePoint?.operator === "!="
      );
    case "target":
      return modifier.success.operator === "!=";
    default:
      return false;
  }
}

function poolWith(modifier: ModifierNode): PoolNode {
  return createPool(createNumber(4), createDie("standard", [createNumber(6)]), [
    modifier,
  ]);
}

/** Every modifier variant, built from the nodes rather than notation. */
const modifierNodes: ModifierNode[] = [
  ...booleans.flatMap((compound) =>
    booleans.flatMap((penetrate) =>
      optionalComparePoints.map((point) =>
        createExplode(compound, penetrate, point),
      ),
    ),
  ),
  ...comparePoints.flatMap((success) =>
    optionalComparePoints.map((failure) => createTarget(success, failure)),
  ),
  ...ends.flatMap((end) =>
    [1, 12].flatMap((qty) => [createDrop(end, qty), createKeep(end, qty)]),
  ),
  ...booleans.flatMap((once) =>
    optionalComparePoints.flatMap((point) => [
      createReRoll(once, point),
      createUnique(once, point),
    ]),
  ),
  ...optionalComparePoints.flatMap((point) => [
    createCriticalSuccess(point),
    createCriticalFailure(point),
  ]),
  createSort("a"),
  createSort("d"),
  ...values.flatMap((value) => [createMax(value), createMin(value)]),
];

const notations = [
  "4d6",
  "d%",
  "4d%",
  "dF",
  "dF.1",
  "dF.2",
  "(2+3)d6",
  "4d(2+3)",
  "4d6!!p>5",
  "8d10>=8f<=2",
  "4d6dh1",
  "4d6kl2",
  "2d20ro<3",
  "6d6uo",
  "d20cs>18cf<3",
  "4d6sd",
  "4d6max5min-2",
  "{4d6+2d8, 3d20}k1",
  "2+3*4^2",
  "2^3^2",
  "-2^2",
  "5%-3",
  "((2+3)*4)",
  "floor(4d6/2)+max(2d6, 3)",
  "4d6 // fire",
  "2d6 // slashing\n+ 1d4 # fire",
  "4d6 /* fire */ + 2d4 [cold]",
  "{2d6 [a], 3d8 // b\n}",
];

describe("round-trip", () => {
  test.each(notations)("%s survives JSON", (notation) => {
    const node = parser.parse(notation);

    expect(JSON.parse(JSON.stringify(node))).toEqual(node);
  });

  test.each(notations)("%s survives nodeToNotation()", (notation) => {
    const node = parser.parse(notation);

    expect(parser.parse(nodeToNotation(node))).toEqual(node);
  });

  test.each([
    ["4d6", "4d6"],
    ["1d6", "d6"],
    ["d%", "d%"],
    ["dF.1", "dF.1"],
    ["4d6k3", "4d6kh3"],
    ["4d6d1", "4d6dl1"],
    ["4d6s", "4d6sa"],
    ["2 ** 3", "2^3"],
    ["4d6 /* fire */", "4d6 [fire]"],
    ["4d6 # fire", "4d6 // fire"],
  ])("%s is written as %s", (notation, expected) => {
    expect(nodeToNotation(parser.parse(notation))).toBe(expected);
  });

  // starts from the nodes, so the writer can't output something the grammar rejects or reads
  // differently
  test.each(
    modifierNodes
      .filter((modifier) => !isWrittenAsDiamond(modifier))
      .map((modifier) => [modifierToNotation(modifier), modifier] as const),
  )("4d6%s parses back to the same modifier", (notation, modifier) => {
    expect(parser.parse(`4d6${notation}`)).toEqual(poolWith(modifier));
  });

  // the parser never produces these: `!=` would be read as an explode, so `<>` is written instead
  test.each([
    [
      "a plain explode on !=5",
      createExplode(false, false, notEqual),
      "!<>5",
      createExplode(false, false, diamond),
    ],
    ["a target on !=5", createTarget(notEqual), "<>5", createTarget(diamond)],
    [
      "a target on !=5 with a failure on !=1",
      createTarget(notEqual, createComparePoint("!=", 1)),
      "<>5f!=1",
      createTarget(diamond, createComparePoint("!=", 1)),
    ],
  ])("%s is written as %s", (_label, modifier, expected, parsed) => {
    expect(modifierToNotation(modifier)).toBe(expected);
    expect(parser.parse(`4d6${expected}`)).toEqual(poolWith(parsed));
  });

  test("parentheses are added where the tree needs them", () => {
    const sum = createBinary("+", createNumber(1), createNumber(2));

    expect(nodeToNotation(createBinary("*", sum, createNumber(3)))).toBe(
      "(1+2)*3",
    );
    expect(nodeToNotation(createBinary("-", createNumber(3), sum))).toBe(
      "3-(1+2)",
    );
    expect(
      nodeToNotation(
        createBinary("^", createUnary(createNumber(2)), createNumber(2)),
      ),
    ).toBe("(-2)^2");
  });
});
