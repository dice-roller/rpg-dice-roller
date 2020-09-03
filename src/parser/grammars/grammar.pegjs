// Dice Grammar
// ==========================
//

Main = Expression


// Expression / roll groups
RollGroup
  = "{" _ expr:Expression exprs:(_ "," _ Expression)* _ "}" modifiers:Modifier* {
    return new RollGroup(
      [
        expr,
        ...exprs.map(v => v[3])
      ],
      Object.assign({}, ...modifiers.map(item => {
        return {[item.name]: item};
      }))
    );
  }


// Dice

Dice = die:(StandardDie / PercentileDie / FudgeDie) modifiers:Modifier* {
  die.modifiers = Object.assign({}, ...modifiers.map(item => {
    return {[item.name]: item};
  }));

  return die;
}

StandardDie
  = qty:IntegerOrExpression? "d" sides:IntegerOrExpression {
    return new Dice.StandardDice(sides, qty || 1)
  }

PercentileDie
  = qty:IntegerOrExpression? "d%" {
    return new Dice.PercentileDice(qty || 1);
  }

FudgeDie
  = qty:IntegerOrExpression? "dF" sides:("." [12])? {
    return new Dice.FudgeDice(sides ? parseInt(sides[1], 10) : 2, qty || 1);
  }


// Modifiers

Modifier
  = ExplodeModifier
  / TargetModifier
  / DropModifier
  / KeepModifier
  / ReRollModifier
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

// Drop lowest/highest dice) - needs alternative syntax of `"-" ("h" | "l")`
DropModifier
  = "d" end:[lh]? qty:IntegerNumber {
    return new Modifiers.DropModifier(end || 'l', qty);
  }

// Keep lowest/highest dice) - needs alternative syntax of `"+" ("h" | "l")`
KeepModifier
  = "k" end:[lh]? qty:IntegerNumber {
    return new Modifiers.KeepModifier(end || 'h', qty);
  }

// Maximum roll value
MaxModifier
  = "max" max:FloatNumber {
    return new Modifiers.MaxModifier(max);
  }

// Minimum roll value
MinModifier
  = "min" min:FloatNumber {
    return new Modifiers.MinModifier(min);
  }

// Re-rolling Dice (Including Re-roll Once)
ReRollModifier
  = "r" once:"o"? comparePoint:ComparePoint? {
    return new Modifiers.ReRollModifier(!!once, comparePoint);
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
  = operator:CompareOperator value:FloatNumber {
    return new ComparePoint(operator, value);
  }

CompareOperator
  = "!=" / "<=" / ">=" / "=" / ">" / "<"


/**
 * Mathematical
 */

// Either a positive integer or an expression within parenthesis (Handy for dice qty or sides)
IntegerOrExpression
  = IntegerNumber
  / l:"(" _ expr:(FloatNumber (_ Operator _ FloatNumber)+) _ r:")" { return evaluate(text()) }

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

Factor
  = MathFunction
  / Dice
  / FloatNumber
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

FloatNumber
  = "-"? Number ([.] Number)? { return parseFloat(text()) }

IntegerNumber
  = [1-9] [0-9]* { return parseInt(text(), 10) }

Number
  = [0-9]+ { return parseInt(text(), 10) }

Operator
 = "**" { return "^" } / "*" / "^" / "%" / "/" / "+" / "-"


_ "whitespace"
  = [ \t\n\r]*
