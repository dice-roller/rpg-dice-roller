/**
 * Default dice behaviour.
 *
 * Every function accepts any `DieLike`. Values or functions the die provides itself are used first;
 * otherwise the defaults are derived from `min` / `max` or `faces`.
 */
import { EvaluationError } from "../errors/EvaluationError.js";
import { ValidationError } from "../errors/ValidationError.js";
import type { RollContext } from "../evaluator/RollContext.js";
import type { NumberGenerator } from "../random/NumberGenerator.js";
import type {
  DieLike,
  DieSnapshot,
  FacesDieDefinition,
  NumberOrGetter,
  RangeDieDefinition,
  ResolvedDie,
} from "./types.js";

/** Whether the die is defined by a list of faces. */
export function isFacesDie(die: DieLike): die is DieLike & FacesDieDefinition {
  return "faces" in die && Array.isArray(die.faces);
}

/** Whether the die is defined by a `min` / `max` range. */
export function isRangeDie(die: DieLike): die is DieLike & RangeDieDefinition {
  return !isFacesDie(die);
}

/** Resolves a `NumberOrGetter`, calling functions with the die as `this`. */
export function resolveNumber(value: NumberOrGetter, die: DieLike): number {
  return typeof value === "function" ? value.call(die) : value;
}

/**
 * The display label used after the `d`, e.g. `6`, `%`, `F` or `F.1`.
 *
 * Uses the die's `notation` if set; otherwise a range die from 1 to a number uses that number
 * (`{ min: 1, max: 6 }` -> `6`).
 *
 * Other dice get a display-only label, e.g. `-2..3` for `rangeDie(-2, 3)` and `{1,1,2,3,5,8}` for a
 * face die. It doesn't parse back, and avoids `[...]`, which is the description syntax.
 */
export function dieNotation(die: DieLike): string {
  if (die.notation !== undefined) {
    return die.notation;
  }

  if (isFacesDie(die)) {
    return `{${die.faces.join(",")}}`;
  }

  const min = dieMin(die);
  const max = dieMax(die);

  return min === 1 ? String(max) : `${min}..${max}`;
}

/** The lowest value the die can roll. */
export function dieMin(die: DieLike): number {
  if (die.min !== undefined) {
    return resolveNumber(die.min, die);
  }

  return isFacesDie(die) ? Math.min(...die.faces) : Number.NaN;
}

/** The highest value the die can roll. */
export function dieMax(die: DieLike): number {
  if (die.max !== undefined) {
    return resolveNumber(die.max, die);
  }

  return isFacesDie(die) ? Math.max(...die.faces) : Number.NaN;
}

/**
 * The average value of a single roll.
 *
 * Repeated faces act as weights, so `{ faces: [1, 1, 4] }` averages 2.
 */
export function dieAverage(die: DieLike): number {
  if (die.average !== undefined) {
    return resolveNumber(die.average, die);
  }

  if (isFacesDie(die)) {
    return die.faces.reduce((sum, face) => sum + face, 0) / die.faces.length;
  }

  return (dieMin(die) + dieMax(die)) / 2;
}

/** The number of faces on the die (including repeated faces). */
export function faceCount(die: DieLike): number {
  if (die.faceCount !== undefined) {
    return resolveNumber(die.faceCount, die);
  }

  if (isFacesDie(die)) {
    return die.faces.length;
  }

  return dieMax(die) - dieMin(die) + 1;
}

/**
 * Normalises any `DieLike` into a `ResolvedDie` with plain numbers and a `roll()`.
 *
 * The die's own values / functions are used when present, otherwise the helpers above.
 *
 * @throws {ValidationError} the die isn't valid, e.g. it has no faces, `min` is greater than `max`,
 *   or a range die without its own `roll()` has bounds that aren't safe integers
 */
export function resolveDie(die: DieLike): ResolvedDie {
  validateDefinition(die);

  const resolved: DieSnapshot = {
    notation: dieNotation(die),
    min: dieMin(die),
    max: dieMax(die),
    average: dieAverage(die),
    faceCount: faceCount(die),
  };

  validateResolved(die, resolved);

  return Object.freeze({
    ...resolved,
    roll: rollFunction(die, resolved),
    source: die,
  });
}

/** The JSON-safe values of a resolved die, without its `roll()` and `source`. */
export function dieSnapshot(die: DieSnapshot): DieSnapshot {
  const { notation, min, max, average, faceCount } = die;

  return { notation, min, max, average, faceCount };
}

/**
 * Rolls the die once.
 *
 * - `max` / `min` mode: returns `die.max` / `die.min`, ignoring a custom `roll()`.
 * - `random` mode: uses `die.roll()` (the die's own, or the default: a range die uses
 *   `generator.integer(min, max)`, a faces die uses `faces[generator.integer(0, n - 1)]`).
 *
 * @throws {EvaluationError} a custom `roll()` doesn't return a finite number
 */
export function rollDie(die: ResolvedDie, ctx: RollContext): number {
  switch (ctx.mode) {
    case "max":
      return die.max;
    case "min":
      return die.min;
    default: {
      const value = die.roll(ctx.generator);

      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new EvaluationError(
          `Die "${die.notation}" rolled a value that isn't a finite number: ${String(value)}`,
        );
      }

      return value;
    }
  }
}

function rollFunction(
  die: DieLike,
  { min, max }: DieSnapshot,
): (generator: NumberGenerator) => number {
  const { roll } = die;

  if (typeof roll === "function") {
    return (generator) => roll.call(die, generator);
  }

  if (isFacesDie(die)) {
    const faces = [...die.faces];

    return (generator) => faces[generator.integer(0, faces.length - 1)] ?? min;
  }

  return (generator) => generator.integer(min, max);
}

function validateDefinition(die: DieLike): void {
  const input: unknown = die;

  if (typeof input !== "object" || input === null) {
    throw new ValidationError(`A die must be an object: ${String(input)}`);
  }

  if (isFacesDie(die)) {
    if (die.faces.length === 0) {
      throw new ValidationError("A face die needs at least one face");
    }

    if (!die.faces.every((face) => Number.isFinite(face))) {
      throw new ValidationError(
        `Die faces must be finite numbers: ${die.faces.join(", ")}`,
      );
    }
  } else if (die.min === undefined || die.max === undefined) {
    throw new ValidationError("A die needs either faces, or a min and max");
  }
}

function validateResolved(die: DieLike, resolved: DieSnapshot): void {
  const { notation, ...values } = resolved;

  for (const [name, value] of Object.entries(values)) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new ValidationError(
        `Die ${name} must be a finite number: ${String(value)}`,
      );
    }
  }

  if (typeof notation !== "string") {
    throw new ValidationError(
      `Die notation must be a string: ${String(notation)}`,
    );
  }

  if (resolved.min > resolved.max) {
    throw new ValidationError(
      `Die min must not be greater than max: ${resolved.min}, ${resolved.max}`,
    );
  }

  if (
    isRangeDie(die) &&
    typeof die.roll !== "function" &&
    (!Number.isSafeInteger(resolved.min) || !Number.isSafeInteger(resolved.max))
  ) {
    throw new ValidationError(
      `Die min and max must be integers: ${resolved.min}, ${resolved.max}`,
    );
  }
}
