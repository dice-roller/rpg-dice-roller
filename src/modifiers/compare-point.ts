import type { ComparePoint } from "../ast/nodes.js";
import { ValidationError } from "../errors/ValidationError.js";

/**
 * Whether the value matches the compare point, e.g. `matchesComparePoint({ operator: ">=", value: 8 }, 9)`.
 *
 * `!=` and `<>` both mean "not equal".
 *
 * @throws {ValidationError} the operator is unknown (e.g. from untyped or imported data)
 */
export function matchesComparePoint(
  comparePoint: ComparePoint,
  value: number,
): boolean {
  const { operator, value: target } = comparePoint;

  switch (operator) {
    case "=":
      return value === target;
    case "!=":
    case "<>":
      return value !== target;
    case "<":
      return value < target;
    case ">":
      return value > target;
    case "<=":
      return value <= target;
    case ">=":
      return value >= target;
    default: {
      const unknown: never = operator;

      throw new ValidationError(`Unknown compare operator: ${String(unknown)}`);
    }
  }
}
