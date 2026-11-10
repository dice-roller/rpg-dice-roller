/**
 * Public builders for creating rolls in code, without notation.
 *
 * For supported notation they can produce the same nodes as the parser, e.g.
 * `pool(4, 6, { modifiers: [keep("h", 3)] })` equals `parse("4d6kh3")`.
 *
 * Numbers are accepted anywhere an expression is expected, and `pool()` accepts a number of sides
 * (`standard`), an expression for computed sides, or a `DieNode` for any registered die
 * (`die("fib")`, `die("range", -2, 3)`).
 *
 * Builders validate direct inputs at runtime, e.g. `keep("h", 0)` and `compare(">=", NaN)` throw
 * `ValidationError`. Supplied nodes are checked by discriminator, not recursively validated or
 * copied. Quantity, die arguments, function arity and registry availability are checked when
 * evaluated where applicable; constructing a node does not guarantee it can be rolled or parsed.
 */
import { ValidationError } from "../errors/ValidationError.js";
import {
  createBinary,
  createComparePoint,
  createCriticalFailure,
  createCriticalSuccess,
  createDescription,
  createDie,
  createDrop,
  createExplode,
  createFunction,
  createGroup,
  createKeep,
  createMax,
  createMin,
  createNumber,
  createParen,
  createPool,
  createReRoll,
  createSort,
  createTarget,
  createUnary,
  createUnique,
} from "./factory.js";
import {
  BINARY_OPERATORS,
  COMPARE_OPERATORS,
  MATH_FUNCTION_NAMES,
} from "./nodes.js";
import type {
  BinaryNode,
  BinaryOperator,
  ComparePoint,
  CompareOperator,
  CriticalFailureNode,
  CriticalSuccessNode,
  DescriptionNode,
  DieNode,
  DropNode,
  ExplodeNode,
  ExpressionNode,
  FunctionNode,
  GroupNode,
  KeepNode,
  MathFunctionName,
  MaxNode,
  MinNode,
  ModifierNode,
  NumberNode,
  ParenNode,
  PoolEnd,
  PoolNode,
  ReRollNode,
  SortDirection,
  SortNode,
  TargetNode,
  TargetRule,
  UnaryNode,
  UniqueNode,
} from "./nodes.js";

/** A number or an expression node. */
export type ExpressionInput = number | ExpressionNode;

/**
 * The die of a pool: a number of sides or an expression (a `standard` die, e.g. `6` or
 * `paren(binary("+", 2, 3))`), or a `DieNode` from `die()`.
 */
export type DieInput = ExpressionInput | DieNode;

/** Options shared by pools and groups. */
export interface ModifiableOptions {
  /** Repeated names use the last node at the first position; keep and drop are keyed by end. */
  modifiers?: readonly ModifierNode[];
  /** Text is trimmed and must be nonempty; a string is stored as an `inline` description. */
  description?: string | DescriptionNode;
}

/* ------------------------------------------------------------------------------------------------
 * Expressions
 * --------------------------------------------------------------------------------------------- */

/** A literal number. */
export function num(value: number): NumberNode {
  return createNumber(finite(value, "A number"));
}

/**
 * A reference to a die factory, e.g. `die("percentile")` for `d%`, or `die("range", -2, 3)`.
 * Register custom names in the die registry used by the evaluator before rolling. Registration is
 * not checked here; valid literal `range` and `face` dice use brace notation, while custom names
 * and unsupported arguments have display-only notation.
 */
export function die(name: string, ...args: ExpressionInput[]): DieNode {
  if (typeof name !== "string" || name === "") {
    throw new ValidationError("A die needs a name");
  }

  return createDie(name, args.map(expression));
}

/** A pool of dice, e.g. `pool(4, 6)` for `4d6`, or `pool(2, die("fib"))`. */
export function pool(
  qty: ExpressionInput,
  die: DieInput,
  options: ModifiableOptions = {},
): PoolNode {
  const dieNode = isNode(die, "die")
    ? die
    : createDie("standard", [expression(die)]);

  return createPool(
    expression(qty),
    dieNode,
    modifierList(options.modifiers),
    description(options.description),
  );
}

/** A roll group, e.g. `group([pool(4, 6), pool(2, 8)])` for `{4d6, 2d8}`. */
export function group(
  expressions: readonly ExpressionInput[],
  options: ModifiableOptions = {},
): GroupNode {
  if (!Array.isArray(expressions) || expressions.length === 0) {
    throw new ValidationError("A group needs at least one expression");
  }

  return createGroup(
    expressions.map(expression),
    modifierList(options.modifiers),
    description(options.description),
  );
}

