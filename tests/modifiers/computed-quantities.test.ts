import { EvaluationError } from "../../src/errors/EvaluationError.js";
import { ModifierRegistry } from "../../src/modifiers/ModifierRegistry.js";
import type { ModifierHandlerOf } from "../../src/modifiers/types.js";
import { evaluateGroup, evaluatePool, poolsOf, rollsOf } from "./helpers.js";

describe("computed keep and drop quantities", () => {
  test("evaluates a pool quantity after its initial rolls and retains its result", () => {
    const result = evaluatePool("3d6kh(d4)", { rolls: [1, 6, 3, 2] });

    expect(rollsOf(result)).toEqual(["1d", "6", "3"]);
    expect(result.value).toBe(9);
    expect(result.node.modifiers[0]).toMatchObject({
      name: "keep",
      qty: { type: "paren", expression: { type: "pool" } },
    });
    expect(result.modifierArguments).toMatchObject([
      {
        modifierIndex: 0,
        result: {
          type: "paren",
          value: 2,
          inner: { type: "pool", value: 2 },
        },
      },
    ]);
  });

  test("supports computed pool drop quantities", () => {
    const result = evaluatePool("3d6dh(d4)", { rolls: [1, 6, 3, 2] });

    expect(rollsOf(result)).toEqual(["1", "6d", "3d"]);
    expect(result.modifierArguments).toMatchObject([
      { modifierIndex: 0, result: { type: "paren", value: 2 } },
    ]);
  });

  test.each([
    ["3d6kl(d4)", ["1", "6d", "3"]],
    ["3d6dl(d4)", ["1d", "6", "3d"]],
  ])("supports computed low-end quantities in %s", (notation, expected) => {
    expect(rollsOf(evaluatePool(notation, { rolls: [1, 6, 3, 2] }))).toEqual(
      expected,
    );
  });

  test("supports zero and quantities larger than the candidate count", () => {
    expect(rollsOf(evaluatePool("2d6kh(0)", { rolls: [1, 2] }))).toEqual([
      "1d",
      "2d",
    ]);
    expect(rollsOf(evaluatePool("2d6kh(1000)", { rolls: [1, 2] }))).toEqual([
      "1",
      "2",
    ]);
  });

  test("uses the current roll context to resolve a reference quantity", () => {
    const result = evaluatePool("3d6kh($character.count)", {
      rolls: [1, 6, 3],
      data: { character: { count: 2 } },
    });

    expect(rollsOf(result)).toEqual(["1d", "6", "3"]);
    expect(result.modifierArguments).toMatchObject([
      { result: { type: "paren", value: 2 } },
    ]);
  });

  test("deduplicates computed modifiers before resolving their arguments", () => {
    const result = evaluatePool("3d6kh(1)kh(d4)", {
      rolls: [1, 6, 3, 2],
    });

    expect(result.node.modifiers).toHaveLength(1);
    expect(result.modifierArguments).toHaveLength(1);
    expect(result.modifierArguments?.[0]).toMatchObject({
      modifierIndex: 0,
      result: { type: "paren", value: 2 },
    });
    expect(rollsOf(result)).toEqual(["1d", "6", "3"]);
  });

  test("executes a computed modifier on an empty pool", () => {
    const result = evaluatePool("(0)d6kh(d4)", { rolls: [2] });

    expect(result.rolls).toEqual([]);
    expect(result.modifierArguments).toMatchObject([
      { modifierIndex: 0, result: { type: "paren", value: 2 } },
    ]);
  });

  test("validates pool die arguments before evaluating modifier quantities", () => {
    expect(() => evaluatePool("1d(0)kh(1/0)")).toThrow(
      "Die sides must be a positive integer: 0",
    );
  });

  test("applies dice quantity safety limits inside computed arguments", () => {
    expect(() =>
      evaluatePool("1d6kh(3d4)", {
        rolls: [1],
        limits: { maxQty: 2 },
      }),
    ).toThrow(EvaluationError);
  });

  test.each(["-1", "1.5", "1/0", "9007199254740992"])(
    "rejects a computed quantity that is not a non-negative safe integer: %s",
    (quantity) => {
      expect(() => evaluatePool(`1d6kh(${quantity})`, { rolls: [1] })).toThrow(
        EvaluationError,
      );
    },
  );

  test("resolves a group quantity once before applying it to its members", () => {
    const result = evaluateGroup("{d6,d6}kh(d2)", { rolls: [2, 6, 1] });

    expect(
      result.members.map(({ value, useInTotal }) => [value, useInTotal]),
    ).toEqual([
      [2, false],
      [6, true],
    ]);
    expect(result.modifierArguments).toMatchObject([
      { modifierIndex: 0, result: { type: "paren", value: 1 } },
    ]);
  });

  test("keeps modifier parameter dice outside flattened group candidates", () => {
    const result = evaluateGroup("{2d6+2d6}kh(d4)", {
      rolls: [1, 2, 5, 6, 2],
    });

    expect(poolsOf(result)).toHaveLength(2);
    expect(poolsOf(result).map(rollsOf)).toEqual([
      ["1d", "2d"],
      ["5", "6"],
    ]);
    expect(result.modifierArguments).toMatchObject([
      { modifierIndex: 0, result: { type: "paren", value: 2 } },
    ]);
  });

  test("keeps computed modifier results within nested group boundaries", () => {
    const result = evaluateGroup("{{d6,d6}kh(d2),d6}kh(d2)", {
      rolls: [2, 6, 1, 4, 1],
    });
    const innerResult = result.members[0]?.result;

    expect(
      result.members.map(({ value, useInTotal }) => [value, useInTotal]),
    ).toEqual([
      [6, true],
      [4, false],
    ]);
    expect(result.modifierArguments).toMatchObject([
      { modifierIndex: 0, result: { type: "paren", value: 1 } },
    ]);
    if (innerResult?.type !== "group") {
      throw new Error("Expected a nested group result");
    }
    expect(innerResult.modifierArguments).toMatchObject([
      { modifierIndex: 0, result: { type: "paren", value: 1 } },
    ]);
  });

  test("retains source modifier indexes when handlers execute in another order", () => {
    const result = evaluatePool("4d6dh(d4)kh(d4)", {
      rolls: [1, 6, 3, 4, 2, 1],
    });

    expect(rollsOf(result)).toEqual(["1d", "6d", "3d", "4"]);
    expect(
      result.modifierArguments?.map(({ modifierIndex }) => modifierIndex),
    ).toEqual([1, 0]);
  });

  test("does not resolve a quantity before checking handler applicability", () => {
    const modifiers = new ModifierRegistry().register({
      name: "keep",
      order: 7,
      appliesTo: ["pool"],
      apply(items) {
        return [...items];
      },
    });

    expect(() =>
      evaluateGroup("{d6}kh(1/0)", {
        rolls: [1],
        modifiers,
      }),
    ).toThrow('The "keep" modifier can\'t be used on a group');
  });

  test("passes numeric handler quantities without changing the source AST", () => {
    const received: number[] = [];
    const receivedModifiers: unknown[] = [];
    const handler: ModifierHandlerOf<"keep"> = {
      name: "keep",
      order: 7,
      appliesTo: ["pool", "group"],
      groupHandling: "flatten",
      apply(items, { modifier }) {
        received.push(modifier.qty);
        receivedModifiers.push(modifier);
        return [...items];
      },
    };
    const modifiers = new ModifierRegistry().register(handler);
    const computed = evaluatePool("2d6kh(2)", { modifiers, rolls: [1, 2] });
    const numeric = evaluatePool("2d6kh1", { modifiers, rolls: [1, 2] });
    const [computedModifier] = computed.node.modifiers;
    const [numericModifier] = numeric.node.modifiers;

    expect(received).toEqual([2, 1]);
    if (computedModifier?.name !== "keep" || numericModifier?.name !== "keep") {
      throw new Error("Expected Keep modifiers");
    }
    expect(computedModifier.qty).toMatchObject({ type: "paren" });
    expect(numericModifier.qty).toBe(1);
    expect(receivedModifiers[0]).not.toBe(computedModifier);
    expect(receivedModifiers[1]).toBe(numericModifier);
    expect(numeric).not.toHaveProperty("modifierArguments");
  });
});
