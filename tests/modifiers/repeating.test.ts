import { explode, group, pool } from "../../src/ast/builders.js";
import { createComparePoint } from "../../src/ast/factory.js";
import { EvaluationError } from "../../src/errors/EvaluationError.js";
import { createRollContext } from "../../src/evaluator/RollContext.js";
import {
  explodeHandler,
  reRollHandler,
  uniqueHandler,
} from "../../src/modifiers/handlers/index.js";
import { createDieResult } from "../../src/results/die-result.js";
import {
  evaluate,
  evaluateGroup,
  evaluatePool,
  parser,
  poolsOf,
  rollsOf,
} from "./helpers.js";

/** Notation, the generator's values (initial rolls first), the expected rolls, and the total. */
type Example = [string, number[], string[], number];

const repeatableTestDie = {
  notation: "10",
  min: 1,
  max: 10,
  average: 5.5,
  faceCount: 10,
  roll: () => 1,
  source: { min: 1, max: 10 },
};

describe("explode", () => {
  test.each<Example>([
    // the documented examples
    ["2d6!", [4, 6, 6, 2], ["4", "6!", "6!", "2"], 18],
    ["2d6!!", [4, 6, 6, 2], ["4", "14!!"], 18],
    ["2d6!p", [6, 1, 6, 6, 4], ["6!p", "5!p", "5!p", "3", "1"], 20],
    ["2d6!!p", [6, 1, 6, 6, 4], ["19!!p", "1"], 20],
    // compare points
    ["2d6!=5", [5, 2, 5, 1], ["5!", "5!", "1", "2"], 13],
    ["2d6!>4", [5, 2, 6, 3], ["5!", "6!", "3", "2"], 16],
    ["2d10!<=3", [3, 9, 2, 8], ["3!", "2!", "8", "9"], 22],
    ["2d6!!>4", [5, 2, 6, 3], ["14!!", "2"], 16],
    ["2d6!p=5", [5, 2, 5, 1], ["5!p", "4!p", "0", "2"], 11],
    // no explosions
    ["2d6!", [1, 2], ["1", "2"], 3],
    ["2d6!!", [1, 2], ["1", "2"], 3],
    // other dice
    ["2dF!", [2, 0, 1], ["1!", "0", "-1"], 0],
    ["d%!", [100, 7], ["100!", "7"], 107],
  ])("%s", (notation, rolls, expected, total) => {
    const result = evaluatePool(notation, { rolls });

    expect(rollsOf(result)).toEqual(expected);
    expect(result.value).toBe(total);
  });

  test("`2d6!!=4` compounds on rolls equal to 4", () => {
    expect(parser.parse("2d6!!=4")).toEqual(
      pool(2, 6, {
        modifiers: [
          explode({ compound: true, comparePoint: createComparePoint("=", 4) }),
        ],
      }),
    );

    // if it exploded on "not equal to 4", the 2 would explode
    const result = evaluatePool("2d6!!=4", { rolls: [4, 2, 4, 3] });

    expect(rollsOf(result)).toEqual(["11!!", "2"]);
    expect(result.value).toBe(13);
  });

  test("`2d6!<>4` explodes on every value except 4", () => {
    expect(parser.parse("2d6!<>4")).toEqual(
      pool(2, 6, {
        modifiers: [explode({ comparePoint: createComparePoint("<>", 4) })],
      }),
    );

    const result = evaluatePool("2d6!<>4", { rolls: [4, 2, 5, 4] });

    expect(rollsOf(result)).toEqual(["4", "2!", "5!", "4"]);
    expect(result.value).toBe(15);
  });

  test("extra rolls are new die results, and penetrated rolls keep their rolled value", () => {
    const [first, second] = evaluatePool("d6!p", { rolls: [6, 3] }).rolls;

    expect(first).toMatchObject({ value: 6, initialValue: 6 });
    expect(second).toEqual({
      ...createDieResult(3),
      value: 2,
      calculationValue: 2,
    });
  });

  test("a compound roll keeps its initial value", () => {
    expect(evaluatePool("d6!!", { rolls: [6, 6, 1] }).rolls).toEqual([
      {
        ...createDieResult(6),
        value: 13,
        calculationValue: 13,
        flags: ["explode", "compound"],
      },
    ]);
  });

  test.each([
    ["1d10!>0", 1001],
    ["2d10!>0", 2002],
    ["1d10!!>0", 1],
    ["1d10!p>0", 1001],
  ])(
    "%s is limited to 1000 explosions per roll: %d rolls",
    (notation, count) => {
      // the generator always returns the die's min (1), which always explodes
      expect(evaluatePool(notation).rolls).toHaveLength(count);
    },
  );

  test("a compound roll is limited to 1000 explosions", () => {
    expect(evaluatePool("1d10!!>0").value).toBe(1001);
  });

  test("the iteration limit can be configured", () => {
    expect(
      evaluatePool("1d10!>0", { limits: { maxIterations: 5 } }).rolls,
    ).toHaveLength(6);
  });

  test.each([1, 3])("rolls no more than %i extra dice", (maxIterations) => {
    const rollDie = jest.fn(() => createDieResult(10));
    const result = explodeHandler.apply([createDieResult(10)], {
      modifier: {
        type: "modifier",
        name: "explode",
        compound: false,
        penetrate: false,
      },
      ctx: createRollContext({ limits: { maxIterations } }),
      die: repeatableTestDie,
      rollDie,
    });

    expect(rollDie).toHaveBeenCalledTimes(maxIterations);
    expect(result).toHaveLength(maxIterations + 1);
  });

  test.each([
    ["max", 6006],
    ["min", 1],
  ] as const)("in %s mode", (mode, total) => {
    expect(evaluate("d6!", { mode }).value).toBe(total);
  });

  test("a die with one value can't explode", () => {
    expect(() => evaluate("2d1!")).toThrow(EvaluationError);
    expect(() => evaluate("2d1!>5")).toThrow(EvaluationError);
  });

  test("explode can't be used on a group", () => {
    expect(() =>
      evaluate(group([pool(2, 6)], { modifiers: [explode()] })),
    ).toThrow(EvaluationError);
  });

  test("dice in a group can explode", () => {
    const result = evaluateGroup("{2d6!}k1", { rolls: [6, 2, 3] });
    const [pool] = poolsOf(result);

    expect(pool && rollsOf(pool)).toEqual(["6!", "3d", "2d"]);
    expect(result.members[0]).toMatchObject({
      value: 6,
      calculationValue: 6,
      useInTotal: true,
      flags: [],
    });
    expect(result.value).toBe(6);
  });

  test.each(["{2d6}r", "{2d6}ro", "{2d6}u", "{2d6}uo"])(
    "%s cannot be used directly on a group",
    (notation) => {
      expect(() => evaluate(notation)).toThrow(EvaluationError);
    },
  );
});

