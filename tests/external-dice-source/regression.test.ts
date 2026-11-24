import { binary, die, group, keep, pool } from "../../src/ast/builders.js";
import type { ExplodeNode } from "../../src/ast/nodes.js";
import { DieRegistry } from "../../src/dice/DieRegistry.js";
import { Roll, Roller } from "../../src/index.js";
import type { ConciseRollData } from "../../src/index.js";
import type { DrawDieRequest } from "../../src/evaluator/DrawDieRequest.js";
import { ModifierRegistry } from "../../src/modifiers/ModifierRegistry.js";
import {
  explodeHandler,
  keepHandler,
} from "../../src/modifiers/handlers/index.js";
import type { ModifierInput } from "../../src/modifiers/types.js";
import type { ScoredItem } from "../../src/results/types.js";
import { withValue } from "../../src/results/die-result.js";
import { toRollData } from "../../src/serialization/encode.js";

describe("external dice source regressions", () => {
  test("custom dice receive the registered factory identity and resolved bounds", () => {
    const dice = new DieRegistry().register("custom", () => ({
      min: 1,
      max: 10,
    }));
    const requests: DrawDieRequest[] = [];
    const result = new Roll(pool(2, die("custom")), {
      dice,
      drawDie: {
        drawMode: "sync",
        callback: (request) => {
          requests.push(request);
          return 7;
        },
      },
    });

    expect(result.total).toBe(14);
    expect(requests).toHaveLength(2);
    for (const request of requests) {
      expect(request).toMatchObject({
        min: 1,
        max: 10,
        factoryName: "custom",
      });
    }
  });

  test("group keep scoring and nested pool order remain intact", () => {
    const faces = [2, 5];
    const input = group([pool(1, 6), pool(1, 6)], {
      modifiers: [keep("h", 1)],
    });
    const result = new Roll(input, {
      drawDie: { drawMode: "sync", callback: () => faces.shift() ?? 1 },
    });

    expect(result.total).toBe(5);
    expect(result.result.type).toBe("group");
  });

  test("custom scoring handlers and custom generator handlers use the shared path", () => {
    const scoringModifiers = new ModifierRegistry().register({
      ...keepHandler,
      apply<T extends ScoredItem>(items: readonly T[]) {
        return items.map((item) => withValue(item, item.value + 1));
      },
    });
    const scored = new Roll("2d6kh1", {
      modifiers: scoringModifiers,
      drawDie: { drawMode: "sync", callback: () => 4 },
    });

    expect(scored.total).toBe(10);

    const generatorModifiers = new ModifierRegistry().register({
      ...explodeHandler,
      *apply<T extends ScoredItem>(
        items: readonly T[],
        input: ModifierInput<ExplodeNode>,
      ) {
        if (!input.rollDie) {
          throw new Error("Expected a pool die draw helper");
        }

        const extra = yield* input.rollDie();

        return extra
          ? items.map((item, index) =>
              index === 0 ? withValue(item, item.value + extra.value) : item,
            )
          : [...items];
      },
    });
    const faces = [6, 2];
    const generated = new Roll("d6!", {
      modifiers: generatorModifiers,
      drawDie: { drawMode: "sync", callback: () => faces.shift() ?? 1 },
    });

    expect(generated.total).toBe(8);
  });

  test("result pools preserve their source AST identity", () => {
    const input = binary("+", pool(1, 6), pool(1, 8));
    const result = new Roll(input, {
      drawDie: { drawMode: "sync", callback: () => 3 },
    });

    expect(result.result.node).toBe(input);
    if (result.result.type !== "binary") {
      throw new Error("Expected a binary result");
    }
    expect(result.result.left.node).toBe(input.left);
    expect(result.result.right.node).toBe(input.right);
  });

  test("snapshot, concise, and history restoration never call the external source", async () => {
    const source = jest.fn(() => 4);
    const original = new Roll("2d6", {
      drawDie: { drawMode: "sync", callback: source },
    });
    const restoredSource = jest.fn(() => 1);
    const options = {
      drawDie: { drawMode: "sync" as const, callback: restoredSource },
    };
    const snapshot = Roll.import(original.export("object"), options);
    const conciseData: ConciseRollData = {
      notation: "2d6",
      rolls: [[4, 4]],
    };
    const concise = Roll.import(conciseData, options);
    const asyncRestoreSource = jest.fn(() => Promise.resolve(1));
    const asyncSnapshot = await Roll.create(toRollData(original), {
      drawDie: { drawMode: "async", callback: asyncRestoreSource },
    });
    const asyncConcise = await Roll.create(conciseData, {
      drawDie: { drawMode: "async", callback: asyncRestoreSource },
    });
    const roller = new Roller({
      drawDie: { drawMode: "sync", callback: source },
    });
    roller.roll("d6");
    const restoredHistory = new Roller(options);
    restoredHistory.import(roller.export("object"));

    expect(snapshot.total).toBe(original.total);
    expect(concise.total).toBe(original.total);
    expect(asyncSnapshot.total).toBe(original.total);
    expect(asyncConcise.total).toBe(8);
    expect(restoredHistory.history.total).toBe(4);
    expect(source).toHaveBeenCalledTimes(3);
    expect(restoredSource).not.toHaveBeenCalled();
    expect(asyncRestoreSource).not.toHaveBeenCalled();
  });

  test("synchronous and asynchronous drivers request dice in the same order", async () => {
    const faces = [6, 6, 6, 6, 3, 3, 3, 3, 1, 2, 3, 4];
    const syncRequests: DrawDieRequest[] = [];
    const asyncRequests: DrawDieRequest[] = [];
    const sync = new Roll("4d6!m", {
      drawDie: {
        drawMode: "sync",
        callback: (request) => {
          syncRequests.push(request);
          return faces.shift() ?? 1;
        },
      },
    });
    const asyncFaces = [6, 6, 6, 6, 3, 3, 3, 3, 1, 2, 3, 4];
    const asynchronous = await Roll.create("4d6!m", {
      drawDie: {
        drawMode: "async",
        callback: async (request) => {
          asyncRequests.push(request);
          await Promise.resolve();
          return asyncFaces.shift() ?? 1;
        },
      },
    });

    expect(asynchronous.total).toBe(sync.total);
    expect(asyncRequests).toEqual(syncRequests);
  });

  test("default seeded results remain deterministic without an external source", () => {
    const seededRoll = () =>
      new Roll("4d6+2", { engine: { name: "mersenne", seed: 42 } });

    expect(seededRoll().result).toEqual(seededRoll().result);
  });
});
