import { createKeep, createMin, createSort } from "../../src/ast/factory.js";
import type { MinNode, TargetNode } from "../../src/ast/nodes.js";
import { EvaluationError } from "../../src/errors/EvaluationError.js";
import { ValidationError } from "../../src/errors/ValidationError.js";
import { createRollContext } from "../../src/evaluator/RollContext.js";
import { ModifierRegistry } from "../../src/modifiers/ModifierRegistry.js";
import {
  criticalFailureHandler,
  criticalSuccessHandler,
  dropHandler,
  keepHandler,
  maxHandler,
  minHandler,
  sortHandler,
  targetHandler,
} from "../../src/modifiers/handlers/index.js";
import type { ModifierHandler } from "../../src/modifiers/types.js";
import { createDieResult } from "../../src/results/die-result.js";
import type { DieResult } from "../../src/results/types.js";
import {
  evaluate,
  evaluateGroup,
  evaluatePool,
  parser,
  rollsOf,
} from "./helpers.js";

/** The documented examples: notation, the rolls, the expected rolls output, and the total. */
type Example = [string, number[], string[], number];

describe("min", () => {
  test.each<Example>([
    ["4d6", [1, 4, 3, 2], ["1", "4", "3", "2"], 10],
    ["4d6min3", [1, 4, 3, 2], ["3^", "4", "3", "3^"], 13],
    ["2d6min-1", [1, 2], ["1", "2"], 3],
    ["2d6min2.5", [1, 3], ["2.5^", "3"], 5.5],
  ])("%s", (notation, rolls, expected, total) => {
    const result = evaluatePool(notation, { rolls });

    expect(rollsOf(result)).toEqual(expected);
    expect(result.value).toBe(total);
  });

  test("the initial value is kept", () => {
    expect(evaluatePool("d6min3", { rolls: [1] }).rolls[0]).toMatchObject({
      value: 3,
      initialValue: 1,
      calculationValue: 3,
    });
  });

  test("only rolls below the minimum are changed and flagged", () => {
    expect(evaluatePool("3d6min4", { rolls: [1, 4, 5] }).rolls).toEqual([
      {
        type: "die",
        value: 4,
        initialValue: 1,
        calculationValue: 4,
        useInTotal: true,
        flags: ["min"],
      },
      {
        type: "die",
        value: 4,
        initialValue: 4,
        calculationValue: 4,
        useInTotal: true,
        flags: [],
      },
      {
        type: "die",
        value: 5,
        initialValue: 5,
        calculationValue: 5,
        useInTotal: true,
        flags: [],
      },
    ]);
  });
});

describe("max", () => {
  test.each<Example>([
    ["4d6", [5, 4, 3, 2], ["5", "4", "3", "2"], 14],
    ["4d6max3", [5, 4, 3, 2], ["3v", "3v", "3", "2"], 11],
    ["2d6max-1", [1, 2], ["-1v", "-1v"], -2],
  ])("%s", (notation, rolls, expected, total) => {
    const result = evaluatePool(notation, { rolls });

    expect(rollsOf(result)).toEqual(expected);
    expect(result.value).toBe(total);
  });

  test("min runs before max, whatever the notation order", () => {
    // min3 raises the 1 to 3, then max2 lowers both to 2
    for (const notation of ["2d6min3max2", "2d6max2min3"]) {
      expect(rollsOf(evaluatePool(notation, { rolls: [1, 5] }))).toEqual([
        "2^v",
        "2v",
      ]);
    }
  });
});

describe("keep", () => {
  test.each<Example>([
    ["6d8k3", [3, 6, 7, 2, 5, 4], ["3d", "6", "7", "2d", "5", "4d"], 18],
    ["4d10kh2", [3, 9, 1, 6], ["3d", "9", "1d", "6"], 15],
    ["4d10k2", [3, 9, 1, 6], ["3d", "9", "1d", "6"], 15],
    ["4d10kl1", [3, 9, 1, 6], ["3d", "9d", "1", "6d"], 1],
    ["2d6k5", [3, 4], ["3", "4"], 7],
    ["2d6kl5", [3, 4], ["3", "4"], 7],
    // ties: the earlier of two equal rolls counts as the lower one
    ["3d6kh1", [6, 6, 2], ["6d", "6", "2d"], 6],
    ["3d6kl1", [2, 2, 5], ["2", "2d", "5d"], 2],
  ])("%s", (notation, rolls, expected, total) => {
    const result = evaluatePool(notation, { rolls });

    expect(rollsOf(result)).toEqual(expected);
    expect(result.value).toBe(total);
  });
});

