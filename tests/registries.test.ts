import { createKeep, createMin, createSort } from "../src/ast/factory.js";
import { BUILT_IN_DIE_NAMES } from "../src/ast/nodes.js";
import type { ModifierName } from "../src/ast/nodes.js";
import { DieRegistry } from "../src/dice/DieRegistry.js";
import {
  faceDie,
  fudgeDie,
  percentileDie,
  rangeDie,
  standardDie,
} from "../src/dice/presets.js";
import type { DieFactory } from "../src/dice/types.js";
import { EvaluationError } from "../src/errors/EvaluationError.js";
import { NotImplementedError } from "../src/errors/NotImplementedError.js";
import { ValidationError } from "../src/errors/ValidationError.js";
import { createRollContext } from "../src/evaluator/RollContext.js";
import { ModifierRegistry } from "../src/modifiers/ModifierRegistry.js";
import { keepHandler } from "../src/modifiers/handlers/index.js";
import type { ModifierHandler } from "../src/modifiers/types.js";

describe("DieRegistry", () => {
  const registry = new DieRegistry();

  test("the built-in factories are registered by the names the grammar uses", () => {
    expect(registry.names).toEqual([...BUILT_IN_DIE_NAMES].sort());
  });

  test.each([
    ["standard", [6], standardDie(6)],
    ["standard", [20], standardDie(20)],
    ["percentile", [], percentileDie],
    ["fudge", [], fudgeDie(2)],
    ["fudge", [1], fudgeDie(1)],
    ["fudge", [2], fudgeDie(2)],
    ["range", [-2, 3], rangeDie(-2, 3)],
    ["face", [1, 1, 2], faceDie([1, 1, 2])],
  ])("create(%s, %p)", (name, args, die) => {
    expect(registry.create(name, ...args)).toEqual(die);
    expect(registry.get(name)?.(...args)).toEqual(die);
  });

  test.each(["d6", "%", "F", "x"])("unknown name %s", (name) => {
    expect(registry.get(name)).toBeUndefined();
    expect(registry.has(name)).toBe(false);
    expect(() => registry.create(name)).toThrow(ValidationError);
  });

  test("custom factories are registered by name", () => {
    const fibonacci = () => faceDie([1, 1, 2, 3, 5, 8]);
    const custom = DieRegistry.empty().register("fib", fibonacci);

    expect(custom.get("fib")).toBe(fibonacci);
    expect(custom.create("fib")).toEqual({ faces: [1, 1, 2, 3, 5, 8] });
    expect(custom.names).toEqual(["fib"]);
  });

  test("an empty registry has no factories", () => {
    expect(DieRegistry.empty().names).toEqual([]);
    expect(registry.names).toEqual([...BUILT_IN_DIE_NAMES].sort());
  });

  test("a factory can be removed by name", () => {
    const custom = new DieRegistry();

    expect(custom.remove("standard")).toBe(true);
    expect(custom.has("standard")).toBe(false);
    expect(() => custom.create("standard", 6)).toThrow(ValidationError);
    expect(custom.remove("standard")).toBe(false);
    expect(custom.remove("x")).toBe(false);
    expect(registry.has("standard")).toBe(true);
  });

  test("a built-in factory can be replaced", () => {
    const loaded = { min: 1, max: 6, roll: () => 6 };
    const custom = new DieRegistry().register("standard", () => loaded);

    expect(custom.create("standard", 6)).toBe(loaded);
    expect(registry.create("standard", 6)).toEqual(standardDie(6));
  });

  test.each([
    ["an empty name", "", () => percentileDie],
    ["a factory that isn't a function", "x", percentileDie],
  ])("%s can't be registered", (_, name, factory) => {
    expect(() =>
      new DieRegistry().register(name, factory as unknown as DieFactory),
    ).toThrow(ValidationError);
  });

  test("factories validate their arguments", () => {
    expect(() => registry.create("standard", 0)).toThrow(ValidationError);
    expect(() => registry.create("fudge", 3)).toThrow(ValidationError);
    expect(() => registry.create("range", 3, 1)).toThrow(ValidationError);
    expect(() => registry.create("face")).toThrow(ValidationError);
  });
});

describe("ModifierRegistry", () => {
  const registry = new ModifierRegistry();

  test("the 11 handlers run in the v5 order", () => {
    expect(registry.handlers.map(({ name, order }) => [name, order])).toEqual([
      ["min", 1],
      ["max", 2],
      ["explode", 3],
      ["re-roll", 4],
      ["unique", 5],
      ["keep", 6],
      ["drop", 7],
      ["target", 8],
      ["critical-success", 9],
      ["critical-failure", 10],
      ["sort", 11],
    ]);
  });

  test.each<[ModifierName, string[]]>([
    ["keep", ["pool", "group"]],
    ["drop", ["pool", "group"]],
    ["target", ["pool", "group"]],
    ["sort", ["pool", "group"]],
    ["explode", ["pool"]],
    ["min", ["pool"]],
  ])("%s applies to %p", (name, targets) => {
    expect(registry.getOrThrow(name).appliesTo).toEqual(targets);
  });

  test("modifiers are put into execution order", () => {
    const modifiers = [createSort("a"), createKeep("h", 1), createMin(2)];

    expect(registry.inExecutionOrder(modifiers)).toEqual([
      createMin(2),
      createKeep("h", 1),
      createSort("a"),
    ]);
  });

  test("a handler can be replaced", () => {
    const custom: ModifierHandler = {
      ...keepHandler,
      apply: (items) => [...items],
    };
    const replaced = new ModifierRegistry().register(custom);

    expect(replaced.get("keep")).toBe(custom);
  });

  test("an empty registry has no handlers", () => {
    const empty = ModifierRegistry.empty();

    expect(empty.handlers).toEqual([]);
    expect(() => empty.getOrThrow("keep")).toThrow(EvaluationError);
  });

  test("a handler can be removed by name", () => {
    const custom = new ModifierRegistry();

    expect(custom.remove("keep")).toBe(true);
    expect(custom.has("keep")).toBe(false);
    expect(custom.handlers).toHaveLength(10);
    expect(() => custom.getOrThrow("keep")).toThrow(EvaluationError);
    expect(custom.remove("keep")).toBe(false);
    expect(registry.has("keep")).toBe(true);
  });

  test.each(
    registry.handlers.map((handler) => [handler.name, handler] as const),
  )("%s is a stub", (_, handler) => {
    expect(() =>
      handler.apply([], {
        modifier: createKeep("h", 1),
        ctx: createRollContext(),
      }),
    ).toThrow(NotImplementedError);
  });
});
