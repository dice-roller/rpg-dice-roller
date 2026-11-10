import type { TargetNode } from "../../ast/nodes.js";
import { ValidationError } from "../../errors/ValidationError.js";
import { withFlags } from "../../results/die-result.js";
import { matchesComparePoint } from "../compare-point.js";
import type { ModifierHandler } from "../types.js";

/**
 * `>=8`, `>=8:2f<=2`: counts weighted successes and failures.
 *
 * The last matching rule determines the signed contribution. Dropped items are still scored and
 * flagged, but remain excluded from the total. Groups count members by their totals.
 */
export const targetHandler: ModifierHandler<TargetNode> = {
  name: "target",
  order: 8,
  appliesTo: ["pool", "group"],
  apply(items, { modifier }) {
    validateTargetAmounts(modifier);

    return items.map((item) => {
      let contribution = 0;

      for (const rule of modifier.rules) {
        if (matchesComparePoint(rule.comparePoint, item.value)) {
          contribution =
            (rule.kind === "success" ? 1 : -1) * (rule.amount ?? 1);
        }
      }

      const scored = {
        ...item,
        calculationValue: contribution,
        flags: item.flags.filter(
          (flag) => !["target-success", "target-failure"].includes(flag),
        ),
      };

      return contribution === 0
        ? scored
        : withFlags(
            scored,
            contribution > 0 ? "target-success" : "target-failure",
          );
    });
  },
};

/** Reject invalid amounts even on target nodes supplied directly by callers. */
export function validateTargetAmounts(modifier: TargetNode): void {
  for (const { amount } of modifier.rules) {
    if (
      amount !== undefined &&
      (!Number.isInteger(amount) || amount < 1 || amount > 10)
    ) {
      throw new ValidationError(
        "A target amount must be an integer between 1 and 10",
      );
    }
  }
}