describe("drop", () => {
  test.each<Example>([
    ["6d8dh3", [3, 6, 7, 2, 5, 4], ["3", "6d", "7d", "2", "5d", "4"], 9],
    ["4d10dl2", [5, 3, 7, 8], ["5d", "3d", "7", "8"], 15],
    ["4d10d2", [5, 3, 7, 8], ["5d", "3d", "7", "8"], 15],
    ["4d10dh1", [5, 3, 7, 8], ["5", "3", "7", "8d"], 15],
    ["4d10dh1dl1", [5, 3, 7, 8], ["5", "3d", "7", "8d"], 12],
    ["4d10dh1dl2", [5, 3, 7, 8], ["5d", "3d", "7", "8d"], 7],
    ["2d6d5", [3, 4], ["3d", "4d"], 0],
    ["3d6dh1", [6, 2, 6], ["6", "2", "6d"], 8],
  ])("%s", (notation, rolls, expected, total) => {
    const result = evaluatePool(notation, { rolls });

    expect(rollsOf(result)).toEqual(expected);
    expect(result.value).toBe(total);
  });

  test("drop flags preserve values and exclude only the selected dice", () => {
    const result = evaluatePool("3d6dh1", { rolls: [6, 2, 6] });

    expect(result.rolls).toEqual([
      {
        type: "die",
        value: 6,
        initialValue: 6,
        calculationValue: 6,
        useInTotal: true,
        flags: [],
      },
      {
        type: "die",
        value: 2,
        initialValue: 2,
        calculationValue: 2,
        useInTotal: true,
        flags: [],
      },
      {
        type: "die",
        value: 6,
        initialValue: 6,
        calculationValue: 6,
        useInTotal: false,
        flags: ["drop"],
      },
    ]);
    expect(result.value).toBe(8);
  });

  test.each<Example>([
    // both look at the whole pool, so they can override each other
    ["3d10k1dh1", [7, 1, 2], ["7d", "1d", "2d"], 0],
    ["3d10k1d1", [6, 1, 9], ["6d", "1d", "9"], 9],
    // a roll dropped by both is only flagged once
    ["3d6kh2dl1", [1, 4, 6], ["1d", "4", "6"], 10],
    ["3d6kh2dl1", [5, 6, 5], ["5d", "6", "5"], 11],
  ])("with keep: %s", (notation, rolls, expected, total) => {
    const result = evaluatePool(notation, { rolls });

    expect(rollsOf(result)).toEqual(expected);
    expect(result.value).toBe(total);
  });
});

