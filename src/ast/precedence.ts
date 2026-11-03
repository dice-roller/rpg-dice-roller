import type { BinaryOperator, ExpressionNode } from "./nodes.js";

/** Precedence levels, matching the grammar (higher binds tighter). */
const ADDITIVE = 1;
const MULTIPLICATIVE = 2;
const UNARY = 3;
const POWER = 4;
const PRIMARY = 5;

const operatorPrecedence: Record<BinaryOperator, number> = {
  "+": ADDITIVE,
  "-": ADDITIVE,
  "*": MULTIPLICATIVE,
  "/": MULTIPLICATIVE,
  "%": MULTIPLICATIVE,
  "^": POWER,
};

export function precedenceOf(node: ExpressionNode): number {
  switch (node.type) {
    case "binary":
      return operatorPrecedence[node.op];
    case "unary":
      return UNARY;
    case "number":
      return node.value < 0 ? UNARY : PRIMARY;
    default:
      return PRIMARY;
  }
}

export function minPrecedenceForBinaryOperand(
  operator: BinaryOperator,
  side: "left" | "right",
): number {
  const precedence = operatorPrecedence[operator];

  if (operator === "^") {
    return side === "left" ? PRIMARY : UNARY;
  }

  return side === "left" ? precedence : precedence + 1;
}

export function minPrecedenceForUnaryOperand(): number {
  return POWER;
}

export function needsParentheses(
  node: ExpressionNode,
  minPrecedence: number,
): boolean {
  return precedenceOf(node) < minPrecedence;
}
