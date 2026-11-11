import type { ExpressionResult } from "../results/types.js";
import { functions, negate, operators } from "./math.js";

/**
 * Evaluates an existing result using each pool's quantity and resolved die average.
 * No dice are rolled. Returns undefined if a modifier needs probability analysis, so the caller
 * can retain the previous midpoint calculation for that roll.
 *
 * Substituting averages is not a statistical mean for non-linear maths or random die parameters.
 */
export function averageResult(result: ExpressionResult): number | undefined {
  switch (result.type) {
    case "number":
      return result.value;
    case "pool":
      return result.node.modifiers.length > 0
        ? undefined
        : result.qty.value * result.die.average;
    case "group": {
      if (result.node.modifiers.length > 0) {
        return undefined;
      }

      const values = result.members.map(({ result }) => averageResult(result));

      return values.every((value) => value !== undefined)
        ? values.reduce((sum, value) => operators["+"](sum, value), 0)
        : undefined;
    }
    case "binary": {
      const left = averageResult(result.left);
      const right = averageResult(result.right);

      return left === undefined || right === undefined
        ? undefined
        : operators[result.node.op](left, right);
    }
    case "unary": {
      const value = averageResult(result.operand);

      return value === undefined ? undefined : negate(value);
    }
    case "paren":
      return averageResult(result.inner);
    case "function": {
      const args = result.args.map(averageResult);

      return args.every((value) => value !== undefined)
        ? functions[result.node.name](...args)
        : undefined;
    }
  }
}
