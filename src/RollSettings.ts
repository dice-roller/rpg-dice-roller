import type { ExpressionNode } from "./ast/nodes.js";
import { DieRegistry } from "./dice/DieRegistry.js";
import { Evaluator } from "./evaluator/Evaluator.js";
import {
  DEFAULT_ROLL_LIMITS,
  createRollContext,
} from "./evaluator/RollContext.js";
import type { RollLimits, RollMode } from "./evaluator/RollContext.js";
import { ModifierRegistry } from "./modifiers/ModifierRegistry.js";
import { Parser } from "./parser/Parser.js";
import { NumberGenerator } from "./random/NumberGenerator.js";
import type { RandomEngine } from "./random/RandomEngine.js";
import type { Presenter } from "./presenters/Presenter.js";
import { defaultTextPresenter } from "./presenters/TextPresenter.js";
import type { ExpressionResult } from "./results/types.js";

/**
 * How notation is parsed, rolled and presented. Every option is optional.
 *
 * @typeParam T the output type of the presenter
 */
export interface RollOptions<T = string> {
  /** The source of randomness (default `nativeMath`). */
  engine?: RandomEngine;
  /** Default: `new DieRegistry()` (the built-in dice). */
  dice?: DieRegistry;
  /** Default: `new ModifierRegistry()` (the built-in modifiers). */
  modifiers?: ModifierRegistry;
  limits?: Partial<RollLimits>;
  /** Used by `Roller.present()` (default: the default `TextPresenter`). */
  presenter?: Presenter<T>;
}

/**
 * Resolved `RollOptions`, with the services built from them.
 *
 * Shared by a `Roller` and its rolls, and by a roll and its re-rolls, so the generator, registries,
 * parser and evaluator are only created once. It can also be created once and passed to many
 * standalone rolls: `new Roll("4d6", settings)`.
 *
 * @typeParam T the output type of the presenter
 */
export class RollSettings<T = string> {
  readonly generator: NumberGenerator;
  readonly dice: DieRegistry;
  readonly modifiers: ModifierRegistry;
  readonly limits: RollLimits;
  readonly presenter: Presenter<T>;
  readonly parser: Parser;
  readonly evaluator: Evaluator;

  constructor(options: RollOptions<T> = {}) {
    this.generator = new NumberGenerator(options.engine);
    this.dice = options.dice ?? new DieRegistry();
    this.modifiers = options.modifiers ?? new ModifierRegistry();
    this.limits = Object.freeze({ ...DEFAULT_ROLL_LIMITS, ...options.limits });
    // without a presenter, T is the default `string`
    this.presenter =
      options.presenter ?? (defaultTextPresenter as unknown as Presenter<T>);
    this.parser = new Parser({ maxQty: this.limits.maxQty });
    this.evaluator = new Evaluator({
      dice: this.dice,
      modifiers: this.modifiers,
    });
  }

  /** Returns the settings as they are, or resolves the options (undefined: the shared defaults). */
  static from<T = string>(
    options?: RollOptions<T> | RollSettings<T>,
  ): RollSettings<T> {
    if (options instanceof RollSettings) {
      return options;
    }

    return options
      ? new RollSettings(options)
      : (defaultSettings() as unknown as RollSettings<T>);
  }

  /** Parses notation into the AST, without rolling. */
  parse(notation: string): ExpressionNode {
    return this.parser.parse(notation);
  }

  /** Evaluates the AST in the mode. */
  evaluate(
    expression: ExpressionNode,
    mode: RollMode = "random",
  ): ExpressionResult {
    return this.evaluator.evaluate(
      expression,
      createRollContext({
        generator: this.generator,
        mode,
        limits: this.limits,
      }),
    );
  }
}

let defaults: RollSettings | undefined;

/**
 * The settings of rolls created without options.
 *
 * Created on first use. Kept private, so nobody can register dice or modifiers on them globally.
 */
function defaultSettings(): RollSettings {
  return (defaults ??= new RollSettings());
}
