/**
 * Immutable helpers for scored items (die results and group members).
 *
 * Modifier handlers use these instead of mutating results: each returns a new object.
 */
import { NotImplementedError } from "../errors/NotImplementedError.js";
import type { ResultFlag } from "./flags.js";
import type { DieResult, ScoredItem } from "./types.js";

/** A fresh die result: `value`, `initialValue` and `calculationValue` all equal `value`. */
export function createDieResult(_value: number): DieResult {
  throw new NotImplementedError("createDieResult()");
}

/** Returns a copy with the flags added (each flag at most once). */
export function withFlags<T extends ScoredItem>(
  _item: T,
  ..._flags: ResultFlag[]
): T {
  throw new NotImplementedError("withFlags()");
}

/** Returns a copy with a new `value` (and `calculationValue`). */
export function withValue<T extends ScoredItem>(_item: T, _value: number): T {
  throw new NotImplementedError("withValue()");
}

/** Returns a copy with a new `calculationValue`, keeping `value`. */
export function withCalculationValue<T extends ScoredItem>(
  _item: T,
  _calculationValue: number,
): T {
  throw new NotImplementedError("withCalculationValue()");
}

/** Returns a copy that is excluded from the total (`useInTotal: false`). */
export function excludeFromTotal<T extends ScoredItem>(_item: T): T {
  throw new NotImplementedError("excludeFromTotal()");
}
