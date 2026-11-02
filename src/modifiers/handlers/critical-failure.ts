import type { CriticalFailureNode } from "../../ast/nodes.js";
import { withFlags } from "../../results/die-result.js";
import { matchesComparePoint } from "../compare-point.js";
import type { ModifierHandler } from "../types.js";
import { comparePointOrDefault } from "./utils.js";

/**
 * `cf`, `cf<3`: flags rolls matching the compare point (the die's min by default) as
 * `critical-failure`.
 *
 * Purely for display: values and totals don't change.
 */
export const criticalFailureHandler: ModifierHandler<CriticalFailureNode> = {
  name: "critical-failure",
  order: 10,
  appliesTo: ["pool"],
  apply(items, input) {
    const comparePoint = comparePointOrDefault(input, "min");

    return items.map((item) =>
      matchesComparePoint(comparePoint, item.value)
        ? withFlags(item, "critical-failure")
        : item,
    );
  },
};
