import { ValidationError } from "../../src/errors/ValidationError.js";
import { Evaluator } from "../../src/evaluator/Evaluator.js";
import { createRollContext } from "../../src/evaluator/RollContext.js";
import {
  snapshotRollInputData,
  type RollInputData,
} from "../../src/evaluator/roll-input-data.js";
import { ModifierRegistry } from "../../src/modifiers/ModifierRegistry.js";
import { Parser } from "../../src/parser/Parser.js";
import { DieRegistry } from "../../src/dice/DieRegistry.js";
import { EngineRegistry } from "../../src/random/EngineRegistry.js";
import { NumberGenerator } from "../../src/random/NumberGenerator.js";

const parser = new Parser();
const evaluator = new Evaluator({
  dice: new DieRegistry(),
  modifiers: new ModifierRegistry(),
});

function evaluate(
  notation: string,
  context: ReturnType<typeof createRollContext> = createRollContext(),
) {
  return evaluator.evaluate(parser.parse(notation), context);
}

function contextWithData(data: unknown) {
  return createRollContext({ data: data as RollInputData });
}

describe("expression references", () => {
  test("resolves nested numbers and converts booleans to zero or one", () => {
    const result = evaluate(
      "$character.attributes.score + $flags.active + $flags.hidden",
      contextWithData({
        character: { attributes: { score: 2.5 } },
        flags: { active: true, hidden: false },
      }),
    );

    expect(result.value).toBe(3.5);
    expect(result.type).toBe("binary");
    if (result.type !== "binary") {
      throw new Error("Expected a binary expression result");
    }
    if (result.left.type === "reference") {
      expect(result.left.node).toEqual({
        type: "reference",
        namespace: "data",
        path: ["character", "attributes", "score"],
      });
      expect(result.left.value).toBe(2.5);
    }
  });

  test("supports references in functions, comparisons, groups, and branches", () => {
    const context = contextWithData({
      score: -3,
      enabled: true,
      bonus: 7,
      fallback: 11,
    });

    expect(evaluate("max($score, 0)", context).value).toBe(0);
    expect(evaluate("$score < 0", context).value).toBe(1);
    expect(evaluate("{$score, $bonus}", context).value).toBe(4);
    expect(evaluate("($enabled) ? ($bonus) : ($fallback)", context).value).toBe(
      7,
    );
  });

  test("resolves references in calculated dice quantities and sides", () => {
    const generator = new NumberGenerator(
      new EngineRegistry().create("mersenne", 7),
    );
    const integer = jest.spyOn(generator, "integer").mockReturnValue(3);
    const context = createRollContext({
      generator,
      data: { quantity: 2, sides: 6, zero: 0 },
    });

    expect(evaluate("($quantity)d($sides)", context)).toMatchObject({
      type: "pool",
      qty: { value: 2 },
      die: { min: 1, max: 6 },
      value: 6,
    });
    expect(evaluate("($zero)d6", context)).toMatchObject({
      type: "pool",
      qty: { value: 0 },
      value: 0,
      rolls: [],
    });
    expect(integer).toHaveBeenCalledTimes(2);
    expect(() => evaluate("1d($zero)", context)).toThrow(ValidationError);
  });

  test("keeps system and data bindings separate and evaluates only selected branches", () => {
    const context = createRollContext({
      data: {
        character: { score: 5 },
        condition: 9,
        data: { condition: 10 },
      },
      system: { character: { score: 3 } },
    });

    expect(evaluate("$$character.score", context).value).toBe(3);
    expect(evaluate("$character.score", context).value).toBe(5);
    expect(evaluate("$condition", context).value).toBe(9);
    expect(evaluate("$data.condition", context).value).toBe(10);
    expect(evaluate("(1) ? ($$condition) : (0)", context).value).toBe(1);
    expect(() => evaluate("$$condition", context)).toThrow("$$condition");
    expect(() => evaluate("$$character.missing", context)).toThrow(
      "$$character.missing",
    );
    expect(evaluate("(1) ? (4) : ($data.missing)", context).value).toBe(4);
    expect(() => evaluate("(0) ? (4) : ($data.missing)", context)).toThrow(
      "$data.missing",
    );
  });

  test("rejects unsafe system bindings without invoking accessors", () => {
    let getterCalled = false;
    const accessorBinding = Object.defineProperty({}, "score", {
      enumerable: true,
      get() {
        getterCalled = true;
        return 3;
      },
    });
    const symbolBinding = {
      [Symbol("score")]: 3,
    } as unknown as Record<string, unknown>;
    const throwingBinding = new Proxy(
      {},
      {
        ownKeys() {
          throw new Error("unavailable bindings");
        },
      },
    );

    expect(() => createRollContext({ system: accessorBinding })).toThrow(
      "System bindings cannot use accessors",
    );
    expect(getterCalled).toBe(false);
    expect(() => createRollContext({ system: symbolBinding })).toThrow(
      "System bindings must use string names",
    );
    expect(() => createRollContext({ system: throwingBinding })).toThrow(
      "System bindings must be a plain object",
    );
    expect(() =>
      createRollContext({ data: null as unknown as RollInputData }),
    ).toThrow("Roll input data must be a plain object");
  });

  test("rejects unsafe nested system references without reading properties", () => {
    const getter = jest.fn(() => 3);
    const accessorBinding = Object.defineProperty({}, "score", {
      enumerable: true,
      get: getter,
    });
    const accessorContext = createRollContext({
      system: { character: accessorBinding },
    });

    expect(() => evaluate("$$character.score", accessorContext)).toThrow(
      "Cannot resolve $$character.score: accessors are not supported",
    );
    expect(getter).not.toHaveBeenCalled();

    const throwingValue = new Proxy(
      {},
      {
        getOwnPropertyDescriptor() {
          throw new Error("unavailable property");
        },
      },
    );
    const throwingContext = createRollContext({
      system: { character: throwingValue },
    });

    expect(() => evaluate("$$character.score", throwingContext)).toThrow(
      "Cannot safely resolve $$character.score",
    );
    expect(() =>
      evaluate("$$score", createRollContext({ system: { score: Number.NaN } })),
    ).toThrow("the reference must identify a number or boolean");
  });

  test("isolates nested condition bindings without changing the parent scope", () => {
    const result = evaluate(
      "(2) ? ((($$condition-1) ? ($$condition+10) : (0))+$$condition) : (0)",
    );

    expect(result.value).toBe(13);
  });

  test.each([
    ["$player.missing", { player: { score: 4 } }],
    ["$Player.score", { player: { score: 4 } }],
    ["$player.score.value", { player: { score: 4 } }],
    ["$player", { player: { score: 4 } }],
    ["$missing", {}],
  ])("reports unresolved reference %s", (notation, data) => {
    const context = createRollContext({
      data,
    });

    expect(() => evaluate(notation, context)).toThrow(ValidationError);
    expect(() => evaluate(notation, context)).toThrow(notation);
  });

  test("does not resolve inherited properties and rejects prototype escape paths", () => {
    const inherited = {};
    Object.setPrototypeOf(inherited, { score: 8 });

    expect(() => evaluate("$score", contextWithData(inherited))).toThrow(
      ValidationError,
    );
    expect(() => evaluate("$constructor", createRollContext())).toThrow(
      "$constructor",
    );
    expect(() => evaluate("$__proto__", createRollContext())).toThrow(
      "reserved path segment",
    );
  });

  test("rejects unsafe data without reading accessors", () => {
    const invalidValues: unknown[] = [
      "text",
      null,
      undefined,
      [],
      () => 1,
      { value: Number.NaN },
      { value: Number.POSITIVE_INFINITY },
      { value: null },
      { value: [1] },
      { value: () => 1 },
      new Date(),
    ];

    for (const value of invalidValues) {
      expect(() => snapshotRollInputData(value)).toThrow(ValidationError);
    }

    let getterCalled = false;
    const withGetter = Object.defineProperty({}, "value", {
      enumerable: true,
      get() {
        getterCalled = true;
        return 1;
      },
    });

    expect(() => snapshotRollInputData(withGetter)).toThrow(ValidationError);
    expect(getterCalled).toBe(false);
  });

  test("rejects cycles and unsafe own property names", () => {
    const circular: Record<string, unknown> = {};
    circular.child = circular;
    const withConstructor = Object.defineProperty({}, "constructor", {
      enumerable: true,
      value: 1,
    });

    expect(() => snapshotRollInputData(circular)).toThrow(ValidationError);
    expect(() => snapshotRollInputData(withConstructor)).toThrow(
      ValidationError,
    );
  });

  test("rejects hidden and symbol data properties and contains proxy traps", () => {
    const nonEnumerable = Object.defineProperty({}, "hidden", { value: 1 });
    const symbolKey = Object.defineProperty({}, Symbol("hidden"), {
      enumerable: true,
      value: 1,
    });
    const throwingKeys = new Proxy(
      {},
      {
        ownKeys() {
          throw new Error("unavailable keys");
        },
      },
    );
    const throwingPrototype = new Proxy(
      {},
      {
        getPrototypeOf() {
          throw new Error("unavailable prototype");
        },
      },
    );

    for (const value of [
      nonEnumerable,
      symbolKey,
      throwingKeys,
      throwingPrototype,
    ]) {
      expect(() => snapshotRollInputData(value)).toThrow(ValidationError);
    }
  });

  test("snapshots nested values so later caller mutations do not affect evaluation", () => {
    const input = { character: { score: 4 } };
    const context = createRollContext({ data: input });
    input.character.score = 12;

    expect(evaluate("$character.score", context).value).toBe(4);
  });
});
