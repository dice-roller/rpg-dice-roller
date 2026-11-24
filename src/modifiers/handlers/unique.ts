import type { UniqueNode } from "../../ast/nodes.js";
import type { EvaluationDrawRequest } from "../../evaluator/EvaluationDrawRequest.js";
import { withFlags, withValue } from "../../results/die-result.js";
import type { ScoredItem } from "../../results/types.js";
import { matchesComparePoint } from "../compare-point.js";
import type { ModifierHandler, ModifierInput } from "../types.js";
import { repeatableDie, resolveIterationBudget } from "./utils.js";

/**
 * `u`, `uo` and numeric limits: re-roll rolls whose value an earlier roll already has (optionally
 * only those matching the compare point), replacing the value (the initial value is kept). The first
 * roll is never re-rolled.
 *
 * `u` repeats while the current value is a matching duplicate (up to its optional limit or
 * `ctx.limits.maxIterations` per roll, default 1000, flag `unique`); `uo` re-rolls once (flag
 * `unique-once`). Both can leave duplicates: a per-die limit can be reached, a replacement can fall
 * outside the compare point, or the per-pool generated-roll budget can be spent. At the pool budget,
 * the current value is kept and later items pass through unchanged.
 *
 * @throws {EvaluationError} the pool die or `rollDie` is missing, or the die can only roll one value,
 *   even if there are no duplicates
 */
export const uniqueHandler: ModifierHandler<UniqueNode> = {
  name: "unique",
  order: 6,
  appliesTo: ["pool"],
  *apply<T extends ScoredItem>(
    items: readonly T[],
    input: ModifierInput<UniqueNode>,
  ): Generator<EvaluationDrawRequest, T[], number> {
    const { modifier, ctx } = input;
    const { rollDie } = repeatableDie(input, "re-roll", items.length > 0);
    const { comparePoint } = modifier;
    const flag = modifier.once ? "unique-once" : "unique";
    const iterations = resolveIterationBudget(modifier, ctx.limits);
    const unique: T[] = [];

    const shouldReRoll = ({ value }: T): boolean =>
      (!comparePoint || matchesComparePoint(comparePoint, value)) &&
      unique.some((earlier) => earlier.value === value);

    for (const [index, item] of items.entries()) {
      let current = item;
      let exhausted = false;

      for (let i = 0; i < iterations && shouldReRoll(current); i++) {
        const extra = yield* rollDie();

        if (!extra) {
          exhausted = true;
          break;
        }

        current = withFlags(withValue(current, extra.value), flag);
      }

      unique.push(current);

      if (exhausted) {
        return unique.concat(items.slice(index + 1));
      }
    }

    return unique;
  },
};
