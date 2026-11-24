import { Roll, Roller, roll } from "../../src/index.js";
import { ValidationError } from "../../src/errors/ValidationError.js";
import { evaluatePool } from "../modifiers/helpers.js";

const syncSource = (face: number) => ({
  drawMode: "sync" as const,
  callback: () => face,
});

describe("synchronous external dice sources", () => {
  test("new Roll() and Roll.create() return fully initialized rolls immediately", () => {
    const callback = jest.fn(() => 6);
    const options = {
      drawDie: { drawMode: "sync" as const, callback },
    };
    const constructed = new Roll("d6", options);
    const created = Roll.create("d6", options);
    const shorthand = roll("d6", options);

    expect(constructed).toBeInstanceOf(Roll);
    expect(created).toBeInstanceOf(Roll);
    expect(shorthand).toBeInstanceOf(Roll);
    expect(constructed.total).toBe(6);
    expect(created.total).toBe(6);
    expect(shorthand.total).toBe(6);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  test("reroll() reuses its synchronous external source", () => {
    const callback = jest.fn(() => 4);
    const original = new Roll("d6", {
      drawDie: { drawMode: "sync", callback },
    });
    const repeated = original.reroll();

    expect(repeated).toBeInstanceOf(Roll);
    expect(repeated.total).toBe(4);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test("new Roll() rejects an asynchronous source and directs callers to the factory", () => {
    const callback = jest.fn(async () => {
      await Promise.resolve();
      return 4;
    });

    expect(
      () =>
        new Roll("d6", {
          drawDie: { drawMode: "async", callback },
        }),
    ).toThrow(ValidationError);
    expect(callback).not.toHaveBeenCalled();
  });

  test("a synchronous Roller remains synchronous with default and per-roll sources", () => {
    const roller = new Roller({ drawDie: syncSource(2) });
    const defaultRoll = roller.roll("d6");
    const override = roller.roll("d6", { drawDie: syncSource(5) });

    expect(defaultRoll).toBeInstanceOf(Roll);
    expect(override).toBeInstanceOf(Roll);
    expect(defaultRoll.total).toBe(2);
    expect(override.total).toBe(5);
    expect(roller.history.rolls).toEqual([defaultRoll, override]);
  });

  test("modifier test helpers accept an external source", () => {
    const faces = [6, 3];
    const result = evaluatePool("d6!", {
      drawDie: { drawMode: "sync", callback: () => faces.shift() ?? 1 },
    });

    expect(result.value).toBe(9);
    expect(result.rolls.map(({ value }) => value)).toEqual([6, 3]);
  });
});
