// Dice Grammar
// ==========================
//

Main = Expression


// Dice groups
DiceGroup
  = "{" _ expr:Expression exprs:(_ "," _ Expression)* _ "}" modifiers:Modifier* {
    return {
      type: 'group',
      notation: text(),
      expressions: [
        expr,
        ...exprs.map(v => v[3])
      ],
      modifiers: Object.assign({}, ...modifiers.map(item => {
        return {[item.subType]: item};
      })),
    };
  }


// Dice

Dice = die:Die modifiers:Modifier* {
  return Object.assign(die, {
    modifiers: Object.assign({}, ...modifiers.map(item => {
      return {[item.subType]: item};
    })),
  });
}

Die = die:(StandardDie / PercentileDie / FudgeDie) { return Object.assign(die, {notation: text()}) }

// @todo sides should total the formula so we have a simple number
StandardDie
  = qty:DieQty? d:"d" sides:IntegerOrExpression {
    return {
      type: 'dice',
      subType: 'standard',
      qty: qty || 1,
      d,
      sides,
    }
  }

PercentileDie
  = qty:DieQty? d:"d" sides:"%" {
    return  {
      type: 'dice',
      subType: 'percentile',
      qty: qty || 1,
      d,
      sides: 100,
    }
  }

FudgeDie
  = qty:DieQty? d:"dF" sides:("." [12])? {
    return  {
      type: 'dice',
      subType: 'fudge',
      qty: qty || 1,
      d,
      sides: sides ? parseInt(sides[1], 10) : 2,
    }
  }

// Die quantity
// @todo this should total the formula so we have a simple number
DieQty = IntegerOrExpression


// Modifiers

Modifier = modifier:(ExplodeModifier / TargetModifier / DropModifier / KeepModifier / RerollModifier / CriticalSuccessModifier / CriticalFailModifier / SortingModifier) { return Object.assign(modifier, {notation: text()}) }

// Explode, Penetrate, Compound modifier
ExplodeModifier
  = "!" compound:"!"? penetrate:"p"? comparePoint:ComparePoint? {
    return {
      type: 'modifier',
      subType: 'explode',
      penetrate: !!penetrate,
      compound: !!compound,
      comparePoint,
    }
  }

// Target / Success and Failure modifier
TargetModifier
  = successCP:ComparePoint failureCP:FailComparePoint? {
    return {
      type: 'modifier',
      subType: 'target',
      successCP,
      failureCP,
    }
  }

// Drop lowest/highest dice) - needs alternative syntax of `"-" ("h" | "l")`
DropModifier
  = "d" end:[lh]? qty:IntegerNumber {
    return {
      type: 'modifier',
      subType: 'drop',
      end: end || 'l',
      qty,
    }
  }

// Keep lowest/highest dice) - needs alternative syntax of `"+" ("h" | "l")`
KeepModifier
  = "k" end:[lh]? qty:IntegerNumber {
    return {
      type: 'modifier',
      subType: 'keep',
      end: end || 'h',
      qty,
    }
  }

// Re-rolling Dice (Including Re-roll Once)
RerollModifier
  = "r" once:"o"? comparePoint:ComparePoint? {
    return {
      type: 'modifier',
      subType: 're-roll',
      once: !!once,
      comparePoint,
    }
  }

// Critical success setting
CriticalSuccessModifier
  = "cs" comparePoint:ComparePoint {
    return {
      type: 'modifier',
      subType: 'critical-success',
      comparePoint,
    }
  }

// Critical failure setting
CriticalFailModifier
  = "cf" comparePoint:ComparePoint {
    return {
      type: 'modifier',
      subType: 'critical-failure',
      comparePoint,
    }
  }

// Sort rolls when outputting
SortingModifier
 = "s" dir:("a" / "d")? {
   return {
     type: 'modifier',
     subType: 'sort',
     direction: dir || 'a',
   }
 }


// Number comparisons

FailComparePoint
  = "f" comparePoint:ComparePoint { return comparePoint }

ComparePoint
  = operator:CompareOperator value:FloatNumber {
    return {
      type: 'compare-point',
      operator,
      value,
    }
  }

CompareOperator
  = "!=" / "<=" / ">=" / "=" / ">" / "<"


/**
 * Mathematical
 */

// Either a positive integer or an expression within parenthesis (Handy for dice qty or sides)
IntegerOrExpression
  = IntegerNumber / l:"(" _ expr:Expression _ r:")" { return [l, ...expr, r] }

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
  / DiceGroup

MathFunction
  = func:("abs" / "ceil" / "cos" / "exp" / "floor" / "log" / "round" / "sign" / "sin" / "sqrt" / "tan") "(" _ expr:Expression _ ")" {
    return [
      `${func}(`,
      ...expr,
      ')',
    ];
  }
  / func:"pow" "(" _ expr1:Expression _ "," _ expr2:Expression _ ")" {
    return [
      `${func}(`,
      ...expr1,
      ',',
      ...expr2,
      ')',
    ];
  }
  / func:"max" "(" _ expr1:Expression _ "," _ expr2:Expression _ ")" {
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