describe("target", () => {
  test.each<Example>([
    ["2d6=6", [4, 6], ["4", "6*"], 1],
    ["4d3>1", [1, 3, 2, 1], ["1", "3*", "2*", "1"], 2],
    ["4d3<2", [1, 3, 2, 1], ["1*", "3", "2", "1*"], 2],
    ["5d8>=5", [2, 4, 6, 3, 8], ["2", "4", "6*", "3", "8*"], 2],
    ["6d10<=4", [7, 2, 10, 3, 3, 4], ["7", "2*", "10", "3*", "3*", "4*"], 4],
    ["2d6<>4", [4, 5], ["4", "5*"], 1],
    ["4d6>4f<3", [2, 5, 4, 5], ["2_", "5*", "4", "5*"], 1],
    ["4d6>4f<3", [1, 2, 3, 6], ["1_", "2_", "3", "6*"], -1],
    // the last matching rule wins
    ["2d6>2f<5", [3, 1], ["3_", "1_"], -2],
  ])("%s", (notation, rolls, expected, total) => {
    const result = evaluatePool(notation, { rolls });

    expect(rollsOf(result)).toEqual(expected);
    expect(result.value).toBe(total);
  });

  test("values are kept, and calculation values count the successes", () => {
    const result = evaluatePool("3d6>4f<2", { rolls: [5, 3, 1] });

    expect(result.rolls.map(({ value }) => value)).toEqual([5, 3, 1]);
    expect(
      result.rolls.map(({ calculationValue }) => calculationValue),
    ).toEqual([1, 0, -1]);
  });

  test("success and failure flags apply at their inclusive boundaries", () => {
    const result = evaluatePool("4d6>=5f<=2", { rolls: [5, 4, 2, 1] });

    expect(
      result.rolls.map(({ value, calculationValue, useInTotal, flags }) => ({
        value,
        calculationValue,
        useInTotal,
        flags,
      })),
    ).toEqual([
      {
        value: 5,
        calculationValue: 1,
        useInTotal: true,
        flags: ["target-success"],
      },
      { value: 4, calculationValue: 0, useInTotal: true, flags: [] },
      {
        value: 2,
        calculationValue: -1,
        useInTotal: true,
        flags: ["target-failure"],
      },
      {
        value: 1,
        calculationValue: -1,
        useInTotal: true,
        flags: ["target-failure"],
      },
    ]);
    expect(result.value).toBe(-1);
  });

  test("dropped rolls aren't counted", () => {
    const result = evaluatePool("4d6>4kh2", { rolls: [5, 6, 2, 5] });

    expect(rollsOf(result)).toEqual(["5d*", "6*", "2d", "5*"]);
    expect(result.value).toBe(2);
  });

  test.each([
    ["5d10>=6:2f<=2:3>=10:5", [1, 2, 5, 6, 10], [-3, -3, 0, 2, 5]],
    ["5d10>=10:5>=6:2f<=2:3", [1, 2, 5, 6, 10], [-3, -3, 0, 2, 2]],
    ["4d6>2:2f<5:3=3:4", [1, 3, 4, 6], [-3, 4, -3, 2]],
    ["3d6<-1:2<>2:10", [1, 2, 3], [10, 0, 10]],
  ])("%s uses the last matching rule", (notation, rolls, expected) => {
    const result = evaluatePool(notation, { rolls });

    expect(result.rolls.map(({ value }) => value)).toEqual(rolls);
    expect(
      result.rolls.map(({ calculationValue }) => calculationValue),
    ).toEqual(expected);
    expect(result.value).toBe(expected.reduce((a, b) => a + b, 0));
  });

  test.each<[number[], number]>([
    [[1, 2, 3, 3], 2],
    [[1, 2, 4, 5], 1],
    [[1, 3, 5, 6], 0],
  ])("4d6<=5=3:2k1 scores the kept result in %s", (rolls, total) => {
    expect(evaluatePool("4d6<=5=3:2k1", { rolls }).value).toBe(total);
  });

  test("clears stale target flags and preserves other flags and exclusion", () => {
    const items = [
      {
        ...createDieResult(6),
        useInTotal: false,
        flags: ["target-failure", "critical-success"] as const,
      },
      { ...createDieResult(3), flags: ["target-success", "drop"] as const },
    ];
    const modifier = {
      type: "modifier",
      name: "target",
      rules: [
        {
          kind: "success",
          comparePoint: { operator: ">", value: 4 },
          amount: 2,
        },
      ],
    } as const;
    const result = targetHandler.apply(items, {
      modifier,
      ctx: createRollContext(),
    });

    expect(result).toMatchObject([
      {
        value: 6,
        useInTotal: false,
        calculationValue: 2,
        flags: ["critical-success", "target-success"],
      },
      { value: 3, calculationValue: 0, flags: ["drop"] },
    ]);
    expect(items[0]?.flags).toEqual(["target-failure", "critical-success"]);
  });

  test("weighted targets preserve dropped, min, and independent critical flags", () => {
    const result = evaluatePool("3d6min2kh2>=2:2f=2:3cs>=2cf=2", {
      rolls: [1, 2, 6],
    });

    expect(
      result.rolls.map(({ value, useInTotal, calculationValue, flags }) => ({
        value,
        useInTotal,
        calculationValue,
        flags,
      })),
    ).toEqual([
      {
        value: 2,
        useInTotal: false,
        calculationValue: -3,
        flags: [
          "min",
          "drop",
          "target-failure",
          "critical-success",
          "critical-failure",
        ],
      },
      {
        value: 2,
        useInTotal: true,
        calculationValue: -3,
        flags: ["target-failure", "critical-success", "critical-failure"],
      },
      {
        value: 6,
        useInTotal: true,
        calculationValue: 2,
        flags: ["target-success", "critical-success"],
      },
    ]);
    expect(result.value).toBe(-1);
  });

  test.each([0, -1, 1.5, 11, NaN, Infinity, null, "2"])(
    "rejects invalid supplied target amount %s even with a custom handler",
    (amount) => {
      const node = parser.parse("d6>4");
      if (node.type !== "pool") throw new Error("Expected a pool");
      const modifier = {
        type: "modifier",
        name: "target",
        rules: [
          {
            kind: "success",
            comparePoint: { operator: ">", value: 4 },
            amount,
          },
        ],
      };
      const modifiers = new ModifierRegistry().register({
        ...targetHandler,
        apply: (items) => [...items],
      });
      expect(() =>
        evaluate({ ...node, modifiers: [modifier] } as never, { modifiers }),
      ).toThrow(ValidationError);
    },
  );

  test.each(["d6>4", "{1,2}>1"])(
    "rejects multiple targets in a directly supplied AST for %s",
    (notation) => {
      const node = parser.parse(notation);
      if (node.type !== "pool" && node.type !== "group") {
        throw new Error("Expected a pool or group");
      }
      const target = node.modifiers[0];
      if (!target) throw new Error("Expected a target");

      expect(() =>
        evaluate({ ...node, modifiers: [target, createKeep("h", 1), target] }),
      ).toThrow(ValidationError);
    },
  );

  test("!= straight after the die is an explode, not a target", () => {
    // `2d6!=4` explodes on 4; `2d6<>4` is the documented "not equal" target
    expect(parser.parse("2d6!=4")).toMatchObject({
      modifiers: [{ name: "explode", comparePoint: { operator: "=" } }],
    });
    expect(parser.parse("2d6>3!")).toMatchObject({
      modifiers: [{ name: "target" }, { name: "explode" }],
    });
  });
});

