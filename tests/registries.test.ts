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
import {
  builtInModifierHandlers,
  keepHandler,
} from "../src/modifiers/handlers/index.js";
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

  test("registry changes do not affect later built-in factories", () => {
    const loaded = { min: 1, max: 6, roll: () => 6 };
    const changed = new DieRegistry();

    changed.register("standard", () => loaded);
    changed.remove("percentile");
    changed.register("custom", () => percentileDie);

    const later = new DieRegistry();

    expect(changed.create("standard", 6)).toBe(loaded);
    expect(changed.has("percentile")).toBe(false);
    expect(changed.has("custom")).toBe(true);
    expect(later.create("standard", 6)).toEqual(standardDie(6));
    expect(later.has("percentile")).toBe(true);
    expect(later.has("custom")).toBe(false);
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

  test("built-in handlers and their target arrays are frozen", () => {
    expect(Object.isFrozen(builtInModifierHandlers)).toBe(true);

    for (const handler of builtInModifierHandlers) {
      expect(Object.isFrozen(handler)).toBe(true);
      expect(Object.isFrozen(handler.appliesTo)).toBe(true);
    }

    const min = builtInModifierHandlers[0];

    expect(Reflect.set(min, "order", 99)).toBe(false);
    expect(Reflect.set(min.appliesTo, "0", "group")).toBe(false);
    expect(min.order).toBe(1);
    expect(min.appliesTo).toEqual(["pool"]);
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

  test("custom handlers and their target arrays remain mutable", () => {
    const custom: ModifierHandler = {
      ...keepHandler,
      appliesTo: [...keepHandler.appliesTo],
      apply: (items) => [...items],
    };
    const registry = new ModifierRegistry().register(custom);

    expect(registry.get("keep")).toBe(custom);
    expect(Object.isFrozen(custom)).toBe(false);
    expect(Object.isFrozen(custom.appliesTo)).toBe(false);
    expect(Reflect.set(custom, "order", 20)).toBe(true);
    expect(Reflect.set(custom.appliesTo, "0", "group")).toBe(true);
    expect(custom.appliesTo[0]).toBe("group");
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

  test("registry changes do not affect later built-in handlers", () => {
    const custom: ModifierHandler = {
      ...keepHandler,
      appliesTo: [...keepHandler.appliesTo],
      apply: (items) => [...items],
    };
    const changed = new ModifierRegistry().register(custom);

    changed.remove("min");

    const later = new ModifierRegistry();

    expect(changed.get("keep")).toBe(custom);
    expect(changed.has("min")).toBe(false);
    expect(later.get("keep")).toBe(keepHandler);
    expect(later.has("min")).toBe(true);
  });

  test.each<[ModifierName, string | undefined]>([
    ["keep", "flatten"],
    ["drop", "flatten"],
    ["sort", "each-pool"],
    ["target", undefined],
    ["explode", undefined],
  ])("%s treats group dice as %p", (name, groupHandling) => {
    expect(registry.getOrThrow(name).groupHandling).toBe(groupHandling);
  });

  test.each(
    registry.handlers.map((handler) => [handler.name, handler] as const),
  )("%s is implemented", (_, handler) => {
    expect(() =>
      handler.apply([], {
        modifier: createKeep("h", 1),
        ctx: createRollContext(),
      }),
    ).not.toThrow(NotImplementedError);
  });
});
