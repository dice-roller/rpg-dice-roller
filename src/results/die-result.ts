/**
 * Immutable helpers for scored items (die results and group members).
 *
 * Modifier handlers can use these instead of mutating results: each returns a shallow copy,
 * preserving other properties and nested references. They do not add flags automatically.
 */
import type { ResultFlag } from "./flags.js";
import type { DieResult, ScoredItem } from "./types.js";

/** A fresh included die result with no flags: `value`, `initialValue` and `calculationValue` all equal `value`. */
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

/** Returns a copy with flags deduplicated in first-occurrence order; does not change scoring. */
export function withFlags<T extends ScoredItem>(
  item: T,
  ...flags: ResultFlag[]
): T {
  return { ...item, flags: [...new Set([...item.flags, ...flags])] };
}

/** Returns a copy with a new `value` and `calculationValue`; preserves a die's `initialValue`. */
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

/** Returns a copy excluded from the total (`useInTotal: false`); does not add a `drop` flag. */
export function excludeFromTotal<T extends ScoredItem>(item: T): T {
  return { ...item, useInTotal: false };
}
