import type { TargetNode } from "../../ast/nodes.js";
import { withCalculationValue, withFlags } from "../../results/die-result.js";
import { matchesComparePoint } from "../compare-point.js";
import type { ModifierHandler } from "../types.js";

/**
 * `>=8`, `>=8f<=2`: counts successes and failures.
 *
 * Items matching `success` count as `1` (flag `target-success`), items matching `failure` as `-1`
 * (flag `target-failure`), and the rest as `0` (via `calculationValue`). An item matching both
 * is a success. Dropped items are still scored and flagged, but remain excluded from the total.
 * On a group, it always counts the members by their totals.
 */
export const targetHandler: ModifierHandler<TargetNode> = {
  name: "target",
  order: 8,
  appliesTo: ["pool", "group"],
  apply(items, { modifier: { success, failure } }) {
    return items.map((item) => {
      if (matchesComparePoint(success, item.value)) {
        return withFlags(withCalculationValue(item, 1), "target-success");
      }

      if (failure && matchesComparePoint(failure, item.value)) {
        return withFlags(withCalculationValue(item, -1), "target-failure");
      }

      return withCalculationValue(item, 0);
    });
  },
};
