import type { ExpressionNode } from "./ast/nodes.js";
import { DieRegistry } from "./dice/DieRegistry.js";
import { Evaluator } from "./evaluator/Evaluator.js";
import {
  createRollContext,
  resolveRollLimits,
} from "./evaluator/RollContext.js";
import type { RollLimits, RollMode } from "./evaluator/RollContext.js";
import { ValidationError } from "./errors/ValidationError.js";
import { ModifierRegistry } from "./modifiers/ModifierRegistry.js";
import { Parser } from "./parser/Parser.js";
import { EngineRegistry } from "./random/EngineRegistry.js";
import { NumberGenerator } from "./random/NumberGenerator.js";
import type {
  EngineDefinition,
  EngineOption,
  RandomEngine,
} from "./random/RandomEngine.js";
import type { Presenter } from "./presenters/Presenter.js";
import { defaultTextPresenter } from "./presenters/TextPresenter.js";
import type { ExpressionResult } from "./results/types.js";

/**
 * How notation is parsed, rolled and presented. Every option is optional.
 *
 * @typeParam T the output type of the presenter
 */
export interface RollOptions<T = string> {
  /** The source of randomness (default `nativeMath`); may be a name, engine instance, or definition. */
  engine?: EngineOption;
  /** Engine factories used to resolve names (default: the built-in engines). */
  engines?: EngineRegistry;
  /** Default: `new DieRegistry()` (the built-in dice). */
  dice?: DieRegistry;
  /** Default: `new ModifierRegistry()` (the built-in modifiers). */
  modifiers?: ModifierRegistry;
  /** Safety limits: `maxQty` 999, `maxIterations` 1000 and `maxGeneratedRolls` 1,000,000 generated rolls per pool/evaluation; each must be a positive safe integer. The generated-roll limit excludes initial dice and truncates repeating modifiers without throwing. */
  limits?: Partial<RollLimits>;
  /** Used by `Roll.present()` and `Roller.present()` (default: the default `TextPresenter`). */
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
  readonly engines: EngineRegistry;
  readonly dice: DieRegistry;
  readonly modifiers: ModifierRegistry;
  readonly limits: RollLimits;
  readonly presenter: Presenter<T>;
  readonly parser: Parser;
  readonly evaluator: Evaluator;

  /** Resolves options and validates limits; supplied registries and presenter are shared by reference. */
  constructor(options: RollOptions<T> = {}) {
    this.limits = Object.freeze(resolveRollLimits(options.limits));
    if (
      options.engines !== undefined &&
      !(options.engines instanceof EngineRegistry)
    ) {
      throw new ValidationError("The engines option must be an EngineRegistry");
    }

    this.engines = options.engines ?? new EngineRegistry();
    this.generator = new NumberGenerator(
      resolveEngineOption(options.engine, this.engines),
    );
    this.dice = options.dice ?? new DieRegistry();
    this.modifiers = options.modifiers ?? new ModifierRegistry();
    // without a presenter, T is the default `string`
    this.presenter =
      options.presenter ?? (defaultTextPresenter as unknown as Presenter<T>);
    this.parser = new Parser({ maxQty: this.limits.maxQty });
    this.evaluator = new Evaluator({
      dice: this.dice,
      modifiers: this.modifiers,
    });
  }

  /** Returns settings as they are, or creates settings from options (undefined: fresh defaults). */
  static from<T = string>(
    options?: RollOptions<T> | RollSettings<T>,
  ): RollSettings<T> {
    if (options instanceof RollSettings) {
      return options;
    }

    return new RollSettings(options);
  }

  /** Creates settings with a new engine and all other configuration shared with the source. */
  static withEngine<T>(
    settings: RollSettings<T>,
    engine: EngineOption,
  ): RollSettings<T> {
    return new RollSettings({
      engine,
      engines: settings.engines,
      dice: settings.dice,
      modifiers: settings.modifiers,
      limits: settings.limits,
      presenter: settings.presenter,
    });
  }

  /** Parses notation into the AST, without rolling. */
  parse(notation: string): ExpressionNode {
    return this.parser.parse(notation);
  }

  /** Evaluates the AST in the given mode (default `random`); `min` and `max` select each die's extreme. Every evaluation starts a fresh generated-roll budget per pool; exhausting it returns the dice rolled so far. */
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

function resolveEngineOption(
  option: EngineOption | undefined,
  engines: EngineRegistry,
): RandomEngine {
  if (option === undefined) {
    return engines.create("nativeMath");
  }

  if (typeof option === "string") {
    return engines.create(option);
  }

  if (typeof option !== "object" || option === null) {
    throw new ValidationError(
      "An engine option must be a name, an engine instance with a next() method, or an engine definition",
    );
  }

  const candidate = option as Partial<RandomEngine> & Partial<EngineDefinition>;

  if (typeof candidate.next === "function") {
    return option as RandomEngine;
  }

  if (typeof candidate.name !== "string" || candidate.name === "") {
    throw new ValidationError(
      "An engine option must be a name, an engine instance with a next() method, or an engine definition",
    );
  }

  return engines.create(candidate.name, candidate.seed);
}
