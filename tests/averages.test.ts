import {
  createDie,
  createNumber,
  createPool,
  createUnary,
} from "../src/ast/factory.js";
import { DieRegistry } from "../src/dice/DieRegistry.js";
import { ValidationError } from "../src/errors/ValidationError.js";
import { averageResult } from "../src/evaluator/average.js";
import { Roll, Roller } from "../src/index.js";
import { RollSettings } from "../src/RollSettings.js";

describe("roll averages", () => {
  test("comparisons substitute averages and mode totals without random draws", () => {
    const settings = new RollSettings();
    const integer = jest
      .spyOn(settings.generator, "integer")
      .mockReturnValue(4);
    const roll = new Roll("(d6)>3", settings);

    expect(roll.total).toBe(1);
    expect(roll.minTotal).toBe(0);
    expect(roll.maxTotal).toBe(1);
    expect(roll.averageTotal).toBe(1);
    expect(integer).toHaveBeenCalledTimes(1);
  });

  test("comparison operands with modifiers use the existing midpoint fallback", () => {
    const settings = new RollSettings();
    const integer = jest
      .spyOn(settings.generator, "integer")
      .mockReturnValue(4);
    const roll = new Roll("(d6kh1)>3", settings);

    expect(averageResult(roll.result)).toBeUndefined();
    expect(roll.averageTotal).toBe((roll.minTotal + roll.maxTotal) / 2);
    expect(integer).toHaveBeenCalledTimes(1);
  });

  test("computed modifier quantities retain existing mode and average policies", () => {
    const settings = new RollSettings();
    const integer = jest
      .spyOn(settings.generator, "integer")
      .mockReturnValue(3);
    const roll = new Roll("3d6kh(d4)", settings);

    expect(roll.total).toBe(9);
    const minTotal = roll.minTotal;
    const maxTotal = roll.maxTotal;

    expect(minTotal).toBeGreaterThanOrEqual(0);
    expect(maxTotal).toBeGreaterThanOrEqual(minTotal);
    expect(roll.averageTotal).toBe((minTotal + maxTotal) / 2);
    expect(integer).toHaveBeenCalledTimes(4);
  });

  test("conditionals nested in comparisons retain the whole-roll fallback", () => {
    const settings = new RollSettings();
    const integer = jest
      .spyOn(settings.generator, "integer")
      .mockReturnValue(4);
    const roll = new Roll("((d6) ? (4) : (0))>3", settings);

    expect(roll.averageTotal).toBe((roll.minTotal + roll.maxTotal) / 2);
    expect(integer).toHaveBeenCalledTimes(1);
  });

  test("conditional mode totals are not bounds or statistical averages", () => {
    const settings = new RollSettings();
    const integer = jest
      .spyOn(settings.generator, "integer")
      .mockReturnValue(3);
    const roll = new Roll("(d6=3) ? (100) : (0)", settings);
    expect(roll.total).toBe(100);
    expect(roll.minTotal).toBe(0);
    expect(roll.maxTotal).toBe(0);
    expect(roll.averageTotal).toBe(0);
    expect(integer).toHaveBeenCalledTimes(1);
  });

  test("averageResult defers conditional results to the whole-roll fallback", () => {
    const settings = new RollSettings();
    const integer = jest
      .spyOn(settings.generator, "integer")
      .mockReturnValue(3);
    const roll = new Roll("(d6=3) ? (100) : (0)", settings);

    expect(averageResult(roll.result)).toBeUndefined();
    expect(integer).toHaveBeenCalledTimes(1);
  });

  test("mode-specific checks bind their own values without drawing", () => {
    const settings = new RollSettings();
    const integer = jest
      .spyOn(settings.generator, "integer")
      .mockReturnValue(3);
    const roll = new Roll("(d6) ? ($$condition*2) : (0)", settings);
    expect(roll.total).toBe(6);
    expect(roll.minTotal).toBe(2);
    expect(roll.maxTotal).toBe(12);
    expect(roll.averageTotal).toBe(7);
    expect(integer).toHaveBeenCalledTimes(1);
  });

  test.each([
    "2d6+((d6) ? ($$condition) : (2))",
    "((d6) ?: (1))d6",
    "1d((d6) ?: (2))",
    "(0) ? (d6) : (2d6)",
  ])("uses a whole-roll mode midpoint for %s", (notation) => {
    const settings = new RollSettings();
    const integer = jest
      .spyOn(settings.generator, "integer")
      .mockReturnValue(2);
    const roll = new Roll(notation, settings);
    const count = integer.mock.calls.length;
    expect(roll.averageTotal).toBe((roll.minTotal + roll.maxTotal) / 2);
    expect(integer).toHaveBeenCalledTimes(count);
  });
  test.each([
    ["standard", "3d6", 10.5],
    ["percentile", "2d%", 101],
    ["default fudge", "4dF", 0],
    ["one non-blank fudge", "4dF.1", 0],
    ["two non-blank fudge", "4dF.2", 0],
    ["integer range", "3d{-2...3}", 1.5],
    ["colon range", "2d{0:9}", 9],
    ["stepped range", "2d{4:3:8}", 11],
    ["descending range", "2d{8:-2:4}", 12],
    ["fractional range", "2d{1.5:4}", 5],
    ["fractional step", "2d{0:0.1:0.3}", 0.3],
    ["uneven faces", "3d{1,2,6}", 9],
    ["weighted faces", "3d{1,1,6}", 8],
    ["negative and fractional faces", "4d{-2,-2,0.5,6}", 2.5],
    ["single face", "3d{5}", 15],
    ["single-value range", "2d{4:4}", 8],
  ])("uses the die average for %s dice", (_, notation, expected) => {
    expect(new Roll(notation).averageTotal).toBeCloseTo(expected, 12);
  });

  test.each([
    ["d{1,1,6}", 8 / 3],
    ["3d{1,1,6}+2d6-1", 14],
    ["-1*(3d{1,1,6}+2)*2", -20],
    ["{3d{1,1,6},2d6}+1", 16],
    ["abs(0-3d{1,1,6})", 8],
    ["min(3d{1,1,6},10)", 8],
    ["2+3*4", 14],
    ["(2+1)d{1,1,6}", 8],
  ])("evaluates %s using unrounded pool averages", (notation, expected) => {
    expect(new Roll(notation).averageTotal).toBeCloseTo(expected, 12);
  });

  test("uses die averages inside a unary AST node", () => {
    const expression = new Roll("3d{1,1,6}").expression;

    expect(new Roll(createUnary(expression)).averageTotal).toBe(-8);
  });

  test.each(["range", "face"] as const)(
    "honours a custom %s die's average override",
    (kind) => {
      const dice = new DieRegistry().register("custom", () => ({
        ...(kind === "range" ? { min: 1, max: 10 } : { faces: [1, 1, 10] }),
        expected: 7,
        average(this: { expected: number }) {
          return this.expected;
        },
      }));
      const node = createPool(createNumber(3), createDie("custom"));

      expect(new Roll(node, { dice }).averageTotal).toBe(21);
    },
  );

  test("reading an average uses the snapshot without drawing more random numbers", () => {
    const roller = new Roller();
    const result = roller.roll("3d{1,1,6}");
    const evaluate = jest.spyOn(roller.settings, "evaluate");
    const integer = jest.spyOn(roller.generator, "integer");
    const factory = jest.spyOn(roller.dice, "create");

    expect(result.averageTotal).toBe(8);
    expect(result.averageTotal).toBe(8);
    expect(evaluate).not.toHaveBeenCalled();
    expect(integer).not.toHaveBeenCalled();
    expect(factory).not.toHaveBeenCalled();
  });

  test("a random sides parameter uses its stored value for the conditional average", () => {
    const settings = new RollSettings();
    const draws = [4, 2, 1, 3];
    const integer = jest
      .spyOn(settings.generator, "integer")
      .mockImplementation(() => draws.shift() ?? 1);
    const roll = new Roll("3d(d6)", settings);

    expect(roll.averageTotal).toBe(7.5);
    expect(roll.averageTotal).toBe(7.5);
    expect(integer).toHaveBeenCalledTimes(4);
  });

  test("mode-based extrema can reject random parameters that become invalid", () => {
    const settings = new RollSettings();
    const integer = jest
      .spyOn(settings.generator, "integer")
      .mockReturnValueOnce(3)
      .mockReturnValueOnce(1);
    const roll = new Roll("1d(d6-1)", settings);

    expect(roll.total).toBe(1);
    expect(() => roll.minTotal).toThrow(ValidationError);
    expect(roll.maxTotal).toBe(5);
    expect(integer).toHaveBeenCalledTimes(2);
  });

  test.each(["object", "json", "base64"] as const)(
    "%s export/import preserves the average without requiring a custom factory",
    (format) => {
      const dice = new DieRegistry().register("custom", () => ({
        faces: [1, 1, 6],
        average: 2,
      }));
      const original = new Roll(
        createPool(createNumber(3), createDie("custom")),
        { dice },
      );
      const restored = Roll.import(original.export(format));

      expect(restored.averageTotal).toBe(6);
      expect(restored.toJSON().averageTotal).toBe(6);
    },
  );

  test.each([
    "2d20k1",
    "d6!",
    "3d{1,1,6}min3",
    "{3d{1,1,6},2d6}kh1",
    "abs(0-(2d20k1+3d{1,1,6}))",
  ])("retains midpoint behaviour for modifiers in %s", (notation) => {
    const result = new Roll(notation);

    expect(result.averageTotal).toBe((result.minTotal + result.maxTotal) / 2);
  });
});
