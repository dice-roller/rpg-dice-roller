import { createDie, createNumber, createPool } from "../src/ast/factory.js";
import { NotImplementedError } from "../src/errors/NotImplementedError.js";
import { NotationError } from "../src/errors/NotationError.js";
import { ImportError } from "../src/errors/ImportError.js";
import type { RollMode } from "../src/evaluator/RollContext.js";
import {
  Roll,
  RollHistory,
  RollSettings,
  Roller,
  dice,
  engines,
  errors,
  modifiers,
  presenters,
  roll,
} from "../src/index.js";
import * as index from "../src/index.js";
import type { ExpressionResult, NumberResult } from "../src/results/types.js";
import * as decodeModule from "../src/serialization/decode.js";
import type { RollData } from "../src/serialization/formats.js";

const d6 = createDie("standard", [createNumber(6)]);

const number = (value: number): NumberResult => ({
  type: "number",
  node: createNumber(value),
  value,
});

/** Settings whose (stub) evaluator is replaced: 4 in `min` mode, 24 in `max`, 14 otherwise. */
function fakeSettings() {
  const settings = new RollSettings();
  const evaluate = jest
    .spyOn(settings, "evaluate")
    .mockImplementation((_, mode: RollMode = "random"): ExpressionResult =>
      number({ random: 14, min: 4, max: 24 }[mode]),
    );

  return { settings, evaluate };
}

describe("Roller", () => {
  test("parses notation with its limits", () => {
    const roller = new Roller({ limits: { maxQty: 10 } });

    expect(roller.parse("4d6")).toEqual(createPool(createNumber(4), d6));
    expect(() => roller.parse("11d6")).toThrow(NotationError);
    expect(roller.limits).toEqual({ maxQty: 10, maxIterations: 1000 });
  });

  test("has its own generator, using the engine", () => {
    const engine = engines.MersenneTwister19937.seed(42);
    const roller = new Roller({ engine });

    expect(roller.generator.engine).toBe(engine);
    expect(new Roller().generator).not.toBe(roller.generator);
  });

  test("uses the default registries and presenter", () => {
    const roller = new Roller();

    expect(roller.dice).toBeInstanceOf(dice.DieRegistry);
    expect(roller.modifiers.handlers).toHaveLength(11);
    expect(roller.presenter).toBe(presenters.defaultTextPresenter);
  });

  test("presents with its presenter", () => {
    const roller = new Roller({ presenter: { present: () => 42 } });

    expect(roller.present()).toBe(42);
  });

  test("rolling is wired to the (stub) evaluator", () => {
    const roller = new Roller();

    expect(() => roller.roll("4d6")).toThrow(NotImplementedError);
    expect(() => roll("4d6")).toThrow(NotImplementedError);
    expect(() => new Roll("4d6")).toThrow(NotImplementedError);
    expect(roller.history).toHaveLength(0);
  });

  test("roll() rolls with its settings and adds to the history", () => {
    const roller = new Roller();
    const evaluate = jest
      .spyOn(roller.settings, "evaluate")
      .mockReturnValue(number(14));

    const result = roller.roll("4d6");

    expect(result.total).toBe(14);
    expect(roller.history.rolls).toEqual([result]);
    expect(evaluate).toHaveBeenCalledWith(roller.parse("4d6"));
  });

  test("options are passed on to the settings, including the presenter", () => {
    const engine = engines.MersenneTwister19937.seed(1);
    const presenter = { present: () => 42 };
    const roller = new Roller({ engine, limits: { maxQty: 5 }, presenter });

    expect(roller.settings.generator.engine).toBe(engine);
    expect(roller.settings.limits.maxQty).toBe(5);
    expect(roller.settings.presenter).toBe(presenter);
    expect(roller.presenter).toBe(presenter);
  });
});

describe("RollSettings", () => {
  test("from() keeps settings, resolves options, and shares the defaults", () => {
    const settings = new RollSettings();

    expect(RollSettings.from(settings)).toBe(settings);
    expect(RollSettings.from({ limits: { maxQty: 3 } }).limits.maxQty).toBe(3);
    expect(RollSettings.from()).toBe(RollSettings.from());
    expect(RollSettings.from({})).not.toBe(RollSettings.from());
  });

  test("the presenter defaults to the default TextPresenter", () => {
    const presenter = { present: () => 1 };

    expect(new RollSettings().presenter).toBe(presenters.defaultTextPresenter);
    expect(RollSettings.from().presenter).toBe(presenters.defaultTextPresenter);
    expect(new RollSettings({ presenter }).presenter).toBe(presenter);
  });
});

