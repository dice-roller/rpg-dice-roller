import type {
  BinaryNode,
  ComparisonNode,
  ConditionalNode,
  ExpressionNode,
  FunctionNode,
  GroupNode,
  MathFunctionName,
  ModifierNode,
  NumberNode,
  ParenNode,
  PoolNode,
  ReferenceNode,
  UnaryNode,
} from "../ast/nodes.js";
import type { DieRegistry } from "../dice/DieRegistry.js";
import { dieSnapshot, resolveDie } from "../dice/die-utils.js";
import type { ResolvedDie } from "../dice/types.js";
import { EvaluationError } from "../errors/EvaluationError.js";
import { ValidationError } from "../errors/ValidationError.js";
import {
  normalizeModifierAmount,
  validateExpression,
} from "../ast/validation.js";
import { createReference } from "../ast/factory.js";
import type { ModifierRegistry } from "../modifiers/ModifierRegistry.js";
import { matchesComparePoint } from "../modifiers/compare-point.js";
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
  ComparisonResult,
  ConditionalResult,
  DieResult,
  ExpressionResult,
  FunctionResult,
  GroupMemberResult,
  GroupResult,
  ModifierArgumentResult,
  NumberResult,
  ParenResult,
  PoolResult,
  ReferenceResult,
  ScoredItem,
  UnaryResult,
} from "../results/types.js";
import type { EvaluationDrawRequest } from "./EvaluationDrawRequest.js";
import { functions, negate, operators } from "./math.js";
import type { RollContext } from "./RollContext.js";
import { resolveReference } from "./roll-input-data.js";
import { AsyncEvaluationDriver } from "./AsyncEvaluationDriver.js";
import { SyncEvaluationDriver } from "./SyncEvaluationDriver.js";

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

interface ModifierApplication<T extends ScoredItem> {
  readonly items: T[];
  readonly modifierArguments: readonly ModifierArgumentResult[];
}

