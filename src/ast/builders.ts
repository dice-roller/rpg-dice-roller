/**
 * Public builders for creating rolls in code, without notation.
 *
 * They produce exactly the same nodes as the parser, e.g.
 * `pool(4, 6, { modifiers: [keep("h", 3)] })` equals `parse("4d6kh3")`.
 *
 * Numbers are accepted anywhere an expression is expected, and `pool()` accepts a number of sides
 * (`standard`), an expression for computed sides, or a `DieNode` for any registered die
 * (`die("fib")`, `die("range", -2, 3)`).
 */
import { NotImplementedError } from "../errors/NotImplementedError.js";
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
  modifiers?: readonly ModifierNode[];
  /** A string is stored as an `inline` description. */
  description?: string | DescriptionNode;
}

/* ------------------------------------------------------------------------------------------------
 * Expressions
 * --------------------------------------------------------------------------------------------- */

/** A literal number. */
export function num(_value: number): NumberNode {
  throw new NotImplementedError("num()");
}

/**
 * A reference to a registered die factory, e.g. `die("percentile")` for `d%`, or
 * `die("range", -2, 3)`.
 */
export function die(_name: string, ..._args: ExpressionInput[]): DieNode {
  throw new NotImplementedError("die()");
}

/** A pool of dice, e.g. `pool(4, 6)` for `4d6`, or `pool(2, die("fib"))`. */
export function pool(
  _qty: ExpressionInput,
  _die: DieInput,
  _options?: ModifiableOptions,
): PoolNode {
  throw new NotImplementedError("pool()");
}

/** A roll group, e.g. `group([pool(4, 6), pool(2, 8)])` for `{4d6, 2d8}`. */
export function group(
  _expressions: readonly ExpressionInput[],
  _options?: ModifiableOptions,
): GroupNode {
  throw new NotImplementedError("group()");
}

/** A binary operation, e.g. `binary("+", pool(2, 6), 3)` for `2d6+3`. */
export function binary(
  _op: BinaryOperator,
  _left: ExpressionInput,
  _right: ExpressionInput,
): BinaryNode {
  throw new NotImplementedError("binary()");
}

/** A unary minus. */
export function negate(_operand: ExpressionInput): UnaryNode {
  throw new NotImplementedError("negate()");
}

/** A parenthesised expression. */
export function paren(_expression: ExpressionInput): ParenNode {
  throw new NotImplementedError("paren()");
}

/** A maths function call, e.g. `fn("floor", binary("/", pool(2, 6), 2))`. */
export function fn(
  _name: MathFunctionName,
  ..._args: ExpressionInput[]
): FunctionNode {
  throw new NotImplementedError("fn()");
}

/* ------------------------------------------------------------------------------------------------
 * Compare points
 * --------------------------------------------------------------------------------------------- */

/** A compare point, e.g. `compare(">=", 8)`. */
export function compare(
  _operator: CompareOperator,
  _value: number,
): ComparePoint {
  throw new NotImplementedError("compare()");
}

/* ------------------------------------------------------------------------------------------------
 * Modifiers
 * --------------------------------------------------------------------------------------------- */

export function explode(_options?: {
  compound?: boolean;
  penetrate?: boolean;
  comparePoint?: ComparePoint;
}): ExplodeNode {
  throw new NotImplementedError("explode()");
}

export function target(
  _success: ComparePoint,
  _failure?: ComparePoint,
): TargetNode {
  throw new NotImplementedError("target()");
}

export function drop(_end: PoolEnd, _qty = 1): DropNode {
  throw new NotImplementedError("drop()");
}

export function keep(_end: PoolEnd, _qty = 1): KeepNode {
  throw new NotImplementedError("keep()");
}

export function reRoll(_options?: {
  once?: boolean;
  comparePoint?: ComparePoint;
}): ReRollNode {
  throw new NotImplementedError("reRoll()");
}

export function unique(_options?: {
  once?: boolean;
  comparePoint?: ComparePoint;
}): UniqueNode {
  throw new NotImplementedError("unique()");
}

export function criticalSuccess(
  _comparePoint?: ComparePoint,
): CriticalSuccessNode {
  throw new NotImplementedError("criticalSuccess()");
}

export function criticalFailure(
  _comparePoint?: ComparePoint,
): CriticalFailureNode {
  throw new NotImplementedError("criticalFailure()");
}

export function sort(_direction: SortDirection = "a"): SortNode {
  throw new NotImplementedError("sort()");
}

export function max(_value: number): MaxNode {
  throw new NotImplementedError("max()");
}

export function min(_value: number): MinNode {
  throw new NotImplementedError("min()");
}
