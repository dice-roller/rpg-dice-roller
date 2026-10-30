import type {
  BuiltInDieName,
  DieNode,
  ExpressionNode,
  ExpressionNodeType,
  MathFunctionName,
  ModifierName,
  ModifierNode,
  ModifierNodeOf,
  PoolNode,
} from "../../src/ast/nodes.js";
import type { ResultFlag } from "../../src/results/flags.js";
import type {
  ExpressionResult,
  ExpressionResultType,
  PoolResult,
} from "../../src/results/types.js";
import { accepts, assertType } from "./helpers.js";
import type { Equals } from "./helpers.js";

// the node and result unions share the same discriminators
assertType<
  Equals<
    ExpressionNodeType,
    "number" | "pool" | "group" | "binary" | "unary" | "paren" | "function"
  >
>();
assertType<Equals<ExpressionResultType, ExpressionNodeType>>();

// every result points back at the node of the same type
assertType<
  Equals<
    Extract<ExpressionResult, { type: "pool" }>["node"],
    Extract<ExpressionNode, { type: "pool" }>
  >
>();

// the 11 modifiers
assertType<
  Equals<
    ModifierName,
    | "explode"
    | "target"
    | "drop"
    | "keep"
    | "re-roll"
    | "unique"
    | "critical-success"
    | "critical-failure"
    | "sort"
    | "max"
    | "min"
  >
>();
assertType<Equals<ModifierNodeOf<"keep">["end"], "h" | "l">>();

// the 14 maths functions
assertType<
  Equals<
    MathFunctionName,
    | "abs"
    | "ceil"
    | "cos"
    | "exp"
    | "floor"
    | "log"
    | "round"
    | "sign"
    | "sin"
    | "sqrt"
    | "tan"
    | "pow"
    | "max"
    | "min"
    | "trunc"
  >
>();

// 14 semantic flags
accepts<ResultFlag>("explode");
// @ts-expect-error - symbols are presenter concerns, not flags
accepts<ResultFlag>("!");

// a pool's die is a reference to a registered factory, with expression args
assertType<
  Equals<BuiltInDieName, "standard" | "percentile" | "fudge" | "range" | "face">
>();
accepts<DieNode>({
  type: "die",
  name: "standard",
  args: [{ type: "number", value: 6 }],
});
accepts<DieNode>({ type: "die", name: "my-die", args: [] });
// @ts-expect-error - a die object isn't a die node
accepts<DieNode>({ min: 1, max: 6 });
// @ts-expect-error - args are expression nodes, not numbers
accepts<DieNode>({ type: "die", name: "standard", args: [6] });

// a literal pool
accepts<PoolNode>({
  type: "pool",
  qty: { type: "number", value: 4 },
  die: { type: "die", name: "standard", args: [{ type: "number", value: 6 }] },
  modifiers: [{ type: "modifier", name: "keep", end: "h", qty: 3 }],
  description: { text: "fire", style: "block" },
});

// @ts-expect-error - descriptions are `inline` or `block`
accepts<PoolNode["description"]>({ text: "x", style: "multiline" });

// @ts-expect-error - modifiers are discriminated by name
accepts<ModifierNode>({ type: "modifier", name: "keep", direction: "a" });

// exhaustive narrowing
export function describeResult(result: ExpressionResult): string {
  switch (result.type) {
    case "number":
    case "binary":
    case "unary":
    case "paren":
    case "function":
    case "group":
      return result.type;
    case "pool":
      accepts<PoolResult>(result);
      return result.die.notation;
    default:
      accepts<never>(result);
      return "";
  }
}