/** A binary operation, e.g. `binary("+", pool(2, 6), 3)` for `2d6+3`. */
export function binary(
  op: BinaryOperator,
  left: ExpressionInput,
  right: ExpressionInput,
): BinaryNode {
  return createBinary(
    oneOf(op, BINARY_OPERATORS, "binary operator"),
    expression(left),
    expression(right),
  );
}

/** A unary minus. */
export function negate(operand: ExpressionInput): UnaryNode {
  return createUnary(expression(operand));
}

/** A parenthesised expression. */
export function paren(expressionInput: ExpressionInput): ParenNode {
  return createParen(expression(expressionInput));
}

/** A maths function call, e.g. `fn("floor", binary("/", pool(2, 6), 2))`. Arity is checked at evaluation. */
export function fn(
  name: MathFunctionName,
  ...args: ExpressionInput[]
): FunctionNode {
  return createFunction(
    oneOf(name, MATH_FUNCTION_NAMES, "maths function"),
    args.map(expression),
  );
}

/* ------------------------------------------------------------------------------------------------
 * Compare points
 * --------------------------------------------------------------------------------------------- */

/** A compare point, e.g. `compare(">=", 8)`. */
export function compare(
  operator: CompareOperator,
  value: number,
): ComparePoint {
  return createComparePoint(
    oneOf(operator, COMPARE_OPERATORS, "compare operator"),
    finite(value, "A compare point value"),
  );
}

/* ------------------------------------------------------------------------------------------------
 * Modifiers
 * --------------------------------------------------------------------------------------------- */

/**
 * Explode matching rolls. An optional positive safe-integer `limit` bounds additional rolls per
 * initial die and is capped by the roll context's `maxIterations`.
 */
export function explode(
  options: {
    compound?: boolean;
    penetrate?: boolean;
    comparePoint?: ComparePoint;
    limit?: number;
  } = {},
): ExplodeNode {
  return createExplode(
    options.compound ?? false,
    options.penetrate ?? false,
    optionalComparePoint(options.comparePoint),
    options.limit,
  );
}

/** A target block starts with a success and can contain further success or failure rules. Amounts are 1–10 and default to 1; the last matching rule wins. */
export function target(rules: readonly TargetRule[]): TargetNode;
/** Count successes and optional failures using unweighted compare points. */
export function target(
  success: ComparePoint,
  failure?: ComparePoint,
): TargetNode;
export function target(
  success: ComparePoint | readonly TargetRule[],
  failure?: ComparePoint,
): TargetNode {
  if (!Array.isArray(success)) {
    return createTarget(
      comparePoint(success as ComparePoint),
      optionalComparePoint(failure),
    );
  }

  if (failure !== undefined || success.length === 0) {
    throw new ValidationError(
      "A target needs a success rule and no second argument",
    );
  }

  const rules = success.map((rule: TargetRule, index: number): TargetRule => {
    if (
      (index === 0 && rule?.kind !== "success") ||
      (rule?.kind !== "success" && rule?.kind !== "failure")
    ) {
      throw new ValidationError(
        "A target block must start with a success and contain only success or failure rules",
      );
    }

    if (
      rule.amount !== undefined &&
      (!Number.isInteger(rule.amount) || rule.amount < 1 || rule.amount > 10)
    ) {
      throw new ValidationError(
        "A target amount must be an integer between 1 and 10",
      );
    }

    return {
      kind: rule.kind,
      comparePoint: comparePoint(rule.comparePoint),
      ...(rule.amount !== undefined && { amount: rule.amount }),
    };
  });

  return createTarget(rules);
}

/** Drop `qty` highest (`h`) or lowest (`l`) items; quantity defaults to 1. */
export function drop(end: PoolEnd, qty = 1): DropNode {
  return createDrop(poolEnd(end), positiveInteger(qty));
}

/** Keep `qty` highest (`h`) or lowest (`l`) items; quantity defaults to 1. */
export function keep(end: PoolEnd, qty = 1): KeepNode {
  return createKeep(poolEnd(end), positiveInteger(qty));
}

/**
 * Re-roll matching dice. `once` is the `ro` alias; numeric `limit: 1` has the same budget but
 * retains `r1` notation. Limits count additional rolls per die and cannot exceed the context cap.
 */
