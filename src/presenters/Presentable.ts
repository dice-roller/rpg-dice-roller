import type { ExpressionResult } from "../results/types.js";
import type { Roll } from "../Roll.js";
import type { RollHistory } from "../RollHistory.js";

/** Anything a presenter can present. */
export type Presentable = Roll<unknown> | RollHistory | ExpressionResult;

/*
 * The guards check the shape rather than using `instanceof`, which avoids an import cycle with
 * `Roll` / `RollHistory`, and also works across copies of the library. Every result has a `type`;
 * rolls and histories don't.
 */

export function isRoll(target: Presentable): target is Roll<unknown> {
  return !("type" in target) && "result" in target;
}

export function isRollHistory(target: Presentable): target is RollHistory {
  return !("type" in target) && "rolls" in target;
}

export function isExpressionResult(
  target: Presentable,
): target is ExpressionResult {
  return "type" in target;
}
