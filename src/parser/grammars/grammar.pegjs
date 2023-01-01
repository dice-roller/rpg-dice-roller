// Dice Grammar
// ==========================
//

Main = Expression


// Expression / roll groups
RollGroup
  = "{" _ expr:Expression exprs:(_ "," _ Expression)* _ "}" modifiers:Modifier* descriptions:__ {
    return new RollGroup(
      [
        expr,
        ...exprs.map(v => v[3])
      ],
      Object.assign({}, ...modifiers.map(item => {
        return {[item.name]: item};
      })),
      descriptions.find((o) => o instanceof Description)
    );
  }


// Dice

Dice = die:(StandardDie / PercentileDie / FudgeDie / ArbitraryDie) modifiers:Modifier* descriptions:__ {
  die.modifiers = Object.assign({}, ...modifiers.map(item => {
    return {[item.name]: item};
  }));

  die.description = descriptions.find((o) => o instanceof Description);

  return die;
}

StandardDie
  = qty:DiceQty? "d" sides:IntegerOrExpression {
    return new Dice.StandardDice(sides, qty || 1)
  }

PercentileDie
  = qty:DiceQty? "d%" {
    return new Dice.PercentileDice(qty || 1);
  }

FudgeDie
  = qty:DiceQty? "dF" sides:("." [12])? {
    return new Dice.FudgeDice(sides ? parseInt(sides[1], 10) : 2, qty || 1);
  }

ArbitraryDie
  = qty:DiceQty? "d{" _ sides:SimpleExpressionRangeGroup _ "}" {
    return new Dice.ArbitraryDice(sides, qty || 1);
  }

DiceQty
  = IntegerOrExpression


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
  / SortingModifier
  / MaxModifier
  / MinModifier

// Explode, Penetrate, Compound modifier
ExplodeModifier
  = "!" compound:"!"? penetrate:"p"? comparePoint:ComparePoint? {
    return new Modifiers.ExplodeModifier(comparePoint, !!compound, !!penetrate);
  }

// Target / Success and Failure modifier
TargetModifier
  = successCP:ComparePoint failureCP:FailComparePoint? {
    return new Modifiers.TargetModifier(successCP, failureCP);
  }

// Drop lowest/highest dice)
DropModifier
  = "d" end:[lh]? qty:IntegerNumber {
    return new Modifiers.DropModifier(end || 'l', qty);
  }

// Keep lowest/highest dice)
KeepModifier
  = "k" end:[lh]? qty:IntegerNumber {
    return new Modifiers.KeepModifier(end || 'h', qty);
  }

// Maximum roll value
MaxModifier
  = "max" max:(FloatNumber / NegativeFloatNumber) {
    return new Modifiers.MaxModifier(max);
  }

// Minimum roll value
MinModifier
  = "min" min:(FloatNumber / NegativeFloatNumber) {
    return new Modifiers.MinModifier(min);
  }

// Re-rolling Dice (Including Re-roll Once)
ReRollModifier
  = "r" once:"o"? comparePoint:ComparePoint? {
    return new Modifiers.ReRollModifier(!!once, comparePoint);
  }

UniqueModifier
  = "u" once:"o"? comparePoint:ComparePoint? {
    return new Modifiers.UniqueModifier(!!once, comparePoint);
  }

// Critical success setting
CriticalSuccessModifier
  = "cs" comparePoint:ComparePoint {
    return new Modifiers.CriticalSuccessModifier(comparePoint);
  }

// Critical failure setting
CriticalFailureModifier
  = "cf" comparePoint:ComparePoint {
    return new Modifiers.CriticalFailureModifier(comparePoint);
  }

// Sort rolls when outputting
SortingModifier
  = "s" dir:("a" / "d")? {
    return new Modifiers.SortingModifier(dir || 'a');
  }


// Number comparisons

FailComparePoint
  = "f" comparePoint:ComparePoint { return comparePoint }

