/**
 * Converts AST nodes back to notation.
 *
 * Parsed notation round-trips (`parse(nodeToNotation(parse(n)))` equals `parse(n)`), using the
 * canonical form of each token: e.g. `1d6` becomes `d6`, and `k3` becomes `kh3`. Parentheses are
 * added where the tree needs them, so nodes from the builders are written correctly too.
 */
import type {
  BinaryOperator,
  ComparePoint,
  DescriptionNode,
  DieNode,
  ExpressionNode,
  ModifierNode,
  PoolNode,
} from "./nodes.js";

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

/** Converts the node to notation, e.g. `{ type: "pool", ... }` -> `4d6kh3`. */
export function nodeToNotation(node: ExpressionNode): string {
  // inline descriptions end with a line break, which isn't needed at the very end
  return write(node).trimEnd();
}

/** Converts a modifier node to notation, e.g. `kh3`. */
export function modifierToNotation(modifier: ModifierNode): string {
  switch (modifier.name) {
    case "explode": {
      const prefix = `!${modifier.compound ? "!" : ""}${modifier.penetrate ? "p" : ""}`;
      return `${prefix}${comparePoint(modifier.comparePoint, prefix === "!")}`;
    }
    case "target":
      return `${comparePoint(modifier.success, true)}${modifier.failure ? `f${comparePoint(modifier.failure)}` : ""}`;
    case "drop":
      return `d${modifier.end}${modifier.qty}`;
    case "keep":
      return `k${modifier.end}${modifier.qty}`;
    case "re-roll":
      return `r${modifier.once ? "o" : ""}${comparePoint(modifier.comparePoint)}`;
    case "unique":
      return `u${modifier.once ? "o" : ""}${comparePoint(modifier.comparePoint)}`;
    case "critical-success":
      return `cs${comparePoint(modifier.comparePoint)}`;
    case "critical-failure":
      return `cf${comparePoint(modifier.comparePoint)}`;
    case "sort":
      return `s${modifier.direction}`;
    case "max":
      return `max${modifier.value}`;
    case "min":
      return `min${modifier.value}`;
  }
}

function write(node: ExpressionNode): string {
  switch (node.type) {
    case "number":
      return String(node.value);
    case "pool":
      return writePool(node);
    case "group":
      return `{${node.expressions.map(write).join(", ")}}${modifiers(node.modifiers)}${description(node.description)}`;
    case "binary": {
      const precedence = operatorPrecedence[node.op];
      // `^` is right-associative, and its exponent may be a unary minus (`2^-1`)
      const leftMin = node.op === "^" ? PRIMARY : precedence;
      const rightMin = node.op === "^" ? UNARY : precedence + 1;

      return `${operand(node.left, leftMin)}${node.op}${operand(node.right, rightMin)}`;
    }
    case "unary":
      return `-${operand(node.operand, POWER)}`;
    case "paren":
      return `(${write(node.expression)})`;
    case "function":
      return `${node.name}(${node.args.map(write).join(", ")})`;
  }
}

function writePool(node: PoolNode): string {
  const qty =
    node.qty.type === "number" && node.qty.value === 1
      ? ""
      : parenthesised(node.qty);
  return `${qty}d${writeDie(node.die)}${modifiers(node.modifiers)}${description(node.description)}`;
}

/**
 * Writes the die after the `d`: `6`, `(2+3)`, `%`, `F`, `F.1`.
 *
 * Other dice (`range`, `face` and user-registered dice) have no notation yet, so they're written
 * as `name(args)`, e.g. `range(-2, 3)`. That is for display only and doesn't parse back.
 */
function writeDie(die: DieNode): string {
  const [first, ...rest] = die.args;

  if (die.name === "standard" && first && rest.length === 0) {
    return parenthesised(first);
  }

  if (die.name === "percentile" && !first) {
    return "%";
  }

  if (die.name === "fudge" && rest.length === 0) {
    if (!first) {
      return "F";
    }

    if (first.type === "number") {
      return `F.${first.value}`;
    }
  }

  // @todo this needs to use correct notation once decided on format
  return `${die.name}(${die.args.map(write).join(", ")})`;
}

function precedenceOf(node: ExpressionNode): number {
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

/** Writes the node, wrapped in parentheses if it binds looser than `minPrecedence`. */
function operand(node: ExpressionNode, minPrecedence: number): string {
  return precedenceOf(node) < minPrecedence ? `(${write(node)})` : write(node);
}

/** Writes a qty / sides: a literal number, or an expression in parentheses. */
function parenthesised(node: ExpressionNode): string {
  return node.type === "number" || node.type === "paren"
    ? write(node)
    : `(${write(node)})`;
}

function modifiers(nodes: readonly ModifierNode[]): string {
  return nodes.map(modifierToNotation).join("");
}

/**
 * Writes a compare point, e.g. `>=8`.
 *
 * `!=` straight after a plain `!`, or at the start of a target, would be read as (another) explode
 * (`!!=5` is a compound explode on `=5`, and `!=5` an explode on `=5`), so `notEqualAsDiamond`
 * writes the equivalent `<>` instead. The parser never produces these nodes, so parsed notation
 * still round-trips exactly.
 */
function comparePoint(
  point: ComparePoint | undefined,
  notEqualAsDiamond = false,
): string {
  if (!point) {
    return "";
  }

  const operator =
    notEqualAsDiamond && point.operator === "!=" ? "<>" : point.operator;

  return `${operator}${point.value}`;
}

function description(node: DescriptionNode | undefined): string {
  if (!node) {
    return "";
  }

  if (node.style === "inline") {
    return ` // ${node.text}\n`;
  }

  return node.text.includes("]") ? ` /* ${node.text} */` : ` [${node.text}]`;
}