describe("re-roll", () => {
  test.each<Example>([
    ["d6r", [1, 1, 4], ["4r"], 4],
    ["d6ro", [1, 1], ["1ro"], 1],
    ["d6ro", [1, 5], ["5ro"], 5],
    ["d6r", [3], ["3"], 3],
    ["2d6r=5", [5, 2, 5, 3], ["3r", "2"], 5],
    ["2d6ro>4", [6, 2, 5], ["5ro", "2"], 7],
    ["4d10r<=3", [1, 5, 3, 9, 2, 8, 6], ["8r", "5", "6r", "9"], 28],
    ["2dFr", [0, 2, 1], ["0r", "1"], 1],
  ])("%s", (notation, rolls, expected, total) => {
    const result = evaluatePool(notation, { rolls });

    expect(rollsOf(result)).toEqual(expected);
    expect(result.value).toBe(total);
  });

  test("the initial value is kept", () => {
    expect(evaluatePool("d6r", { rolls: [1, 4] }).rolls[0]).toMatchObject({
      value: 4,
      initialValue: 1,
      calculationValue: 4,
    });
  });

  test("re-rolls are limited to 1000 per roll", () => {
    const result = evaluatePool("2d10r>0");

    expect(rollsOf(result)).toEqual(["1r", "1r"]);
  });

  test.each([1, 3])("re-rolls no more than %i times", (maxIterations) => {
    const rollDie = jest.fn(() => createDieResult(1));
    const result = reRollHandler.apply([createDieResult(1)], {
      modifier: { type: "modifier", name: "re-roll", once: false },
      ctx: createRollContext({ limits: { maxIterations } }),
      die: repeatableTestDie,
      rollDie,
    });

    expect(rollDie).toHaveBeenCalledTimes(maxIterations);
    expect(result).toHaveLength(1);
  });

  test("in min mode the re-rolls stop at the iteration limit", () => {
    expect(evaluate("d6r", { mode: "min" }).value).toBe(1);
  });

  test("a die with one value can't be re-rolled", () => {
    expect(() => evaluate("2d1r")).toThrow(EvaluationError);
  });

  test("explode runs before re-roll", () => {
    // the 6 explodes into a 1, which is then re-rolled
    expect(rollsOf(evaluatePool("d6r!", { rolls: [6, 1, 3] }))).toEqual([
      "6!",
      "3r",
    ]);
  });
});

