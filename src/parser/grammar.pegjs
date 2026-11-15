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
import { isPositiveSafeInteger } from "../../ast/validation.js";
import { customDieFaces, customDieRange } from "../../dice/custom-die-notation.js";
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

function modifierQuantity(value, name) {
  if (!/^[1-9][0-9]*$/.test(value)) {
    error(`${name} quantity must be a positive whole number without leading zeros`);
  }

  return parseInt(value, 10);
}

function createCustomFaceDie(faceTokens) {
  try {
    const faces = customDieFaces(faceTokens);
    return ast.createDie("face", faces.map(ast.createNumber));
  } catch (cause) {
    error(cause instanceof Error ? cause.message : String(cause));
  }
}

function createCustomRangeDie(start, end, step) {
  try {
    const range = customDieRange(start, end, step);

    if (range.kind === "range") {
      return ast.createDie("range", [
        ast.createNumber(range.start),
        ast.createNumber(range.end),
      ]);
    }

    return ast.createDie("face", range.faces.map(ast.createNumber));
  } catch (cause) {
    error(cause instanceof Error ? cause.message : String(cause));
  }
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
  = invalid:$("-"? Decimal) &"d" &{ return !/^[1-9][0-9]*$/.test(invalid); } {
    error("Dice quantity must be a positive whole number without leading zeros");
  }
  / qty:Quantity? "d" die:RequiredDie modifiers:Modifiers description:Descriptions {
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

// Only diagnose an invalid start after `d`. Once a custom die or computed value starts,
// keep Peggy's deeper failures instead of hiding them behind a name on the whole Die rule.
RequiredDie
  = !("%" / "F" / "{" / [1-9] / "(") invalid:$([0-9]+ / .)? {
    if (invalid === "0") {
      error("A standard die must have at least 1 side");
    }
    if (invalid && invalid.startsWith("0")) {
      error("The number of sides must not have leading zeros");
    }
    error('Expected a number of sides or a die type after "d" (e.g. d6, d%, dF or d{1,2,3})');
  }
  / Die

// A reference to a die factory in the `DieRegistry`, resolved by the evaluator
Die
  = CustomDie
  / "%" {
    return ast.createDie("percentile");
  }
  / "F" nonBlanks:("." @FudgeNonBlanks)? {
    // `dF.2` keeps its argument, so the notation round-trips
    return ast.createDie("fudge", nonBlanks ? [ast.createNumber(Number(nonBlanks))] : []);
  }
  / sides:PositiveInteger {
    return ast.createDie("standard", [ast.createNumber(sides)]);
  }
  / sides:ComputedValue {
    return ast.createDie("standard", [sides]);
  }

FudgeNonBlanks "1 or 2 after dF."
  = [12]

CustomDie
  = "{" _ start:CustomDieNumber tail:CustomDieTail? _ "}" {
    if (!tail) {
      return createCustomFaceDie([start]);
    }

    if (tail.kind === "faces") {
      return createCustomFaceDie([start, ...tail.values]);
    }

    return createCustomRangeDie(start, tail.end, tail.step);
  }

CustomDieTail
  = _ "," _ first:CustomDieNumber rest:(_ "," _ @CustomDieNumber)* {
    return { kind: "faces", values: [first, ...rest] };
  }
  / _ "..." _ end:CustomDieNumber {
    return { kind: "range", end };
  }
  / _ ":" _ step:CustomDieNumber _ ":" _ end:CustomDieNumber {
    return { kind: "stepped", step, end };
  }
  / _ ":" _ end:CustomDieNumber {
    return { kind: "range", end };
  }

CustomDieNumber
  = !([-+] / [0-9]) .? {
    expected("a number for a custom die face or range");
  }
  / [-+]? Decimal {
    return text();
  }

// Numeric maths in parentheses, with at least one operator, e.g. `(2+3)`
ComputedValue
  = "(" _ expression:Expression _ ")" &{ return isNumericMaths(expression) && hasOperator(expression); } {
    return ast.createParen(expression);
  }


// Roll groups, e.g. `{4d6+2d8, 3d20}k1`

RollGroup
  = "{" _ head:Expression tail:(_ "," _ @Expression)* _ "}" modifiers:Modifiers description:Descriptions {
    return ast.createGroup([head, ...tail], modifiers, description);
  }


// Modifiers

Modifiers
  = before:NonTargetModifier* target:TargetModifier? after:NonTargetModifier* {
    return [...before, ...(target ? [target] : []), ...after];
  }

NonTargetModifier
  = ExplodeModifier
  / DropModifier
  / KeepModifier
  / ReRollModifier
  / UniqueModifier
  / CriticalSuccessModifier
  / CriticalFailureModifier
  / SortModifier
  / MaxModifier
  / MinModifier

// `!`, `!!` (compound), `!p` (penetrate), with optional additional-roll limit and amount
ExplodeModifier
  = "!" compound:"!"? penetrate:"p"? limit:ModifierLimit? amount:ModifierAmount? comparePoint:ComparePoint? {
    return ast.createExplode(compound !== null, penetrate !== null, comparePoint ?? undefined, limit ?? undefined, amount ?? undefined);
  }

ModifierLimit
  = value:UnsignedDecimalToken {
    const limit = Number(value);
    if (!/^[1-9][0-9]*$/.test(value) || !isPositiveSafeInteger(limit)) {
      error("Modifier limit must be a positive safe integer without leading zeros");
    }
    return limit;
  }

ModifierAmount
  = ":" value:$([1-9] [0-9]*) ![0-9.] {
    const amount = Number(value);
    if (!isPositiveSafeInteger(amount)) {
      error("Modifier amount must be a positive safe integer");
    }
    return amount;
  }

// `>=8`, `>=8:2f<=2:1=10:3`
TargetModifier
  = success:TargetSuccess rest:(TargetSuccess / TargetFailure)* {
    return ast.createTarget([success, ...rest]);
  }

TargetSuccess
  = !"!=" comparePoint:ComparePoint amount:TargetAmount? {
    return { kind: "success", comparePoint, ...(amount !== null && { amount }) };
  }

TargetFailure
  = "f" comparePoint:ComparePoint amount:TargetAmount? {
    return { kind: "failure", comparePoint, ...(amount !== null && { amount }) };
  }

TargetAmount
  = ":" value:TargetAmountValue { return value; }

TargetAmountValue
  = value:UnsignedDecimalToken {
    const amount = Number(value);
    if (!/^[0-9]+$/.test(value) || !Number.isInteger(amount) || amount < 1 || amount > 10) {
      error("Target amount must be an integer between 1 and 10");
    }
    return amount;
  }
  / .? { expected("a target amount between 1 and 10 after ':'"); }

// `d1`, `dl1`, `dh1` (lowest by default)
DropModifier
  = "d" end:[lh]? qty:DropQuantity {
    return ast.createDrop(end ?? "l", qty);
  }

// `k1`, `kh1`, `kl1` (highest by default)
KeepModifier
  = "k" end:[lh]? qty:KeepQuantity {
    return ast.createKeep(end ?? "h", qty);
  }

KeepQuantity
  = value:UnsignedDecimalToken { return modifierQuantity(value, "Keep"); }
  / .? { expected("a positive keep quantity (e.g. kh1)"); }

DropQuantity
  = value:UnsignedDecimalToken { return modifierQuantity(value, "Drop"); }
  / .? { expected("a positive drop quantity (e.g. dl1)"); }

// `r`, `ro`, `r3`, `r<3`
ReRollModifier
  = "r" once:"o"? limit:ModifierLimit? amount:ModifierAmount? comparePoint:ComparePoint? {
    if (once !== null && limit !== null) {
      error("A re-roll modifier cannot combine the once alias and a numeric limit");
    }
    return ast.createReRoll(once !== null, comparePoint ?? undefined, limit ?? undefined, amount ?? undefined);
  }

// `u`, `uo`, `u3`, `u=5`
UniqueModifier
  = "u" once:"o"? limit:ModifierLimit? comparePoint:ComparePoint? {
    if (once !== null && limit !== null) {
      error("A unique modifier cannot combine the once alias and a numeric limit");
    }
    return ast.createUnique(once !== null, comparePoint ?? undefined, limit ?? undefined);
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
  = "max" value:MaxValue {
    return ast.createMax(value);
  }

// `min2`
MinModifier
  = "min" value:MinValue {
    return ast.createMin(value);
  }

MaxValue
  = !("-" / [0-9]) .? { expected("a number after 'max' (e.g. max5)"); }
  / SignedDecimal

MinValue
  = !("-" / [0-9]) .? { expected("a number after 'min' (e.g. min2)"); }
  / SignedDecimal


// Compare points

ComparePoint
  = operator:CompareOperator value:CompareValue {
    return ast.createComparePoint(operator, value);
  }

CompareValue
  = !("-" / [0-9]) .? { expected("a number after the comparison operator"); }
  / SignedDecimal

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

PositiveInteger "a positive whole number"
  = [1-9] [0-9]* {
    return parseInt(text(), 10);
  }

// Read the whole numeric token before diagnosing counts, so `1.5` is not reported as a
// valid `1` followed by unexpected punctuation. Each caller keeps its own validation rules.
UnsignedDecimalToken
  = $([0-9]+ ("." [0-9]*)?)


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
