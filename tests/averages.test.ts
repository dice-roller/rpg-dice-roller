import {
  createDie,
  createNumber,
  createPool,
  createUnary,
} from "../src/ast/factory.js";
import { DieRegistry } from "../src/dice/DieRegistry.js";
import { Roll, Roller } from "../src/index.js";

describe("roll averages", () => {
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
