import { ValidationError } from "../errors/ValidationError.js";
import { NumberGenerator } from "../random/NumberGenerator.js";
import type { RollInputData } from "./roll-input-data.js";
import { snapshotRollInputData } from "./roll-input-data.js";

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
  /** The maximum number of generations for explode and re-roll, or retries for unique, per die. */
  readonly maxIterations: number;
  /** Additional rolls allowed per pool/evaluation across modifiers, including discarded rolls (default 1,000,000); initial dice are excluded and exhaustion truncates repeating results. */
  readonly maxGeneratedRolls: number;
}

export const DEFAULT_ROLL_LIMITS: RollLimits = Object.freeze({
  maxQty: 999,
  maxIterations: 1000,
  maxGeneratedRolls: 1000000,
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

  for (const limit of [
    "maxQty",
    "maxIterations",
    "maxGeneratedRolls",
  ] as const) {
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
  /** Bindings reserved for built-ins and evaluator-defined values. */
  readonly system: Readonly<Record<string, unknown>>;
  /** A validated snapshot of caller-provided values. */
  readonly data: RollInputData;
}

export interface RollContextOptions {
  generator?: NumberGenerator;
  mode?: RollMode;
  limits?: Partial<RollLimits>;
  system?: Readonly<Record<string, unknown>>;
  data?: RollInputData;
}

/** Creates a roll context, filling in the defaults. */
export function createRollContext(
  options: RollContextOptions = {},
): RollContext {
  let inputData = options.data;

  if (inputData === null) {
    throw new ValidationError("Roll input data must be a plain object");
  }
  inputData ??= Object.create(null) as RollInputData;

  return {
    generator: options.generator ?? new NumberGenerator(),
    mode: options.mode ?? "random",
    limits: resolveRollLimits(options.limits),
    system: copySystemBindings(options.system),
    data: snapshotRollInputData(inputData),
  };
}

function copySystemBindings(
  bindings: Readonly<Record<string, unknown>> = {},
): Readonly<Record<string, unknown>> {
  const copied = Object.create(null) as Record<string, unknown>;

  try {
    for (const key of Reflect.ownKeys(bindings)) {
      if (typeof key !== "string") {
        throw new ValidationError("System bindings must use string names");
      }

      const descriptor = Object.getOwnPropertyDescriptor(bindings, key);

      if (descriptor === undefined || !("value" in descriptor)) {
        throw new ValidationError("System bindings cannot use accessors");
      }

      Object.defineProperty(copied, key, {
        value: descriptor.value,
        enumerable: true,
        writable: false,
        configurable: false,
      });
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new ValidationError("System bindings must be a plain object");
  }

  return Object.freeze(copied);
}
