import type { ReRollNode } from "../../ast/nodes.js";
import { withFlags, withValue } from "../../results/die-result.js";
import { matchesComparePoint } from "../compare-point.js";
import type { ModifierHandler } from "../types.js";
import {
  comparePointOrDefault,
  repeatableDie,
  resolveIterationBudget,
} from "./utils.js";

/**
 * `r`, `ro` and numeric limits: re-roll rolls that match the compare point (the die's min by
 * default), replacing the value (the initial value is kept).
 *
 * `r` repeats until the roll no longer matches (up to its optional limit or
 * `ctx.limits.maxIterations` per roll, default 1000, flag `re-roll`); the final value can still match
 * at the limit. `ro` re-rolls once (flag `re-roll-once`).
 *
 * @throws {EvaluationError} the pool die or `rollDie` is missing, or the die can only roll one value,
 *   even if no roll matches
 */
export const reRollHandler: ModifierHandler<ReRollNode> = {
  name: "re-roll",
  order: 4,
  appliesTo: ["pool"],
  apply(items, input) {
    const { modifier, ctx } = input;
    const { rollDie } = repeatableDie(input, "re-roll");
    const comparePoint = comparePointOrDefault(input, "min");
    const flag = modifier.once ? "re-roll-once" : "re-roll";
    const iterations = resolveIterationBudget(modifier, ctx.limits);

    return items.map((item) => {
      let current = item;

      for (
        let i = 0;
        i < iterations && matchesComparePoint(comparePoint, current.value);
        i++
      ) {
        current = withFlags(withValue(current, rollDie().value), flag);
      }

      return current;
    });
  },
};
