import type { GroupNode, ModifierNode, PoolNode } from "../ast/nodes.js";
import { dieSnapshot } from "../dice/die-utils.js";
import { ImportError } from "../errors/ImportError.js";
import { Evaluator, sumIncluded } from "../evaluator/Evaluator.js";
import type { DrawMode } from "../evaluator/DrawDieRequest.js";
import type { EvaluationDrawRequest } from "../evaluator/EvaluationDrawRequest.js";
import type { RollContext } from "../evaluator/RollContext.js";
import { createRollContext } from "../evaluator/RollContext.js";
import { createDieResult } from "../results/die-result.js";
import type {
  ExpressionResult,
  GroupMemberResult,
  GroupResult,
  ModifierArgumentResult,
  PoolResult,
} from "../results/types.js";
import type { RollSettings } from "../RollSettings.js";
import { conciseRollData } from "./decode.js";
import type { ConciseRollData } from "./formats.js";

/** Reuses expression evaluation while taking all dice and group scoring as supplied. */
export class ConciseRollEvaluator extends Evaluator {
  #poolIndex = 0;
  #groupIndex = 0;

  private constructor(
    private readonly input: ConciseRollData,
    settings: RollSettings<unknown, DrawMode>,
  ) {
    super(settings.evaluator.registries);
  }

  static restore(
    input: ConciseRollData,
    settings: RollSettings<unknown, DrawMode>,
  ): ExpressionResult {
    const data = conciseRollData(input);
    const evaluator = new ConciseRollEvaluator(data, settings);

    try {
      const result = evaluator.evaluate(
        settings.parse(data.notation),
        createRollContext({
          generator: settings.generator,
          limits: settings.limits,
          data: settings.data,
        }),
      );

      if (evaluator.#poolIndex !== data.rolls.length) {
        throw new ImportError(
          `Unused pool results at data.rolls[${evaluator.#poolIndex}]`,
        );
      }

      for (const key of Object.keys(data.groups ?? {})) {
        if (Number(key) >= evaluator.#groupIndex) {
          throw new ImportError(`Unknown group at data.groups.${key}`);
        }
      }

      return result;
    } catch (error) {
      if (error instanceof ImportError) {
        throw error;
      }
      const reason = error instanceof Error ? `: ${error.message}` : "";
      throw new ImportError(`Could not reconstruct the concise roll${reason}`, {
        cause: error,
      });
    }
  }

  protected override *evaluatePool(
    node: PoolNode,
    ctx: RollContext,
  ): Generator<EvaluationDrawRequest, PoolResult, number> {
    const index = this.#poolIndex++;
    const outcomes = this.input.rolls[index];
    if (!outcomes) {
      throw new ImportError(`Missing pool results at data.rolls[${index}]`);
    }

    const qty = yield* this.evaluateNode(node.qty, ctx);
    if (
      !Number.isSafeInteger(qty.value) ||
      qty.value < 0 ||
      qty.value > ctx.limits.maxQty
    ) {
      throw new ImportError(
        `Invalid dice quantity for data.rolls[${index}]: ${qty.value}`,
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
    const rolls = outcomes.map((outcome) => {
      if (typeof outcome === "number") {
        return createDieResult(outcome);
      }

      return {
        ...createDieResult(outcome.value),
        initialValue: outcome.initialValue ?? outcome.value,
        calculationValue: outcome.calculationValue ?? outcome.value,
        useInTotal: outcome.useInTotal ?? true,
        flags: [...(outcome.flags ?? [])],
      };
    });
    const modifierArguments = yield* this.evaluateModifierArguments(
      node.modifiers,
      ctx,
    );

    return {
      type: "pool",
      node,
      qty,
      dieArgs,
      die: dieSnapshot(die),
      rolls,
      value: sumIncluded(rolls),
      ...(modifierArguments.length > 0 && { modifierArguments }),
    };
  }

  protected override *evaluateGroup(
    node: GroupNode,
    ctx: RollContext,
  ): Generator<EvaluationDrawRequest, GroupResult, number> {
    const index = this.#groupIndex++;
    const group = this.input.groups?.[index];
    const path = `data.groups.${index}`;
    for (const key of Object.keys(group?.members ?? {})) {
      if (Number(key) >= node.expressions.length) {
        throw new ImportError(`Unknown group member at ${path}.members.${key}`);
      }
    }

    const members: GroupMemberResult[] = [];

    for (const [source, child] of node.expressions.entries()) {
      const result = yield* this.evaluateNode(child, ctx);
      const score = group?.members?.[source];
      const value = score?.value ?? result.value;

      members.push({
        type: "group-member",
        result,
        value,
        calculationValue: score?.calculationValue ?? value,
        useInTotal: score?.useInTotal ?? true,
        flags: [...(score?.flags ?? [])],
      });
    }

    const order = group?.order;
    if (
      order &&
      (order.length !== members.length ||
        new Set(order).size !== members.length ||
        order.some((source) => source >= members.length))
    ) {
      throw new ImportError(
        `Expected a permutation of member indexes at ${path}.order`,
      );
    }

    const orderedMembers = order?.map((source) => members[source]) ?? members;
    const modifierArguments = yield* this.evaluateModifierArguments(
      node.modifiers,
      ctx,
    );
    return {
      type: "group",
      node,
      members: orderedMembers,
      value: sumIncluded(orderedMembers),
      ...(modifierArguments.length > 0 && { modifierArguments }),
    };
  }

  private *evaluateModifierArguments(
    modifiers: readonly ModifierNode[],
    ctx: RollContext,
  ): Generator<EvaluationDrawRequest, ModifierArgumentResult[], number> {
    const computed = modifiers.filter(
      (modifier) =>
        (modifier.name === "keep" || modifier.name === "drop") &&
        typeof modifier.qty !== "number",
    );

    const arguments_: ModifierArgumentResult[] = [];

    for (const modifier of this.registries.modifiers.inExecutionOrder(
      computed,
    )) {
      const { argument } = yield* this.resolveModifier(
        modifier,
        modifiers.indexOf(modifier),
        ctx,
      );

      if (argument) {
        arguments_.push(argument);
      }
    }

    return arguments_;
  }
}
