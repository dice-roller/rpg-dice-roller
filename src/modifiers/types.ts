import type { ModifierName, ModifierNode } from "../ast/nodes.js";
import type { ResolvedDie } from "../dice/types.js";
import type { RollContext } from "../evaluator/RollContext.js";
import type { DieResult, ScoredItem } from "../results/types.js";

/** What a modifier can be attached to. */
export type ModifierTarget = "pool" | "group";

/** Everything a handler gets besides the items. */
export interface ModifierInput<N extends ModifierNode = ModifierNode> {
  /** The modifier node from the AST. */
  readonly modifier: N;
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
 * (whatever the order in the notation). They never mutate: `apply()` returns a new array of new
 * items, using the helpers in `results/die-result.ts`.
 */
export interface ModifierHandler<N extends ModifierNode = ModifierNode> {
  readonly name: N["name"];
  /** Execution order; lower runs first. */
  readonly order: number;
  readonly appliesTo: readonly ModifierTarget[];

  /**
   * Applies the modifier.
   *
   * `items` are die results for a pool, or group members for a group (or, for a group with a single
   * expression, the die results of every pool in it).
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
