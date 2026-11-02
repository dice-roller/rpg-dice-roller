import {
  dieAverage,
  dieMax,
  dieMin,
  dieNotation,
  dieSnapshot,
  faceCount,
  resolveDie,
  rollDie,
} from "../../src/dice/die-utils.js";
import {
  faceDie,
  fudgeDie,
  percentileDie,
  rangeDie,
  standardDie,
} from "../../src/dice/presets.js";
import type { DieLike } from "../../src/dice/types.js";
import { EvaluationError } from "../../src/errors/EvaluationError.js";
import { ValidationError } from "../../src/errors/ValidationError.js";
import { createRollContext } from "../../src/evaluator/RollContext.js";
import type { RollMode } from "../../src/evaluator/RollContext.js";
import { NumberGenerator } from "../../src/random/NumberGenerator.js";
import { MersenneTwister19937 } from "../../src/random/engines.js";

/** A generator whose `integer()` returns the queued values, in order. */
function queuedGenerator(...values: number[]): NumberGenerator {
  const generator = new NumberGenerator();

  jest
    .spyOn(generator, "integer")
    .mockImplementation(() => values.shift() ?? 0);

  return generator;
}

function ctx(mode: RollMode = "random", generator = new NumberGenerator()) {
  return createRollContext({ mode, generator });
}

describe("die values", () => {
  test.each<[string, DieLike, [string, number, number, number, number]]>([
    ["standardDie(6)", standardDie(6), ["6", 1, 6, 3.5, 6]],
    ["percentileDie", percentileDie, ["%", 1, 100, 50.5, 100]],
    ["fudgeDie(2)", fudgeDie(2), ["F", -1, 1, 0, 3]],
    ["fudgeDie(1)", fudgeDie(1), ["F.1", -1, 1, 0, 6]],
    ["rangeDie(-2, 3)", rangeDie(-2, 3), ["-2..3", -2, 3, 0.5, 6]],
    ["rangeDie(1, 4)", rangeDie(1, 4), ["4", 1, 4, 2.5, 4]],
    ["rangeDie(0, 9)", rangeDie(0, 9), ["0..9", 0, 9, 4.5, 10]],
    [
      "faceDie([1, 1, 2, 3, 5, 8])",
      faceDie([1, 1, 2, 3, 5, 8]),
      ["{1,1,2,3,5,8}", 1, 8, 20 / 6, 6],
    ],
    [
      "faceDie([1, 1, 4]) is weighted",
      faceDie([1, 1, 4]),
      ["{1,1,4}", 1, 4, 2, 3],
    ],
    ["a plain range object", { min: 1, max: 6 }, ["6", 1, 6, 3.5, 6]],
    [
      "a labelled face object",
      { faces: [0, 1], notation: "coin" },
      ["coin", 0, 1, 0.5, 2],
    ],
  ])("%s", (_, die, [notation, min, max, average, faces]) => {
    expect(dieNotation(die)).toBe(notation);
    expect(dieMin(die)).toBe(min);
    expect(dieMax(die)).toBe(max);
    expect(dieAverage(die)).toBeCloseTo(average);
    expect(faceCount(die)).toBe(faces);
  });

  test("the display-only label never uses description brackets", () => {
    expect(dieNotation(faceDie([1, 2]))).not.toMatch(/[[\]]/);
  });

  test("values the die provides are used before the defaults", () => {
    const die: DieLike = {
      faces: [1, 2, 3],
      min: 0,
      max: 10,
      average: 7,
      faceCount: 12,
    };

    expect([dieMin(die), dieMax(die), dieAverage(die), faceCount(die)]).toEqual(
      [0, 10, 7, 12],
    );
  });

  test("getters are called with the die as `this`", () => {
    class Sided {
      readonly min = 1;

      constructor(private readonly sides: number) {}

      max(this: Sided): number {
        return this.sides;
      }

      average(this: Sided): number {
        return this.sides;
      }
    }

    const die = new Sided(8);

    expect(dieMax(die)).toBe(8);
    expect(dieAverage(die)).toBe(8);
    expect(faceCount(die)).toBe(8);
    expect(dieNotation(die)).toBe("8");
  });
});

