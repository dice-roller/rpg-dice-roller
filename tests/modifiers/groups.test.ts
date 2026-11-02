import { group, keep, pool } from "../../src/ast/builders.js";
import type { SortNode } from "../../src/ast/nodes.js";
import { EvaluationError } from "../../src/errors/EvaluationError.js";
import { ModifierRegistry } from "../../src/modifiers/ModifierRegistry.js";
import {
  keepHandler,
  sortHandler,
} from "../../src/modifiers/handlers/index.js";
import { createDieResult } from "../../src/results/die-result.js";
import type { ModifierHandler } from "../../src/modifiers/types.js";
import type { GroupResult } from "../../src/results/types.js";
import { evaluate, evaluateGroup, poolsOf, rollsOf } from "./helpers.js";

/** The rolls of every pool in the group, e.g. `[["8", "1d"], ["6"]]`. */
const poolRolls = (result: GroupResult): string[][] =>
  poolsOf(result).map(rollsOf);

describe("single sub-roll", () => {
  test.each([
    ["{4d10}", [3, 5, 1, 8], 17],
    ["{4d10*3}", [3, 5, 1, 8], 51],
    ["{4d10+5d6}", [3, 5, 1, 8, 4, 5, 3, 4, 2], 35],
  ])(
    "without modifiers, %s is a standard expression",
    (notation, rolls, total) => {
      expect(evaluate(notation, { rolls }).value).toBe(total);
    },
  );

  test("keep keeps the highest dice of every pool (documented example)", () => {
    const result = evaluateGroup("{4d10*(2+5d6)}k2", {
      rolls: [8, 1, 4, 1, 1, 6, 1, 5, 3],
    });

    expect(poolRolls(result)).toEqual([
      ["8", "1d", "4d", "1d"],
      ["1d", "6", "1d", "5d", "3d"],
    ]);
    expect(result.value).toBe(64);
    // the expression and its parentheses are recalculated
    expect(result.members[0]?.result).toMatchObject({
      type: "binary",
      value: 64,
      left: { type: "pool", value: 8 },
      right: { type: "paren", value: 8 },
    });
    expect(result.members[0]).toMatchObject({
      value: 64,
      calculationValue: 64,
      useInTotal: true,
      flags: [],
    });
  });

  test("drop drops the lowest dice of every pool (documented example)", () => {
    const result = evaluateGroup("{4d6+2d8-3d30}d3", {
      rolls: [3, 5, 3, 2, 7, 4, 2, 14, 7],
    });

    expect(poolRolls(result)).toEqual([
      ["3d", "5", "3", "2d"],
      ["7", "4"],
      ["2d", "14", "7"],
    ]);
    expect(result.value).toBe(-2);
  });

  test("keep and drop override each other across pools", () => {
    const result = evaluateGroup("{2d10+1d10}k1dh1", { rolls: [7, 1, 2] });

    expect(poolRolls(result)).toEqual([["7d", "1d"], ["2d"]]);
    expect(result.value).toBe(0);
  });

  test("target counts the sub-roll's total (documented examples)", () => {
    expect(evaluate("{3d20+5}>40", { rolls: [11, 7, 19] }).value).toBe(1);
    expect(evaluate("{3d20+5}>40", { rolls: [1, 7, 19] }).value).toBe(0);
    expect(evaluate("{3d10+5}>30f<15", { rolls: [5, 3, 1] }).value).toBe(-1);
  });

  test("target after keep counts the recalculated total", () => {
    // keep 6 and 5: 11 is a success; all four dice would be 14
    const result = evaluateGroup("{4d6}k2>10", { rolls: [6, 5, 1, 2] });

    expect(result.members[0]).toMatchObject({
      value: 11,
      calculationValue: 1,
      flags: ["target-success"],
    });
    expect(result.value).toBe(1);
  });

  test.each([
    ["{4d6+4}", ["4", "3", "5", "1"]],
    ["{4d6+4}s", ["1", "3", "4", "5"]],
    ["{4d6+4}sd", ["5", "4", "3", "1"]],
  ])("sort sorts the dice: %s (documented example)", (notation, expected) => {
    const result = evaluateGroup(notation, { rolls: [4, 3, 5, 1] });

    expect(poolRolls(result)).toEqual([expected]);
    expect(result.value).toBe(17);
  });

  test("sort keeps each die in its own pool", () => {
    const result = evaluateGroup("{2d6+2d8}sd", { rolls: [1, 6, 2, 8] });

    expect(poolRolls(result)).toEqual([
      ["6", "1"],
      ["8", "2"],
    ]);
  });

  test("a target success survives a later sort", () => {
    const result = evaluateGroup("{4d6+4}>10s", { rolls: [4, 3, 5, 1] });

    expect(result.members[0]).toMatchObject({ value: 17, calculationValue: 1 });
    expect(result.value).toBe(1);
  });

  test("pools in a quantity aren't flattened", () => {
    // (1d4)d6: the d4 rolls 2, then 2d6 roll 3 and 5
    const result = evaluateGroup(
      group([pool(pool(1, 4), 6)], { modifiers: [keep("h", 1)] }),
      {
        rolls: [2, 3, 5],
      },
    );
    const [inner] = poolsOf(result);

    expect(inner && rollsOf(inner)).toEqual(["3d", "5"]);
    expect(inner?.qty).toMatchObject({ type: "pool", value: 2 });
    expect(result.value).toBe(5);
  });

  test("nested groups aren't flattened", () => {
    // the nested {2d6} = 11 is left alone; only the d4's dice are kept from
    const result = evaluateGroup("{{2d6}+1d4}k1", { rolls: [6, 5, 3] });
    const member = result.members[0]?.result;

    expect(member).toMatchObject({
      type: "binary",
      left: { type: "group", value: 11 },
      right: { type: "pool", value: 3 },
    });
    expect(result.value).toBe(14);
  });

  test("a sub-roll without dice is unchanged", () => {
    expect(evaluate("{5}k1").value).toBe(5);
    expect(evaluate("{5*2}s").value).toBe(10);
  });

  test("in max mode", () => {
    // every die rolls its max: keep the two 8s
    expect(evaluate("{4d6+2d8}k2", { mode: "max" }).value).toBe(16);
  });
});

