import type { ComparePoint } from "../ast/nodes.js";
import { NotImplementedError } from "../errors/NotImplementedError.js";

/**
 * Whether the value matches the compare point, e.g. `matchesComparePoint({ operator: ">=", value: 8 }, 9)`.
 *
 * `!=` and `<>` both mean "not equal".
 */
export function matchesComparePoint(
  _comparePoint: ComparePoint,
  _value: number,
): boolean {
  throw new NotImplementedError("matchesComparePoint()");
}
