/**
 * Default dice behaviour.
 *
 * Every function accepts any `DieLike`. Values or functions the die provides itself are used first;
 * otherwise the defaults are derived from `min` / `max` or `faces`.
 */
import { NotImplementedError } from "../errors/NotImplementedError.js";
import type { RollContext } from "../evaluator/RollContext.js";
import type {
  DieLike,
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
 * Uses the die's `notation` if set; otherwise a range die from 1 to a literal number uses that
 * number (`{ min: 1, max: 6 }` -> `6`).
 *
 * Still to implement: a display-only fallback for other dice, e.g. `-2..3` for `rangeDie(-2, 3)`
 * and `{1,1,2,3,5,8}` for a face die. It doesn't parse back, and must avoid `[...]`, which is the
 * description syntax.
 */
export function dieNotation(die: DieLike): string {
  if (die.notation !== undefined) {
    return die.notation;
  }

  if (isRangeDie(die) && die.min === 1 && typeof die.max === "number") {
    return String(die.max);
  }

  throw new NotImplementedError("dieNotation() for dice without a notation");
}

/** The lowest value the die can roll. */
export function dieMin(_die: DieLike): number {
  throw new NotImplementedError("dieMin()");
}

/** The highest value the die can roll. */
export function dieMax(_die: DieLike): number {
  throw new NotImplementedError("dieMax()");
}

/** The average value of a single roll. */
export function dieAverage(_die: DieLike): number {
  throw new NotImplementedError("dieAverage()");
}

/** The number of faces on the die. */
export function faceCount(_die: DieLike): number {
  throw new NotImplementedError("faceCount()");
}

/**
 * Normalises any `DieLike` into a `ResolvedDie` with plain numbers and a `roll()`.
 *
 * The die's own values / functions are used when present, otherwise the helpers above.
 */
export function resolveDie(_die: DieLike): ResolvedDie {
  throw new NotImplementedError("resolveDie()");
}

/**
 * Rolls the die once.
 *
 * - `max` / `min` mode: returns `die.max` / `die.min`, ignoring a custom `roll()`.
 * - `random` mode: uses `die.roll()` (the die's own, or the default: a range die uses
 *   `generator.integer(min, max)`, a faces die uses `faces[generator.integer(0, n - 1)]`).
 */
export function rollDie(_die: ResolvedDie, _ctx: RollContext): number {
  throw new NotImplementedError("rollDie()");
}
