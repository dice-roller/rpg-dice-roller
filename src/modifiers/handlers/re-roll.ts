import type { ReRollNode } from "../../ast/nodes.js";
import { withFlags, withValue } from "../../results/die-result.js";
import type { ScoredItem } from "../../results/types.js";
import { matchesComparePoint } from "../compare-point.js";
import type { ModifierHandler, ModifierInput } from "../types.js";
import {
  comparePointOrDefault,
  repeatableDie,
  resolveIterationBudget,
} from "./utils.js";

/**
 * `r`, `ro` and numeric limits: re-roll rolls that match the compare point (the die's min by
 * default). `:amount` replaces each match with that many children, visited depth-first.
 * A single replacement retains the original initial value; branching children retain their own.
 *
 * `r` repeats until the roll no longer matches (up to its optional limit or
 * `ctx.limits.maxIterations` per roll, default 1000, flag `re-roll`); the final value can still match
 * at the per-die limit. `ro` re-rolls once (flag `re-roll-once`). When the per-pool generated-roll
 * budget is spent, a match with no replacement remains terminal; partially generated branches keep
 * their terminal descendants and omit unrolled siblings.
 *
 * @throws {EvaluationError} the pool die or `rollDie` is missing, or the die can only roll one value,
 *   even if no roll matches
 */
export const reRollHandler: ModifierHandler<ReRollNode> = {
  name: "re-roll",
  order: 5,
  appliesTo: ["pool"],
  apply<T extends ScoredItem>(
    items: readonly T[],
    input: ModifierInput<ReRollNode>,
  ): T[] {
    const { modifier, ctx } = input;
    const { rollDie } = repeatableDie(input, "re-roll", items.length > 0);
    const comparePoint = comparePointOrDefault(input, "min");
    const flag = modifier.once ? "re-roll-once" : "re-roll";
    const iterations = resolveIterationBudget(modifier, ctx.limits);
    const amount = modifier.amount ?? 1;

    return items.flatMap((item) => {
      interface ReRollFrame {
        item: ScoredItem;
        remaining: number;
        initialized: boolean;
        childIndex: number;
      }

      const terminalResults: ScoredItem[] = [];
      const stack: ReRollFrame[] = [
        {
          item,
          remaining: iterations,
          initialized: false,
          childIndex: 0,
        },
      ];

      while (stack.length > 0) {
        const frame = stack.at(-1);

        if (!frame) {
          break;
        }

        if (!frame.initialized) {
          frame.initialized = true;

          if (
            frame.remaining > 0 &&
            matchesComparePoint(comparePoint, frame.item.value)
          ) {
            continue;
          }

          terminalResults.push(frame.item);
          stack.pop();
          continue;
        }

        if (frame.childIndex >= amount) {
          stack.pop();
          continue;
        }

        const extra = rollDie();

        if (!extra) {
          if (frame.childIndex === 0) {
            terminalResults.push(frame.item);
          }

          break;
        }

        frame.childIndex++;
        const replacement =
          amount === 1
            ? withValue(frame.item, extra.value)
            : {
                ...extra,
                ...frame.item,
                value: extra.value,
                initialValue: extra.initialValue,
                calculationValue: extra.calculationValue,
              };

        stack.push({
          item: withFlags(replacement, flag),
          remaining: frame.remaining - 1,
          initialized: false,
          childIndex: 0,
        });
      }

      return terminalResults as T[];
    });
  },
};