describe("critical success / failure", () => {
  test.each<Example>([
    ["2d20cs", [4, 20], ["4", "20**"], 24],
    ["4d10cs>7", [8, 7, 10, 2], ["8**", "7", "10**", "2"], 27],
    ["5d3cs=2", [1, 2, 3, 2, 2], ["1", "2**", "3", "2**", "2**"], 10],
    ["2d20cf", [4, 1], ["4", "1__"], 5],
    ["4d10cf<3", [1, 2, 3, 10], ["1__", "2__", "3", "10"], 16],
    ["6d4cf=2", [2, 1, 2, 4, 3, 2], ["2__", "1", "2__", "4", "3", "2__"], 14],
    ["2d20cscf", [20, 1], ["20**", "1__"], 21],
    ["d20cs>=19cf<=2", [19], ["19**"], 19],
  ])("%s", (notation, rolls, expected, total) => {
    const result = evaluatePool(notation, { rolls });

    expect(rollsOf(result)).toEqual(expected);
    expect(result.value).toBe(total);
  });

  test("the defaults are the die's own max / min", () => {
    // `dF` rolls a face by index: 0 -> -1, 2 -> 1
    expect(rollsOf(evaluatePool("2dFcscf", { rolls: [2, 0] }))).toEqual([
      "1**",
      "-1__",
    ]);
    expect(rollsOf(evaluatePool("2d%cs", { rolls: [100, 99] }))).toEqual([
      "100**",
      "99",
    ]);
  });

  test("they don't change values or totals", () => {
    const plain = evaluatePool("4d6", { rolls: [1, 6, 3, 6] });
    const flagged = evaluatePool("4d6cscf", { rolls: [1, 6, 3, 6] });

    expect(flagged.value).toBe(plain.value);
    expect(
      flagged.rolls.map(({ calculationValue }) => calculationValue),
    ).toEqual(plain.rolls.map(({ calculationValue }) => calculationValue));
  });
});

describe("sort", () => {
  test.each<Example>([
    ["4d6", [4, 3, 5, 1], ["4", "3", "5", "1"], 13],
    ["4d6s", [4, 3, 5, 1], ["1", "3", "4", "5"], 13],
    ["4d6sa", [4, 3, 5, 1], ["1", "3", "4", "5"], 13],
    ["4d6sd", [4, 3, 5, 1], ["5", "4", "3", "1"], 13],
    // sort runs last, so dropped rolls are sorted with the rest
    ["4d6sdkh2", [4, 3, 5, 1], ["5", "4", "3d", "1d"], 9],
  ])("%s", (notation, rolls, expected, total) => {
    const result = evaluatePool(notation, { rolls });

    expect(rollsOf(result)).toEqual(expected);
    expect(result.value).toBe(total);
  });

  test("sorting is stable when an earlier modifier makes values tie", () => {
    const result = evaluatePool("4d6min4s", { rolls: [2, 1, 4, 3] });

    expect(
      result.rolls.map(({ initialValue, value, flags }) => ({
        initialValue,
        value,
        flags,
      })),
    ).toEqual([
      { initialValue: 2, value: 4, flags: ["min"] },
      { initialValue: 1, value: 4, flags: ["min"] },
      { initialValue: 4, value: 4, flags: [] },
      { initialValue: 3, value: 4, flags: ["min"] },
    ]);
  });

  test("equal values keep their order", () => {
    const rolls = evaluatePool("3d6sd>4", { rolls: [3, 6, 3] }).rolls;

    expect(rolls.map(({ initialValue }) => initialValue)).toEqual([6, 3, 3]);
  });
});