type GeneratorResult<T> = T | Generator<EvaluationDrawRequest, T, number>;

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
    return new SyncEvaluationDriver().evaluate(
      this.evaluateGenerator(node, ctx),
      ctx,
    );
  }

  /** Evaluates an expression tree while awaiting externally supplied die faces. */
  evaluateAsync(
    node: ExpressionNode,
    ctx: RollContext,
  ): Promise<ExpressionResult> {
    return new AsyncEvaluationDriver().evaluate(
      this.evaluateGenerator(node, ctx),
      ctx,
    );
  }

  /** Creates a resumable evaluation of an expression tree. */
  *evaluateGenerator(
    node: ExpressionNode,
    ctx: RollContext,
  ): Generator<EvaluationDrawRequest, ExpressionResult, number> {
    validateExpression(node);
    return yield* this.evaluateNode(node, ctx);
  }

  protected *evaluateNode(
    node: ExpressionNode,
    ctx: RollContext,
  ): Generator<EvaluationDrawRequest, ExpressionResult, number> {
    switch (node.type) {
      case "number":
        return this.evaluateNumber(node, ctx);
      case "pool":
        return yield* this.evaluatePool(node, ctx);
      case "group":
        return yield* this.evaluateGroup(node, ctx);
      case "binary":
        return yield* this.evaluateBinary(node, ctx);
      case "comparison":
        return yield* this.evaluateComparison(node, ctx);
      case "unary":
        return yield* this.evaluateUnary(node, ctx);
      case "paren":
        return yield* this.evaluateParen(node, ctx);
      case "function":
        return yield* this.evaluateFunction(node, ctx);
      case "conditional":
        return yield* this.evaluateConditional(node, ctx);
      case "reference":
        return this.evaluateReference(node, ctx);
      default: {
        throw new EvaluationError(
          `Unknown node type: ${(node as { type: string }).type}`,
        );
      }
    }
  }

  protected *evaluateConditional(
    node: ConditionalNode,
    ctx: RollContext,
  ): Generator<EvaluationDrawRequest, ConditionalResult, number> {
    const condition = yield* this.evaluateNode(node.condition, ctx);
    const selectedBranch = condition.value === 0 ? "false" : "true";
    const branch =
      selectedBranch === "true" ? node.trueBranch : node.falseBranch;
    const branchContext: RollContext = {
      ...ctx,
      system: Object.freeze({ ...ctx.system, condition: condition.value }),
    };
    let selectedResult: ExpressionResult;

    if (branch === null) {
      selectedResult = this.evaluateReference(
        createReference("system", ["condition"]),
        branchContext,
      );
    } else {
      selectedResult = yield* this.evaluateNode(branch, branchContext);
    }

    return {
      type: "conditional",
      node,
      value: selectedResult.value,
      condition,
      selectedBranch,
      selectedResult,
    };
  }

  protected evaluateReference(
    node: ReferenceNode,
    ctx: RollContext,
  ): ReferenceResult {
    return {
      type: "reference",
      node,
      value: resolveReference(node.namespace, node.path, ctx.system, ctx.data),
    };
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
  protected *evaluatePool(
    node: PoolNode,
    ctx: RollContext,
  ): Generator<EvaluationDrawRequest, PoolResult, number> {
    const qty = yield* this.evaluateNode(node.qty, ctx);
    const count = qty.value;
    const minQty = node.qty.type === "number" ? 1 : 0;

    if (
      !Number.isSafeInteger(count) ||
      count < minQty ||
      count > ctx.limits.maxQty
    ) {
      throw new EvaluationError(
        `Dice quantity must be an integer between ${minQty} and ${ctx.limits.maxQty}: ${count}`,
      );
    }

    const dieArgs: ExpressionResult[] = [];

    for (const arg of node.die.args) {
      dieArgs.push(yield* this.evaluateNode(arg, ctx));
    }

    const die = this.createDie(
      node,
      dieArgs.map(({ value }) => value),
    );
    const initialRolls: DieResult[] = [];

    for (let index = 0; index < count; index++) {
      initialRolls.push(createDieResult(yield* this.drawPoolDie(node, die)));
    }
    const generatedRolls = { count: 0 };
    const rollGeneratedDie = () =>
      this.rollGeneratedDie(node, die, generatedRolls, ctx);
    const rollGeneratedBatch = (batchCount: number) =>
      this.rollGeneratedBatch(node, die, batchCount, generatedRolls, ctx);
    const modifierApplication =
      node.modifiers.length === 0
        ? { items: initialRolls, modifierArguments: [] }
        : yield* this.applyModifiers(initialRolls, node.modifiers, "pool", {
            ctx,
            die,
            rollDie: rollGeneratedDie,
            rollBatch: rollGeneratedBatch,
          });
    const rolls = modifierApplication.items;

    return {
      type: "pool",
      node,
      value: sumIncluded(rolls),
      qty,
      dieArgs,
      die: dieSnapshot(die),
      rolls,
      ...(modifierApplication.modifierArguments.length > 0 && {
        modifierArguments: modifierApplication.modifierArguments,
      }),
    };
  }

  /** Creates and resolves the die of a pool node, with already evaluated arguments. */
  protected createDie(node: PoolNode, args: readonly number[]): ResolvedDie {
    return resolveDie(this.registries.dice.create(node.die.name, ...args));
  }

  protected *drawPoolDie(
    node: PoolNode,
    die: ResolvedDie,
  ): Generator<EvaluationDrawRequest, number, number> {
    return yield { die, factoryName: node.die.name };
  }

  private *rollGeneratedDie(
    node: PoolNode,
    die: ResolvedDie,
    budget: { count: number },
    ctx: RollContext,
  ): Generator<EvaluationDrawRequest, DieResult | undefined, number> {
    if (budget.count >= ctx.limits.maxGeneratedRolls) {
      return undefined;
    }

    budget.count++;

    return createDieResult(yield* this.drawPoolDie(node, die));
  }

  private *rollGeneratedBatch(
    node: PoolNode,
    die: ResolvedDie,
    batchCount: number,
    budget: { count: number },
    ctx: RollContext,
  ): Generator<EvaluationDrawRequest, DieResult[] | undefined, number> {
    if (!Number.isSafeInteger(batchCount) || batchCount < 0) {
      throw new EvaluationError(
        "A generated batch size must be a non-negative safe integer",
      );
    }

    if (batchCount > ctx.limits.maxGeneratedRolls - budget.count) {
      return undefined;
    }

    budget.count += batchCount;
    const results: DieResult[] = [];

    for (let index = 0; index < batchCount; index++) {
      results.push(createDieResult(yield* this.drawPoolDie(node, die)));
    }

    return results;
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
  protected *evaluateGroup(
    node: GroupNode,
    ctx: RollContext,
  ): Generator<EvaluationDrawRequest, GroupResult, number> {
    if (node.expressions.length === 0) {
      throw new EvaluationError("A group needs at least one expression");
    }

    this.validateIterationLimits(node.modifiers, ctx);

    let members: GroupMemberResult[] = [];

    for (const expression of node.expressions) {
      const result = yield* this.evaluateNode(expression, ctx);

      members.push({
        type: "group-member",
        result,
        value: result.value,
        calculationValue: result.value,
        useInTotal: true,
        flags: [],
      });
    }
    const modifierArguments: ModifierArgumentResult[] = [];

    for (const modifier of this.orderedModifiers(node.modifiers)) {
      const handler = this.handlerFor(modifier, "group");
      const resolved = yield* this.resolveModifier(
        modifier,
        node.modifiers.indexOf(modifier),
        ctx,
      );
      if (resolved.argument) {
        modifierArguments.push(resolved.argument);
      }
      const input: ModifierInput = { modifier: resolved.modifier, ctx };

      if (handler.groupHandling === "flatten" && members.length === 1) {
        const updatedMembers: GroupMemberResult[] = [];

        for (const member of members) {
          const result = yield* this.applyToFlattenedDice(
            member.result,
            handler,
            input,
          );
          updatedMembers.push(withMemberResult(member, result));
        }

        members = updatedMembers;
      } else {
        members = yield* this.runHandler(handler, members, input);

        if (handler.groupHandling === "each-pool") {
          const runHandler = this.runHandler.bind(this);
          const updatedMembers: GroupMemberResult[] = [];

          for (const member of members) {
            const result = yield* this.rebuildPools(
              member.result,
              function* (pool) {
                const rolls = yield* runHandler(handler, pool.rolls, input);

                return withPoolRolls(pool, rolls);
              },
              (nested) => runHandler(handler, nested, input),
            );
            updatedMembers.push(withMemberResult(member, result));
          }

          members = updatedMembers;
        }
      }
    }

    return {
      type: "group",
      node,
      value: sumIncluded(members),
      members,
      ...(modifierArguments.length > 0 && { modifierArguments }),
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
  protected *applyToFlattenedDice(
    result: ExpressionResult,
    handler: ModifierHandler,
    input: ModifierInput,
  ): Generator<EvaluationDrawRequest, ExpressionResult, number> {
    const pools: PoolResult[] = [];

    yield* this.rebuildPools(result, (pool) => {
      pools.push(pool);

      return pool;
    });

    const byPool = pools.map((): DieResult[] => []);
    const taggedList = yield* this.runHandler(
      handler,
      pools.flatMap((pool, index) =>
        pool.rolls.map((roll): TaggedDieResult => ({ ...roll, [POOL]: index })),
      ),
      input,
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

    return yield* this.rebuildPools(result, (pool, index) => {
      return withPoolRolls(pool, byPool[index] ?? []);
    });
  }

  /**
   * Walks the result tree, replacing each pool with `replace(pool, index)` and recalculating the
   * values above it. Pools are visited in notation order.
   *
   * Pools in a pool's quantity or die arguments aren't visited (they've already been used), nor
   * are pools in nested groups unless `transformMembers` is supplied.
   */
  protected *rebuildPools(
    result: ExpressionResult,
    replace: (pool: PoolResult, index: number) => GeneratorResult<PoolResult>,
    transformMembers?: (
      members: readonly GroupMemberResult[],
    ) => GeneratorResult<GroupMemberResult[]>,
  ): Generator<EvaluationDrawRequest, ExpressionResult, number> {
    let index = 0;

    const visit = function* (
      current: ExpressionResult,
    ): Generator<EvaluationDrawRequest, ExpressionResult, number> {
      switch (current.type) {
        case "pool":
          return yield* resolveGeneratorResult(replace(current, index++));
        case "group": {
          if (!transformMembers) {
            return current;
          }

          const transformedMembers = yield* resolveGeneratorResult(
            transformMembers(current.members),
          );
          const members: GroupMemberResult[] = [];

          for (const member of transformedMembers) {
            members.push(withMemberResult(member, yield* visit(member.result)));
          }

          return { ...current, members, value: sumIncluded(members) };
        }
        case "binary": {
          const left = yield* visit(current.left);
          const right = yield* visit(current.right);

          return {
            ...current,
            left,
            right,
            value: operators[current.node.op](left.value, right.value),
          };
        }
        case "comparison": {
          const left = yield* visit(current.left);
          const right = yield* visit(current.right);

          return {
            ...current,
            left,
            right,
            value: Number(
              matchesComparePoint(
                { operator: current.node.op, value: right.value },
                left.value,
              ),
            ),
          };
        }
        case "unary": {
          const operand = yield* visit(current.operand);

          return { ...current, operand, value: negate(operand.value) };
        }
        case "paren": {
          const inner = yield* visit(current.inner);

          return { ...current, inner, value: inner.value };
        }
        case "function": {
          const args: ExpressionResult[] = [];

          for (const arg of current.args) {
            args.push(yield* visit(arg));
          }

          return {
            ...current,
            args,
            value: functions[current.node.name](
              ...args.map(({ value }) => value),
            ),
          };
        }
        case "conditional": {
          const selectedResult = yield* visit(current.selectedResult);
          return { ...current, selectedResult, value: selectedResult.value };
        }
        default:
          return current;
      }
    };

    return yield* visit(result);
  }

  /** Uses `operators` from `math.ts`. */
  protected *evaluateBinary(
    node: BinaryNode,
    ctx: RollContext,
  ): Generator<EvaluationDrawRequest, BinaryResult, number> {
    if (!Object.hasOwn(operators, node.op)) {
      throw new EvaluationError(`Unknown operator: ${String(node.op)}`);
    }

    const left = yield* this.evaluateNode(node.left, ctx);
    const right = yield* this.evaluateNode(node.right, ctx);

    return {
      type: "binary",
      node,
      value: operators[node.op](left.value, right.value),
      left,
      right,
    };
  }

  protected *evaluateComparison(
    node: ComparisonNode,
    ctx: RollContext,
  ): Generator<EvaluationDrawRequest, ComparisonResult, number> {
    const left = yield* this.evaluateNode(node.left, ctx);
    const right = yield* this.evaluateNode(node.right, ctx);

    return {
      type: "comparison",
      node,
      value: Number(
        matchesComparePoint(
          { operator: node.op, value: right.value },
          left.value,
        ),
      ),
      left,
      right,
    };
  }

  /** Uses `negate` from `math.ts`. */
  protected *evaluateUnary(
    node: UnaryNode,
    ctx: RollContext,
  ): Generator<EvaluationDrawRequest, UnaryResult, number> {
    const operand = yield* this.evaluateNode(node.operand, ctx);

    return { type: "unary", node, value: negate(operand.value), operand };
  }

  protected *evaluateParen(
    node: ParenNode,
    ctx: RollContext,
  ): Generator<EvaluationDrawRequest, ParenResult, number> {
    const inner = yield* this.evaluateNode(node.expression, ctx);

    return { type: "paren", node, value: inner.value, inner };
  }

  /** Uses `functions` from `math.ts`. */
  protected *evaluateFunction(
    node: FunctionNode,
    ctx: RollContext,
  ): Generator<EvaluationDrawRequest, FunctionResult, number> {
    if (!Object.hasOwn(functions, node.name)) {
      throw new EvaluationError(`Unknown maths function: ${String(node.name)}`);
    }

    if (node.args.length !== functionArity[node.name]) {
      throw new EvaluationError(
        `${node.name}() takes ${functionArity[node.name]} argument(s), not ${node.args.length}`,
      );
    }

    const args: ExpressionResult[] = [];

    for (const arg of node.args) {
      args.push(yield* this.evaluateNode(arg, ctx));
    }

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
  protected *applyModifiers<T extends ScoredItem>(
    items: readonly T[],
    modifiers: readonly ModifierNode[],
    target: ModifierTarget,
    input: Omit<ModifierInput, "modifier">,
  ): Generator<EvaluationDrawRequest, ModifierApplication<T>, number> {
    this.validateIterationLimits(modifiers, input.ctx);

    const modifierArguments: ModifierArgumentResult[] = [];
    let modifiedItems = [...items];

    for (const modifier of this.orderedModifiers(modifiers)) {
      const handler = this.handlerFor(modifier, target);
      const resolved = yield* this.resolveModifier(
        modifier,
        modifiers.indexOf(modifier),
        input.ctx,
      );

      if (resolved.argument) {
        modifierArguments.push(resolved.argument);
      }

      modifiedItems = yield* this.runHandler(handler, modifiedItems, {
        ...input,
        modifier: resolved.modifier,
      });
    }

    return { items: modifiedItems, modifierArguments };
  }

  protected *resolveModifier(
    modifier: ModifierNode,
    modifierIndex: number,
    ctx: RollContext,
  ): Generator<
    EvaluationDrawRequest,
    { modifier: ModifierNode; argument?: ModifierArgumentResult },
    number
  > {
    if (
      (modifier.name === "keep" || modifier.name === "drop") &&
      typeof modifier.qty !== "number"
    ) {
      const result = yield* this.evaluateNode(modifier.qty, ctx);

      if (!Number.isSafeInteger(result.value) || result.value < 0) {
        throw new EvaluationError(
          `A computed ${modifier.name} quantity must be a non-negative safe integer: ${result.value}`,
        );
      }

      return {
        modifier: { ...modifier, qty: result.value },
        argument: { modifierIndex, result },
      };
    }

    return { modifier };
  }

  private validateIterationLimits(
    modifiers: readonly ModifierNode[],
    ctx: RollContext,
  ): void {
    for (const modifier of modifiers) {
      if (
        modifier.name === "explode" ||
        modifier.name === "explode-matching-batch" ||
        modifier.name === "re-roll" ||
        modifier.name === "unique"
      ) {
        resolveIterationBudget(modifier, ctx.limits);
      }

      if (modifier.name === "explode" || modifier.name === "re-roll") {
        normalizeModifierAmount(modifier.amount);
      } else if (
        modifier.name === "unique" &&
        Object.hasOwn(modifier, "amount")
      ) {
        throw new ValidationError(
          "A modifier amount is not supported on unique",
        );
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
  protected *runHandler<T extends ScoredItem>(
    handler: ModifierHandler,
    items: readonly T[],
    input: ModifierInput,
  ): Generator<EvaluationDrawRequest, T[], number> {
    const result = handler.apply(items, input);
    let returnedItems: unknown;

    if (Array.isArray(result)) {
      returnedItems = result;
    } else if (isGenerator(result)) {
      returnedItems = yield* result;
    } else {
      throw new EvaluationError(
        `The "${handler.name}" handler must return an array of items`,
      );
    }

    if (!Array.isArray(returnedItems)) {
      throw new EvaluationError(
        `The "${handler.name}" handler must return an array of items`,
      );
    }

    return returnedItems as T[];
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

function isGenerator<T>(
  value: Generator<EvaluationDrawRequest, T, number> | T,
): value is Generator<EvaluationDrawRequest, T, number> {
  return (
    typeof value === "object" &&
    value !== null &&
    "next" in value &&
    typeof value.next === "function"
  );
}

function* resolveGeneratorResult<T>(
  value: GeneratorResult<T>,
): Generator<EvaluationDrawRequest, T, number> {
  if (isGenerator(value)) {
    return yield* value;
  }

  return value;
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
