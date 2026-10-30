import {
  createComparePoint as cp,
  createCriticalFailure,
  createCriticalSuccess,
  createDrop,
  createExplode,
  createKeep,
  createMax,
  createMin,
  createReRoll,
  createSort,
  createTarget,
  createUnique,
} from "../../src/ast/factory.js";
import type { ModifierNode } from "../../src/ast/nodes.js";
import { Parser } from "../../src/parser/Parser.js";

const parser = new Parser();

const modifiersOf = (notation: string): readonly ModifierNode[] => {
  const node = parser.parse(notation);

  if (node.type !== "pool" && node.type !== "group") {
    throw new Error(`${notation} is not a pool or group`);
  }

  return node.modifiers;
};

describe("modifiers", () => {
  test("4d6!!p>5 is a compound, penetrating explode", () => {
    expect(modifiersOf("4d6!!p>5")).toEqual([
      {
        type: "modifier",
        name: "explode",
        compound: true,
        penetrate: true,
        comparePoint: { operator: ">", value: 5 },
      },
    ]);
  });

  test.each<[string, ModifierNode]>([
    // explode
    ["4d6!", createExplode(false, false)],
    ["4d6!!", createExplode(true, false)],
    ["4d6!p", createExplode(false, true)],
    ["4d6!=3", createExplode(false, false, cp("=", 3))],
    // target
    ["8d10>=8", createTarget(cp(">=", 8))],
    ["8d10>=8f<=2", createTarget(cp(">=", 8), cp("<=", 2))],
    ["4d6<>3", createTarget(cp("<>", 3))],
    // drop / keep
    ["4d6d1", createDrop("l", 1)],
    ["4d6dh1", createDrop("h", 1)],
    ["4d6dl2", createDrop("l", 2)],
    ["4d6k3", createKeep("h", 3)],
    ["4d6kl2", createKeep("l", 2)],
    // re-roll / unique
    ["2d20r", createReRoll(false)],
    ["2d20ro<3", createReRoll(true, cp("<", 3))],
    ["6d6u", createUnique(false)],
    ["6d6uo", createUnique(true)],
    ["6d6u=5", createUnique(false, cp("=", 5))],
    // critical success / failure
    ["d20cs", createCriticalSuccess()],
    ["d20cs>18", createCriticalSuccess(cp(">", 18))],
    ["d20cf<3", createCriticalFailure(cp("<", 3))],
    // sort
    ["4d6s", createSort("a")],
    ["4d6sa", createSort("a")],
    ["4d6sd", createSort("d")],
    // max / min
    ["4d6max5", createMax(5)],
    ["4d6min2", createMin(2)],
    ["4d6min-1.5", createMin(-1.5)],
  ])("%s", (notation, expected) => {
    expect(modifiersOf(notation)[0]).toEqual(expected);
  });

  test("modifiers keep their notation order", () => {
    expect(modifiersOf("d20cs>18cf<3")).toEqual([
      createCriticalSuccess(cp(">", 18)),
      createCriticalFailure(cp("<", 3)),
    ]);
    expect(modifiersOf("4d6max5min2")).toEqual([createMax(5), createMin(2)]);
  });

  test("a repeated modifier replaces the earlier one, keeping its position", () => {
    expect(modifiersOf("4d6k1min2k3")).toEqual([
      createKeep("h", 3),
      createMin(2),
    ]);
  });

  test("roll groups take modifiers", () => {
    expect(modifiersOf("{4d6+2d8, 3d20}k1")).toEqual([createKeep("h", 1)]);
  });

  test.each(["=", "!=", "<>", "<", ">", "<=", ">="] as const)(
    "compare operator %s",
    (operator) => {
      expect(modifiersOf(`4d6r${operator}2`)).toEqual([
        createReRoll(false, cp(operator, 2)),
      ]);
    },
  );
});