describe("execution order", () => {
  test("target rules run once at their equal-order position", () => {
    const calls: string[] = [];
    const modifiers = new ModifierRegistry().register(
      {
        ...targetHandler,
        order: 1,
        apply: (items, input) => {
          calls.push(`target:${input.modifier.rules.length}`);
          return targetHandler.apply(items, input);
        },
      } satisfies ModifierHandler<TargetNode>,
      {
        ...minHandler,
        order: 1,
        apply: (items, input) => {
          calls.push("min");
          return minHandler.apply(items, input);
        },
      } satisfies ModifierHandler<MinNode>,
    );
    const result = evaluatePool("2d6>4:2=4:3min4", {
      rolls: [1, 5],
      modifiers,
    });

    expect(calls).toEqual(["target:2", "min"]);
    expect(
      result.rolls.map(({ calculationValue }) => calculationValue),
    ).toEqual([4, 2]);
  });
  test.each([
    ["4d6kh2s", "4d6skh2"],
    ["4d6>4kh2", "4d6kh2>4"],
    ["4d6min2kh2cs", "4d6cskh2min2"],
  ])("%s rolls the same as %s", (first, second) => {
    const rolls = [1, 6, 3, 4];

    expect(evaluatePool(first, { rolls }).rolls).toEqual(
      evaluatePool(second, { rolls }).rolls,
    );
  });

  test("handlers run in the registry order, so a custom order changes the result", () => {
    // by default min (1) runs before target (8): [4^, 5] are both successes
    expect(evaluatePool("2d6min4>3", { rolls: [1, 5] }).value).toBe(2);

    // target first: the 1 counts as 0 and the 5 as 1, then min sets the 1 to 4
    const modifiers = new ModifierRegistry().register({
      ...targetHandler,
      order: 0,
    });
    const result = evaluatePool("2d6min4>3", { rolls: [1, 5], modifiers });

    expect(rollsOf(result)).toEqual(["4^", "5*"]);
    expect(result.value).toBe(5);
  });
});

describe("min / max mode", () => {
  test.each([
    ["4d6kh3", "max", 18],
    ["4d6kh3", "min", 3],
    ["4d6min3", "min", 12],
    ["4d6max3", "max", 12],
    ["4d6>=5", "max", 4],
    ["4d6>=5", "min", 0],
  ] as const)("%s in %s mode = %d", (notation, mode, total) => {
    expect(evaluate(notation, { mode }).value).toBe(total);
  });
});

describe("groups", () => {
  test.each<[string, number[], boolean[], number]>([
    // members are 2d6 = 7, 3d4 = 6
    ["{2d6, 3d4}k1", [3, 4, 1, 2, 3], [true, false], 7],
    ["{2d6, 3d4}kl1", [3, 4, 1, 2, 3], [false, true], 6],
    ["{2d6, 3d4}d1", [3, 4, 1, 2, 3], [true, false], 7],
    ["{2d6, 3d4}dh1", [3, 4, 1, 2, 3], [false, true], 6],
  ])("%s", (notation, rolls, used, total) => {
    const result = evaluateGroup(notation, { rolls });

    expect(result.members.map(({ useInTotal }) => useInTotal)).toEqual(used);
    expect(result.value).toBe(total);
  });

  test("group members count as successes and failures by their totals", () => {
    // 2d6 = 7 (success), 1d4 = 1 (failure), 5 (neither)
    const result = evaluateGroup("{2d6, 1d4, 5}>6f<2", { rolls: [3, 4, 1] });

    expect(result.members.map(({ flags }) => flags)).toEqual([
      ["target-success"],
      ["target-failure"],
      [],
    ]);
    expect(result.value).toBe(0);
  });

  test("group members are sorted by their totals", () => {
    const result = evaluateGroup("{2d6, 1d4, 5}sd", { rolls: [3, 4, 1] });

    expect(result.members.map(({ value }) => value)).toEqual([7, 5, 1]);
    expect(result.value).toBe(13);
  });

  test("a group without modifiers sums its members", () => {
    const result = evaluateGroup("{2d6, 3, 1d4*2}", { rolls: [3, 4, 2] });

    expect(result.members.map(({ value }) => value)).toEqual([7, 3, 4]);
    expect(result.members[0]?.result.type).toBe("pool");
    expect(result.value).toBe(14);
  });

  test.each([
    "{2d6, 1d4}min2",
    "{2d6, 1d4}max2",
    "{2d6, 1d4}cs",
    "{2d6, 1d4}cf",
  ])("%s can't be used on a group", (notation) => {
    expect(() => evaluate(notation)).toThrow(EvaluationError);
  });
});

