/**
 * rpg-dice-roller
 *
 * @example
 * import { Roll, Roller } from "@dice-roller/rpg-dice-roller";
 *
 * // a single roll
 * const roll = new Roll("4d6kh3");
 * roll.total;      // e.g. 14
 * `${roll}`;       // e.g. "4d6kh3: [3d, 5, 6, 3] = 14"
 *
 * // rolls with a history
 * const roller = new Roller();
 * roller.roll("4d6kh3");
 * roller.history.total;
 */
import type { ExpressionNode } from "./ast/nodes.js";
import { Roll } from "./Roll.js";
import type { RollOptions, RollSettings } from "./RollSettings.js";

/** Shorthand for `new Roll(input, options)`: rolls notation (or an AST) once, without a history. */
export function roll(
  input: string | ExpressionNode,
  options?: RollOptions | RollSettings,
): Roll {
  return new Roll(input, options);
}

// the main classes
export { Roll } from "./Roll.js";
export { RollSettings } from "./RollSettings.js";
export type { RollOptions } from "./RollSettings.js";
export { Roller } from "./Roller.js";
export type { RollerOptions } from "./Roller.js";
export { RollHistory } from "./RollHistory.js";

// types for custom dice, engines and modifier handlers
export type {
  RollContext,
  RollLimits,
  RollMode,
} from "./evaluator/RollContext.js";
export type { NumberGenerator } from "./random/NumberGenerator.js";
export type { RandomEngine } from "./random/RandomEngine.js";

// the most used types
export type { DieLike } from "./dice/types.js";
export type { ExpressionNode } from "./ast/nodes.js";
export type { Presentable } from "./presenters/Presentable.js";
export type { Presenter } from "./presenters/Presenter.js";
export type { ExpressionResult } from "./results/types.js";
export type {
  ExportFormat,
  HistoryData,
  RollData,
} from "./serialization/formats.js";

// namespaces
export * as ast from "./ast/index.js";
export * as dice from "./dice/index.js";
export * as engines from "./random/engines.js";
export * as errors from "./errors/index.js";
export * as modifiers from "./modifiers/index.js";
export * as presenters from "./presenters/index.js";
export * as results from "./results/index.js";
