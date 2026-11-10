import type {
  BinaryNode,
  ExpressionNode,
  FunctionNode,
  GroupNode,
  MathFunctionName,
  ModifierNode,
  NumberNode,
  ParenNode,
  PoolNode,
  UnaryNode,
} from "../ast/nodes.js";
import type { DieRegistry } from "../dice/DieRegistry.js";
import { dieSnapshot, resolveDie, rollDie } from "../dice/die-utils.js";
import type { ResolvedDie } from "../dice/types.js";
import { EvaluationError } from "../errors/EvaluationError.js";
import { ValidationError } from "../errors/ValidationError.js";
import type { ModifierRegistry } from "../modifiers/ModifierRegistry.js";
import { validateTargetAmounts } from "../modifiers/handlers/target.js";
import { resolveIterationBudget } from "../modifiers/handlers/utils.js";
import type {
  ModifierHandler,
  ModifierInput,
  ModifierTarget,
} from "../modifiers/types.js";
import { createDieResult } from "../results/die-result.js";
import type {
  BinaryResult,
  DieResult,
  ExpressionResult,
  FunctionResult,
  GroupMemberResult,
  GroupResult,
  NumberResult,
  ParenResult,
  PoolResult,
  ScoredItem,
  UnaryResult,
} from "../results/types.js";
import { functions, negate, operators } from "./math.js";
import type { RollContext } from "./RollContext.js";

/** The number of arguments each maths function takes (matching the grammar). */
const functionArity: Readonly<Record<MathFunctionName, number>> = {
  abs: 1,
  ceil: 1,
  cos: 1,
  exp: 1,
  floor: 1,
  log: 1,
  round: 1,
  sign: 1,
  sin: 1,
  sqrt: 1,
  tan: 1,
  trunc: 1,
  pow: 2,
  max: 2,
  min: 2,
};

/**
 * The sum of `calculationValue` for the items that are `useInTotal`.
 *
 * @throws {EvaluationError} the sum isn't a real number (e.g. `Infinity + -Infinity`)
 */
export function sumIncluded(items: readonly ScoredItem[]): number {
  return items
    .filter(({ useInTotal }) => useInTotal)
    .reduce(
      (total, { calculationValue }) => operators["+"](total, calculationValue),
      0,
    );
}

/** Registries used to resolve dice and modifier handlers during evaluation. */
export interface EvaluatorRegistries {
  /** Factories for dice referenced by pool nodes. */
  readonly dice: DieRegistry;
  /** Handlers for modifiers referenced by pool and group nodes. */
  readonly modifiers: ModifierRegistry;
}

/**
 * Walks the AST and builds the result tree.
 *
 * Evaluation uses the supplied context's roll mode, generator and limits. The same AST can be
 * evaluated in `random` mode for a roll and in `min` / `max` mode for its corresponding totals.
 */
export class Evaluator {
  /** Creates an evaluator using the given die and modifier registries. */
  constructor(readonly registries: EvaluatorRegistries) {}

