import type { ResultFlag } from "../results/flags.js";
import {
  minPrecedenceForBinaryOperand,
  minPrecedenceForComparisonOperand,
  minPrecedenceForUnaryOperand,
  needsParentheses,
} from "../ast/precedence.js";
import type {
  BinaryResult,
  ComparisonResult,
  ConditionalResult,
  DieResult,
  ExpressionResult,
  FunctionResult,
  GroupMemberResult,
  GroupResult,
  NumberResult,
  ParenResult,
  PoolResult,
  ReferenceResult,
  UnaryResult,
} from "../results/types.js";
import type { Roll } from "../Roll.js";
import type { RollHistory } from "../RollHistory.js";
import { TreePresenter } from "./TreePresenter.js";

function containsDice(result: ExpressionResult): boolean {
  switch (result.type) {
    case "number":
    case "reference":
      return false;
    case "pool":
      return true;
    case "group":
      return result.members.some(({ result }) => containsDice(result));
    case "binary":
    case "comparison":
      return containsDice(result.left) || containsDice(result.right);
    case "unary":
      return containsDice(result.operand);
    case "paren":
      return containsDice(result.inner);
    case "function":
      return result.args.some(containsDice);
    case "conditional":
      return (
        containsDice(result.condition) || containsDice(result.selectedResult)
      );
  }
}

/** Default flag symbols, e.g. `[6!, 2, 1d]. */
export const DEFAULT_FLAG_SYMBOLS: Readonly<Record<ResultFlag, string>> =
  Object.freeze({
    compound: "!",
    explode: "!",
    "critical-failure": "cf",
    "critical-success": "cs",
    drop: "d",
    max: "v",
    min: "^",
    penetrate: "p",
    "re-roll": "r",
    "re-roll-once": "ro",
    "target-failure": "_",
    "target-success": "*",
    unique: "u",
    "unique-once": "uo",
  });

/** Options for formatting flags and roll histories. */
export interface TextPresenterOptions {
  /** Overrides individual default flag symbols; an empty string suppresses a symbol. */
  flagSymbols?: Partial<Record<ResultFlag, string>>;
  /** Joins the rolls of a history (default `"; "`; an empty string is allowed). */
  separator?: string;
  /** Shows stored dice results used to calculate pool quantities or sides (default `false`). */
  expandInlineRolls?: boolean;
}

/**
 * Plain text output, matching v5: e.g. `4d6: [3, 5, 2, 6] = 16`, with flag symbols after each die
 * value and history rolls joined with `"; "`. It prints the supplied roll's total as-is: newly
 * evaluated rolls round their total to 2 decimal places, but restored totals need not be rounded.
 *
 * Maths is written without spaces (`[4, 2]+3`), function arguments are joined with `,`
 * (`max([5],[2])`), and group members are joined with `, ` (`{[4, 5], [3]-1}`). A member with flags
 * (e.g. dropped, or a target success) is wrapped in parentheses: `([6, 3])d`.
 * An expression result is presented without notation or a total; an empty history produces `""`.
 * Conditionals show the evaluated condition and selected result, e.g.
 * `(condition: [2, 5*] = 1, true: [3, 10, 2, 3]+$$condition)`. Caller-data references use `$` and
 * system references use `$$`; their numeric value is shown once beside the conditional's check.
 */
export class TextPresenter extends TreePresenter<string> {
  readonly flagSymbols: Readonly<Record<ResultFlag, string>>;
  readonly separator: string;
  readonly expandInlineRolls: boolean;

  constructor(options: TextPresenterOptions = {}) {
    super();
    this.flagSymbols = Object.freeze({
      ...DEFAULT_FLAG_SYMBOLS,
      ...options.flagSymbols,
    });
    this.separator = options.separator ?? "; ";
    this.expandInlineRolls = options.expandInlineRolls ?? false;
  }

  /** The symbols for the flags, e.g. `["explode", "drop"]` -> `!d`. */
  protected flags(
    flags: readonly ResultFlag[],
    calculationValue: number,
  ): string {
    return flags
      .map((flag) => {
        const count = ["target-success", "target-failure"].includes(flag)
          ? Math.abs(calculationValue)
          : 1;
        return this.flagSymbols[flag].repeat(count);
      })
      .join("");
  }

