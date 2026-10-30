import type { BuiltInDieName } from "../ast/nodes.js";
import { ValidationError } from "../errors/ValidationError.js";
import {
  faceDie,
  fudgeDie,
  percentileDie,
  rangeDie,
  standardDie,
} from "./presets.js";
import type { FudgeNonBlanks } from "./presets.js";
import type { DieFactory, DieLike } from "./types.js";

/** The built-in factories, keyed by the names the grammar uses. */
const builtInFactories: Record<BuiltInDieName, DieFactory> = {
  standard: (sides) => standardDie(sides),
  percentile: () => percentileDie,
  // `fudgeDie()` checks the value at runtime
  fudge: (nonBlanks = 2) => fudgeDie(nonBlanks as FudgeNonBlanks),
  range: (min, max) => rangeDie(min, max),
  face: (...faces) => faceDie(faces),
};

/**
 * Die factories by name.
 *
 * A pool's die is a `DieNode` (`{ name, args }`), and the evaluator creates the die with
 * `registry.create(name, ...args)`. The grammar uses the built-in names (`d6` -> `standard(6)`,
 * `d%` -> `percentile()`, `dF.1` -> `fudge(1)`), so registering a factory with a built-in name
 * changes what that notation rolls, for every roll using this registry.
 *
 * Imports work the same way: the AST stores the name, so nothing needs restoring.
 */
export class DieRegistry {
  readonly #factories = new Map<string, DieFactory>();

  /** A registry with the built-in factories: `standard`, `percentile`, `fudge`, `range`, `face`. */
  constructor() {
    for (const [name, factory] of Object.entries(builtInFactories)) {
      this.register(name, factory);
    }
  }

  /** A registry with no factories, not even the built-ins. */
  static empty(): DieRegistry {
    const registry = new DieRegistry();

    registry.#factories.clear();

    return registry;
  }

  /** The registered names, in alphabetical order. */
  get names(): readonly string[] {
    return [...this.#factories.keys()].sort();
  }

  /**
   * Registers a factory, replacing any already registered with the same name.
   *
   * @throws {ValidationError} the name is empty, or the factory isn't a function
   */
  register(name: string, factory: DieFactory): this {
    if (typeof name !== "string" || name === "") {
      throw new ValidationError("A die factory needs a name");
    }

    if (typeof factory !== "function") {
      throw new ValidationError(`The die factory "${name}" must be a function`);
    }

    this.#factories.set(name, factory);

    return this;
  }

  /** The factory registered with the name, e.g. `registry.get("standard")?.(6)`. */
  get(name: string): DieFactory | undefined {
    return this.#factories.get(name);
  }

  getOrThrow(name: string): DieFactory {
    const factory = this.get(name);

    if (!factory) {
      throw new ValidationError(`Unknown die: "${name}"`);
    }

    return factory;
  }

  /** Whether a factory is registered with the name. */
  has(name: string): boolean {
    return this.#factories.has(name);
  }

  /**
   * Removes the factory registered with the name. Notation that uses a removed built-in (e.g. `d6`
   * after removing `standard`) then throws when it's rolled.
   *
   * @returns whether a factory was registered with the name
   */
  remove(name: string): boolean {
    return this.#factories.delete(name);
  }

  /**
   * Creates a die with the named factory, e.g. `registry.create("standard", 6)`.
   *
   * @throws {ValidationError} no factory is registered with the name (or the factory rejects the
   *   arguments)
   */
  create(name: string, ...args: number[]): DieLike {
    return this.getOrThrow(name)(...args);
  }
}
