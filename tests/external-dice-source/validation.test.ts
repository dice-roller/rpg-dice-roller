import { DieRegistry } from "../../src/dice/DieRegistry.js";
import { die, pool } from "../../src/ast/builders.js";
import { EvaluationError } from "../../src/errors/EvaluationError.js";
import { ValidationError } from "../../src/errors/ValidationError.js";
import type { DrawDieOptions } from "../../src/evaluator/DrawDieRequest.js";
import { Roll, RollSettings } from "../../src/index.js";

describe("external dice source validation", () => {
  test.each<[string, unknown]>([
    ["non-numeric", "six"],
    ["NaN", Number.NaN],
    ["infinity", Number.POSITIVE_INFINITY],
    ["below the die range", 0],
    ["above the die range", 7],
    ["fractional for an integer die", 3.5],
  ])("rejects a face that is %s", (_, face) => {
    const callback = jest.fn(() => face as number);

    expect(
      () =>
        new Roll("d6", {
          drawDie: { drawMode: "sync", callback },
        }),
    ).toThrow(EvaluationError);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("rejects a face that is not in a custom die's face list", () => {
    const callback = jest.fn(() => 4);

    expect(
      () =>
        new Roll("d{1,2,3}", {
          drawDie: { drawMode: "sync", callback },
        }),
    ).toThrow(EvaluationError);
  });

  test("surfaces callback failures with the original cause and die context", () => {
    const cause = new Error("external source failed");
    let error: unknown;

    try {
      new Roll("d6", {
        drawDie: {
          drawMode: "sync",
          callback: () => {
            throw cause;
          },
        },
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(EvaluationError);

    if (!(error instanceof EvaluationError)) {
      throw new Error("Expected an EvaluationError");
    }

    expect(error.cause).toBe(cause);
    expect(error.message).toContain('die "6"');
  });

  test("a Promise from a sync callback fails without falling back to the RNG", () => {
    const next = jest.fn(() => -0x8000_0000);
    const callback = jest.fn(() => Promise.resolve(6) as unknown as number);

    expect(
      () =>
        new Roll("d6", {
          engine: { next },
          drawDie: { drawMode: "sync", callback },
        }),
    ).toThrow(/Promise in sync mode/);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  test.each([
    [{}, /drawDie\.drawMode/],
    [{ drawMode: "sync" }, /drawDie\.callback/],
    [{ drawMode: "invalid", callback: () => 1 }, /drawDie\.drawMode/],
    [null, /drawDie option must be an object/],
  ])("rejects malformed drawDie configuration %p", (drawDie, message) => {
    expect(
      () =>
        new RollSettings({
          drawDie: drawDie as never,
        }),
    ).toThrow(ValidationError);
    expect(
      () =>
        new RollSettings({
          drawDie: drawDie as never,
        }),
    ).toThrow(message);
  });

  test("async invalid faces reject and concurrent rolls remain isolated", async () => {
    const invalid: DrawDieOptions = {
      drawMode: "async",
      callback: () => Promise.resolve(7),
    };
    const valid: DrawDieOptions = {
      drawMode: "async",
      callback: () => Promise.resolve(5),
    };
    const [rejected, fulfilled] = await Promise.allSettled([
      Roll.create("d6", { drawDie: invalid }),
      Roll.create("d6", { drawDie: valid }),
    ]);

    expect(rejected.status).toBe("rejected");
    if (rejected.status === "rejected") {
      expect(rejected.reason).toBeInstanceOf(EvaluationError);
    }
    expect(fulfilled).toMatchObject({
      status: "fulfilled",
      value: { total: 5 },
    });

    const later = await Roll.create("d6", { drawDie: valid });
    expect(later.total).toBe(5);
  });

  test("custom die sources validate against the resolved die definition", () => {
    const dice = new DieRegistry().register("decimal", () => ({
      min: 0.5,
      max: 1.5,
      roll: () => 1,
    }));
    const roll = Roll.create(pool(1, die("decimal")), {
      dice,
      drawDie: { drawMode: "sync", callback: () => 1.25 },
    });

    expect(roll.total).toBe(1.25);
  });
});
