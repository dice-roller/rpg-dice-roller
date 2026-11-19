import { ValidationError } from "../errors/ValidationError.js";
import { EvaluationError } from "../errors/EvaluationError.js";
import {
  BINARY_OPERATORS,
  COMPARE_OPERATORS,
  MATH_FUNCTION_NAMES,
} from "./nodes.js";
import type { ExpressionNode } from "./nodes.js";

/** Validates expression structure without resolving any references. */
export function validateExpression(
  node: unknown,
): asserts node is ExpressionNode {
  validateNode(node);
}

function validateNode(node: unknown): void {
  if (typeof node !== "object" || node === null) {
    throw new ValidationError("Expected an expression node");
  }

  const expression = node as Record<string, unknown>;

  switch (expression.type) {
    case "number":
      if (typeof expression.value !== "number") {
        throw new ValidationError("A number node must contain a numeric value");
      }
      return;
    case "reference": {
      const path = expression.path;

      if (
        !["system", "data"].includes(expression.namespace as string) ||
        !Array.isArray(path) ||
        path.length === 0 ||
        !path.every(
          (segment) =>
            typeof segment === "string" &&
            /^[A-Za-z_][A-Za-z0-9_]*$/.test(segment),
        )
      ) {
        throw new ValidationError("Invalid reference node");
      }

      return;
    }
    case "pool": {
      validateNode(expression.qty);

      const die = expression.die;

      if (
        typeof die !== "object" ||
        die === null ||
        (die as Record<string, unknown>).type !== "die" ||
        typeof (die as Record<string, unknown>).name !== "string" ||
        !Array.isArray((die as Record<string, unknown>).args)
      ) {
        throw new ValidationError("A pool must contain a valid die node");
      }

      for (const arg of (die as { args: unknown[] }).args) {
        validateNode(arg);
      }

      if (!Array.isArray(expression.modifiers)) {
        throw new ValidationError("A pool's modifiers must be a list");
      }

      expression.modifiers.forEach(validateModifierStructure);
      validateDescriptionStructure(expression.description);

      return;
    }
    case "group":
      if (
        !Array.isArray(expression.expressions) ||
        expression.expressions.length === 0
      ) {
        throw new ValidationError(
          "A group must contain at least one expression",
        );
      }

      for (const child of expression.expressions) {
        validateNode(child);
      }

      if (!Array.isArray(expression.modifiers)) {
        throw new ValidationError("A group's modifiers must be a list");
      }

      expression.modifiers.forEach(validateModifierStructure);
      validateDescriptionStructure(expression.description);

      return;
    case "binary":
      if (
        !BINARY_OPERATORS.includes(
          expression.op as (typeof BINARY_OPERATORS)[number],
        )
      ) {
        throw new EvaluationError(
          "A binary node must contain a valid operator",
        );
      }

      validateNode(expression.left);
      validateNode(expression.right);

      return;
    case "comparison":
      if (
        !COMPARE_OPERATORS.includes(
          expression.op as (typeof COMPARE_OPERATORS)[number],
        )
      ) {
        throw new EvaluationError(
          "A comparison node must contain a valid operator",
        );
      }

      validateNode(expression.left);
      validateNode(expression.right);
      return;
    case "unary":
      if (expression.op !== "-") {
        throw new EvaluationError("A unary node must contain a valid operator");
      }

      validateNode(expression.operand);
      return;
    case "paren":
      validateNode(expression.expression);
      return;
    case "function":
      if (
        !MATH_FUNCTION_NAMES.includes(
          expression.name as (typeof MATH_FUNCTION_NAMES)[number],
        ) ||
        !Array.isArray(expression.args)
      ) {
        throw new EvaluationError(
          "A function node must contain a valid name and argument list",
        );
      }

      for (const arg of expression.args) {
        validateNode(arg);
      }

      return;
    case "conditional":
      validateNode(expression.condition);
      if (expression.trueBranch !== null) {
        validateNode(expression.trueBranch);
      }

      if (
        expression.falseBranch === undefined ||
        expression.falseBranch === null
      ) {
        throw new ValidationError(
          "A conditional expression requires a false branch",
        );
      }

      validateNode(expression.falseBranch);
      return;
    default:
      throw new EvaluationError(
        `Unknown expression node type: ${String(expression.type)}`,
      );
  }
}