ComparePoint
  = operator:CompareOperator value:(FloatNumber / NegativeFloatNumber) {
    return new ComparePoint(operator, value);
  }

CompareOperator
  = "!=" / "<=" / ">=" / "=" / "<>" / ">" / "<"


/**
 * Mathematical
 */

// A comma separated group of integer / expression ranges
SimpleExpressionRangeGroup
  = expr:(SimpleExpressionRange / SimpleExpression) exprs:(_ "," _ (SimpleExpressionRange / SimpleExpression))* {
    return [
      expr,
      ...exprs.map(v => v[3]),
    ];
  }

// An expression range (e.g. `2...6`, `4:8`, `10:5:40`)
SimpleExpressionRange
  = start:SimpleExpression _ step:RangeStep _ end:SimpleExpression {
    return { start: evaluate(start), step, end: evaluate(end) };
  }

// Range step (Defaults to `1` if no value provided)
RangeStep
  = ":" step:(_ FloatNumber _ ":")? { return step?.[1] || 1 }
  / "..." { return 1 }

// Either a positive integer or an expression within parenthesis (Handy for dice qty or sides)
IntegerOrExpression
  = IntegerNumber
  / l:"(" _ expr:SimpleExpression _ r:")" { return evaluate(text()) }

// Generic expression
Expression
  = head:Factor tail:(_ Operator _ Factor)* {
    head = Array.isArray(head) ? head : [head];

    return [
      ...head,
      ...tail
        .map(([, value, , factor]) => {
          return [
            value,
            factor
          ];
        }).flat(2)
    ]
  }

SimpleExpression
  = head:SimpleFactor tail:(_ Operator _ SimpleFactor)* {
    head = Array.isArray(head) ? head : [head];

    return [
      ...head,
      ...tail
        .map(([, value, , factor]) => {
          return [
            value,
            factor,
          ];
        }).flat(2)
    ];
  }

SimpleFactor
  = FloatNumber
  / NegativeFloatNumber
  / l:"(" _ expr:SimpleExpression _ r:")" { return [l, ...expr, r] }

Factor
  = MathFunction
  / Dice
  / SimpleFactor
  / l:"(" _ expr:Expression _ r:")" { return [l, ...expr, r] }
  / RollGroup

MathFunction
  = func:("abs" / "ceil" / "cos" / "exp" / "floor" / "log" / "round" / "sign" / "sin" / "sqrt" / "tan") "(" _ expr:Expression _ ")" {
    return [
      `${func}(`,
      ...expr,
      ')',
    ];
  }
  / func:("pow" / "max" / "min") "(" _ expr1:Expression _ "," _ expr2:Expression _ ")" {
    return [
      `${func}(`,
      ...expr1,
      ',',
      ...expr2,
      ')',
    ];
  }

NegativeFloatNumber
  = "-" FloatNumber { return parseFloat(text()) }

FloatNumber
  = Number ([.] Number)? { return parseFloat(text()) }

IntegerNumber
  = [1-9] [0-9]* { return parseInt(text(), 10) }

Number
  = [0-9]+ { return parseInt(text(), 10) }

Operator
 = "**" { return "^" } / "*" / "^" / "%" / "/" / "+" / "-"


/**
 * Comments
 */

Comment "comment"
  = MultiLineComment
  / SingleLineComment

// allows comments in the format of /* .. */ and [ ... ]
MultiLineComment
  = "/*" text:(!"*/" .)* "*/" { return new Description(text.flat().join(''), Description.types.MULTILINE) }
  / "[" text:[^\]]* "]" { return new Description(text.flat().join(''), Description.types.MULTILINE) }

// allows comments in the format of // ... and # ...
SingleLineComment
  = ("//" / "#") text:(!LineTerminator .)* { return new Description(text.flat().join(''), Description.types.INLINE) }


LineTerminator
  = [\n\r\u2028\u2029]

WhiteSpace "whitespace"
  = [ \t\n\r]

_ = WhiteSpace*

__ "whitespace or comment"
  = (WhiteSpace / Comment)*