describe("unique", () => {
  test.each<Example>([
    ["2d10u", [3, 3, 3, 7], ["3", "7u"], 10],
    ["2d10uo", [3, 3, 3], ["3", "3uo"], 6],
    ["3d10u", [4, 2, 4, 2, 9], ["4", "2", "9u"], 15],
    ["4d6u=5", [5, 5, 2, 2, 6], ["5", "6u", "2", "2"], 15],
    // only duplicates matching the compare point are re-rolled
    ["4d4u<=2", [1, 1, 3, 3, 4], ["1", "4u", "3", "3"], 11],
  ])("%s", (notation, rolls, expected, total) => {
    const result = evaluatePool(notation, { rolls });

    expect(rollsOf(result)).toEqual(expected);
    expect(result.value).toBe(total);
  });

  test("the first roll is never re-rolled", () => {
    expect(rollsOf(evaluatePool("3d6u", { rolls: [2, 5, 6] }))).toEqual([
      "2",
      "5",
      "6",
    ]);
  });

  test.each([1, 3])(
    "re-rolls duplicates no more than %i times",
    (maxIterations) => {
      const rollDie = jest.fn(() => createDieResult(1));
      const result = uniqueHandler.apply(
        [createDieResult(1), createDieResult(1)],
        {
          modifier: { type: "modifier", name: "unique", once: false },
          ctx: createRollContext({ limits: { maxIterations } }),
          die: repeatableTestDie,
          rollDie,
        },
      );

      expect(rollDie).toHaveBeenCalledTimes(maxIterations);
      expect(result).toHaveLength(2);
    },
  );

  test("impossible uniqueness stops at 1000 re-rolls per roll, excluding the first", () => {
    const generator = jest.fn(() => 1);
    const ctx = createRollContext();
    const die = {
      notation: "3",
      min: 1,
      max: 3,
      average: 2,
      faceCount: 3,
      roll: () => 1,
      source: { min: 1, max: 3 },
    };
    const items = [1, 1, 1, 1, 1].map(createDieResult);
    const result = uniqueHandler.apply(items, {
      modifier: { type: "modifier", name: "unique", once: false },
      ctx,
      die,
      rollDie: () => createDieResult(generator()),
    });

    expect(generator).toHaveBeenCalledTimes(4000);
    expect(result.map(({ value }) => value)).toEqual([1, 1, 1, 1, 1]);
    expect(result[0]?.flags).toEqual([]);
    expect(result[1]?.flags).toEqual(["unique"]);
  });

  test("a die with one value can't be made unique", () => {
    expect(() => evaluate("2d1u")).toThrow(EvaluationError);
  });
});

describe("repeating handlers", () => {
  test("a valid quantity limit still constrains the number of dice", () => {
    expect(evaluatePool("1d6", { limits: { maxQty: 1 } }).rolls).toHaveLength(
      1,
    );
    expect(() => evaluatePool("2d6", { limits: { maxQty: 1 } })).toThrow(
      EvaluationError,
    );
  });

  test.each([
    [
      "explode",
      explodeHandler,
      { type: "modifier", name: "explode", compound: false, penetrate: false },
    ],
    [
      "re-roll",
      reRollHandler,
      { type: "modifier", name: "re-roll", once: false },
    ],
    [
      "unique",
      uniqueHandler,
      { type: "modifier", name: "unique", once: false },
    ],
  ] as const)("%s needs a pool die", (_, handler, modifier) => {
    expect(() =>
      handler.apply([createDieResult(1)], {
        modifier: modifier as never,
        ctx: createRollContext(),
      }),
    ).toThrow(EvaluationError);
  });

  test("they don't change the original items", () => {
    const items = Object.freeze([
      Object.freeze(createDieResult(6)),
      Object.freeze(createDieResult(1)),
    ]);
    const before = structuredClone(items);

    explodeHandler.apply(items, {
      modifier: {
        type: "modifier",
        name: "explode",
        compound: true,
        penetrate: false,
      },
      ctx: createRollContext(),
      die: {
        notation: "6",
        min: 1,
        max: 6,
        average: 3.5,
        faceCount: 6,
        roll: () => 2,
        source: { min: 1, max: 6 },
      },
      rollDie: () => createDieResult(2),
    });

    expect(items).toEqual(before);
  });
});
