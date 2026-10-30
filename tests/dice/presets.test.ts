import {
  faceDie,
  fudgeDie,
  percentileDie,
  rangeDie,
  standardDie,
} from "../../src/dice/presets.js";
import { ValidationError } from "../../src/errors/ValidationError.js";

describe("rangeDie", () => {
  test.each([
    [-2, 3],
    [0, 9],
    [-5, -1],
    [4, 4],
  ])("rangeDie(%d, %d)", (min, max) => {
    expect(rangeDie(min, max)).toEqual({ min, max });
  });

  test("a notation label can be set", () => {
    expect(rangeDie(0, 9, { notation: "10z" })).toEqual({
      min: 0,
      max: 9,
      notation: "10z",
    });
  });

  test.each([
    [3, 2],
    [1.5, 6],
    [1, 6.5],
    [Number.NaN, 6],
    [1, Number.POSITIVE_INFINITY],
  ])("rangeDie(%d, %d) throws a ValidationError", (min, max) => {
    expect(() => rangeDie(min, max)).toThrow(ValidationError);
  });
});

describe("faceDie", () => {
  test("faceDie([1, 1, 2, 3, 5, 8])", () => {
    expect(faceDie([1, 1, 2, 3, 5, 8])).toEqual({ faces: [1, 1, 2, 3, 5, 8] });
  });

  test("a notation label can be set", () => {
    expect(faceDie([0, 1], { notation: "coin" })).toEqual({
      faces: [0, 1],
      notation: "coin",
    });
  });

  test("the faces are copied and frozen", () => {
    const faces = [1, 2, 3];
    const die = faceDie(faces);

    faces.push(4);

    expect(die.faces).toEqual([1, 2, 3]);
    expect(Object.isFrozen(die.faces)).toBe(true);
  });

  test.each([
    ["no faces", []],
    ["a non-finite face", [1, Number.NaN]],
    ["an infinite face", [1, Number.POSITIVE_INFINITY]],
  ])("%s throws a ValidationError", (_, faces) => {
    expect(() => faceDie(faces)).toThrow(ValidationError);
  });
});

describe("built-in presets", () => {
  test.each([
    ["standardDie(6)", standardDie(6), { min: 1, max: 6, notation: "6" }],
    ["percentileDie", percentileDie, { min: 1, max: 100, notation: "%" }],
    ["fudgeDie(2)", fudgeDie(2), { faces: [-1, 0, 1], notation: "F" }],
    ["fudgeDie()", fudgeDie(), { faces: [-1, 0, 1], notation: "F" }],
    [
      "fudgeDie(1)",
      fudgeDie(1),
      { faces: [-1, 0, 0, 0, 0, 1], notation: "F.1" },
    ],
  ])("%s", (_, die, expected) => {
    expect(die).toEqual(expected);
  });

  test.each([
    standardDie(6),
    percentileDie,
    fudgeDie(1),
    rangeDie(-2, 3),
    faceDie([1, 2]),
  ])("%o is frozen", (die) => {
    expect(Object.isFrozen(die)).toBe(true);
  });

  test("fudge dice are shared instances", () => {
    expect(fudgeDie(1)).toBe(fudgeDie(1));
    expect(fudgeDie()).toBe(fudgeDie(2));
  });

  test.each([0, -1, 1.5])(
    "standardDie(%d) throws a ValidationError",
    (sides) => {
      expect(() => standardDie(sides)).toThrow(ValidationError);
    },
  );

  test("fudgeDie(3) throws a ValidationError", () => {
    expect(() => fudgeDie(3 as 1)).toThrow(ValidationError);
  });
});
