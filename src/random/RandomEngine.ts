/** A source of uniformly distributed signed 32-bit integers. */
export interface RandomEngine {
  /** Returns a uniformly distributed signed 32-bit integer. */
  next(): number;
}

/** A named engine, optionally initialized with a signed 32-bit seed. */
export interface EngineDefinition {
  name: string;
  seed?: number;
}

/** An engine selected by name, supplied as an instance, or defined with an optional seed. */
export type EngineOption = string | RandomEngine | EngineDefinition;

/** Creates a fresh engine, optionally initialized with a signed 32-bit seed. */
export type EngineFactory = (seed?: number) => RandomEngine;