describe("multiple sub-rolls", () => {
  test("keep keeps sub-rolls by their totals (documented examples)", () => {
    const result = evaluateGroup("{4d10, 5d6, 2d10}k2", {
      rolls: [8, 1, 4, 1, 1, 5, 1, 5, 3, 6, 3],
    });

    expect(result.members.map(({ useInTotal }) => useInTotal)).toEqual([
      true,
      true,
      false,
    ]);
    expect(result.members[2]?.flags).toEqual(["drop"]);
    // the dice themselves aren't dropped
    expect(poolRolls(result)[2]).toEqual(["6", "3"]);
    expect(result.value).toBe(29);
    expect(evaluate("{5+d10, 3d4*2}k1", { rolls: [8, 3, 2, 2] }).value).toBe(
      14,
    );
  });

  test("drop drops sub-rolls by their totals (documented examples)", () => {
    expect(
      evaluate("{4d10, 5d6, 2d10}d2", {
        rolls: [8, 1, 4, 1, 1, 5, 1, 5, 3, 6, 3],
      }).value,
    ).toBe(15);
    expect(evaluate("{5+d10, 3d4*2}d1", { rolls: [8, 3, 2, 2] }).value).toBe(
      14,
    );
  });

  const targetRolls = [4, 3, 3, 2, 2, 6, 17, 5, 20, 7, 9, 6, 10, 8];

  test("target counts the successful sub-rolls (documented example)", () => {
    const result = evaluateGroup("{4d6+2d8, 3d20+3, 5d10+1}>40", {
      rolls: targetRolls,
    });

    expect(result.members.map(({ value }) => value)).toEqual([20, 45, 41]);
    expect(result.members.map(({ flags }) => flags)).toEqual([
      [],
      ["target-success"],
      ["target-success"],
    ]);
    expect(result.value).toBe(2);
  });

  test("target failures are subtracted (documented example)", () => {
    const result = evaluateGroup("{4d6+2d8, 3d20+3, 5d10+1}>40f<30", {
      rolls: targetRolls,
    });

    expect(result.members.map(({ flags }) => flags)).toEqual([
      ["target-failure"],
      ["target-success"],
      ["target-success"],
    ]);
    expect(result.value).toBe(1);
  });

  // totals: 6.5, 14, 12
  const sortRolls = [4, 3, 5, 1, 3, 2, 4, 8, 4];

  test.each([
    [
      "{4d6/2, 3d4+5, 2d10}",
      [6.5, 14, 12],
      [
        ["4", "3", "5", "1"],
        ["3", "2", "4"],
        ["8", "4"],
      ],
    ],
    [
      "{4d6/2, 3d4+5, 2d10}s",
      [6.5, 12, 14],
      [
        ["1", "3", "4", "5"],
        ["4", "8"],
        ["2", "3", "4"],
      ],
    ],
    [
      "{4d6/2, 3d4+5, 2d10}sd",
      [14, 12, 6.5],
      [
        ["4", "3", "2"],
        ["8", "4"],
        ["5", "4", "3", "1"],
      ],
    ],
  ])(
    "sort sorts the sub-rolls and their dice: %s (documented example)",
    (notation, totals, dice) => {
      const result = evaluateGroup(notation, { rolls: sortRolls });

      expect(result.members.map(({ value }) => value)).toEqual(totals);
      expect(poolRolls(result)).toEqual(dice);
      expect(result.value).toBe(32.5);
    },
  );
});