function validateDescriptionStructure(description: unknown): void {
  if (description === undefined) {
    return;
  }

  if (
    typeof description !== "object" ||
    description === null ||
    typeof (description as Record<string, unknown>).text !== "string" ||
    !["inline", "block"].includes(
      String((description as Record<string, unknown>).style),
    )
  ) {
    throw new ValidationError("Invalid description node");
  }
}

function validateModifierStructure(value: unknown): void {
  if (typeof value !== "object" || value === null) {
    throw new ValidationError("Invalid modifier node");
  }

  const modifier = value as Record<string, unknown>;
  const optionalNumber = (name: string) =>
    modifier[name] === undefined || typeof modifier[name] === "number";
  const compare = (point: unknown) =>
    point === undefined ||
    (typeof point === "object" &&
      point !== null &&
      COMPARE_OPERATORS.includes(
        (point as Record<string, unknown>)
          .operator as (typeof COMPARE_OPERATORS)[number],
      ) &&
      typeof (point as Record<string, unknown>).value === "number" &&
      Number.isFinite((point as Record<string, unknown>).value));

  if (modifier.type !== "modifier") {
    throw new ValidationError("Invalid modifier node");
  }

  let valid = false;

  switch (modifier.name) {
    case "explode":
      valid =
        typeof modifier.compound === "boolean" &&
        typeof modifier.penetrate === "boolean" &&
        optionalNumber("limit") &&
        optionalNumber("amount") &&
        compare(modifier.comparePoint);
      break;
    case "explode-matching-batch":
      valid =
        (modifier.limit === undefined ||
          isPositiveSafeInteger(modifier.limit)) &&
        compare(modifier.comparePoint) &&
        compare(modifier.failureComparePoint);
      break;
    case "re-roll":
      valid =
        typeof modifier.once === "boolean" &&
        optionalNumber("limit") &&
        optionalNumber("amount") &&
        compare(modifier.comparePoint);
      break;
    case "unique":
      valid =
        typeof modifier.once === "boolean" &&
        optionalNumber("limit") &&
        compare(modifier.comparePoint);
      break;
    case "target":
      valid =
        Array.isArray(modifier.rules) &&
        modifier.rules.every((rule: unknown) => {
          if (typeof rule !== "object" || rule === null) {
            return false;
          }

          const r = rule as Record<string, unknown>;

          return (
            (r.kind === "success" || r.kind === "failure") &&
            r.comparePoint !== undefined &&
            compare(r.comparePoint) &&
            (r.amount === undefined || typeof r.amount === "number")
          );
        });
      break;
    case "keep":
    case "drop":
      valid =
        (modifier.end === "h" || modifier.end === "l") &&
        typeof modifier.qty === "number";
      break;
    case "sort":
      valid = modifier.direction === "a" || modifier.direction === "d";
      break;
    case "min":
    case "max":
      valid = typeof modifier.value === "number";
      break;
    case "critical-success":
    case "critical-failure":
      valid = compare(modifier.comparePoint);
      break;
  }

  if (!valid) {
    throw new ValidationError("Invalid modifier node");
  }
}

export function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function normalizeModifierLimit(
  limit: unknown,
  once = false,
): number | undefined {
  if (limit === undefined) {
    return undefined;
  }

  if (!isPositiveSafeInteger(limit)) {
    throw new ValidationError(
      "A modifier limit must be a positive safe integer",
    );
  }

  if (once) {
    if (limit !== 1) {
      throw new ValidationError(
        "A once modifier cannot have a limit other than 1",
      );
    }

    return undefined;
  }

  return limit;
}

export function normalizeModifierAmount(amount: unknown): number | undefined {
  if (amount === undefined) {
    return undefined;
  }

  if (!isPositiveSafeInteger(amount)) {
    throw new ValidationError(
      "A modifier amount must be a positive safe integer",
    );
  }

  return amount;
}
