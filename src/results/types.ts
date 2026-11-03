/**
 * The result tree.
 *
 * Expression results mirror the AST with a `type`, their source `node`, and a numeric `value`.
 * Pool dice and group members are scored items within that tree, not expression results, and do
 * not themselves have a `node`. Results are readonly plain data; values can be non-finite.
 */
import type {
  BinaryNode,
  FunctionNode,
  GroupNode,
  NumberNode,
  ParenNode,
  PoolNode,
  UnaryNode,
} from "../ast/nodes.js";
import type { DieSnapshot } from "../dice/types.js";
import type { ResultFlag } from "./flags.js";

/** A die roll or group member that modifier handlers can transform using the result helpers. */
export interface ScoredItem {
  /** The value after modifiers (e.g. after re-rolls, or `max` / `min`). */
  readonly value: number;
  /** The value used in totals (e.g. `1` / `-1` / `0` for target successes / failures). */
  readonly calculationValue: number;
  /** `false` when dropped (or otherwise excluded from the total). */
  readonly useInTotal: boolean;
  /** Semantic markers for presenters; setting a flag alone does not change the total. */
  readonly flags: readonly ResultFlag[];
}

/** A result for an expression node; individual dice and group members are nested within it. */
export type ExpressionResult =
  | NumberResult
  | PoolResult
  | GroupResult
  | BinaryResult
  | UnaryResult
  | ParenResult
  | FunctionResult;

/** The `type` of every expression result. */
export type ExpressionResultType = ExpressionResult["type"];

/** The result of a numeric literal. */
export interface NumberResult {
  readonly type: "number";
  readonly node: NumberNode;
  readonly value: number;
}

/** A single die roll in a pool. */
export interface DieResult extends ScoredItem {
  readonly type: "die";
  /** The value originally rolled, before any modifiers. */
  readonly initialValue: number;
}

/** A pool's evaluated quantity, die arguments, die snapshot and modified rolls. */
export interface PoolResult {
  readonly type: "pool";
  readonly node: PoolNode;
  /** The sum of `calculationValue` for the rolls that are `useInTotal`. */
  readonly value: number;
  readonly qty: ExpressionResult;
  /** The evaluated `node.die.args`, e.g. the `6` in `d6` or the `(2+3)` in `d(2+3)`. */
  readonly dieArgs: readonly ExpressionResult[];
  /** The values of the die the factory created, for presenters. */
  readonly die: DieSnapshot;
  readonly rolls: readonly DieResult[];
}

/** One expression of a roll group, with scoring separate from its nested expression result. */
export interface GroupMemberResult extends ScoredItem {
  readonly type: "group-member";
  /** The evaluated expression; scoring changes to the member need not change this result. */
  readonly result: ExpressionResult;
}

/** A group of evaluated members after its modifiers have been applied. */
export interface GroupResult {
  readonly type: "group";
  readonly node: GroupNode;
  /** The sum of `calculationValue` for members included in the total. */
  readonly value: number;
  readonly members: readonly GroupMemberResult[];
}

/** A binary operation and its evaluated operands. */
export interface BinaryResult {
  readonly type: "binary";
  readonly node: BinaryNode;
  readonly value: number;
  readonly left: ExpressionResult;
  readonly right: ExpressionResult;
}

/** A unary operation and its evaluated operand. */
export interface UnaryResult {
  readonly type: "unary";
  readonly node: UnaryNode;
  readonly value: number;
  readonly operand: ExpressionResult;
}

/** A parenthesised expression and its evaluated inner result. */
export interface ParenResult {
  readonly type: "paren";
  readonly node: ParenNode;
  readonly value: number;
  readonly inner: ExpressionResult;
}

/** A maths function and its evaluated arguments. */
export interface FunctionResult {
  readonly type: "function";
  readonly node: FunctionNode;
  readonly value: number;
  readonly args: readonly ExpressionResult[];
}
