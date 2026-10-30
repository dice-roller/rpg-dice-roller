/**
 * The result tree.
 *
 * Mirrors the AST: every result is readonly, JSON-safe plain data with a `type`, the `node` it came
 * from, and its numeric `value`.
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

/** Something modifiers act on: a single die roll, or a member of a roll group. */
export interface ScoredItem {
  /** The value after modifiers (e.g. after re-rolls, or `max` / `min`). */
  readonly value: number;
  /** The value used in totals (e.g. `1` / `-1` / `0` for target successes / failures). */
  readonly calculationValue: number;
  /** `false` when dropped (or otherwise excluded from the total). */
  readonly useInTotal: boolean;
  readonly flags: readonly ResultFlag[];
}

/** Any result. */
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

/** One expression of a roll group. */
export interface GroupMemberResult extends ScoredItem {
  readonly type: "group-member";
  readonly result: ExpressionResult;
}

export interface GroupResult {
  readonly type: "group";
  readonly node: GroupNode;
  readonly value: number;
  readonly members: readonly GroupMemberResult[];
}

export interface BinaryResult {
  readonly type: "binary";
  readonly node: BinaryNode;
  readonly value: number;
  readonly left: ExpressionResult;
  readonly right: ExpressionResult;
}

export interface UnaryResult {
  readonly type: "unary";
  readonly node: UnaryNode;
  readonly value: number;
  readonly operand: ExpressionResult;
}

export interface ParenResult {
  readonly type: "paren";
  readonly node: ParenNode;
  readonly value: number;
  readonly inner: ExpressionResult;
}

export interface FunctionResult {
  readonly type: "function";
  readonly node: FunctionNode;
  readonly value: number;
  readonly args: readonly ExpressionResult[];
}
