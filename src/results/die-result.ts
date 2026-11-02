/**
 * Immutable helpers for scored items (die results and group members).
 *
 * Modifier handlers use these instead of mutating results: each returns a new object.
 */
import type { ResultFlag } from "./flags.js";
import type { DieResult, ScoredItem } from "./types.js";

/** A fresh die result: `value`, `initialValue` and `calculationValue` all equal `value`. */
export function createDieResult(value: number): DieResult {
  return {
    type: "die",
    value,
    initialValue: value,
    calculationValue: value,
    useInTotal: true,
    flags: [],
  };
}

/** Returns a copy with the flags added (each flag at most once). */
export function withFlags<T extends ScoredItem>(
  item: T,
  ...flags: ResultFlag[]
): T {
  return { ...item, flags: [...new Set([...item.flags, ...flags])] };
}

/** Returns a copy with a new `value` (and `calculationValue`). */
export function withValue<T extends ScoredItem>(item: T, value: number): T {
  return { ...item, value, calculationValue: value };
}

/** Returns a copy with a new `calculationValue`, keeping `value`. */
export function withCalculationValue<T extends ScoredItem>(
  item: T,
  calculationValue: number,
): T {
  return { ...item, calculationValue };
}

/** Returns a copy that is excluded from the total (`useInTotal: false`). */
export function excludeFromTotal<T extends ScoredItem>(item: T): T {
  return { ...item, useInTotal: false };
}
