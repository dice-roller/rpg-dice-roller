/**
 * Dice are plain data, optionally with behaviour.
 *
 * A die can be a plain object (`{ min: 1, max: 6 }`, `{ faces: [1, 1, 2, 3, 5, 8] }`), a class
 * instance, or an object with methods. Anything a die doesn't provide falls back to the helpers in
 * `die-utils.ts`.
 *
 * Dice are created by the factories in the `DieRegistry`; the AST only stores the factory's name
 * and arguments (`DieNode`), so dice don't need an id.
 */
import type { NumberGenerator } from "../random/NumberGenerator.js";

/**
 * A number, or a function that returns one.
 *
 * Functions are called with the die as `this`, so class getters and methods both work.
 */
export type NumberOrGetter = number | (() => number);

interface DieLabels {
  /** The display label used after the `d` by presenters, e.g. `6`, `%`, `F` or `F.1`. */
  readonly notation?: string;
}

/** A die defined by its inclusive bounds, e.g. d6 or d%. */
export interface RangeDieDefinition extends DieLabels {
  readonly min: NumberOrGetter;
  readonly max: NumberOrGetter;
}

/** A die with a non-empty list of finite faces, e.g. dF (`[-1, 0, 1]`). Repeats act as weights. */
export interface FacesDieDefinition extends DieLabels {
  readonly faces: readonly number[];
}

/** The minimum data that defines a die. */
export type DieDefinition = RangeDieDefinition | FacesDieDefinition;

/**
 * Optional behaviour a die can provide, instead of the default helpers.
 *
 * For face dice, bounds default to the extrema, average to the mean including repeats, and
 * face count to the array length. For range dice, average defaults to `(min + max) / 2` and
 * face count to `max - min + 1`. Overrides are resolved with the die as `this`.
 */
export interface DieBehaviour {
  /** Lowest value, used in `min` mode; defaults to the lowest face for a face die. */
  readonly min: NumberOrGetter;
  /** Highest value, used in `max` mode; defaults to the highest face for a face die. */
  readonly max: NumberOrGetter;
  /** Average of a single roll; override this for a custom distribution. */
  readonly average: NumberOrGetter;
  /** Number of faces, including repeats. */
  readonly faceCount: NumberOrGetter;
  /**
   * Rolls once using the supplied generator; called with the die as `this` in random mode.
   * It must return a finite number. `min` / `max` mode ignores it and uses the resolved bounds.
   */
  roll(generator: NumberGenerator): number;
}

/**
 * A range or faces definition with optional behaviour overrides.
 *
 * Without a custom `roll`, range bounds must be safe integers and are sampled inclusively;
 * face dice sample an array index uniformly. With a custom `roll`, range bounds may be fractional.
 * Resolved numeric values must be finite and `min` must not exceed `max`.
 */
export type DieLike = DieDefinition & Partial<DieBehaviour>;

/**
 * Creates a die from the evaluated arguments of a `DieNode`, e.g. `standard(6)` for `d6`.
 *
 * Registered by name in the `DieRegistry`. A class can be registered by wrapping it:
 * `(sides) => new MyDie(sides)`.
 */
export type DieFactory = (...args: number[]) => DieLike;

/** The JSON-safe values of a die, stored in results. */
export interface DieSnapshot {
  readonly notation: string;
  readonly min: number;
  readonly max: number;
  readonly average: number;
  readonly faceCount: number;
}

/** A die with every value resolved to a plain number, and a `roll()` that always exists. */
export interface ResolvedDie extends DieSnapshot {
  roll(generator: NumberGenerator): number;
  /** The die that was resolved. */
  readonly source: DieLike;
}
