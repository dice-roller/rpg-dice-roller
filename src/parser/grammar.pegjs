// Dice notation grammar
// =====================
//
// Emits the plain-data AST from `src/ast/nodes.ts`, using the creators in `src/ast/factory.ts`.
//
// Precedence (lowest to highest) matches mathjs:
//   Additive        + -          left-associative
//   Multiplicative  * / %        left-associative
//   Unary           -            only directly before a number (as in v5)
//   Power           ^ **         right-associative, binds tighter than unary minus (-2^2 = -4)
//   Primary         functions, dice pools, roll groups, numbers, ( expression )
//
// Parse options:
//   maxQty  the maximum literal quantity of a dice pool (default 999)

{{
import * as ast from "../../ast/factory.js";
import { DEFAULT_ROLL_LIMITS } from "../../evaluator/RollContext.js";

const DEFAULT_MAX_QTY = DEFAULT_ROLL_LIMITS.maxQty;

// Whether the node only contains numbers and operators (no dice, groups, functions or parentheses)
function isNumericMaths(node) {
  switch (node.type) {
    case "number":
      return true;
    case "unary":
      return isNumericMaths(node.operand);
    case "binary":
      return isNumericMaths(node.left) && isNumericMaths(node.right);
    default:
      return false;
  }
}

// Whether the node contains a binary operator
function hasOperator(node) {
  switch (node.type) {
    case "binary":
      return true;
    case "unary":
      return hasOperator(node.operand);
    default:
      return false;
  }
}
}}

{
// As in v5, description text is trimmed, and empty descriptions are rejected
function createDescription(text, style) {
  const trimmed = text.trim();

  if (trimmed === "") {
    error("Description text cannot be empty");
  }

  return ast.createDescription(trimmed, style);
}
}

Start
  = Expression


// Expressions, by precedence

Expression
  = Additive

Additive
  = head:Multiplicative tail:(_ @AdditiveOperator _ @Multiplicative)* {
    return ast.createLeftAssociative(head, tail);
  }

AdditiveOperator
  = "+" / "-"

Multiplicative
  = head:Unary tail:(_ @MultiplicativeOperator _ @Unary)* {
    return ast.createLeftAssociative(head, tail);
  }

MultiplicativeOperator
  = "*" / "/" / "%"

// v5 only accepted a minus sign as part of a number, so it must be directly followed by a number
// (and not a dice pool such as `-4d6`)
Unary
  = "-" &(Decimal !"d") operand:Power {
    return ast.createUnary(operand);
  }
  / Power

Power
  = base:Primary exponent:(_ PowerOperator _ @Unary)? {
    return exponent ? ast.createBinary("^", base, exponent) : base;
  }

PowerOperator
  = "^" / "**"

Primary
  = MathFunction
  / DicePool
  / RollGroup
  / Number
  / "(" _ expression:Expression _ ")" {
    return ast.createParen(expression);
  }


// Maths functions

MathFunction
  = name:UnaryFunctionName "(" _ arg:Expression _ ")" {
    return ast.createFunction(name, [arg]);
  }
  / name:BinaryFunctionName "(" _ first:Expression _ "," _ second:Expression _ ")" {
    return ast.createFunction(name, [first, second]);
  }

UnaryFunctionName
  = "abs" / "ceil" / "cos" / "exp" / "floor" / "log" / "round" / "sign" / "sin" / "sqrt" / "tan" / "trunc"

BinaryFunctionName
  = "pow" / "max" / "min"


// Dice pools, e.g. `4d6`, `d%`, `2dF.1`, `(1+2)d(3*2)`

DicePool
  = qty:Quantity? "d" die:Die modifiers:Modifier* description:Descriptions {
    const maxQty = options.maxQty ?? DEFAULT_MAX_QTY;

    if (qty && qty.type === "number" && qty.value > maxQty) {
      error(`Dice quantity must be between 1 and ${maxQty}`);
    }

    return ast.createPool(qty ?? ast.createNumber(1), die, modifiers, description);
  }

Quantity
  = value:PositiveInteger {
    return ast.createNumber(value);
  }
  / ComputedValue

// A reference to a die factory in the `DieRegistry`, resolved by the evaluator
Die
  = "%" {
    return ast.createDie("percentile");
  }
  / "F" nonBlanks:("." @[12])? {
    // `dF.2` keeps its argument, so the notation round-trips
    return ast.createDie("fudge", nonBlanks ? [ast.createNumber(Number(nonBlanks))] : []);
  }
  / sides:PositiveInteger {
    return ast.createDie("standard", [ast.createNumber(sides)]);
  }
  / sides:ComputedValue {
    return ast.createDie("standard", [sides]);
  }