export function reRoll(
  options: {
    once?: boolean;
    comparePoint?: ComparePoint;
    limit?: number;
  } = {},
): ReRollNode {
  return createReRoll(
    options.once ?? false,
    optionalComparePoint(options.comparePoint),
    options.limit,
  );
}

/**
 * Re-roll duplicate dice. `once` is the `uo` alias; numeric `limit: 1` has the same budget but
 * retains `u1` notation. Limits count additional rolls per die and cannot exceed the context cap.
 */
export function unique(
  options: {
    once?: boolean;
    comparePoint?: ComparePoint;
    limit?: number;
  } = {},
): UniqueNode {
  return createUnique(
    options.once ?? false,
    optionalComparePoint(options.comparePoint),
    options.limit,
  );
}

/** Flag critical successes using the supplied compare point or the handler default. */
export function criticalSuccess(
  comparePoint?: ComparePoint,
): CriticalSuccessNode {
  return createCriticalSuccess(optionalComparePoint(comparePoint));
}

/** Flag critical failures using the supplied compare point or the handler default. */
export function criticalFailure(
  comparePoint?: ComparePoint,
): CriticalFailureNode {
  return createCriticalFailure(optionalComparePoint(comparePoint));
}

/** Sort ascending (`a`, the default) or descending (`d`). */
export function sort(direction: SortDirection = "a"): SortNode {
  return createSort(oneOf(direction, ["a", "d"] as const, "sort direction"));
}

/** Cap die values at `value` with the built-in handler. */
export function max(value: number): MaxNode {
  return createMax(finite(value, "A max value"));
}

/** Raise die values to at least `value` with the built-in handler. */
export function min(value: number): MinNode {
  return createMin(finite(value, "A min value"));
}

/* ------------------------------------------------------------------------------------------------
 * Validation
 * --------------------------------------------------------------------------------------------- */

const EXPRESSION_TYPES: ReadonlySet<string> = new Set<ExpressionNode["type"]>([
  "number",
  "pool",
  "group",
  "binary",
  "unary",
  "paren",
  "function",
]);

function isNode<T extends string>(
  value: unknown,
  type: T,
): value is { readonly type: T } {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === type
  );
}

function expression(input: ExpressionInput): ExpressionNode {
  if (typeof input === "number") {
    return num(input);
  }

  const type: unknown =
    typeof input === "object" && input !== null ? input.type : undefined;

  if (typeof type !== "string" || !EXPRESSION_TYPES.has(type)) {
    throw new ValidationError(
      `Expected a number or an expression node, got: ${JSON.stringify(input) ?? typeof input}`,
    );
  }

  return input;
}

function finite(value: number, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ValidationError(`${label} must be finite: ${String(value)}`);
  }

  return value;
}

function positiveInteger(value: number): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new ValidationError(
      `A modifier quantity must be a positive integer: ${String(value)}`,
    );
  }

  return value;
}

function oneOf<T extends string>(
  value: T,
  allowed: readonly T[],
  label: string,
): T {
  if (!allowed.includes(value)) {
    throw new ValidationError(`Unknown ${label}: ${String(value)}`);
  }

  return value;
}

function poolEnd(end: PoolEnd): PoolEnd {
  return oneOf(end, ["h", "l"] as const, "pool end");
}

function comparePoint(point: ComparePoint): ComparePoint {
  if (typeof point !== "object" || point === null) {
    throw new ValidationError(`Expected a compare point: ${String(point)}`);
  }

  return compare(point.operator, point.value);
}

function optionalComparePoint(
  point: ComparePoint | undefined,
): ComparePoint | undefined {
  return point === undefined ? undefined : comparePoint(point);
}

function modifierList(
  modifiers: readonly ModifierNode[] = [],
): readonly ModifierNode[] {
  const input: unknown = modifiers;

  if (
    !Array.isArray(input) ||
    !input.every((modifier: unknown) => isNode(modifier, "modifier"))
  ) {
    throw new ValidationError("Modifiers must be a list of modifier nodes");
  }

  return modifiers;
}

function description(
  input: string | DescriptionNode | undefined,
): DescriptionNode | undefined {
  if (input === undefined) {
    return undefined;
  }

  const text = typeof input === "string" ? input : input?.text;
  const style = typeof input === "string" ? "inline" : input?.style;

  if (typeof text !== "string" || text.trim() === "") {
    throw new ValidationError("Description text cannot be empty");
  }

  return createDescription(
    text.trim(),
    oneOf(style, ["inline", "block"] as const, "description style"),
  );
}
