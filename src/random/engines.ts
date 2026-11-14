/** Random engine registries and the default `Math.random()` engine. */
export { EngineRegistry } from "./EngineRegistry.js";
export { nativeMath } from "./builtInEngines.js";
export type {
  EngineDefinition,
  EngineFactory,
  EngineOption,
  RandomEngine,
} from "./RandomEngine.js";