  /** Formats a number with `String(value)`, including non-finite values. */
  protected formatNumber(value: number): string {
    return String(value);
  }

  /** The rolls joined with `separator`; an empty history is an empty string. */
  protected history(history: RollHistory): string {
    return history.rolls.map((roll) => this.roll(roll)).join(this.separator);
  }

  /** `notation: <result> = total`. */
  protected roll(roll: Roll<unknown>): string {
    return `${roll.notation}: ${this.visit(roll.result)} = ${this.formatNumber(roll.total)}`;
  }

  protected number(result: NumberResult): string {
    return this.formatNumber(result.value);
  }

  /** `[3, 5, 2, 6]` */
  protected pool(result: PoolResult): string {
    const rolls = `[${result.rolls.map((roll) => this.die(roll, result)).join(", ")}]`;

    if (!this.expandInlineRolls) {
      return rolls;
    }

    const parameters: string[] = [];

    if (containsDice(result.qty)) {
      parameters.push(
        `qty: ${this.visit(result.qty)} = ${this.formatNumber(result.qty.value)}`,
      );
    }

    for (const sides of result.dieArgs) {
      if (containsDice(sides)) {
        parameters.push(
          `sides: ${this.visit(sides)} = ${this.formatNumber(sides.value)}`,
        );
      }
    }

    return parameters.length > 0
      ? `(${parameters.join(", ")}) -> ${rolls}`
      : rolls;
  }

  /** `6!`, `1d` */
  protected die(result: DieResult, _pool: PoolResult): string {
    return `${this.formatNumber(result.value)}${this.flags(result.flags, result.calculationValue)}`;
  }

  /** `{[3, 5]+2, ([4])d}` */
  protected group(result: GroupResult): string {
    return `{${result.members.map((member) => this.member(member)).join(", ")}}`;
  }

  /** A group member: `[3, 5]+2`, or `([3, 5]+2)*` with flags. */
  protected member(member: GroupMemberResult): string {
    const inner = this.visit(member.result);

    return member.flags.length === 0
      ? inner
      : `(${inner})${this.flags(member.flags, member.calculationValue)}`;
  }

  /** `[4, 2]+3` */
  protected binary(result: BinaryResult): string {
    const operator = result.node.op;
    const left = this.operand(
      result.left,
      minPrecedenceForBinaryOperand(operator, "left"),
    );
    const right = this.operand(
      result.right,
      minPrecedenceForBinaryOperand(operator, "right"),
    );

    return `${left}${operator}${right}`;
  }

  /** `[4, 2]>3` */
  protected comparison(result: ComparisonResult): string {
    const minPrecedence = minPrecedenceForComparisonOperand();
    const left = this.operand(result.left, minPrecedence);
    const right = this.operand(result.right, minPrecedence);

    return `${left}${result.node.op}${right}`;
  }

  /** `-5` */
  protected unary(result: UnaryResult): string {
    return `${result.node.op}${this.operand(result.operand, minPrecedenceForUnaryOperand())}`;
  }

  protected operand(result: ExpressionResult, minPrecedence: number): string {
    const text = this.visit(result);

    return needsParentheses(result.node, minPrecedence) ? `(${text})` : text;
  }

  /** `([4, 2]*2)` */
  protected paren(result: ParenResult): string {
    return `(${this.visit(result.inner)})`;
  }

  /** `floor([4, 5]/2)`, `max([5],[2])` */
  protected fn(result: FunctionResult): string {
    return `${result.node.name}(${result.args.map((arg) => this.visit(arg)).join(",")})`;
  }

  protected conditional(result: ConditionalResult): string {
    return `(condition: ${this.visit(result.condition)} = ${this.formatNumber(result.condition.value)}, ${result.selectedBranch}: ${this.visit(result.selectedResult)})`;
  }

  protected override reference(result: ReferenceResult): string {
    const name = result.node.path.join(".");
    return `${result.node.namespace === "data" ? "$" : "$$"}${name}`;
  }
}

/** The frozen shared instance used by roll, history, and roller `toString()` methods. */
export const defaultTextPresenter = Object.freeze(new TextPresenter());
