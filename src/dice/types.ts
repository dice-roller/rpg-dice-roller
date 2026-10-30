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

/** A die with every value between `min` and `max`, e.g. d6 or d%. */
export interface RangeDieDefinition extends DieLabels {
  readonly min: NumberOrGetter;
  readonly max: NumberOrGetter;
}

/** A die with a list of faces, e.g. dF (`[-1, 0, 1]`). */
export interface FacesDieDefinition extends DieLabels {
  readonly faces: readonly number[];
}

/** The minimum data that defines a die. */
export type DieDefinition = RangeDieDefinition | FacesDieDefinition;

/** Optional behaviour a die can provide, instead of the default helpers. */
export interface DieBehaviour {
  readonly min: NumberOrGetter;
  readonly max: NumberOrGetter;
  readonly average: NumberOrGetter;
  readonly faceCount: NumberOrGetter;
  /** Rolls the die once (ignored in `min` / `max` mode). */
  roll(generator: NumberGenerator): number;
}

/** Anything that can be used as a die. */
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
