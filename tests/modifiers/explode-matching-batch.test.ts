import { RollSettings } from "../../src/RollSettings.js";
import { createExplodeMatchingBatch } from "../../src/ast/factory.js";
import { createRollContext } from "../../src/evaluator/RollContext.js";
import { ModifierRegistry } from "../../src/modifiers/ModifierRegistry.js";
import {
  explodeHandler,
  explodeMatchingBatchHandler,
} from "../../src/modifiers/handlers/index.js";
import type { PoolResult } from "../../src/results/types.js";

function settingsWithRolls(
  rolls: readonly number[],
  limits: { maxGeneratedRolls?: number; maxIterations?: number } = {},
  modifiers?: ModifierRegistry,
) {
  const settings = new RollSettings({
    limits: { maxGeneratedRolls: 100, ...limits },
    ...(modifiers && { modifiers }),
  });
  const remaining = [...rolls];
  const integer = jest
    .spyOn(settings.generator, "integer")
    .mockImplementation((min) => remaining.shift() ?? min);

  return { settings, integer, remaining };
}

function evaluatePool(settings: RollSettings, notation: string): PoolResult {
  const result = settings.evaluate(settings.parse(notation));

  if (result.type !== "pool") {
    throw new Error("Expected a pool result");
  }

  return result;
}