describe("Roll", () => {
  test("the constructor parses and rolls straight away", () => {
    const { settings, evaluate } = fakeSettings();
    const result = new Roll("4d6", settings);

    expect(result.notation).toBe("4d6");
    expect(result.total).toBe(14);
    expect(evaluate).toHaveBeenCalledWith(settings.parse("4d6"));
  });

  test("an AST input gets its notation from the AST", () => {
    const node = createPool(createNumber(4), createDie("percentile"));

    expect(new Roll(node, fakeSettings().settings).notation).toBe("4d%");
  });

  test("options are validated by the parser", () => {
    expect(() => new Roll("11d6", { limits: { maxQty: 10 } })).toThrow(
      NotationError,
    );
  });

  test("reroll() returns a new roll with the same input and settings", () => {
    const { settings, evaluate } = fakeSettings();
    const first = new Roll("4d6", settings);
    const second = first.reroll();

    expect(second).toBeInstanceOf(Roll);
    expect(second).not.toBe(first);
    expect(second.notation).toBe("4d6");
    expect(evaluate).toHaveBeenCalledTimes(2);
  });

  test("roll() is a shorthand for new Roll()", () => {
    const { settings, evaluate } = fakeSettings();

    expect(roll("2d6", settings)).toBeInstanceOf(Roll);
    expect(evaluate).toHaveBeenCalledTimes(1);
  });

  test("fromJSON() does not roll", () => {
    // the default (stub) evaluator would throw if it was called
    const result = Roll.fromJSON(rollData(5));

    expect(result.notation).toBe("1d6");
    expect(result.total).toBe(5);
    expect(result.minTotal).toBe(1);
  });

  test("import() rejects a history", () => {
    const decode = jest
      .spyOn(decodeModule, "decode")
      .mockReturnValue({ type: "history", version: 1, rolls: [], total: 0 });

    expect(() => Roll.import("{}")).toThrow(ImportError);
    decode.mockRestore();
  });

  test("totals are rounded, and taken from stored data", () => {
    const result = roll1(10 / 3);

    expect(result.total).toBe(3.33);
    expect(result.minTotal).toBe(1);
    expect(result.maxTotal).toBe(6);
    expect(result.averageTotal).toBe(3.5);
    expect(result.expression).toBe(result.result.node);
  });

  test("min / max totals are evaluated once, lazily", () => {
    const { settings, evaluate } = fakeSettings();
    const result = new Roll("4d6", settings);

    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(result.averageTotal).toBe(14);
    expect(result.minTotal).toBe(4);
    expect(result.maxTotal).toBe(24);
    expect(evaluate).toHaveBeenCalledTimes(3);
  });

  test("the first description is found", () => {
    const description = { text: "fire", style: "block" } as const;
    const node = createPool(createNumber(4), d6, [], description);
    const result = Roll.fromJSON({
      ...rollData(1),
      notation: "4d6 [fire]",
      result: { ...number(1), node } as unknown as NumberResult,
    });

    expect(result.description).toEqual(description);
  });
});

describe("RollHistory", () => {
  test("collects rolls", () => {
    const history = new RollHistory();

    history.add(roll1(2), roll1(3.5));

    expect(history).toHaveLength(2);
    expect(history.total).toBe(5.5);
    expect([...history].map(({ total }) => total)).toEqual([2, 3.5]);

    history.clear();

    expect(history.rolls).toEqual([]);
  });
});

test("namespaces are exported", () => {
  expect(modifiers.ModifierRegistry).toBeDefined();
  expect(errors.NotationError).toBe(NotationError);
  expect(dice.percentileDie.notation).toBe("%");
});

test.each([
  "math",
  "serialization",
  "Parser",
  "Evaluator",
  "createRollContext",
  "DEFAULT_ROLL_LIMITS",
  "NumberGenerator",
])("the internal %s is not exported", (name) => {
  expect(index).not.toHaveProperty(name);
});

test.each([
  "resolveDie",
  "rollDie",
  "dieMin",
  "dieMax",
  "dieAverage",
  "faceCount",
  "dieNotation",
])("the internal die helper %s is not exported", (name) => {
  expect(dice).not.toHaveProperty(name);
});

test("NotImplementedError is not exported", () => {
  expect(errors).not.toHaveProperty("NotImplementedError");
});

function rollData(value: number): RollData {
  return {
    type: "roll",
    version: 1,
    notation: "1d6",
    result: number(value),
    total: Math.round(value * 100) / 100,
    minTotal: 1,
    maxTotal: 6,
    averageTotal: 3.5,
  };
}

function roll1(value: number): Roll {
  return Roll.fromJSON(rollData(value));
}
