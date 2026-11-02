/**
 * Helpers shared by the built-in modifier handlers.
 */
import type {
  ComparePoint,
  CriticalFailureNode,
  CriticalSuccessNode,
  ExplodeNode,
  ReRollNode,
  UniqueNode,
} from "../../ast/nodes.js";
import { createComparePoint } from "../../ast/factory.js";
import { EvaluationError } from "../../errors/EvaluationError.js";
import { excludeFromTotal, withFlags } from "../../results/die-result.js";
import type { ResolvedDie } from "../../dice/types.js";
import type { DieResult, ScoredItem } from "../../results/types.js";
import type { ModifierInput } from "../types.js";

/**
 * Compares two values for sorting, ascending. Safe for infinite values (`Infinity - Infinity` is
 * `NaN`, which would break the sort).
 */
export function compareValues(a: number, b: number): number {
  if (a === b) {
    return 0;
  }

  return a < b ? -1 : 1;
}

/**
 * The indexes of the items, sorted by value, ascending.
 *
 * The sort is stable, so items with the same value keep their order: the earlier of two equal
 * items counts as the lower one.
 */
export function indexesByValue(items: readonly ScoredItem[]): number[] {
  return items
    .map((_, index) => index)
    .sort((a, b) => compareValues(items[a]?.value ?? 0, items[b]?.value ?? 0));
}

/** Returns a copy of the items, with those at the indexes dropped (flag `drop`). */
export function dropAt<T extends ScoredItem>(
  items: readonly T[],
  indexes: Iterable<number>,
): T[] {
  const dropped = new Set(indexes);

  return items.map((item, index) =>
    dropped.has(index) ? excludeFromTotal(withFlags(item, "drop")) : item,
  );
}

/**
 * The pool's die and a function to roll it again, for repeating modifiers (explode, re-roll and
 * unique).
 *
 * @throws {EvaluationError} there's no die (e.g. on a group), or the die can only roll one value,
 *   so repeating would never change anything
 */
export function repeatableDie(
  { modifier, die, rollDie }: ModifierInput,
  action: string,
): { die: ResolvedDie; rollDie: () => DieResult } {
  if (!die || !rollDie) {
    throw new EvaluationError(
      `The "${modifier.name}" modifier can only be used on a dice pool`,
    );
  }

  if (die.min === die.max) {
    throw new EvaluationError(
      `Can't ${action} the die "${die.notation}", because it can only roll ${die.min}`,
    );
  }

  return { die, rollDie };
}

/**
 * The modifier's compare point, or `=` the pool die's min / max by default.
 *
 * @throws {EvaluationError} there's no compare point, and no die to take the default from
 */
export function comparePointOrDefault(
  {
    modifier,
    die,
  }: ModifierInput<
    | ExplodeNode
    | ReRollNode
    | UniqueNode
    | CriticalSuccessNode
    | CriticalFailureNode
  >,
  end: "min" | "max",
): ComparePoint {
  if (modifier.comparePoint) {
    return modifier.comparePoint;
  }

  if (!die) {
    throw new EvaluationError(
      `The "${modifier.name}" modifier needs a compare point when there's no die`,
    );
  }

  return createComparePoint("=", die[end]);
}
