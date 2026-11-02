import { ValidationError } from "../errors/ValidationError.js";
import { NumberGenerator } from "../random/NumberGenerator.js";

/**
 * How dice are rolled.
 *
 * - `random`: use the generator
 * - `min` / `max`: every die rolls its minimum / maximum value (used for `minTotal` / `maxTotal`)
 */
export type RollMode = "random" | "min" | "max";

/** Safety limits for a single roll. */
export interface RollLimits {
  /** The maximum number of dice in a pool. */
  readonly maxQty: number;
  /** The maximum number of iterations for repeating modifiers (explode, re-roll, unique). */
  readonly maxIterations: number;
}

export const DEFAULT_ROLL_LIMITS: RollLimits = Object.freeze({
  maxQty: 999,
  maxIterations: 1000,
});

/**
 * Resolves and validates the safety limits used by a roll.
 *
 * @throws {ValidationError} if the limits are invalid
 */
export function resolveRollLimits(
  limits: Partial<RollLimits> = {},
): RollLimits {
  const resolved = { ...DEFAULT_ROLL_LIMITS, ...limits };

  for (const limit of ["maxQty", "maxIterations"] as const) {
    const value = resolved[limit];

    if (!Number.isSafeInteger(value) || value < 1) {
      throw new ValidationError(`${limit} must be a positive safe integer`);
    }
  }

  return resolved;
}

/** Everything that changes per roll but isn't part of the notation. */
export interface RollContext {
  readonly generator: NumberGenerator;
  readonly mode: RollMode;
  readonly limits: RollLimits;
}

export interface RollContextOptions {
  generator?: NumberGenerator;
  mode?: RollMode;
  limits?: Partial<RollLimits>;
}

/** Creates a roll context, filling in the defaults. */
export function createRollContext(
  options: RollContextOptions = {},
): RollContext {
  return {
    generator: options.generator ?? new NumberGenerator(),
    mode: options.mode ?? "random",
    limits: resolveRollLimits(options.limits),
  };
}
