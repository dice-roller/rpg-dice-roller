import type { UniqueNode } from "../../ast/nodes.js";
import { withFlags, withValue } from "../../results/die-result.js";
import type { ScoredItem } from "../../results/types.js";
import { matchesComparePoint } from "../compare-point.js";
import type { ModifierHandler, ModifierInput } from "../types.js";
import { repeatableDie } from "./utils.js";

/**
 * `u`, `uo`: re-rolls rolls whose value an earlier roll already has (optionally only those
 * matching the compare point), replacing the value (the initial value is kept). The first roll is
 * never re-rolled.
 *
 * `u` repeats until unique (up to `ctx.limits.maxIterations` per roll, flag `unique`), `uo`
 * re-rolls once (flag `unique-once`), so it can still leave duplicates.
 *
 * @throws {EvaluationError} the die can only roll one value
 */
export const uniqueHandler: ModifierHandler<UniqueNode> = {
  name: "unique",
  order: 5,
  appliesTo: ["pool"],
  apply<T extends ScoredItem>(
    items: readonly T[],
    input: ModifierInput<UniqueNode>,
  ): T[] {
    const { modifier, ctx } = input;
    const { rollDie } = repeatableDie(input, "re-roll");
    const { comparePoint } = modifier;
    const flag = modifier.once ? "unique-once" : "unique";
    const iterations = modifier.once ? 1 : ctx.limits.maxIterations;
    const unique: T[] = [];

    const shouldReRoll = ({ value }: T): boolean =>
      (!comparePoint || matchesComparePoint(comparePoint, value)) &&
      unique.some((earlier) => earlier.value === value);

    for (const item of items) {
      let current = item;

      for (let i = 0; i < iterations && shouldReRoll(current); i++) {
        current = withFlags(withValue(current, rollDie().value), flag);
      }

      unique.push(current);
    }

    return unique;
  },
};
