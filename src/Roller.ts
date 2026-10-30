import type { ExpressionNode } from "./ast/nodes.js";
import type { DieRegistry } from "./dice/DieRegistry.js";
import type { RollLimits } from "./evaluator/RollContext.js";
import type { ModifierRegistry } from "./modifiers/ModifierRegistry.js";
import type { Presenter } from "./presenters/Presenter.js";
import { defaultTextPresenter } from "./presenters/TextPresenter.js";
import type { NumberGenerator } from "./random/NumberGenerator.js";
import { Roll } from "./Roll.js";
import { RollHistory } from "./RollHistory.js";
import { RollSettings } from "./RollSettings.js";
import type { RollOptions } from "./RollSettings.js";
import { decode } from "./serialization/decode.js";
import { encode } from "./serialization/encode.js";
import type {
  ExportFormat,
  HistoryData,
  RollData,
} from "./serialization/formats.js";

/** @typeParam T the output type of the presenter */
export type RollerOptions<T = string> = RollOptions<T>;

/**
 * Rolls notation and keeps a history of the rolls.
 *
 * For a single roll without a history, use `new Roll(notation)` instead.
 *
 * @example
 * const roller = new Roller();
 * roller.roll("4d6");
 * roller.roll("2d10+3");
 * roller.history.total;  // e.g. 27
 * `${roller}`;           // e.g. "4d6: [3, 5, 2, 2] = 12; 2d10+3: [4, 8]+3 = 15"
 *
 * @typeParam T the output type of the configured presenter
 */
export class Roller<T = string> {
  readonly history = new RollHistory();
  /** Shared by every roll of this roller (and their re-rolls). */
  readonly settings: RollSettings<T>;

  constructor(options: RollerOptions<T> = {}) {
    this.settings = new RollSettings(options);
  }

  get presenter(): Presenter<T> {
    return this.settings.presenter;
  }

  get generator(): NumberGenerator {
    return this.settings.generator;
  }

  get dice(): DieRegistry {
    return this.settings.dice;
  }

  get modifiers(): ModifierRegistry {
    return this.settings.modifiers;
  }

  get limits(): RollLimits {
    return this.settings.limits;
  }

  /** Parses notation into the AST, without rolling. */
  parse(notation: string): ExpressionNode {
    return this.settings.parse(notation);
  }

  /** Rolls notation (or an AST), and adds the roll to the history. */
  roll(input: string | ExpressionNode): Roll<T> {
    const roll = new Roll(input, this.settings);

    this.history.add(roll);

    return roll;
  }

  /** Presents the history with the presenter, or the one from the options (default `TextPresenter`). */
  present(): T;
  present<U>(presenter: Presenter<U>): U;
  present(presenter?: Presenter<unknown>): unknown {
    return (presenter ?? this.presenter).present(this.history);
  }

  /** Exports the history. */
  export(format: "object"): HistoryData;
  export(format?: "json" | "base64"): string;
  export(format: ExportFormat = "json"): HistoryData | string {
    return encode(this.history.toJSON(), format);
  }

  /**
   * Imports exported rolls (a roll or a whole history, as an object, JSON or base64), and adds them
   * to the history.
   *
   * @returns the imported rolls
   * @throws {ImportError} the data is invalid
   */
  import(data: string | RollData | HistoryData): Roll<T>[] {
    const decoded = decode(data);
    const rolls =
      decoded.type === "history"
        ? decoded.rolls.map((roll) => Roll.fromJSON(roll, this.settings))
        : [Roll.fromJSON(decoded, this.settings)];

    this.history.add(...rolls);

    return rolls;
  }

  /** Always the default `TextPresenter` output of the history. */
  toString(): string {
    return defaultTextPresenter.present(this.history);
  }
}
