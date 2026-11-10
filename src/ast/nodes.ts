/**
 * The notation AST.
 *
 * Expression, die and modifier nodes are readonly plain data with a `type` discriminator;
 * compare points and descriptions are embedded data without one. Parser and builder output can
 * be serialized as JSON and used in roll imports.
 */

/* ------------------------------------------------------------------------------------------------
 * Expressions
 * --------------------------------------------------------------------------------------------- */

/** Any node that evaluates to a number. */
export type ExpressionNode =
  | NumberNode
  | PoolNode
  | GroupNode
  | BinaryNode
  | UnaryNode
  | ParenNode
  | FunctionNode;

/** The `type` of every expression node. */
export type ExpressionNodeType = ExpressionNode["type"];

/** A literal number, e.g. `4` or `-2.5`. */
export interface NumberNode {
  readonly type: "number";
  readonly value: number;
}

/** A pool of dice, e.g. `4d6kh3`. */
export interface PoolNode {
  readonly type: "pool";
  /** The number of dice; a `NumberNode` for literal quantities. */
  readonly qty: ExpressionNode;
  readonly die: DieNode;
  /** In notation order after deduplication; handlers may execute in a different order. */
  readonly modifiers: readonly ModifierNode[];
  readonly description?: DescriptionNode;
}

/** The names of the built-in die factories in the `DieRegistry`. */
export const BUILT_IN_DIE_NAMES = [
  "standard",
  "percentile",
  "fudge",
  "range",
  "face",
] as const;
/** A built-in die factory name; registries can also contain custom names. */
export type BuiltInDieName = (typeof BUILT_IN_DIE_NAMES)[number];

/**
 * The die of a pool: a reference to a die factory in the `DieRegistry`, and its arguments.
 *
 * The evaluator evaluates the argument expressions, then calls `registry.create(name, ...args)`.
 * Registering a replacement for `standard` changes what `d6` rolls in that registry. Computed
 * sides (`d(2+3)`) are expressions too. Custom factory names can be constructed with `die()`;
 * their displayed notation is not necessarily parseable.
 *
 * - `d6`: `{ name: "standard", args: [6] }`
 * - `d(2+3)`: `{ name: "standard", args: [(2+3)] }`
 * - `d%`: `{ name: "percentile", args: [] }`
 * - `dF` / `dF.1` / `dF.2`: `{ name: "fudge", args: [] }` / `[1]` / `[2]`
 */
export interface DieNode {
  readonly type: "die";
  /** The registered name: a `BuiltInDieName`, or the name of a user-registered die. */
  readonly name: string;
  readonly args: readonly ExpressionNode[];
}

/** A roll group, e.g. `{4d6+2d8, 3d20}k1`. */
export interface GroupNode {
  readonly type: "group";
  readonly expressions: readonly ExpressionNode[];
  readonly modifiers: readonly ModifierNode[];
  readonly description?: DescriptionNode;
}

/** The binary maths operators. `**` is parsed as `^`. */
export const BINARY_OPERATORS = ["+", "-", "*", "/", "%", "^"] as const;
/** A supported binary operator. */
export type BinaryOperator = (typeof BINARY_OPERATORS)[number];

/** A binary maths operation, e.g. `2d6 + 3`. */
export interface BinaryNode {
  readonly type: "binary";
  readonly op: BinaryOperator;
  readonly left: ExpressionNode;
  readonly right: ExpressionNode;
}

/** A unary minus, e.g. `-2`. */
export interface UnaryNode {
  readonly type: "unary";
  readonly op: "-";
  readonly operand: ExpressionNode;
}

/** A parenthesised expression, e.g. `(2+3)`. Kept so the notation round-trips. */
export interface ParenNode {
  readonly type: "paren";
  readonly expression: ExpressionNode;
}

/** The supported maths functions. */
export const MATH_FUNCTION_NAMES = [
  "abs",
  "ceil",
  "cos",
  "exp",
  "floor",
  "log",
  "round",
  "sign",
  "sin",
  "sqrt",
  "tan",
  "pow",
  "max",
  "min",
  "trunc",
] as const;
/** A supported maths function name. */
export type MathFunctionName = (typeof MATH_FUNCTION_NAMES)[number];

/** A maths function call, e.g. `floor(2d6 / 2)`. */
export interface FunctionNode {
  readonly type: "function";
  readonly name: MathFunctionName;
  readonly args: readonly ExpressionNode[];
}