describe("errors", () => {
  test("a modifier without a handler throws an EvaluationError", () => {
    const modifiers = new ModifierRegistry();

    modifiers.remove("keep");

    expect(() => evaluate("4d6kh1", { modifiers })).toThrow(EvaluationError);
    expect(() => evaluate("4d6", { modifiers })).not.toThrow();
  });

  test("a handler that doesn't return an array throws an EvaluationError", () => {
    const modifiers = new ModifierRegistry().register({
      ...keepHandler,
      apply: () => undefined as unknown as [],
    });

    expect(() => evaluate("4d6kh1", { modifiers })).toThrow(EvaluationError);
  });

  test("a custom handler can replace a built-in", () => {
    const modifiers = new ModifierRegistry().register({
      ...keepHandler,
      apply: (items) => items.map(() => ({ ...createDieResult(1) })) as never,
    });

    expect(evaluate("4d6kh1", { modifiers, rolls: [6, 6, 6, 6] }).value).toBe(
      4,
    );
  });

  test("an unknown compare operator throws a ValidationError", () => {
    const node = {
      ...evaluate("2d6>3").node,
      modifiers: [
        {
          type: "modifier",
          name: "target",
          rules: [
            { kind: "success", comparePoint: { operator: "~", value: 3 } },
          ],
        },
      ],
    };

    expect(() => evaluate(node as never)).toThrow(ValidationError);
  });

  test("a compare point default needs a die", () => {
    expect(() =>
      criticalSuccessHandler.apply([createDieResult(6)], {
        modifier: { type: "modifier", name: "critical-success" },
        ctx: createRollContext(),
      }),
    ).toThrow(EvaluationError);
  });
});

describe("handlers are immutable", () => {
  const ctx = createRollContext();
  const items: readonly DieResult[] = Object.freeze(
    [4, 1, 6].map((value) => Object.freeze(createDieResult(value))),
  );
  const die = {
    notation: "6",
    min: 1,
    max: 6,
    average: 3.5,
    faceCount: 6,
    roll: () => 1,
    source: { min: 1, max: 6 },
  };

  test.each<[string, ModifierHandler, object]>([
    ["min", minHandler, createMin(3)],
    ["max", maxHandler, { type: "modifier", name: "max", value: 3 }],
    ["keep", keepHandler, createKeep("h", 1)],
    ["drop", dropHandler, { type: "modifier", name: "drop", end: "l", qty: 1 }],
    [
      "target",
      targetHandler,
      {
        type: "modifier",
        name: "target",
        rules: [
          { kind: "success", comparePoint: { operator: ">", value: 3 } },
          { kind: "failure", comparePoint: { operator: "<", value: 2 } },
        ],
      },
    ],
    [
      "critical-success",
      criticalSuccessHandler,
      { type: "modifier", name: "critical-success" },
    ],
    [
      "critical-failure",
      criticalFailureHandler,
      { type: "modifier", name: "critical-failure" },
    ],
    ["sort", sortHandler, createSort("d")],
  ])(
    "%s returns new items and leaves the originals unchanged",
    (_, handler, modifier) => {
      const before = structuredClone(items);
      const result = handler.apply(items, {
        modifier: modifier as never,
        ctx,
        die,
      });

      expect(result).not.toBe(items);
      expect(result).toHaveLength(items.length);
      expect(items).toEqual(before);
    },
  );
});
