import { ValidationError } from "../errors/ValidationError.js";
import type { FacesDieDefinition, RangeDieDefinition } from "./types.js";

/** Optional settings for a preset die. */
export interface DieOptions {
  /** The display label used after the `d` (see `DieLike.notation`). */
  readonly notation?: string;
}

/**
 * A die with every integer from `min` to `max`, e.g. `rangeDie(-2, 3)`.
 *
 * Registered in the `DieRegistry` as `range`.
 *
 * @throws {ValidationError} `min` or `max` isn't a safe integer, or `min` is greater than `max`
 */
export function rangeDie(
  min: number,
  max: number,
  options: DieOptions = {},
): RangeDieDefinition {
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) {
    throw new ValidationError(
      `Die min and max must be integers: ${min}, ${max}`,
    );
  }

  if (min > max) {
    throw new ValidationError(
      `Die min must not be greater than max: ${min}, ${max}`,
    );
  }

  return Object.freeze({ min, max, ...labels(options) });
}

/**
 * A die with a list of faces, e.g. `faceDie([1, 1, 2, 3, 5, 8])`.
 *
 * Repeated faces act as weights. The faces are copied and frozen, so changing the array afterwards
 * doesn't change the die. Registered in the `DieRegistry` as `face`, with the faces as arguments.
 *
 * @throws {ValidationError} there are no faces, or a face isn't a finite number
 */
export function faceDie(
  faces: readonly number[],
  options: DieOptions = {},
): FacesDieDefinition {
  // checked at runtime for JS users, without narrowing `faces` to `any[]`
  const input: unknown = faces;

  if (!Array.isArray(input) || faces.length === 0) {
    throw new ValidationError("A face die needs at least one face");
  }

  if (!faces.every((face) => Number.isFinite(face))) {
    throw new ValidationError(
      `Die faces must be finite numbers: ${faces.join(", ")}`,
    );
  }

  return Object.freeze({
    faces: Object.freeze([...faces]),
    ...labels(options),
  });
}

/**
 * A die numbered from 1 to `sides`, e.g. `standardDie(6)` for `d6`.
 *
 * Registered in the `DieRegistry` as `standard`.
 *
 * @throws {ValidationError} `sides` isn't a positive integer
 */
export function standardDie(sides: number): RangeDieDefinition {
  if (!Number.isSafeInteger(sides) || sides < 1) {
    throw new ValidationError(`Die sides must be a positive integer: ${sides}`);
  }

  return rangeDie(1, sides, { notation: String(sides) });
}

/** `d%`: a 100-sided die, displayed as `d%`. Registered in the `DieRegistry` as `percentile`. */
export const percentileDie: RangeDieDefinition = rangeDie(1, 100, {
  notation: "%",
});

/** The number of faces each non-blank symbol (`-`, `+`) covers on a fudge die. */
export type FudgeNonBlanks = 1 | 2;

const fudgeDiceDefinitions: Record<FudgeNonBlanks, FacesDieDefinition> = {
  1: faceDie([-1, 0, 0, 0, 0, 1], { notation: "F.1" }),
  2: faceDie([-1, 0, 1], { notation: "F" }),
};

/**
 * A fudge / fate die. Registered in the `DieRegistry` as `fudge`.
 *
 * - `fudgeDie(2)` (`dF`): two faces each of `-1`, `0` and `+1`
 * - `fudgeDie(1)` (`dF.1`): one `-1`, four `0` and one `+1`
 *
 * @throws {ValidationError} `nonBlanks` isn't 1 or 2
 */
export function fudgeDie(nonBlanks: FudgeNonBlanks = 2): FacesDieDefinition {
  if (nonBlanks !== 1 && nonBlanks !== 2) {
    throw new ValidationError(
      `Fudge die non-blanks must be 1 or 2: ${String(nonBlanks)}`,
    );
  }

  return fudgeDiceDefinitions[nonBlanks];
}

// leaves `notation` out when it isn't set, so the die stays JSON-friendly
function labels({ notation }: DieOptions): { notation?: string } {
  return notation === undefined ? {} : { notation };
}
