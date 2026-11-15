import { die, pool, paren } from "../src/ast/builders.js";
import { DieRegistry } from "../src/dice/DieRegistry.js";
import { Roll } from "../src/Roll.js";
import { RollSettings } from "../src/RollSettings.js";
import { Roller } from "../src/Roller.js";
import type { NumberGenerator } from "../src/random/NumberGenerator.js";
import type { RandomEngine } from "../src/random/RandomEngine.js";

describe("random draw routing", () => {
  test("nested quantity expressions and outer dice share the selected engine", () => {
    const sequence = controlledEngine([-0x8000_0000, -0x8000_0000]);
    const roll = new Roll(pool(paren(pool(1, 4)), 6), {
      engine: sequence.engine,
    });

    expect(roll.total).toBe(1);
    expect(sequence.next).toHaveBeenCalledTimes(2);
  });

  test("quantity and sides rolls precede all outer dice", () => {
    const sequence = controlledEngine([
      d6Word(2),
      d6Word(4),
      d6Word(3),
      d6Word(1),
    ]);
    const roll = new Roll("(d6)d(d6)", { engine: sequence.engine });

    expect(roll.result).toMatchObject({
      type: "pool",
      qty: { value: 2 },
      dieArgs: [{ value: 4 }],
      die: { max: 4 },
      rolls: [{ value: 3 }, { value: 1 }],
    });
    expect(sequence.next).toHaveBeenCalledTimes(4);
  });

  test.each([
    ["1d6!1", [d6Word(6), d6Word(6)], 2],
    ["1d6r", [d6Word(1), d6Word(2)], 2],
    ["2d10u", [d10Word(3), d10Word(3), d10Word(7)], 3],
  ])("%s repeating draws use the selected engine", (notation, draws, count) => {
    const sequence = controlledEngine(draws);

    new Roll(notation, { engine: sequence.engine });

    expect(sequence.next).toHaveBeenCalledTimes(count);
  });

  test("min, max, average, presentation, serialization, and import do not draw", () => {
    const sequence = controlledEngine([-0x8000_0000, -0x8000_0000]);
    const roller = new Roller({ engine: sequence.engine });
    const roll = roller.roll(pool(paren(pool(1, 4)), 6));

    expect(sequence.next).toHaveBeenCalledTimes(2);
    expect(roll.minTotal).toBe(1);
    expect(roll.maxTotal).toBe(24);
    expect(roll.averageTotal).toBeGreaterThanOrEqual(1);
    roll.present();
    roll.toString();
    roll.toJSON();
    roll.export();
    roller.present();
    roller.toString();
    const data = roller.export();

    const importedEngine = controlledEngine([]);
    const imported = Roll.import(
      roll.export(),
      new RollSettings({ engine: importedEngine.engine }),
    );
    const importedRoller = new Roller({ engine: importedEngine.engine });
    importedRoller.import(data);

    expect(imported.total).toBe(roll.total);
    expect(sequence.next).toHaveBeenCalledTimes(2);
    expect(importedEngine.next).not.toHaveBeenCalled();
  });

  test("non-random modes do not call a custom die's roll method or engine", () => {
    const sequence = controlledEngine([-0x8000_0000]);
    const customRoll = jest.fn((generator: NumberGenerator) =>
      generator.integer(1, 6),
    );
    const dice = new DieRegistry().register("custom", () => ({
      min: 1,
      max: 6,
      roll: customRoll,
    }));
    const roll = new Roll(pool(1, die("custom")), {
      dice,
      engine: sequence.engine,
    });

    expect(customRoll).toHaveBeenCalledTimes(1);
    expect(sequence.next).toHaveBeenCalledTimes(1);
    expect(roll.minTotal).toBe(1);
    expect(roll.maxTotal).toBe(6);
    expect(roll.averageTotal).toBe(3.5);
    expect(customRoll).toHaveBeenCalledTimes(1);
    expect(sequence.next).toHaveBeenCalledTimes(1);
  });
});

function controlledEngine(values: number[]): {
  engine: RandomEngine;
  next: jest.Mock<number, []>;
} {
  let index = 0;
  const next = jest.fn(() => values[index++] ?? -0x8000_0000);

  return { engine: { next }, next };
}

function d6Word(value: number): number {
  return -0x8000_0000 + value - 1;
}

function d10Word(value: number): number {
  return -0x8000_0000 + value - 1;
}
