import type { ExpressionResult } from "../results/types.js";
import type { Roll } from "../Roll.js";
import type { RollHistory } from "../RollHistory.js";

/** A roll, history, or evaluated expression result; an individual die result is not presentable. */
export type Presentable = Roll<unknown> | RollHistory | ExpressionResult;

/*
 * The guards check the shape rather than using `instanceof`, which avoids an import cycle with
 * `Roll` / `RollHistory`, and also works across copies of the library. Every result has a `type`;
 * rolls and histories don't.
 */

/**
 * Narrows a presentable to a roll by its shape: no `type` property and a `result` property.
 * This is not validation of arbitrary input; lookalike objects can match.
 */
export function isRoll(target: Presentable): target is Roll<unknown> {
  return !("type" in target) && "result" in target;
}

/**
 * Narrows a presentable to a history by its shape: no `type` property and a `rolls` property.
 * This is not validation of arbitrary input; lookalike objects can match.
 */
export function isRollHistory(target: Presentable): target is RollHistory {
  return !("type" in target) && "rolls" in target;
}

/**
 * Narrows a presentable to an expression result by the presence of `type`.
 * This is a shallow shape check, not validation of the result or its type.
 */
export function isExpressionResult(
  target: Presentable,
): target is ExpressionResult {
  return "type" in target;
}
