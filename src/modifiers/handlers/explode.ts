import type { ExplodeNode } from "../../ast/nodes.js";
import { withFlags, withValue } from "../../results/die-result.js";
import type { ResultFlag } from "../../results/flags.js";
import type { DieResult, ScoredItem } from "../../results/types.js";
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
 * 1000). At the limit the last extra roll is retained even if it matches.
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
  order: 3,
  appliesTo: ["pool"],
  apply<T extends ScoredItem>(
    items: readonly T[],
    input: ModifierInput<ExplodeNode>,
  ): T[] {
    const { modifier, ctx } = input;
    const iterations = resolveIterationBudget(modifier, ctx.limits);
    const { rollDie } = repeatableDie(input, "explode");
    const comparePoint = comparePointOrDefault(input, "max");
    const flags: ResultFlag[] = modifier.penetrate
      ? ["explode", "penetrate"]
      : ["explode"];

    return items.flatMap((item) => {
      // pools only, so the items are die results
      const chain: ScoredItem[] = [item];
      let rolled = item.value;

      for (
        let i = 0;
        i < iterations && matchesComparePoint(comparePoint, rolled);
        i++
      ) {
        const extra: DieResult = rollDie();
        const last = chain.length - 1;

        rolled = extra.value;
        chain[last] = withFlags(chain[last] ?? item, ...flags);
        chain.push(
          modifier.penetrate ? withValue(extra, extra.value - 1) : extra,
        );
      }

      if (modifier.compound && chain.length > 1) {
        const total = chain.reduce((sum, { value }) => sum + value, 0);

        return [
          withFlags(withValue(item, total), "explode", "compound", ...flags),
        ];
      }

      return chain as T[];
    });
  },
};
