import type { ModifierName, ModifierNode } from "../ast/nodes.js";
import type { ResolvedDie } from "../dice/types.js";
import type { RollContext } from "../evaluator/RollContext.js";
import type { DieResult, ScoredItem } from "../results/types.js";

/** What a modifier can be attached to. */
export type ModifierTarget = "pool" | "group";

/** Context and modifier node supplied to a handler alongside its items. */
export interface ModifierInput<N extends ModifierNode = ModifierNode> {
  /** The modifier node from the AST. */
  readonly modifier: N;
  /** Roll mode, random generator, and safety limits for this evaluation. */
  readonly ctx: RollContext;
  /** The pool's die (pools only). */
  readonly die?: ResolvedDie;
  /** Rolls one more die of the pool (pools only), e.g. for explode and re-roll. */
  readonly rollDie?: () => DieResult;
}

/**
 * The behaviour of a modifier.
 *
 * Handlers are registered by `name` in the `ModifierRegistry`, and run in ascending `order`
 * regardless of notation order; equal orders retain notation order. Implementations should not
 * mutate their input: return a new array, copying changed items with the result helpers. Unchanged
 * items may be reused.
 */
export interface ModifierHandler<N extends ModifierNode = ModifierNode> {
  /** The existing AST modifier name this handler implements. */
  readonly name: N["name"];
  /** Execution order; lower runs first. */
  readonly order: number;
  /** Targets on which the evaluator permits this handler. */
  readonly appliesTo: readonly ModifierTarget[];
  /**
   * How the handler treats the dice inside a roll group. By default it only gets the members.
   *
   * - `flatten`: a group with a single expression gets the dice of every pool in it, flattened,
   *   instead of its member (keep, drop: `{4d6+2d8}k2` keeps the 2 highest dice)
   * - `each-pool`: gets the members of each group, then the dice of each pool, separately
   *   (sort: nested members are sorted by total, and the dice within each pool)
   *
   * Pools in a pool's quantity or die arguments aren't included. Flattening stops at nested groups;
   * with multiple expressions it operates on members instead. Flattened dice are written back to
   * their original pools, so returned dice must retain their pool association (e.g. by copying an
   * input item with object spread). New, unassociated dice cause an `EvaluationError`.
   */
  readonly groupHandling?: "flatten" | "each-pool";

  /**
   * Applies the modifier.
   *
   * `items` are die results for a pool, or group members for a group (or die results, as set by
   * `groupHandling`). Group calls, including calls for their pool dice, do not supply `die` or
   * `rollDie`. The evaluator requires an array result.
   */
  apply<T extends ScoredItem>(
    items: readonly T[],
    input: ModifierInput<N>,
  ): T[];
}

/** The handler for the modifier with the given name. */
export type ModifierHandlerOf<K extends ModifierName> = ModifierHandler<
  Extract<ModifierNode, { name: K }>
>;
