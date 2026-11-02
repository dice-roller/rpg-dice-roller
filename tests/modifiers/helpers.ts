import type { ExpressionNode } from "../../src/ast/nodes.js";
import { DieRegistry } from "../../src/dice/DieRegistry.js";
import { Evaluator } from "../../src/evaluator/Evaluator.js";
import { createRollContext } from "../../src/evaluator/RollContext.js";
import type { RollLimits, RollMode } from "../../src/evaluator/RollContext.js";
import { ModifierRegistry } from "../../src/modifiers/ModifierRegistry.js";
import { Parser } from "../../src/parser/Parser.js";
import { NumberGenerator } from "../../src/random/NumberGenerator.js";
import type { ResultFlag } from "../../src/results/flags.js";
import type {
  ExpressionResult,
  GroupResult,
  PoolResult,
} from "../../src/results/types.js";

export const parser = new Parser({ maxQty: 10_000 });

export interface EvaluateOptions {
  mode?: RollMode;
  /** Values returned by `generator.integer()`, in order (then the die's minimum). */
  rolls?: readonly number[];
  modifiers?: ModifierRegistry;
  limits?: Partial<RollLimits>;
}

/** Evaluates notation (or a node), with the generator returning the queued rolls. */
export function evaluate(
  input: string | ExpressionNode,
  {
    mode = "random",
    rolls = [],
    modifiers = new ModifierRegistry(),
    limits,
  }: EvaluateOptions = {},
): ExpressionResult {
  const queue = [...rolls];
  const generator = new NumberGenerator();

  jest
    .spyOn(generator, "integer")
    .mockImplementation((min) => queue.shift() ?? min);

  const evaluator = new Evaluator({ dice: new DieRegistry(), modifiers });
  const node = typeof input === "string" ? parser.parse(input) : input;

  return evaluator.evaluate(
    node,
    createRollContext({ generator, mode, limits }),
  );
}

export function evaluatePool(
  input: string | ExpressionNode,
  options?: EvaluateOptions,
): PoolResult {
  const result = evaluate(input, options);

  if (result.type !== "pool") {
    throw new Error(`Expected a pool, got ${result.type}`);
  }

  return result;
}

export function evaluateGroup(
  input: string | ExpressionNode,
  options?: EvaluateOptions,
): GroupResult {
  const result = evaluate(input, options);

  if (result.type !== "group") {
    throw new Error(`Expected a group, got ${result.type}`);
  }

  return result;
}

/**
 * The rolls of a pool in the v5 text style, for compact assertions: `3d` (dropped), `6*`
 * (success), `2_` (failure), `3^` (min), `3v` (max), `20**` / `1__` (critical), `6!` / `14!!` /
 * `6!p` (explode / compound / penetrate), `3r` / `3ro` / `3u` / `3uo` (re-roll / unique).
 */
export function rollsOf(result: PoolResult): string[] {
  return result.rolls.map(
    ({ value, flags }) =>
      `${value}${flags
        // a compound roll has both flags, but only shows `!!`
        .filter((flag) => flag !== "explode" || !flags.includes("compound"))
        .map((flag) => symbols[flag])
        .join("")}`,
  );
}

/** The pools in a result tree, in notation order. */
export function poolsOf(result: ExpressionResult): PoolResult[] {
  switch (result.type) {
    case "pool":
      return [result];
    case "group":
      return result.members.flatMap((member) => poolsOf(member.result));
    case "binary":
      return [...poolsOf(result.left), ...poolsOf(result.right)];
    case "unary":
      return poolsOf(result.operand);
    case "paren":
      return poolsOf(result.inner);
    case "function":
      return result.args.flatMap(poolsOf);
    default:
      return [];
  }
}

const symbols: Readonly<Record<ResultFlag, string>> = {
  drop: "d",
  min: "^",
  max: "v",
  "target-success": "*",
  "target-failure": "_",
  "critical-success": "**",
  "critical-failure": "__",
  explode: "!",
  compound: "!!",
  penetrate: "p",
  "re-roll": "r",
  "re-roll-once": "ro",
  unique: "u",
  "unique-once": "uo",
};
