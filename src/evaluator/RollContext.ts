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
    limits: { ...DEFAULT_ROLL_LIMITS, ...options.limits },
  };
}
