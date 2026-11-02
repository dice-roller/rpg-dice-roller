import type { CriticalSuccessNode } from "../../ast/nodes.js";
import { withFlags } from "../../results/die-result.js";
import { matchesComparePoint } from "../compare-point.js";
import type { ModifierHandler } from "../types.js";
import { comparePointOrDefault } from "./utils.js";

/**
 * `cs`, `cs>18`: flags rolls matching the compare point (the die's max by default) as
 * `critical-success`.
 *
 * Purely for display: values and totals don't change.
 */
export const criticalSuccessHandler: ModifierHandler<CriticalSuccessNode> = {
  name: "critical-success",
  order: 9,
  appliesTo: ["pool"],
  apply(items, input) {
    const comparePoint = comparePointOrDefault(input, "max");

    return items.map((item) =>
      matchesComparePoint(comparePoint, item.value)
        ? withFlags(item, "critical-success")
        : item,
    );
  },
};
