import type {
  BinaryNode,
  ExpressionNode,
  FunctionNode,
  GroupNode,
  ModifierNode,
  NumberNode,
  ParenNode,
  PoolNode,
  UnaryNode,
} from "../ast/nodes.js";
import type { DieRegistry } from "../dice/DieRegistry.js";
import { EvaluationError } from "../errors/EvaluationError.js";
import { NotImplementedError } from "../errors/NotImplementedError.js";
import type { ModifierRegistry } from "../modifiers/ModifierRegistry.js";
import type { ModifierInput, ModifierTarget } from "../modifiers/types.js";
import type {
  BinaryResult,
  ExpressionResult,
  FunctionResult,
  GroupResult,
  NumberResult,
  ParenResult,
  PoolResult,
  ScoredItem,
  UnaryResult,
} from "../results/types.js";
import type { RollContext } from "./RollContext.js";

export interface EvaluatorRegistries {
  readonly dice: DieRegistry;
  readonly modifiers: ModifierRegistry;
}

/**
 * Walks the AST and builds the result tree.
 *
 * The same AST is evaluated in `random` mode for the roll, and in `min` / `max` mode for
 * `minTotal` / `maxTotal`. Maths goes through `math.ts`.
 */
export class Evaluator {
  constructor(readonly registries: EvaluatorRegistries) {}

  evaluate(node: ExpressionNode, ctx: RollContext): ExpressionResult {
    switch (node.type) {
      case "number":
        return this.evaluateNumber(node, ctx);
      case "pool":
        return this.evaluatePool(node, ctx);
      case "group":
        return this.evaluateGroup(node, ctx);
      case "binary":
        return this.evaluateBinary(node, ctx);
      case "unary":
        return this.evaluateUnary(node, ctx);
      case "paren":
        return this.evaluateParen(node, ctx);
      case "function":
        return this.evaluateFunction(node, ctx);
      default: {
        const unknown: never = node;

        throw new EvaluationError(
          `Unknown node type: ${(unknown as { type: string }).type}`,
        );
      }
    }
  }

  protected evaluateNumber(_node: NumberNode, _ctx: RollContext): NumberResult {
    throw new NotImplementedError("Evaluator.evaluateNumber()");
  }

  /**
   * Evaluates `qty` and the die's `args`, validates qty against `ctx.limits.maxQty`, creates the
   * die with `registries.dice.create(node.die.name, ...args)`, resolves it with `resolveDie()`,
   * rolls it `qty` times with `rollDie()`, then applies the modifiers.
   */
  protected evaluatePool(_node: PoolNode, _ctx: RollContext): PoolResult {
    throw new NotImplementedError("Evaluator.evaluatePool()");
  }

  /**
   * Evaluates each expression, then applies the modifiers to the members.
   *
   * As in v5, a group with a single expression (`{4d6+2d8}k2`) applies its modifiers to the dice of
   * every pool inside it: the die results are flattened for the handler, then written back into
   * their pool results.
   */
  protected evaluateGroup(_node: GroupNode, _ctx: RollContext): GroupResult {
    throw new NotImplementedError("Evaluator.evaluateGroup()");
  }

  /** Uses `operators` from `math.ts`. */
  protected evaluateBinary(_node: BinaryNode, _ctx: RollContext): BinaryResult {
    throw new NotImplementedError("Evaluator.evaluateBinary()");
  }

  /** Uses `negate` from `math.ts`. */
  protected evaluateUnary(_node: UnaryNode, _ctx: RollContext): UnaryResult {
    throw new NotImplementedError("Evaluator.evaluateUnary()");
  }

  protected evaluateParen(_node: ParenNode, _ctx: RollContext): ParenResult {
    throw new NotImplementedError("Evaluator.evaluateParen()");
  }

  /** Uses `functions` from `math.ts`. */
  protected evaluateFunction(
    _node: FunctionNode,
    _ctx: RollContext,
  ): FunctionResult {
    throw new NotImplementedError("Evaluator.evaluateFunction()");
  }

  /**
   * Applies the modifiers in execution order (`ModifierRegistry.inExecutionOrder()`).
   *
   * @throws {EvaluationError} a handler doesn't apply to the target (e.g. `explode` on a group)
   */
  protected applyModifiers<T extends ScoredItem>(
    _items: readonly T[],
    _modifiers: readonly ModifierNode[],
    _target: ModifierTarget,
    _input: Omit<ModifierInput, "modifier">,
  ): T[] {
    throw new NotImplementedError("Evaluator.applyModifiers()");
  }
}
