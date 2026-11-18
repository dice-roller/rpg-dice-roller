import type { ExplodeMatchingBatchNode } from "../../ast/nodes.js";
import { EvaluationError } from "../../errors/EvaluationError.js";
import { withCalculationValue, withFlags } from "../../results/die-result.js";
import type { ResultFlag } from "../../results/flags.js";
import type { ScoredItem } from "../../results/types.js";
import { matchesComparePoint } from "../compare-point.js";
import type { ModifierHandler, ModifierInput } from "../types.js";
import { resolveIterationBudget } from "./utils.js";

const TRIGGER_FLAG: ResultFlag = "explode-matching-batch";
const FAILURE_FLAG: ResultFlag = "explode-matching-batch-failure";

/**
 * `!m`: repeats a complete batch when every die in it has the same value and the optional compare
 * point matches. An optional failure compare point is checked first and zeroes accumulated scoring.
 * Limits count additional batches and are capped by `ctx.limits.maxIterations`.
 *
 * @throws {EvaluationError} the pool die or `rollBatch` is missing
 */
export const explodeMatchingBatchHandler: ModifierHandler<ExplodeMatchingBatchNode> =
  {
    name: "explode-matching-batch",
    order: 3,
    appliesTo: ["pool"],
    apply<T extends ScoredItem>(
      items: readonly T[],
      input: ModifierInput<ExplodeMatchingBatchNode>,
    ): T[] {
      const { modifier, ctx, die, rollBatch } = input;

      if (!die || !rollBatch) {
        throw new EvaluationError(
          `The "${modifier.name}" modifier can only be used on a dice pool`,
        );
      }

      const iterations = resolveIterationBudget(modifier, ctx.limits);
      const batchSize = items.length;

      if (batchSize === 0) {
        return [];
      }

      const batches: T[][] = [[...items]];
      let generatedBatches = 0;

      while (true) {
        const currentBatch = batches.at(-1);
        const first = currentBatch?.[0];

        if (
          !currentBatch ||
          !first ||
          !currentBatch.every(({ value }) => value === first.value)
        ) {
          return batches.flat();
        }

        if (
          modifier.failureComparePoint &&
          matchesComparePoint(modifier.failureComparePoint, first.value)
        ) {
          return batches.flatMap((batch, index) =>
            batch.map((item) =>
              withCalculationValue(
                index === batches.length - 1
                  ? withFlags(item, FAILURE_FLAG)
                  : item,
                0,
              ),
            ),
          );
        }

        if (
          generatedBatches >= iterations ||
          (modifier.comparePoint !== undefined &&
            !matchesComparePoint(modifier.comparePoint, first.value))
        ) {
          return batches.flat();
        }

        const nextBatch = rollBatch(batchSize);

        if (!nextBatch) {
          return batches.flat();
        }

        batches[batches.length - 1] = currentBatch.map((item) =>
          withFlags(item, TRIGGER_FLAG),
        );
        batches.push([...nextBatch] as unknown as T[]);
        generatedBatches++;
      }
    },
  };
