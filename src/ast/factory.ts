/**
 * Node creators used by the grammar.
 *
 * Trivial object constructors: no validation and no defaults beyond omitting missing optional
 * properties, so the nodes stay JSON round-trippable.
 */
import type {
  BinaryNode,
  BinaryOperator,
  ComparePoint,
  CompareOperator,
  CriticalFailureNode,
  CriticalSuccessNode,
  DescriptionNode,
  DescriptionStyle,
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

/* ------------------------------------------------------------------------------------------------
 * Expressions
 * --------------------------------------------------------------------------------------------- */

export function createNumber(value: number): NumberNode {
  return { type: "number", value };
}

export function createPool(
  qty: ExpressionNode,
  die: DieNode,
  modifiers: readonly ModifierNode[] = [],
  description?: DescriptionNode,
): PoolNode {
  return {
    type: "pool",
    qty,
    die,
    modifiers: createModifiers(modifiers),
    ...(description && { description }),
  };
}

export function createDie(
  name: string,
  args: readonly ExpressionNode[] = [],
): DieNode {
  return { type: "die", name, args };
}

export function createGroup(
  expressions: readonly ExpressionNode[],
  modifiers: readonly ModifierNode[] = [],
  description?: DescriptionNode,
): GroupNode {
  return {
    type: "group",
    expressions,
    modifiers: createModifiers(modifiers),
    ...(description && { description }),
  };
}

export function createBinary(
  op: BinaryOperator,
  left: ExpressionNode,
  right: ExpressionNode,
): BinaryNode {
  return { type: "binary", op, left, right };
}

/**
 * Folds `head (op operand)*` into left-associative binary nodes: `a - b - c` -> `(a - b) - c`.
 */
export function createLeftAssociative(
  head: ExpressionNode,
  tail: readonly (readonly [BinaryOperator, ExpressionNode])[],
): ExpressionNode {
  return tail.reduce<ExpressionNode>(
    (left, [op, right]) => createBinary(op, left, right),
    head,
  );
}

export function createUnary(operand: ExpressionNode): UnaryNode {
  return { type: "unary", op: "-", operand };
}

export function createParen(expression: ExpressionNode): ParenNode {
  return { type: "paren", expression };
}

export function createFunction(
  name: MathFunctionName,
  args: readonly ExpressionNode[],
): FunctionNode {
  return { type: "function", name, args };
}

/* ------------------------------------------------------------------------------------------------
 * Compare points and descriptions
 * --------------------------------------------------------------------------------------------- */

export function createComparePoint(
  operator: CompareOperator,
  value: number,
): ComparePoint {
  return { operator, value };
}

export function createDescription(
  text: string,
  style: DescriptionStyle,
): DescriptionNode {
  return { text, style };
}

/* ------------------------------------------------------------------------------------------------
 * Modifiers
 * --------------------------------------------------------------------------------------------- */

/**
 * De-duplicates modifiers, as in v5: a repeated modifier replaces the earlier one (last wins), but
 * keeps the earlier one's position.
 *
 * Keep and drop are de-duplicated per end, so `4d10dh1dl2` keeps both (as v5's `drop-h` /
 * `drop-l`), while `4d10dl1dl2` only keeps `dl2`.
 */
export function createModifiers(
  modifiers: readonly ModifierNode[],
): ModifierNode[] {
  const byKey = new Map<string, ModifierNode>();

  for (const modifier of modifiers) {
    byKey.set(modifierKey(modifier), modifier);
  }

  return [...byKey.values()];
}

function modifierKey(modifier: ModifierNode): string {
  if (modifier.name === "keep" || modifier.name === "drop") {
    return `${modifier.name}-${modifier.end}`;
  }

  return modifier.name;
}

export function createExplode(
  compound: boolean,
  penetrate: boolean,
  comparePoint?: ComparePoint,
): ExplodeNode {
  return {
    type: "modifier",
    name: "explode",
    compound,
    penetrate,
    ...(comparePoint && { comparePoint }),
  };
}

export function createTarget(rules: readonly TargetRule[]): TargetNode;
export function createTarget(
  success: ComparePoint,
  failure?: ComparePoint,
): TargetNode;
export function createTarget(
  input: ComparePoint | readonly TargetRule[],
  failure?: ComparePoint,
): TargetNode {
  const rules: readonly TargetRule[] = Array.isArray(input)
    ? input
    : [
        { kind: "success", comparePoint: input as ComparePoint },
        ...(failure
          ? [{ kind: "failure" as const, comparePoint: failure }]
          : []),
      ];
  return {
    type: "modifier",
    name: "target",
    rules,
  };
}

export function createDrop(end: PoolEnd, qty: number): DropNode {
  return { type: "modifier", name: "drop", end, qty };
}

export function createKeep(end: PoolEnd, qty: number): KeepNode {
  return { type: "modifier", name: "keep", end, qty };
}

export function createReRoll(
  once: boolean,
  comparePoint?: ComparePoint,
): ReRollNode {
  return {
    type: "modifier",
    name: "re-roll",
    once,
    ...(comparePoint && { comparePoint }),
  };
}

export function createUnique(
  once: boolean,
  comparePoint?: ComparePoint,
): UniqueNode {
  return {
    type: "modifier",
    name: "unique",
    once,
    ...(comparePoint && { comparePoint }),
  };
}

export function createCriticalSuccess(
  comparePoint?: ComparePoint,
): CriticalSuccessNode {
  return {
    type: "modifier",
    name: "critical-success",
    ...(comparePoint && { comparePoint }),
  };
}

export function createCriticalFailure(
  comparePoint?: ComparePoint,
): CriticalFailureNode {
  return {
    type: "modifier",
    name: "critical-failure",
    ...(comparePoint && { comparePoint }),
  };
}

export function createSort(direction: SortDirection): SortNode {
  return { type: "modifier", name: "sort", direction };
}

export function createMax(value: number): MaxNode {
  return { type: "modifier", name: "max", value };
}

export function createMin(value: number): MinNode {
  return { type: "modifier", name: "min", value };
}