  /**
   * Evaluates an expression tree into a result tree, rolling dice according to the context.
   *
   * @throws {EvaluationError} if a node, quantity, operation or modifier result is invalid
   */
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
        throw new EvaluationError(
          `Unknown node type: ${(node as { type: string }).type}`,
        );
      }
    }
  }

  protected evaluateNumber(node: NumberNode, _ctx: RollContext): NumberResult {
    if (typeof node.value !== "number" || !Number.isFinite(node.value)) {
      throw new EvaluationError(
        `A number must be finite: ${String(node.value)}`,
      );
    }

    return { type: "number", node, value: node.value };
  }

  /**
   * Evaluates `qty` and the die's `args`, validates qty against `ctx.limits.maxQty`, creates the
   * die with `registries.dice.create(node.die.name, ...args)`, resolves it with `resolveDie()`,
   * rolls it `qty` times with `rollDie()`, then applies the modifiers.
   */
  protected evaluatePool(node: PoolNode, ctx: RollContext): PoolResult {
    const qty = this.evaluate(node.qty, ctx);
    const count = qty.value;

    if (
      !Number.isSafeInteger(count) ||
      count < 1 ||
      count > ctx.limits.maxQty
    ) {
      throw new EvaluationError(
        `Dice quantity must be an integer between 1 and ${ctx.limits.maxQty}: ${count}`,
      );
    }

    const dieArgs = node.die.args.map((arg) => this.evaluate(arg, ctx));
    const die = this.createDie(
      node,
      dieArgs.map(({ value }) => value),
    );
    const roll = (): DieResult => createDieResult(rollDie(die, ctx));
    const initialRolls = Array.from({ length: count }, roll);
    const rolls =
      node.modifiers.length === 0
        ? initialRolls
        : this.applyModifiers(initialRolls, node.modifiers, "pool", {
            ctx,
            die,
            rollDie: roll,
          });

    return {
      type: "pool",
      node,
      value: sumIncluded(rolls),
      qty,
      dieArgs,
      die: dieSnapshot(die),
      rolls,
    };
  }

  /** Creates and resolves the die of a pool node, with already evaluated arguments. */
  protected createDie(node: PoolNode, args: readonly number[]): ResolvedDie {
    return resolveDie(this.registries.dice.create(node.die.name, ...args));
  }

  /**
   * Evaluates each expression, then applies the modifiers in execution order.
   *
   * Each handler gets the members, unless its `groupHandling` says otherwise:
   *
   * - `flatten`: as in v5, a group with a single expression (`{4d6+2d8}k2`) gives the handler the
   *   dice of every pool inside it. The die results are flattened, then the result tree is walked
   *   again to write them back into their pools and recalculate everything above them.
   * - `each-pool`: the handler gets each nested group's members and each pool's dice.
   */
  protected evaluateGroup(node: GroupNode, ctx: RollContext): GroupResult {
    if (node.expressions.length === 0) {
      throw new EvaluationError("A group needs at least one expression");
    }

    this.validateIterationLimits(node.modifiers, ctx);

    let members = node.expressions.map((expression): GroupMemberResult => {
      const result = this.evaluate(expression, ctx);

      return {
        type: "group-member",
        result,
        value: result.value,
        calculationValue: result.value,
        useInTotal: true,
        flags: [],
      };
    });

    for (const modifier of this.orderedModifiers(node.modifiers)) {
      const handler = this.handlerFor(modifier, "group");
      const input: ModifierInput = { modifier, ctx };

      if (handler.groupHandling === "flatten" && members.length === 1) {
        members = members.map((member) =>
          withMemberResult(
            member,
            this.applyToFlattenedDice(member.result, (dice) =>
              this.runHandler(handler, dice, input),
            ),
          ),
        );
      } else {
        members = this.runHandler(handler, members, input);

        if (handler.groupHandling === "each-pool") {
          members = members.map((member) =>
            withMemberResult(
              member,
              this.rebuildPools(
                member.result,
                (pool) =>
                  withPoolRolls(
                    pool,
                    this.runHandler(handler, pool.rolls, input),
                  ),
                (nested) => this.runHandler(handler, nested, input),
              ),
            ),
          );
        }
      }
    }

    return {
      type: "group",
      node,
      value: sumIncluded(members),
      members,
    };
  }

  /**
   * Applies `apply` to the flattened dice of every pool in the result, then writes the dice back
   * into their own pools, in the order `apply` returned them, and recalculates the result.
   *
   * Each die is tagged with its pool, so the handler may copy, reorder or remove dice.
   *
   * @throws {EvaluationError} the handler returned a die that didn't come from a pool
   */
  protected applyToFlattenedDice(
    result: ExpressionResult,
    apply: (dice: readonly TaggedDieResult[]) => TaggedDieResult[],
  ): ExpressionResult {
    const pools: PoolResult[] = [];

    this.rebuildPools(result, (pool) => {
      pools.push(pool);

      return pool;
    });

    const byPool = pools.map((): DieResult[] => []);
    const taggedList = apply(
      pools.flatMap((pool, index) =>
        pool.rolls.map((roll): TaggedDieResult => ({ ...roll, [POOL]: index })),
      ),
    );

    for (const tagged of taggedList) {
      const rolls = byPool[tagged[POOL] ?? -1];

      if (!rolls) {
        throw new EvaluationError(
          "A group modifier returned a die that isn't from one of its pools",
        );
      }

      const roll: TaggedDieResult = { ...tagged };

      delete roll[POOL];
      rolls.push(roll);
    }

    return this.rebuildPools(result, (pool, index) =>
      withPoolRolls(pool, byPool[index] ?? []),
    );
  }

  /**
   * Walks the result tree, replacing each pool with `replace(pool, index)` and recalculating the
   * values above it. Pools are visited in notation order.
   *
   * Pools in a pool's quantity or die arguments aren't visited (they've already been used), nor
   * are pools in nested groups unless `transformMembers` is supplied.
   */
  protected rebuildPools(
    result: ExpressionResult,
    replace: (pool: PoolResult, index: number) => PoolResult,
    transformMembers?: (
      members: readonly GroupMemberResult[],
    ) => GroupMemberResult[],
  ): ExpressionResult {
    let index = 0;

    const visit = (current: ExpressionResult): ExpressionResult => {
      switch (current.type) {
        case "pool":
          return replace(current, index++);
        case "group": {
          if (!transformMembers) {
            return current;
          }

          const members = transformMembers(current.members).map((member) =>
            withMemberResult(member, visit(member.result)),
          );

          return { ...current, members, value: sumIncluded(members) };
        }
        case "binary": {
          const left = visit(current.left);
          const right = visit(current.right);

          return {
            ...current,
            left,
            right,
            value: operators[current.node.op](left.value, right.value),
          };
        }
        case "unary": {
          const operand = visit(current.operand);

          return { ...current, operand, value: negate(operand.value) };
        }
        case "paren": {
          const inner = visit(current.inner);

          return { ...current, inner, value: inner.value };
        }
        case "function": {
          const args = current.args.map(visit);

          return {
            ...current,
            args,
            value: functions[current.node.name](
              ...args.map(({ value }) => value),
            ),
          };
        }
        default:
          return current;
      }
    };

    return visit(result);
  }

  /** Uses `operators` from `math.ts`. */
  protected evaluateBinary(node: BinaryNode, ctx: RollContext): BinaryResult {
    if (!Object.hasOwn(operators, node.op)) {
      throw new EvaluationError(`Unknown operator: ${String(node.op)}`);
    }

    const left = this.evaluate(node.left, ctx);
    const right = this.evaluate(node.right, ctx);

    return {
      type: "binary",
      node,
      value: operators[node.op](left.value, right.value),
      left,
      right,
    };
  }

  /** Uses `negate` from `math.ts`. */
  protected evaluateUnary(node: UnaryNode, ctx: RollContext): UnaryResult {
    const operand = this.evaluate(node.operand, ctx);

    return { type: "unary", node, value: negate(operand.value), operand };
  }

  protected evaluateParen(node: ParenNode, ctx: RollContext): ParenResult {
    const inner = this.evaluate(node.expression, ctx);

    return { type: "paren", node, value: inner.value, inner };
  }

  /** Uses `functions` from `math.ts`. */
  protected evaluateFunction(
    node: FunctionNode,
    ctx: RollContext,
  ): FunctionResult {
    if (!Object.hasOwn(functions, node.name)) {
      throw new EvaluationError(`Unknown maths function: ${String(node.name)}`);
    }

    if (node.args.length !== functionArity[node.name]) {
      throw new EvaluationError(
        `${node.name}() takes ${functionArity[node.name]} argument(s), not ${node.args.length}`,
      );
    }

    const args = node.args.map((arg) => this.evaluate(arg, ctx));

    return {
      type: "function",
      node,
      value: functions[node.name](...args.map(({ value }) => value)),
      args,
    };
  }

  /**
   * Applies the modifiers in execution order (`ModifierRegistry.inExecutionOrder()`).
   *
   * @throws {EvaluationError} a handler doesn't apply to the target (e.g. `explode` on a group)
   */
  protected applyModifiers<T extends ScoredItem>(
    items: readonly T[],
    modifiers: readonly ModifierNode[],
    target: ModifierTarget,
    input: Omit<ModifierInput, "modifier">,
  ): T[] {
    this.validateIterationLimits(modifiers, input.ctx);

    return this.orderedModifiers(modifiers).reduce<T[]>(
      (current, modifier) =>
        this.runHandler(this.handlerFor(modifier, target), current, {
          ...input,
          modifier,
        }),
      [...items],
    );
  }

  private validateIterationLimits(
    modifiers: readonly ModifierNode[],
    ctx: RollContext,
  ): void {
    for (const modifier of modifiers) {
      if (
        modifier.name === "explode" ||
        modifier.name === "re-roll" ||
        modifier.name === "unique"
      ) {
        resolveIterationBudget(modifier, ctx.limits);
      }
    }
  }

  private orderedModifiers(modifiers: readonly ModifierNode[]): ModifierNode[] {
    if (modifiers.filter(({ name }) => name === "target").length > 1) {
      throw new ValidationError("Target rules must be in one modifier");
    }

    return this.registries.modifiers.inExecutionOrder(modifiers);
  }

  /**
   * The handler of the modifier.
   *
   * @throws {EvaluationError} no handler is registered, or it doesn't apply to the target
   */
  protected handlerFor(
    modifier: ModifierNode,
    target: ModifierTarget,
  ): ModifierHandler {
    if (modifier.name === "target") {
      validateTargetAmounts(modifier);
    }

    const handler = this.registries.modifiers.getOrThrow(modifier.name);

    if (!handler.appliesTo.includes(target)) {
      throw new EvaluationError(
        `The "${modifier.name}" modifier can't be used on a ${target}`,
      );
    }

    return handler;
  }

  /** @throws {EvaluationError} the handler doesn't return an array */
  protected runHandler<T extends ScoredItem>(
    handler: ModifierHandler,
    items: readonly T[],
    input: ModifierInput,
  ): T[] {
    const result: unknown = handler.apply(items, input);

    if (!Array.isArray(result)) {
      throw new EvaluationError(
        `The "${handler.name}" handler must return an array of items`,
      );
    }

    return result as T[];
  }
}

/** Tags flattened die results with the index of their pool (copied by the handlers' spreads). */
const POOL = Symbol("pool");

/** A die result carrying an internal pool tag during flattened group modifier handling. */
export type TaggedDieResult = DieResult & { [POOL]?: number };

function withPoolRolls(
  pool: PoolResult,
  rolls: readonly DieResult[],
): PoolResult {
  return { ...pool, rolls, value: sumIncluded(rolls) };
}

/**
 * Returns a copy of the member with a recalculated result. The calculation value follows the new
 * value, unless a modifier has already changed it (e.g. a target success).
 */
function withMemberResult(
  member: GroupMemberResult,
  result: ExpressionResult,
): GroupMemberResult {
  if (result.value === member.value) {
    return { ...member, result };
  }

  return {
    ...member,
    result,
    value: result.value,
    calculationValue:
      member.calculationValue === member.value
        ? result.value
        : member.calculationValue,
  };
}