describe("custom flattening handlers", () => {
  test("dice that a handler reorders are written back into their own pools", () => {
    const modifiers = new ModifierRegistry().register({
      ...keepHandler,
      apply: (items) => [...items].reverse(),
    });
    const result = evaluateGroup("{2d6+1d4}k1", {
      rolls: [1, 2, 3],
      modifiers,
    });

    expect(poolRolls(result)).toEqual([["2", "1"], ["3"]]);
    expect(result.value).toBe(6);
  });

  test("dice that a handler removes are removed from their pools", () => {
    const modifiers = new ModifierRegistry().register({
      ...keepHandler,
      apply: (items) => items.filter(({ value }) => value > 1),
    });
    const result = evaluateGroup("{2d6+1d4}k1", {
      rolls: [1, 2, 3],
      modifiers,
    });

    expect(poolRolls(result)).toEqual([["2"], ["3"]]);
    expect(result.value).toBe(5);
  });

  test("a die that isn't from a pool throws an EvaluationError", () => {
    const modifiers = new ModifierRegistry().register({
      ...keepHandler,
      apply: () => [createDieResult(1)] as never,
    });

    expect(() => evaluate("{2d6}k1", { modifiers })).toThrow(EvaluationError);
  });

  test("the pool tags aren't left on the results", () => {
    const result = evaluateGroup("{2d6+1d4}k1", { rolls: [1, 2, 3] });

    for (const roll of poolsOf(result).flatMap(({ rolls }) => rolls)) {
      expect(Object.getOwnPropertySymbols(roll)).toEqual([]);
    }
  });

  test("an each-pool handler gets each pool's dice separately", () => {
    const sizes: number[] = [];
    const counting: ModifierHandler<SortNode> = {
      ...sortHandler,
      apply(items, input) {
        sizes.push(items.length);

        return sortHandler.apply(items, input);
      },
    };
    const modifiers = new ModifierRegistry().register(counting);

    evaluate("{2d6+1d4, 3}s", { rolls: [1, 2, 3], modifiers });

    // once for the members, then once per pool
    expect(sizes).toEqual([2, 2, 1]);
  });
});
