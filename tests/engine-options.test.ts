import { EngineRegistry } from "../src/random/EngineRegistry.js";
import { Roll } from "../src/Roll.js";
import { RollSettings } from "../src/RollSettings.js";
import { Roller } from "../src/Roller.js";
import { ValidationError } from "../src/errors/ValidationError.js";
import type { RandomEngine } from "../src/random/RandomEngine.js";

describe("engine options", () => {
  test("resolves names and seeded definitions once", () => {
    const registry = EngineRegistry.empty();
    const engine: RandomEngine = { next: () => -0x8000_0000 };
    const factory = jest.fn(() => engine);
    registry.register("custom", factory);

    const settings = new RollSettings({
      engine: { name: "custom", seed: 17 },
      engines: registry,
    });

    expect(factory).toHaveBeenCalledTimes(1);
    expect(factory).toHaveBeenCalledWith(17);
    expect(settings.generator.engine).toBe(engine);
    expect(settings.engines).toBe(registry);
  });

  test("uses an engine instance before interpreting its name or seed fields", () => {
    const sequence = sequenceEngine([-0x8000_0000]);
    const engine = Object.assign(sequence.engine, {
      name: "not-registered",
      seed: 42,
    });
    const settings = new RollSettings({ engine });

    expect(settings.generator.engine).toBe(engine);
    expect(new Roll("d6", settings).total).toBe(1);
    expect(sequence.next).toHaveBeenCalledTimes(1);
  });

  test("rejects malformed options and invalid registries", () => {
    expect(() => new RollSettings({ engine: {} as never })).toThrow(
      ValidationError,
    );
    expect(() => new RollSettings({ engine: 42 as never })).toThrow(
      ValidationError,
    );
    expect(
      () => new RollSettings({ engine: { name: "mersenne", seed: 1.5 } }),
    ).toThrow(/signed 32-bit integer/);
    expect(() => new RollSettings({ engines: {} as EngineRegistry })).toThrow(
      /must be an EngineRegistry/,
    );
  });

  test("derived settings retain the existing configuration and registry", () => {
    const presenter = { present: () => "custom" };
    const settings = new RollSettings({
      limits: { maxQty: 4 },
      presenter,
    });
    const derived = RollSettings.withEngine(settings, "mersenne");

    expect(derived.generator.engine).not.toBe(settings.generator.engine);
    expect(derived.engines).toBe(settings.engines);
    expect(derived.dice).toBe(settings.dice);
    expect(derived.modifiers).toBe(settings.modifiers);
    expect(derived.limits).toEqual(settings.limits);
    expect(derived.presenter).toBe(presenter);
  });
});

describe("per-roll engine overrides", () => {
  test("ordinary rolls and rerolls continue the selected instance", () => {
    const queued = sequenceEngine([-0x8000_0000, 0, -0x8000_0000]);
    const roller = new Roller({ engine: queued.engine });

    const first = roller.roll("d6");
    const second = first.reroll();
    const third = roller.roll("d6");

    expect([first.total, second.total, third.total]).toEqual([1, 3, 1]);
    expect(queued.next).toHaveBeenCalledTimes(3);
  });

  test("Roller.roll and Roll.reroll overrides restart and retain actual settings", () => {
    const definition = { name: "mersenne", seed: 42 };
    const baseline = new Roll("d20", { engine: definition });
    const baselineReroll = baseline.reroll();
    const roller = new Roller();

    const firstOverride = roller.roll("d20", { engine: definition });
    const repeatedOverride = roller.roll("d20", { engine: definition });

    expect(repeatedOverride.total).toBe(firstOverride.total);
    expect(firstOverride.reroll().total).toBe(baselineReroll.total);

    const standalone = new Roll("d20");
    const rerolledWithOverride = standalone.reroll({ engine: definition });

    expect(rerolledWithOverride.total).toBe(baseline.total);
    expect(rerolledWithOverride.reroll().total).toBe(baselineReroll.total);
  });

  test("an override does not advance the roller's own sequence", () => {
    const parentSequence = sequenceEngine([-0x8000_0000]);
    const referenceSequence = sequenceEngine([-0x8000_0000]);
    const roller = new Roller({ engine: parentSequence.engine });
    const reference = new Roller({ engine: referenceSequence.engine });

    roller.roll("d6", { engine: { name: "mersenne", seed: 7 } });

    expect(parentSequence.next).not.toHaveBeenCalled();
    expect(roller.roll("d6").total).toBe(reference.roll("d6").total);
    expect(parentSequence.next).toHaveBeenCalledTimes(1);
  });

  test("a failed overridden roll may consume draws but is not added to history", () => {
    const sequence = sequenceEngine([-0x8000_0000]);
    const roller = new Roller();

    expect(() =>
      roller.roll("d6 + sqrt(-4)", { engine: sequence.engine }),
    ).toThrow();
    expect(sequence.next).toHaveBeenCalled();
    expect(roller.history).toHaveLength(0);
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