describe("matching-batch explode", () => {
  test("requires a pool die and batch helper", () => {
    const result = explodeMatchingBatchHandler.apply([], {
      modifier: createExplodeMatchingBatch(),
      ctx: createRollContext(),
    });

    if (Array.isArray(result)) {
      throw new Error("Expected a generator handler result");
    }

    expect(() => result.next()).toThrow(
      'The "explode-matching-batch" modifier can only be used on a dice pool',
    );
  });
  test("flags matching full batches and leaves a mixed stopping batch unmarked", () => {
    const { settings, integer, remaining } = settingsWithRolls([
      4, 4, 4, 4, 4, 5,
    ]);
    const result = evaluatePool(settings, "2d6!m");

    expect(result).toMatchObject({
      value: 25,
      rolls: [
        { value: 4, flags: ["explode-matching-batch"] },
        { value: 4, flags: ["explode-matching-batch"] },
        { value: 4, flags: ["explode-matching-batch"] },
        { value: 4, flags: ["explode-matching-batch"] },
        { value: 4, flags: [] },
        { value: 5, flags: [] },
      ],
    });
    expect(integer).toHaveBeenCalledTimes(6);
    expect(remaining).toEqual([]);
  });

  test("failure takes precedence, zeroes all accumulated dice, and flags only its batch", () => {
    const { settings } = settingsWithRolls([6, 6, 1, 1]);
    const result = evaluatePool(settings, "2d6!m>=5f<=2");

    expect(result).toMatchObject({
      value: 0,
      rolls: [
        {
          value: 6,
          calculationValue: 0,
          flags: ["explode-matching-batch"],
        },
        {
          value: 6,
          calculationValue: 0,
          flags: ["explode-matching-batch"],
        },
        {
          value: 1,
          calculationValue: 0,
          flags: ["explode-matching-batch-failure"],
        },
        {
          value: 1,
          calculationValue: 0,
          flags: ["explode-matching-batch-failure"],
        },
      ],
    });
  });

  test("later target modifiers may rescore a failed pool", () => {
    const { settings } = settingsWithRolls([6, 6, 1, 1]);
    const result = evaluatePool(settings, "2d6!m>=5f<=2>=5");

    expect(result.value).toBe(2);
    expect(result.rolls).toMatchObject([
      {
        value: 6,
        calculationValue: 1,
        flags: ["explode-matching-batch", "target-success"],
      },
      {
        value: 6,
        calculationValue: 1,
        flags: ["explode-matching-batch", "target-success"],
      },
      {
        value: 1,
        calculationValue: 0,
        flags: ["explode-matching-batch-failure"],
      },
      {
        value: 1,
        calculationValue: 0,
        flags: ["explode-matching-batch-failure"],
      },
    ]);
  });

  test("failure is checked on the initial batch and on the final allowed batch", () => {
    const initialFailure = settingsWithRolls([1, 1]);
    expect(evaluatePool(initialFailure.settings, "2d6!mf=1")).toMatchObject({
      value: 0,
      rolls: [
        { calculationValue: 0, flags: ["explode-matching-batch-failure"] },
        { calculationValue: 0, flags: ["explode-matching-batch-failure"] },
      ],
    });
    expect(initialFailure.integer).toHaveBeenCalledTimes(2);

    const finalBatchFailure = settingsWithRolls([3, 3, 1, 1]);
    expect(
      evaluatePool(finalBatchFailure.settings, "2d6!m1=3f=1"),
    ).toMatchObject({
      value: 0,
      rolls: [
        { calculationValue: 0, flags: ["explode-matching-batch"] },
        { calculationValue: 0, flags: ["explode-matching-batch"] },
        { calculationValue: 0, flags: ["explode-matching-batch-failure"] },
        { calculationValue: 0, flags: ["explode-matching-batch-failure"] },
      ],
    });
  });

  test("does not fail a mixed batch even when one die matches the failure point", () => {
    const { settings } = settingsWithRolls([1, 2]);
    const result = evaluatePool(settings, "2d6!mf=1");

    expect(result.value).toBe(3);
    expect(result.rolls).toMatchObject([
      { calculationValue: 1, flags: [] },
      { calculationValue: 2, flags: [] },
    ]);
  });

  test("does not draw or flag a partial batch when the shared budget is insufficient", () => {
    const { settings, integer, remaining } = settingsWithRolls([4, 4, 5], {
      maxGeneratedRolls: 1,
    });
    const result = evaluatePool(settings, "2d6!m");

    expect(result.rolls).toMatchObject([
      { value: 4, flags: [] },
      { value: 4, flags: [] },
    ]);
    expect(integer).toHaveBeenCalledTimes(2);
    expect(remaining).toEqual([5]);
  });

  test("the iteration cap counts extra batches and permits a single-valued die", () => {
    const { settings, integer } = settingsWithRolls([1, 1], {
      maxIterations: 1,
    });
    const result = evaluatePool(settings, "d1!m");

    expect(result.rolls).toMatchObject([
      { value: 1, flags: ["explode-matching-batch"] },
      { value: 1, flags: [] },
    ]);
    expect(integer).toHaveBeenCalledTimes(2);
  });

  test("preserves per-pool budgets across later generators", () => {
    const { settings, integer, remaining } = settingsWithRolls(
      [6, 6, 6, 6, 1, 1],
      { maxGeneratedRolls: 2 },
    );
    const result = evaluatePool(settings, "2d6!m!");

    expect(result.rolls).toMatchObject([
      { value: 6, flags: ["explode-matching-batch"] },
      { value: 6, flags: ["explode-matching-batch"] },
      { value: 6, flags: [] },
      { value: 6, flags: [] },
    ]);
    expect(integer).toHaveBeenCalledTimes(4);
    expect(remaining).toEqual([1, 1]);
  });

  test("raw duplicate modifiers execute sequentially", () => {
    const { settings, integer, remaining } = settingsWithRolls([4, 4, 2, 3]);
    const parsed = settings.parse("d6");

    if (parsed.type !== "pool") {
      throw new Error("Expected a pool node");
    }

    const expression = {
      ...parsed,
      modifiers: [
        createExplodeMatchingBatch(undefined, 1),
        createExplodeMatchingBatch(undefined, 1),
      ],
    };
    const result = settings.evaluate(expression);

    expect(result).toMatchObject({
      type: "pool",
      value: 13,
      rolls: [
        { value: 4, flags: ["explode-matching-batch"] },
        { value: 4, flags: ["explode-matching-batch"] },
        { value: 2, flags: [] },
        { value: 3, flags: [] },
      ],
    });
    expect(integer).toHaveBeenCalledTimes(4);
    expect(remaining).toEqual([]);
  });

  test("parsed duplicate modifiers evaluate using only the last configuration", () => {
    const { settings, integer, remaining } = settingsWithRolls([
      5, 5, 5, 5, 3, 3,
    ]);
    const result = evaluatePool(settings, "2d6!m1=4!m2=5");

    expect(result).toMatchObject({
      value: 26,
      rolls: [
        { value: 5, flags: ["explode-matching-batch"] },
        { value: 5, flags: ["explode-matching-batch"] },
        { value: 5, flags: ["explode-matching-batch"] },
        { value: 5, flags: ["explode-matching-batch"] },
        { value: 3, flags: [] },
        { value: 3, flags: [] },
      ],
    });
    expect(integer).toHaveBeenCalledTimes(6);
    expect(remaining).toEqual([]);
  });

  test("uses the items after an earlier reordered generator as its initial batch", () => {
    const modifiers = new ModifierRegistry().register({
      ...explodeHandler,
      order: 2,
    });
    const { settings, integer, remaining } = settingsWithRolls(
      [6, 6, 4, 5],
      {},
      modifiers,
    );
    const result = evaluatePool(settings, "d6!1!m1");

    expect(result).toMatchObject({
      value: 21,
      rolls: [
        { value: 6, flags: ["explode", "explode-matching-batch"] },
        { value: 6, flags: ["explode-matching-batch"] },
        { value: 4, flags: [] },
        { value: 5, flags: [] },
      ],
    });
    expect(integer).toHaveBeenCalledTimes(4);
    expect(remaining).toEqual([]);
  });

  test("an earlier generator shares the budget and cannot leave room for a partial batch", () => {
    const modifiers = new ModifierRegistry().register({
      ...explodeHandler,
      order: 2,
    });
    const { settings, integer, remaining } = settingsWithRolls(
      [6, 6, 6, 6, 5],
      { maxGeneratedRolls: 3 },
      modifiers,
    );
    const result = evaluatePool(settings, "2d6!1!m1");

    expect(result).toMatchObject({
      value: 24,
      rolls: [
        { value: 6, flags: ["explode"] },
        { value: 6, flags: [] },
        { value: 6, flags: ["explode"] },
        { value: 6, flags: [] },
      ],
    });
    expect(integer).toHaveBeenCalledTimes(4);
    expect(remaining).toEqual([5]);
  });

  test("rejects invalid batch sizes from custom generators", () => {
    const modifiers = new ModifierRegistry().register({
      ...explodeHandler,
      order: 2,
      *apply(items, input) {
        if (!input.rollBatch) {
          throw new Error("Expected a batch draw helper");
        }

        yield* input.rollBatch(-1);

        return [...items];
      },
    });
    const { settings } = settingsWithRolls([6], {}, modifiers);

    expect(() => evaluatePool(settings, "d6!1!m1")).toThrow(
      "A generated batch size must be a non-negative safe integer",
    );
  });

  test("uses the changed item count from a prior custom modifier as its batch size", () => {
    const modifiers = new ModifierRegistry().register({
      ...explodeHandler,
      order: 2,
      apply(items) {
        return [...items, ...items];
      },
    });
    const { settings, integer, remaining } = settingsWithRolls(
      [6, 4, 5],
      {},
      modifiers,
    );
    const result = evaluatePool(settings, "d6!1!m1");

    expect(result).toMatchObject({
      value: 21,
      rolls: [
        { value: 6, flags: ["explode-matching-batch"] },
        { value: 6, flags: ["explode-matching-batch"] },
        { value: 4, flags: [] },
        { value: 5, flags: [] },
      ],
    });
    expect(integer).toHaveBeenCalledTimes(3);
    expect(remaining).toEqual([]);
  });

  test("works for a pool nested in a group and treats zero quantity as no batch", () => {
    const grouped = settingsWithRolls([4, 4, 4, 4, 4], {
      maxGeneratedRolls: 2,
    });
    const group = grouped.settings.evaluate(
      grouped.settings.parse("{2d6!m,d6}"),
    );

    expect(group).toMatchObject({
      type: "group",
      members: [
        {
          result: {
            type: "pool",
            rolls: [
              { flags: ["explode-matching-batch"] },
              { flags: ["explode-matching-batch"] },
              { flags: [] },
              { flags: [] },
            ],
          },
        },
        { result: { type: "pool", rolls: [{ value: 4, flags: [] }] } },
      ],
    });

    const zero = settingsWithRolls([4]);
    expect(evaluatePool(zero.settings, "(1-1)d6!m")).toMatchObject({
      value: 0,
      rolls: [],
    });
    expect(zero.integer).not.toHaveBeenCalled();
  });
});
