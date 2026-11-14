import { ValidationError } from "../errors/ValidationError.js";
import { builtInEngineFactories } from "./builtInEngines.js";
import type { EngineFactory, RandomEngine } from "./RandomEngine.js";

const MIN_SEED = -0x8000_0000;
const MAX_SEED = 0x7fff_ffff;

/** Factories for built-in and custom random engines. */
export class EngineRegistry {
  readonly #factories = new Map<string, EngineFactory>();

  /** A registry with the built-in engines: `crypto`, `mersenne`, `nativeMath`, `xoroshiro128plus`. */
  constructor() {
    for (const [name, factory] of Object.entries(builtInEngineFactories)) {
      this.register(name, factory);
    }
  }

  /** A registry with no factories, not even the built-ins. */
  static empty(): EngineRegistry {
    const registry = new EngineRegistry();

    registry.#factories.clear();

    return registry;
  }

  /** The registered names, in alphabetical order. */
  get names(): readonly string[] {
    return [...this.#factories.keys()].sort();
  }

  /** Registers a factory, replacing any already registered with the same name. */
  register(name: string, factory: EngineFactory): this {
    if (typeof name !== "string" || name === "") {
      throw new ValidationError("An engine factory needs a name");
    }

    if (typeof factory !== "function") {
      throw new ValidationError(
        `The engine factory "${name}" must be a function`,
      );
    }

    this.#factories.set(name, factory);

    return this;
  }

  /** The factory registered with the name. */
  get(name: string): EngineFactory | undefined {
    return this.#factories.get(name);
  }

  /** Returns the factory registered with the name. */
  getOrThrow(name: string): EngineFactory {
    const factory = this.get(name);

    if (!factory) {
      throw new ValidationError(`Unknown random engine: "${name}"`);
    }

    return factory;
  }

  /** Whether a factory is registered with the name. */
  has(name: string): boolean {
    return this.#factories.has(name);
  }

  /** Removes the factory registered with the name. */
  remove(name: string): boolean {
    return this.#factories.delete(name);
  }

  /** Creates a fresh engine using the named factory. */
  create(name: string, seed?: number): RandomEngine {
    if (
      seed !== undefined &&
      (!Number.isInteger(seed) || seed < MIN_SEED || seed > MAX_SEED)
    ) {
      throw new ValidationError(
        `The seed for engine "${name}" must be a signed 32-bit integer`,
      );
    }

    const engine = this.getOrThrow(name)(seed);

    if (
      (typeof engine !== "object" && typeof engine !== "function") ||
      engine === null ||
      typeof engine.next !== "function"
    ) {
      throw new ValidationError(
        `The factory for engine "${name}" must return an object with a next() method`,
      );
    }

    return engine;
  }
}
