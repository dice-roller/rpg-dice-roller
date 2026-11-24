import type { ExpressionNode } from "./ast/nodes.js";
import type { DieRegistry } from "./dice/DieRegistry.js";
import type {
  DrawDieAsyncOptions,
  DrawDieOptions,
  DrawDieSyncOptions,
  DrawMode,
} from "./evaluator/DrawDieRequest.js";
import type { RollLimits } from "./evaluator/RollContext.js";
import type { RollInputData } from "./evaluator/roll-input-data.js";
import type { ModifierRegistry } from "./modifiers/ModifierRegistry.js";
import type { Presenter } from "./presenters/Presenter.js";
import { defaultTextPresenter } from "./presenters/TextPresenter.js";
import type { NumberGenerator } from "./random/NumberGenerator.js";
import type { EngineOption } from "./random/RandomEngine.js";
import { Roll } from "./Roll.js";
import type { SyncRollOptions } from "./Roll.js";
import { RollHistory } from "./RollHistory.js";
import { RollSettings } from "./RollSettings.js";
import type { RollOptions } from "./RollSettings.js";
import { decodeImport } from "./serialization/decode.js";
import { encode, toHistoryData } from "./serialization/encode.js";
import type {
  ConciseRollData,
  EncodedExportData,
  EncodedHistoryData,
  ExportFormat,
} from "./serialization/formats.js";

/** Options shared by all rolls made or imported by a roller.
 *
 * @typeParam T the output type of the presenter
 */
export type RollerOptions<T = string> = RollOptions<T>;

type DrawModeOf<Options> = Options extends {
  readonly drawMode: infer Mode extends DrawMode;
}
  ? Mode
  : "sync";

type ConfiguredDrawMode<Options> = Options extends {
  drawDie?: infer DrawDie;
}
  ? DrawModeOf<NonNullable<DrawDie>>
  : "sync";

type RollResultForMode<T, Mode extends DrawMode> = Mode extends "async"
  ? Promise<Roll<T, "async">>
  : Roll<T, "sync">;

interface RollCallOptions {
  engine?: EngineOption;
  data?: RollInputData;
  drawDie?: DrawDieOptions;
}

type SyncRollCallOptions = Omit<RollCallOptions, "drawDie"> & {
  drawDie: DrawDieSyncOptions;
};

type AsyncRollCallOptions = Omit<RollCallOptions, "drawDie"> & {
  drawDie: DrawDieAsyncOptions;
};

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
export class Roller<
  T = string,
  Options extends RollerOptions<T> = SyncRollOptions<T>,
> {
  /** Mutable history of rolls made or imported by this roller. */
  readonly history = new RollHistory();
  /** Shared by every roll of this roller (and their re-rolls). */
  readonly settings: RollSettings<T, ConfiguredDrawMode<Options>>;

  constructor(
    options: Options & RollerOptions<T> = {} as Options & RollerOptions<T>,
  ) {
    this.settings = new RollSettings<T, ConfiguredDrawMode<Options>>(
      options as RollOptions<T, ConfiguredDrawMode<Options>>,
    );
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

  /** Rolls notation (or an AST), and adds the roll to the history only if it succeeds. Async rolls are appended in completion order. Per-roll data replaces the roller's defaults and is snapshotted for the roll. */
  roll(
    input: string | ExpressionNode,
    options: AsyncRollCallOptions,
  ): Promise<Roll<T, "async">>;
  roll(
    input: string | ExpressionNode,
    options: SyncRollCallOptions,
  ): Roll<T, "sync">;
  roll(
    this: Roller<T, Options>,
    input: string | ExpressionNode,
    options?: Omit<RollCallOptions, "drawDie">,
  ): RollResultForMode<T, ConfiguredDrawMode<Options>>;
  roll(
    input: string | ExpressionNode,
    options: RollCallOptions,
  ): Roll<T, "sync"> | Promise<Roll<T, "async">>;
  roll(
    input: string | ExpressionNode,
    options?: RollCallOptions,
  ): Roll<T, "sync"> | Promise<Roll<T, "async">> {
    const engine = options?.engine;
    let settings: RollSettings<T, DrawMode> =
      engine === undefined
        ? this.settings
        : RollSettings.withEngine(this.settings, engine);

    if (options?.data !== undefined) {
      settings = RollSettings.withData(settings, options.data);
    }

    if (options?.drawDie !== undefined) {
      settings = RollSettings.withDrawDie(settings, options.drawDie);
    }

    const roll = Roll.create<T>(input, settings);

    if (roll instanceof Promise) {
      return roll.then((completed) => {
        this.history.add(completed);
        return completed;
      });
    }

    this.history.add(roll);

    return roll;
  }

  /** Presents the history with the presenter, or the one from the options (default `TextPresenter`). */
  present(): T;
  present<U>(presenter: Presenter<U>): U;
  present(presenter?: Presenter<unknown>): unknown {
    return (presenter ?? this.presenter).present(this.history);
  }

  /** Exports the history as a JSON-safe object (default), JSON, or UTF-8 base64 JSON. May evaluate uncached min/max totals. */
  export(format?: "object"): EncodedHistoryData;
  export(format: "json" | "base64"): string;
  export(format: ExportFormat): EncodedHistoryData | string;
  export(format: ExportFormat = "object"): EncodedHistoryData | string {
    return encode(toHistoryData(this.history), format);
  }

  /**
   * Imports a roll, a whole history or concise finished results (an object, JSON or base64), and adds the rolls
   * to the history, without rolling.
   *
   * The data is validated first, so nothing is added if any of it is invalid. Imported rolls share
   * this roller's settings for later re-rolls; re-rolling does not add the new roll to the history.
   *
   * @returns the imported rolls
   * @throws {ImportError} the data is invalid
   */
  import(
    data: string | EncodedExportData | ConciseRollData,
  ): Roll<T, ConfiguredDrawMode<Options>>[] {
    const decoded = decodeImport(data);
    const rolls = (decoded.type === "history" ? decoded.rolls : [decoded]).map(
      (roll) => new Roll<T, ConfiguredDrawMode<Options>>(roll, this.settings),
    );

    this.history.add(...rolls);

    return rolls;
  }

  /** Always the default `TextPresenter` output of the history. */
  toString(): string {
    return defaultTextPresenter.present(this.history);
  }
}
