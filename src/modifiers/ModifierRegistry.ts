import type { ModifierName, ModifierNode } from "../ast/nodes.js";
import { EvaluationError } from "../errors/EvaluationError.js";
import { builtInModifierHandlers } from "./handlers/index.js";
import type { ModifierHandler, ModifierHandlerOf } from "./types.js";

/**
 * Modifier handlers by name.
 *
 * Replace a built-in handler by registering another with the same name.
 */
export class ModifierRegistry {
  readonly #handlers = new Map<ModifierName, ModifierHandler>();

  /** A registry with the 11 built-in handlers registered. */
  constructor() {
    this.register(...builtInModifierHandlers);
  }

  /** A registry with no handlers, not even the built-ins. */
  static empty(): ModifierRegistry {
    const registry = new ModifierRegistry();

    registry.#handlers.clear();

    return registry;
  }

  /** Registers handlers, replacing any already registered with the same name. */
  register(...handlers: ModifierHandler[]): this {
    for (const handler of handlers) {
      this.#handlers.set(handler.name, handler);
    }

    return this;
  }

  get<K extends ModifierName>(name: K): ModifierHandlerOf<K> | undefined {
    return this.#handlers.get(name) as ModifierHandlerOf<K> | undefined;
  }

  /** @throws {EvaluationError} no handler is registered with the name */
  getOrThrow<K extends ModifierName>(name: K): ModifierHandlerOf<K> {
    const handler = this.get(name);

    if (!handler) {
      throw new EvaluationError(`No handler for the "${name}" modifier`);
    }

    return handler;
  }

  has(name: ModifierName): boolean {
    return this.#handlers.has(name);
  }

  /**
   * Removes the handler registered with the name. Notation that uses the modifier then throws when
   * it's rolled.
   *
   * @returns whether a handler was registered with the name
   */
  remove(name: ModifierName): boolean {
    return this.#handlers.delete(name);
  }

  /** The registered handlers, in execution order. */
  get handlers(): readonly ModifierHandler[] {
    return [...this.#handlers.values()].sort((a, b) => a.order - b.order);
  }

  /**
   * Sorts modifier nodes into execution order (by their handler's `order`).
   *
   * @throws {EvaluationError} a modifier has no registered handler
   */
  inExecutionOrder<N extends ModifierNode>(modifiers: readonly N[]): N[] {
    return [...modifiers].sort(
      (a, b) => this.getOrThrow(a.name).order - this.getOrThrow(b.name).order,
    );
  }
}