/* ------------------------------------------------------------------------------------------------
 * Compare points and descriptions
 * --------------------------------------------------------------------------------------------- */

/** Operators accepted by compare points; `!=` and `<>` both mean not equal. */
export const COMPARE_OPERATORS = [
  "=",
  "!=",
  "<>",
  "<",
  ">",
  "<=",
  ">=",
] as const;
/** An operator accepted by a compare point. */
export type CompareOperator = (typeof COMPARE_OPERATORS)[number];

/** A comparison against a value, e.g. the `>=8` in `8d10>=8`. */
export interface ComparePoint {
  readonly operator: CompareOperator;
  readonly value: number;
}

/**
 * - `inline`: `// text` or `# text`
 * - `block`: `/* text *\/` or `[text]`
 */
export type DescriptionStyle = "inline" | "block";

/** A roll description. */
export interface DescriptionNode {
  readonly text: string;
  readonly style: DescriptionStyle;
}

/* ------------------------------------------------------------------------------------------------
 * Modifiers
 *
 * Discriminated by `name`. A missing `comparePoint` means the handler's default
 * (e.g. explode on the die's max value).
 * --------------------------------------------------------------------------------------------- */

/** A modifier selected by `name`; an omitted compare point uses the registered handler's default. */
export type ModifierNode =
  | ExplodeNode
  | TargetNode
  | DropNode
  | KeepNode
  | ReRollNode
  | UniqueNode
  | CriticalSuccessNode
  | CriticalFailureNode
  | SortNode
  | MaxNode
  | MinNode;

/** The `name` of every modifier node. */
export type ModifierName = ModifierNode["name"];

/** The modifier node with the given name. */
export type ModifierNodeOf<N extends ModifierName> = Extract<
  ModifierNode,
  { name: N }
>;

/** Which end of the sorted rolls to keep / drop: `h`ighest or `l`owest. */
export type PoolEnd = "h" | "l";

/** `a`scending or `d`escending. */
export type SortDirection = "a" | "d";

/** `!`, `!!` (compound), `!p` (penetrate), `!!p`. */
export interface ExplodeNode {
  readonly type: "modifier";
  readonly name: "explode";
  readonly compound: boolean;
  readonly penetrate: boolean;
  readonly comparePoint?: ComparePoint;
}

/** A target comparison; amount is a whole number from 1 to 10 and defaults to 1. */
export interface TargetRule {
  readonly kind: "success" | "failure";
  readonly comparePoint: ComparePoint;
  readonly amount?: number;
}

/** Success / failure counting, e.g. `>=8:2f<=2`. The last matching rule in the block wins. */
export interface TargetNode {
  readonly type: "modifier";
  readonly name: "target";
  readonly rules: readonly TargetRule[];
}

/** `d`, `dh`, `dl`. */
export interface DropNode {
  readonly type: "modifier";
  readonly name: "drop";
  readonly end: PoolEnd;
  readonly qty: number;
}

/** `k`, `kh`, `kl`. */
export interface KeepNode {
  readonly type: "modifier";
  readonly name: "keep";
  readonly end: PoolEnd;
  readonly qty: number;
}

/** `r`, `ro`. */
export interface ReRollNode {
  readonly type: "modifier";
  readonly name: "re-roll";
  readonly once: boolean;
  readonly comparePoint?: ComparePoint;
}

/** `u`, `uo`. */
export interface UniqueNode {
  readonly type: "modifier";
  readonly name: "unique";
  readonly once: boolean;
  readonly comparePoint?: ComparePoint;
}

/** `cs`. */
export interface CriticalSuccessNode {
  readonly type: "modifier";
  readonly name: "critical-success";
  readonly comparePoint?: ComparePoint;
}

/** `cf`. */
export interface CriticalFailureNode {
  readonly type: "modifier";
  readonly name: "critical-failure";
  readonly comparePoint?: ComparePoint;
}

/** `s`, `sa`, `sd`. */
export interface SortNode {
  readonly type: "modifier";
  readonly name: "sort";
  readonly direction: SortDirection;
}

/** `max5`. */
export interface MaxNode {
  readonly type: "modifier";
  readonly name: "max";
  readonly value: number;
}

/** `min2`. */
export interface MinNode {
  readonly type: "modifier";
  readonly name: "min";
  readonly value: number;
}