describe("resolveDie", () => {
  test("resolves every value to a plain number, keeping the source", () => {
    const die = rangeDie(-2, 3);
    const resolved = resolveDie(die);

    expect(dieSnapshot(resolved)).toEqual({
      notation: "-2..3",
      min: -2,
      max: 3,
      average: 0.5,
      faceCount: 6,
    });
    expect(resolved.source).toBe(die);
    expect(typeof resolved.roll).toBe("function");
    expect(Object.isFrozen(resolved)).toBe(true);
  });

  test("the snapshot is JSON-safe", () => {
    const snapshot = dieSnapshot(resolveDie(standardDie(6)));

    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
    expect(snapshot).not.toHaveProperty("roll");
    expect(snapshot).not.toHaveProperty("source");
  });

  test("a custom roll() is bound to the die", () => {
    const die = {
      min: 1,
      max: 6,
      loaded: 6,
      roll(this: { loaded: number }) {
        return this.loaded;
      },
    };

    expect(resolveDie(die).roll(new NumberGenerator())).toBe(6);
  });

  test("a custom roll() allows non-integer bounds", () => {
    expect(resolveDie({ min: 0.5, max: 1.5, roll: () => 1 }).min).toBe(0.5);
  });

  test.each<[string, unknown]>([
    ["null", null],
    ["a number", 6],
    ["no faces", { faces: [] }],
    ["a non-finite face", { faces: [1, Number.NaN] }],
    ["no min / max", {}],
    ["only a min", { min: 1 }],
    ["min greater than max", { min: 6, max: 1 }],
    ["non-integer bounds without a roll()", { min: 1, max: 6.5 }],
    [
      "an infinite max",
      { min: 1, max: Number.POSITIVE_INFINITY, roll: () => 1 },
    ],
    ["a getter returning NaN", { min: 1, max: () => Number.NaN }],
    ["a non-numeric average", { min: 1, max: 6, average: "x" }],
    ["a non-string notation", { min: 1, max: 6, notation: 6 }],
  ])("%s throws a ValidationError", (_, die) => {
    expect(() => resolveDie(die as DieLike)).toThrow(ValidationError);
  });
});

describe("rollDie", () => {
  test("a range die uses generator.integer(min, max)", () => {
    const generator = queuedGenerator(4);
    const integer = jest.spyOn(generator, "integer");

    expect(rollDie(resolveDie(rangeDie(-2, 3)), ctx("random", generator))).toBe(
      4,
    );
    expect(integer).toHaveBeenCalledWith(-2, 3);
  });

  test("a faces die picks a face by index, so repeated faces are weighted", () => {
    const generator = queuedGenerator(0, 1, 5);
    const integer = jest.spyOn(generator, "integer");
    const die = resolveDie(faceDie([1, 1, 2, 3, 5, 8]));

    expect([1, 2, 3].map(() => rollDie(die, ctx("random", generator)))).toEqual(
      [1, 1, 8],
    );
    expect(integer).toHaveBeenCalledWith(0, 5);
  });

  test.each<[RollMode, number]>([
    ["min", -1],
    ["max", 1],
  ])("%s mode returns the extreme, ignoring a custom roll()", (mode, value) => {
    const roll = jest.fn(() => 0);
    const die = resolveDie({ faces: [-1, 0, 1], roll });

    expect(rollDie(die, ctx(mode))).toBe(value);
    expect(roll).not.toHaveBeenCalled();
  });

  test("random mode uses a custom roll() with the context's generator", () => {
    const generator = new NumberGenerator();
    const roll = jest.fn(() => 5);

    expect(
      rollDie(resolveDie({ min: 1, max: 6, roll }), ctx("random", generator)),
    ).toBe(5);
    expect(roll).toHaveBeenCalledWith(generator);
  });

  test("seeded generators roll the same values", () => {
    const rollMany = () => {
      const context = ctx(
        "random",
        new NumberGenerator(MersenneTwister19937.seed(42)),
      );
      const die = resolveDie(standardDie(20));

      return Array.from({ length: 10 }, () => rollDie(die, context));
    };

    const values = rollMany();

    expect(rollMany()).toEqual(values);
    expect(values.every((value) => value >= 1 && value <= 20)).toBe(true);
  });

  test.each([Number.NaN, Number.POSITIVE_INFINITY, "6"])(
    "a custom roll() returning %p throws an EvaluationError",
    (value) => {
      const die = resolveDie({ min: 1, max: 6, roll: () => value as number });

      expect(() => rollDie(die, ctx())).toThrow(EvaluationError);
    },
  );
});