// Numeric maths in parentheses, with at least one operator, e.g. `(2+3)`
ComputedValue
  = "(" _ expression:Expression _ ")" &{ return isNumericMaths(expression) && hasOperator(expression); } {
    return ast.createParen(expression);
  }


// Roll groups, e.g. `{4d6+2d8, 3d20}k1`

RollGroup
  = "{" _ head:Expression tail:(_ "," _ @Expression)* _ "}" modifiers:Modifier* description:Descriptions {
    return ast.createGroup([head, ...tail], modifiers, description);
  }


// Modifiers

Modifier
  = ExplodeModifier
  / TargetModifier
  / DropModifier
  / KeepModifier
  / ReRollModifier
  / UniqueModifier
  / CriticalSuccessModifier
  / CriticalFailureModifier
  / SortModifier
  / MaxModifier
  / MinModifier

// `!`, `!!` (compound), `!p` (penetrate)
ExplodeModifier
  = "!" compound:"!"? penetrate:"p"? comparePoint:ComparePoint? {
    return ast.createExplode(compound !== null, penetrate !== null, comparePoint ?? undefined);
  }

// `>=8`, `>=8f<=2`
TargetModifier
  = success:ComparePoint failure:("f" @ComparePoint)? {
    return ast.createTarget(success, failure ?? undefined);
  }

// `d1`, `dl1`, `dh1` (lowest by default)
DropModifier
  = "d" end:[lh]? qty:PositiveInteger {
    return ast.createDrop(end ?? "l", qty);
  }

// `k1`, `kh1`, `kl1` (highest by default)
KeepModifier
  = "k" end:[lh]? qty:PositiveInteger {
    return ast.createKeep(end ?? "h", qty);
  }

// `r`, `ro`, `r<3`
ReRollModifier
  = "r" once:"o"? comparePoint:ComparePoint? {
    return ast.createReRoll(once !== null, comparePoint ?? undefined);
  }

// `u`, `uo`, `u=5`
UniqueModifier
  = "u" once:"o"? comparePoint:ComparePoint? {
    return ast.createUnique(once !== null, comparePoint ?? undefined);
  }

// `cs`, `cs>18`
CriticalSuccessModifier
  = "cs" comparePoint:ComparePoint? {
    return ast.createCriticalSuccess(comparePoint ?? undefined);
  }

// `cf`, `cf<3`
CriticalFailureModifier
  = "cf" comparePoint:ComparePoint? {
    return ast.createCriticalFailure(comparePoint ?? undefined);
  }

// `s`, `sa`, `sd` (ascending by default)
SortModifier
  = "s" direction:[ad]? {
    return ast.createSort(direction ?? "a");
  }

// `max5`
MaxModifier
  = "max" value:SignedDecimal {
    return ast.createMax(value);
  }

// `min2`
MinModifier
  = "min" value:SignedDecimal {
    return ast.createMin(value);
  }


// Compare points

ComparePoint
  = operator:CompareOperator value:SignedDecimal {
    return ast.createComparePoint(operator, value);
  }

CompareOperator
  = "!=" / "<=" / ">=" / "=" / "<>" / ">" / "<"


// Numbers

Number
  = value:Decimal {
    return ast.createNumber(value);
  }

Decimal
  = [0-9]+ ("." [0-9]+)? {
    return parseFloat(text());
  }

SignedDecimal
  = "-"? Decimal {
    return parseFloat(text());
  }

PositiveInteger
  = [1-9] [0-9]* {
    return parseInt(text(), 10);
  }


// Descriptions

// Whitespace and descriptions after a pool or group; the first description is used
Descriptions "whitespace or description"
  = items:(WhiteSpace { return null; } / Description)* {
    return items.find((item) => item !== null);
  }

Description "description"
  = BlockDescription
  / InlineDescription

// `/* text */` or `[text]`
BlockDescription
  = "/*" text:$(!"*/" .)* "*/" {
    return createDescription(text, "block");
  }
  / "[" text:$[^\]]* "]" {
    return createDescription(text, "block");
  }

// `// text` or `# text`
InlineDescription
  = ("//" / "#") text:$(!LineTerminator .)* {
    return createDescription(text, "inline");
  }

LineTerminator
  = [\n\r\u2028\u2029]

WhiteSpace "whitespace"
  = [ \t\n\r]

_
  = WhiteSpace*
