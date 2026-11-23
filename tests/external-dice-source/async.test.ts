import { Roll, Roller, roll } from "../../src/index.js";
import type { ExplodeNode } from "../../src/ast/nodes.js";
import { ModifierRegistry } from "../../src/modifiers/ModifierRegistry.js";
import { explodeHandler } from "../../src/modifiers/handlers/index.js";
import type { ModifierInput } from "../../src/modifiers/types.js";
import type { ScoredItem } from "../../src/results/types.js";
import { withValue } from "../../src/results/die-result.js";

describe("asynchronous external dice sources", () => {
  test("Roll.create() and roll() return promises for async sources", async () => {
    const callback = jest.fn(async () => {
      await Promise.resolve();
      return 6;
    });
    const options = {
      drawDie: { drawMode: "async" as const, callback },
    };
    const created = Roll.create("d6", options);
    const shorthand = roll("d6", options);

    expect(created).toBeInstanceOf(Promise);
    expect(shorthand).toBeInstanceOf(Promise);
    await expect(created).resolves.toMatchObject({ total: 6 });
    await expect(shorthand).resolves.toMatchObject({ total: 6 });
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test("async rolls with no dice still return promises", async () => {
    const callback = jest.fn(async () => {
      await Promise.resolve();
      return 6;
    });
    const result = Roll.create("4+2", {
      drawDie: { drawMode: "async", callback },
    });

    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toMatchObject({ total: 6 });
    expect(callback).not.toHaveBeenCalled();
  });

  test("callback rejection is preserved as the cause", async () => {
    const cause = new Error("external source failed");
    const result = Roll.create("d6", {
      drawDie: {
        drawMode: "async",
        callback: async () => {
          await Promise.resolve();
          throw cause;
        },
      },
    });

    await expect(result).rejects.toMatchObject({ cause });
  });

  test("reroll() reuses its async external source and stays asynchronous", async () => {
    const callback = jest.fn(async () => {
      await Promise.resolve();
      return 4;
    });
    const original = await Roll.create("d6", {
      drawDie: { drawMode: "async", callback },
    });
    const rerolled = original.reroll();

    expect(rerolled).toBeInstanceOf(Promise);
    await expect(rerolled).resolves.toMatchObject({ total: 4 });
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test("imports stay synchronous and imported rolls reroll asynchronously", async () => {
    const snapshot = new Roll("d6", {
      drawDie: { drawMode: "sync", callback: () => 6 },
    }).export("object");
    const callback = jest.fn(async () => {
      await Promise.resolve();
      return 4;
    });
    const options = { drawDie: { drawMode: "async" as const, callback } };
    const imported = Roll.import(snapshot, options);

    expect(imported).toBeInstanceOf(Roll);
    expect(callback).not.toHaveBeenCalled();
    await expect(imported.reroll()).resolves.toMatchObject({ total: 4 });

    const roller = new Roller(options);
    const [rollerImport] = roller.import(snapshot);

    expect(rollerImport).toBeInstanceOf(Roll);
    expect(callback).toHaveBeenCalledTimes(1);
    await expect(rollerImport.reroll()).resolves.toMatchObject({ total: 4 });
    expect(roller.history.rolls).toEqual([rollerImport]);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test("custom generator modifiers can request a batch from the async driver", async () => {
    const modifiers = new ModifierRegistry().register({
      ...explodeHandler,
      *apply<T extends ScoredItem>(
        items: readonly T[],
        input: ModifierInput<ExplodeNode>,
      ) {
        if (!input.rollBatch) {
          throw new Error("Expected a pool batch draw helper");
        }

        const batch = yield* input.rollBatch(2);

        return batch
          ? items.map((item, index) =>
              index === 0
                ? withValue(
                    item,
                    item.value +
                      batch.reduce((total, die) => total + die.value, 0),
                  )
                : item,
            )
          : [...items];
      },
    });
    const faces = [6, 2, 3];
    const callback = jest.fn(async () => {
      await Promise.resolve();
      return faces.shift() ?? 1;
    });
    const result = await Roll.create("d6!", {
      modifiers,
      drawDie: { drawMode: "async", callback },
    });

    expect(result.total).toBe(11);
    expect(callback).toHaveBeenCalledTimes(3);

    const syncFaces = [6, 2, 3];
    const synchronous = new Roll("d6!", {
      modifiers,
      drawDie: {
        drawMode: "sync",
        callback: () => syncFaces.shift() ?? 1,
      },
    });

    expect(synchronous.total).toBe(11);
  });

  test("simultaneous asynchronous rolls are added to history in completion order", async () => {
    const roller = new Roller();
    const resolvers: ((face: number) => void)[] = [];
    const drawDie = {
      drawMode: "async" as const,
      callback: () =>
        new Promise<number>((resolve) => {
          resolvers.push(resolve);
        }),
    };
    const first = roller.roll("d6", { drawDie });
    const second = roller.roll("d6", { drawDie });

    expect(roller.history.length).toBe(0);
    await Promise.resolve();
    resolvers[1](2);
    const secondRoll = await second;

    expect(roller.history.rolls).toEqual([secondRoll]);
    resolvers[0](1);
    const firstRoll = await first;

    expect(roller.history.rolls).toEqual([secondRoll, firstRoll]);
  });

  test("a pending roll is added to history only after it succeeds", async () => {
    let resolveFace: (face: number) => void = () => undefined;
    const face = new Promise<number>((resolve) => {
      resolveFace = resolve;
    });
    const roller = new Roller();
    const pending = roller.roll("d6", {
      drawDie: { drawMode: "async", callback: () => face },
    });

    expect(pending).toBeInstanceOf(Promise);
    expect(roller.history.length).toBe(0);
    resolveFace(5);

    const result = await pending;

    expect(result.total).toBe(5);
    expect(roller.history.rolls).toEqual([result]);
  });

  test("failed rolls and per-call source overrides do not pollute history", async () => {
    const roller = new Roller({
      drawDie: {
        drawMode: "async",
        callback: async () => {
          await Promise.resolve();
          return 1;
        },
      },
    });
    const overridden = await roller.roll("d6", {
      drawDie: {
        drawMode: "async",
        callback: async () => {
          await Promise.resolve();
          return 5;
        },
      },
    });
    const cause = new Error("source rejected");

    expect(overridden.total).toBe(5);
    await expect(
      roller.roll("d6", {
        drawDie: {
          drawMode: "async",
          callback: async () => {
            await Promise.resolve();
            throw cause;
          },
        },
      }),
    ).rejects.toMatchObject({ cause });

    expect(roller.history.rolls).toEqual([overridden]);
  });

  test("min, max, and average totals do not request external faces", async () => {
    const callback = jest.fn(async () => {
      await Promise.resolve();
      return 4;
    });
    const result = await Roll.create("d6", {
      drawDie: { drawMode: "async", callback },
    });

    expect(result.total).toBe(4);
    expect(result.minTotal).toBe(1);
    expect(result.maxTotal).toBe(6);
    expect(result.averageTotal).toBe(3.5);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("an async Roller default returns a promise", async () => {
    const roller = new Roller({
      drawDie: {
        drawMode: "async",
        callback: async () => {
          await Promise.resolve();
          return 3;
        },
      },
    });
    const result = roller.roll("d6");

    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toMatchObject({ total: 3 });
  });
});
