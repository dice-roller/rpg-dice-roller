import { Roll } from "../src/Roll.js";
import { RollSettings } from "../src/RollSettings.js";
import { Roller } from "../src/Roller.js";
import { roll } from "../src/index.js";
import type { RandomEngine } from "../src/random/RandomEngine.js";

describe("roll data options", () => {
  test("settings data is a default for direct evaluation and rolls", () => {
    const input = { character: { score: 4 } };
    const settings = new RollSettings({ data: input });
    input.character.score = 12;

    expect(settings.evaluate(settings.parse("$character.score")).value).toBe(4);
    expect(new Roll("$character.score", settings).total).toBe(4);
    expect(settings.evaluate(settings.parse("1")).value).toBe(1);
  });

  test("standalone roll and roll helper accept data options", () => {
    expect(new Roll("$score", { data: { score: 3 } }).total).toBe(3);
    expect(roll("$score", { data: { score: 5 } }).total).toBe(5);
  });

  test("reports no description when nested expressions have none", () => {
    const result = new Roll("$score+1", { data: { score: 2 } });

    expect(result.total).toBe(3);
    expect(result.description).toBeUndefined();
  });

  test("per-roll data replaces defaults, with empty and undefined behavior", () => {
    const roller = new Roller({ data: { score: 2, bonus: 3 } });

    expect(roller.roll("$score").total).toBe(2);
    expect(roller.roll("$score", { data: { score: 9 } }).total).toBe(9);
    expect(roller.roll("$score", { data: undefined }).total).toBe(2);
    expect(() => roller.roll("$bonus", { data: { score: 9 } })).toThrow(
      "$bonus",
    );
    expect(() => roller.roll("$score", { data: {} })).toThrow("$score");
    expect(roller.history).toHaveLength(3);
  });

  test("roll snapshots data and rerolls reuse or replace that snapshot", () => {
    const input = { character: { score: 4 } };
    const roller = new Roller({ data: { character: { score: 1 } } });
    const first = roller.roll("$character.score", { data: input });
    input.character.score = 12;

    expect(first.total).toBe(4);
    expect(first.reroll().total).toBe(4);
    expect(first.minTotal).toBe(4);
    expect(first.maxTotal).toBe(4);
    expect(first.reroll({ data: undefined }).total).toBe(4);
    expect(first.reroll({ data: { character: { score: 8 } } }).total).toBe(8);
    expect(roller.history).toHaveLength(1);
  });

  test("lazy extrema use the snapshot and report missing data in a newly selected branch", () => {
    const { engine } = sequenceEngine([-0x8000_0000]);
    const result = new Roll("(1d6=1) ? ($low) : ($high)", {
      engine,
      data: { low: 3 },
    });

    expect(result.total).toBe(3);
    expect(result.minTotal).toBe(3);
    expect(() => result.maxTotal).toThrow("$high");
  });

  test("engine derivation retains defaults and engine/data overrides combine", () => {
    const settings = new RollSettings({ data: { score: 6 } });
    const derived = RollSettings.withEngine(settings, "mersenne");
    expect(new Roll("$score", derived).total).toBe(6);

    const engine = sequenceEngine([-0x8000_0000]);
    const roller = new Roller({ data: { bonus: 1 } });
    const overridden = roller.roll("d6 + $bonus", {
      engine: engine.engine,
      data: { bonus: 3 },
    });

    expect(overridden.total).toBe(4);
    expect(engine.next).toHaveBeenCalledTimes(1);
    expect(roller.roll("$bonus").total).toBe(1);
  });
});

function sequenceEngine(values: number[]): {
  engine: RandomEngine;
  next: jest.Mock<number, []>;
} {
  let index = 0;
  const next = jest.fn(() => values[index++] ?? -0x8000_0000);

  return { engine: { next }, next };
}
