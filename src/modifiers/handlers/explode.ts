import type { ExplodeNode } from "../../ast/nodes.js";
import type { EvaluationDrawRequest } from "../../evaluator/EvaluationDrawRequest.js";
import { withFlags, withValue } from "../../results/die-result.js";
import type { ResultFlag } from "../../results/flags.js";
import type { ScoredItem } from "../../results/types.js";
import { matchesComparePoint } from "../compare-point.js";
import type { ModifierHandler, ModifierInput } from "../types.js";
import {
  comparePointOrDefault,
  repeatableDie,
  resolveIterationBudget,
} from "./utils.js";

/**
 * `!`, `!!`, `!p`, `!!p`: rolls another die whenever a roll matches the compare point (the die's max
 * by default), up to the modifier limit or `ctx.limits.maxIterations` times per initial die (default
 * 1000 generations). `:amount` generates that many children per match, visited depth-first.
 * At the per-die generation limit the last extra roll is retained even if it matches. If the
 * per-pool generated-roll budget is spent, pending branches stop and only dice that actually
 * generated children are flagged as triggers.
 *
 * - compound (`!!`): adds the extra rolls to the original roll (flags `explode` and `compound`)
 * - penetrate (`p`): subtracts 1 from each extra roll (flag `penetrate`); whether it explodes
 *   again is checked before subtracting
 * - otherwise each extra roll is a new die result, after the roll that exploded (flag `explode`)
 *
 * @throws {EvaluationError} the pool die or `rollDie` is missing, or the die can only roll one value,
 *   even if no roll matches
 */
export const explodeHandler: ModifierHandler<ExplodeNode> = {
  name: "explode",
  order: 4,
  appliesTo: ["pool"],
  *apply<T extends ScoredItem>(
    items: readonly T[],
    input: ModifierInput<ExplodeNode>,
  ): Generator<EvaluationDrawRequest, T[], number> {
    const { modifier, ctx } = input;
    const iterations = resolveIterationBudget(modifier, ctx.limits);
    const { rollDie } = repeatableDie(input, "explode", items.length > 0);
    const comparePoint = comparePointOrDefault(input, "max");
    const flags: ResultFlag[] = modifier.penetrate
      ? ["explode", "penetrate"]
      : ["explode"];

    const output: T[] = [];

    for (const item of items) {
      interface ExplosionFrame {
        item: ScoredItem;
        rawValue: number;
        remaining: number;
        initialized: boolean;
        childIndex: number;
      }

      const traversal: ScoredItem[] = [];
      const stack: ExplosionFrame[] = [
        {
          item,
          rawValue: item.value,
          remaining: iterations,
          initialized: false,
          childIndex: 0,
        },
      ];
      const amount = modifier.amount ?? 1;

      while (stack.length > 0) {
        const frame = stack.at(-1)!;

        if (!frame.initialized) {
          frame.initialized = true;

          if (
            frame.remaining <= 0 ||
            !matchesComparePoint(comparePoint, frame.rawValue)
          ) {
            traversal.push(frame.item);
            stack.pop();
            continue;
          }
        }

        if (frame.childIndex >= amount) {
          stack.pop();
          continue;
        }

        const extra = yield* rollDie();

        if (!extra) {
          if (frame.childIndex === 0) {
            traversal.push(frame.item);
          }

          break;
        }

        if (frame.childIndex === 0) {
          frame.item = withFlags(frame.item, ...flags);
          traversal.push(frame.item);
        }

        frame.childIndex++;

        stack.push({
          item: modifier.penetrate ? withValue(extra, extra.value - 1) : extra,
          rawValue: extra.value,
          remaining: frame.remaining - 1,
          initialized: false,
          childIndex: 0,
        });
      }

      if (modifier.compound && traversal.length > 1) {
        const total = traversal.reduce((sum, { value }) => sum + value, 0);

        output.push(
          withFlags(withValue(item, total), "explode", "compound", ...flags),
        );
      } else {
        output.push(...(traversal as T[]));
      }
    }

    return output;
  },
};
