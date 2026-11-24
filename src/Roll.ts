import type { DescriptionNode, ExpressionNode } from "./ast/nodes.js";
import { nodeToNotation } from "./ast/notation.js";
import { validateExpression } from "./ast/validation.js";
import { ImportError } from "./errors/ImportError.js";
import { ValidationError } from "./errors/ValidationError.js";
import { averageResult, containsConditional } from "./evaluator/average.js";
import type {
  DrawDieAsyncOptions,
  DrawDieSyncOptions,
  DrawMode,
} from "./evaluator/DrawDieRequest.js";
import type { RollInputData } from "./evaluator/roll-input-data.js";
import { snapshotRollInputData } from "./evaluator/roll-input-data.js";
import type { Presenter } from "./presenters/Presenter.js";
import { defaultTextPresenter } from "./presenters/TextPresenter.js";
import type { EngineOption } from "./random/RandomEngine.js";
import type { ExpressionResult } from "./results/types.js";
import { RollSettings } from "./RollSettings.js";
import type { RollOptions } from "./RollSettings.js";
import { ConciseRollEvaluator } from "./serialization/ConciseRollEvaluator.js";
import { decodeImport } from "./serialization/decode.js";
import { encode, encodeNumbers, toRollData } from "./serialization/encode.js";
import type {
  ConciseRollData,
  EncodedRollData,
  ExportFormat,
  RollData,
} from "./serialization/formats.js";

/** Rounds a total to 2 decimal places, as in v5. */
const roundTotal = (value: number): number => parseFloat(value.toFixed(2));

export type SyncRollOptions<T = string> = Omit<RollOptions<T>, "drawDie"> & {
  drawDie?: DrawDieSyncOptions;
};

export type AsyncRollOptions<T = string> = Omit<RollOptions<T>, "drawDie"> & {
  drawDie: DrawDieAsyncOptions;
};

type RollInput = string | ExpressionNode | RollData | ConciseRollData;
type RollExpressionInput = string | ExpressionNode;

const PREPARED_ROLL = Symbol("prepared roll");

interface PreparedRoll<T> {
  readonly [PREPARED_ROLL]: true;
  readonly input: RollExpressionInput;
  readonly settings: RollSettings<T, DrawMode>;
  readonly data: RollInputData;
  readonly notation: string;
  readonly result: ExpressionResult;
  readonly total: number;
  readonly minTotal: number | undefined;
  readonly maxTotal: number | undefined;
  readonly averageTotal: number | undefined;
}

/** The first description in the expression tree. */
function findDescription(node: ExpressionNode): DescriptionNode | undefined {
  switch (node.type) {
    case "number":
    case "reference":
      return undefined;
    case "conditional":
      return firstDescription([
        node.condition,
        ...(node.trueBranch ? [node.trueBranch] : []),
        node.falseBranch,
      ]);
    case "pool":
      return node.description;
    case "group":
      return node.description ?? firstDescription(node.expressions);
    case "binary":
    case "comparison":
      return firstDescription([node.left, node.right]);
    case "unary":
      return findDescription(node.operand);
    case "paren":
      return findDescription(node.expression);
    case "function":
      return firstDescription(node.args);
  }
}

function firstDescription(
  nodes: readonly ExpressionNode[],
): DescriptionNode | undefined {
  for (const node of nodes) {
    const description = findDescription(node);

    if (description) {
      return description;
    }
  }

  return undefined;
}

function prepareRoll<T>(
  input: RollInput,
  settings: RollSettings<T, DrawMode>,
  asyncMode: false,
): PreparedRoll<T>;
function prepareRoll<T>(
  input: RollInput,
  settings: RollSettings<T, DrawMode>,
  asyncMode: true,
): Promise<PreparedRoll<T>>;
function prepareRoll<T>(
  input: RollInput,
  settings: RollSettings<T, DrawMode>,
  asyncMode: boolean,
): PreparedRoll<T> | Promise<PreparedRoll<T>> {
  const data = snapshotRollInputData(settings.data);
  const createPrepared = (
    expressionInput: RollExpressionInput,
    notation: string,
    result: ExpressionResult,
    total = roundTotal(result.value),
    minTotal?: number,
    maxTotal?: number,
    averageTotal?: number,
  ): PreparedRoll<T> => ({
    [PREPARED_ROLL]: true,
    input: expressionInput,
    settings,
    data,
    notation,
    result,
    total,
    minTotal,
    maxTotal,
    averageTotal,
  });

  if (typeof input === "object" && input.type === "roll") {
    const prepared = createPrepared(
      input.result.node,
      input.notation,
      input.result,
      input.total,
      input.minTotal,
      input.maxTotal,
      input.averageTotal,
    );

    return asyncMode ? Promise.resolve(prepared) : prepared;
  }

  if (
    typeof input === "object" &&
    input.type === undefined &&
    "rolls" in input
  ) {
    const result = ConciseRollEvaluator.restore(input, settings);
    const prepared = createPrepared(result.node, input.notation, result);

    return asyncMode ? Promise.resolve(prepared) : prepared;
  }

  if (!asyncMode && settings.drawDie?.drawMode === "async") {
    throw new ValidationError(
      "Use Roll.create() to construct a roll with an asynchronous drawDie source",
    );
  }

  if (typeof input !== "string") {
    validateExpression(input);
  }

  const notation = typeof input === "string" ? input : nodeToNotation(input);
  const expression = typeof input === "string" ? settings.parse(input) : input;

  if (asyncMode) {
    return settings
      .evaluateAsync(expression, "random", data)
      .then((result) => createPrepared(input, notation, result));
  }

  return createPrepared(
    input,
    notation,
    settings.evaluate(expression, "random", data),
  );
}

function isPreparedRoll<T>(input: unknown): input is PreparedRoll<T> {
  return typeof input === "object" && input !== null && PREPARED_ROLL in input;
}

/**
 * One evaluated notation: the result tree and its totals.
 *
 * Can be used on its own, or through a `Roller`, which adds rolls made by `roll()` to its history.
 *
 * `total` is calculated straight away; `minTotal` / `maxTotal` evaluate the expression again in
 * `min` / `max` mode on first access, and are cached (or taken from the data on import). Each
 * evaluation gets a fresh generated-roll budget per pool; when it is spent, repeating modifiers
 * return the dice rolled so far instead of throwing for the limit. The readonly properties do not
 * make the result tree or shared settings deeply immutable. Roll data is snapshotted per roll;
 * rerolls reuse it unless replacement data is supplied.
 *
 * @example
 * const roll = new Roll("4d6kh3");   // rolls straight away
 * roll.total;                        // e.g. 14
 * `${roll}`;                         // e.g. "4d6kh3: [3d, 5, 6, 3] = 14"
 *
 * new Roll("4d6", { engine: { name: "mersenne", seed: 42 } });
 *
 * @typeParam T the output type of the configured presenter
 */
export class Roll<T = string, Mode extends DrawMode = "sync"> {
  /** The original notation (or the notation of an AST input). */
  readonly notation: string;
  /** The evaluated expression tree, including individual dice results. */
  readonly result: ExpressionResult;
  /** The total, rounded to 2 decimal places. */
  readonly total: number;

  #minTotal: number | undefined;
  #maxTotal: number | undefined;
  #averageTotal: number | undefined;
  readonly #input: string | ExpressionNode;
  readonly #settings: RollSettings<T, DrawMode>;
  readonly #data: RollInputData;

  /**
   * Parses (if a string) and rolls the input. `RollData` is restored as it is, without rolling or
   * validating: its result and totals are used, and `reroll()` rolls its expression. Concise data reconstructs
   * the result from finished outcomes. Use `Roll.import()` or `Roll.fromJSON()` to validate exported data.
   *
   * @param input the notation or expression to roll, or the data to restore
   * @param options how to roll; `RollSettings` are used as they are, so they can be shared
   * @throws {ValidationError | NotationError} the notation is invalid
   */
  constructor(
    input: RollInput | PreparedRoll<T>,
    options?: RollOptions<T, DrawMode> | RollSettings<T, DrawMode>,
  ) {
    const settings = isPreparedRoll<T>(input)
      ? input.settings
      : RollSettings.from<T, DrawMode>(options);
    const prepared = isPreparedRoll<T>(input)
      ? input
      : prepareRoll(input, settings, false);

    this.#input = prepared.input;
    this.#settings = prepared.settings;
    this.#data = prepared.data;
    this.notation = prepared.notation;
    this.result = prepared.result;
    this.total = prepared.total;
    this.#minTotal = prepared.minTotal;
    this.#maxTotal = prepared.maxTotal;
    this.#averageTotal = prepared.averageTotal;
  }

  /** Creates a fully initialized roll using the configured synchronous or asynchronous driver. */
  static create<T = string>(
    input: RollInput,
    options?: SyncRollOptions<T>,
  ): Roll<T, "sync">;
  static create<T = string>(
    input: RollInput,
    options: AsyncRollOptions<T>,
  ): Promise<Roll<T, "async">>;
  static create<T = string, Mode extends DrawMode = DrawMode>(
    input: RollInput,
    options: RollOptions<T, Mode> | RollSettings<T, Mode>,
  ): Mode extends "async" ? Promise<Roll<T, "async">> : Roll<T, "sync">;
  static create<T = string, Mode extends DrawMode = DrawMode>(
    input: RollInput,
    options?: RollOptions<T, Mode> | RollSettings<T, Mode>,
  ): Mode extends "async" ? Promise<Roll<T, "async">> : Roll<T, "sync">;
  static create<T = string>(
    input: RollInput,
    options?: RollOptions<T, DrawMode> | RollSettings<T, DrawMode>,
  ): Roll<T, "sync"> | Promise<Roll<T, "async">> {
    const settings = RollSettings.from<T, DrawMode>(options);

    if (settings.drawDie?.drawMode === "async") {
      return Promise.resolve()
        .then(() => prepareRoll(input, settings, true))
        .then((prepared) => new Roll(prepared));
    }

    return new Roll(input, settings);
  }

  /**
   * Creates a roll from exported data or concise finished results, without rolling.
   *
   * The options are used by `reroll()`. Pools refer to their die by factory name, so re-rolling
   * uses the die registered under that name in these settings.
   *
   * @throws {ImportError} the data is invalid, or is a history
   */
  static fromJSON<T = string>(
    data: EncodedRollData | ConciseRollData,
    options: SyncRollOptions<T>,
  ): Roll<T, "sync">;
  static fromJSON<T = string>(
    data: EncodedRollData | ConciseRollData,
    options: AsyncRollOptions<T>,
  ): Roll<T, "async">;
  static fromJSON<T = string, Mode extends DrawMode = DrawMode>(
    data: EncodedRollData | ConciseRollData,
    options: RollOptions<T, Mode> | RollSettings<T, Mode>,
  ): Roll<T, Mode>;
  static fromJSON<T = string>(
    data: EncodedRollData | ConciseRollData,
  ): Roll<T, "sync">;
  static fromJSON<T = string, Mode extends DrawMode = DrawMode>(
    data: EncodedRollData | ConciseRollData,
    options?: RollOptions<T, Mode> | RollSettings<T, Mode>,
  ): Roll<T, Mode>;
  static fromJSON<T = string>(
    data: EncodedRollData | ConciseRollData,
    options?: RollOptions<T, DrawMode> | RollSettings<T, DrawMode>,
  ): Roll<T, DrawMode> {
    return Roll.import<T, DrawMode>(data, options);
  }

  /**
   * Imports an exported roll or concise finished results (an object, JSON or base64), without rolling.
   *
   * @throws {ImportError} the data is invalid, or is a history
   */
  static import<T = string>(
    data: string | EncodedRollData | ConciseRollData,
    options: SyncRollOptions<T>,
  ): Roll<T, "sync">;
  static import<T = string>(
    data: string | EncodedRollData | ConciseRollData,
    options: AsyncRollOptions<T>,
  ): Roll<T, "async">;
  static import<T = string, Mode extends DrawMode = DrawMode>(
    data: string | EncodedRollData | ConciseRollData,
    options: RollOptions<T, Mode> | RollSettings<T, Mode>,
  ): Roll<T, Mode>;
  static import<T = string>(
    data: string | EncodedRollData | ConciseRollData,
  ): Roll<T, "sync">;
  static import<T = string, Mode extends DrawMode = DrawMode>(
    data: string | EncodedRollData | ConciseRollData,
    options?: RollOptions<T, Mode> | RollSettings<T, Mode>,
  ): Roll<T, Mode>;
  static import<T = string>(
    data: string | EncodedRollData | ConciseRollData,
    options?: RollOptions<T, DrawMode> | RollSettings<T, DrawMode>,
  ): Roll<T, DrawMode> {
    const decoded = decodeImport(data);

    if (decoded.type === "history") {
      throw new ImportError(
        "Expected a roll, but got a history; use Roller.import()",
      );
    }

    return new Roll<T, DrawMode>(decoded, options);
  }

  /** The AST that was evaluated. */
  get expression(): ExpressionNode {
    return this.result.node;
  }

  /** The first description in the notation. */
  get description(): DescriptionNode | undefined {
    return findDescription(this.expression);
  }

  /** Total with each die at its minimum, rounded to 2 decimal places; not necessarily an expression minimum (e.g. `-d6`). Modifier-generated rolls stop at the fresh per-pool budget. */
  get minTotal(): number {
    return (this.#minTotal ??= this.#totalIn("min"));
  }

  /** Total with each die at its maximum, rounded to 2 decimal places; not necessarily an expression maximum (e.g. `-d6`). Modifier-generated rolls stop at the fresh per-pool budget. */
  get maxTotal(): number {
    return (this.#maxTotal ??= this.#totalIn("max"));
  }

  /**
   * The expression evaluated with each pool's quantity times its die's average.
   * Uses the stored die snapshots without rolling again or rounding intermediate averages.
   *
   * Rolls containing modifiers or conditionals retain the midpoint of `minTotal` and `maxTotal`.
   * Conditional mode totals are not guaranteed bounds and their midpoint is not a statistical mean
   * (see #293).
   * This is not a statistical mean for modifiers, non-linear maths or random die parameters.
   * Its uncached extrema use fresh per-pool budgets and include any partial results when exhausted.
   */
  get averageTotal(): number {
    return (this.#averageTotal ??=
      (containsConditional(this.expression)
        ? undefined
        : averageResult(this.result)) ?? (this.minTotal + this.maxTotal) / 2);
  }

  /** Rolls the original input again; omitted data reuses this roll's snapshot, supplied data replaces it, and an engine override applies only to this reroll. Does not add to a history. */
  reroll(options?: {
    engine?: EngineOption;
    data?: RollInputData;
  }): Mode extends "async" ? Promise<Roll<T, "async">> : Roll<T, "sync">;
  reroll(
    this: Roll<T, Mode>,
    options?: { engine?: EngineOption; data?: RollInputData },
  ): Roll<T, "sync"> | Promise<Roll<T, "async">> {
    const engine = options?.engine;
    let settings =
      engine === undefined
        ? this.#settings
        : RollSettings.withEngine(this.#settings, engine);

    if (options?.data !== undefined) {
      settings = RollSettings.withData(settings, options.data);
    }

    return Roll.create<T>(this.#input, settings);
  }

  /** Presents the roll with the presenter, or the one from the options (default `TextPresenter`). */
  present(): T;
  present<U>(presenter: Presenter<U>): U;
  present(presenter?: Presenter<unknown>): unknown {
    return (presenter ?? this.#settings.presenter).present(this);
  }

  /** Always the default `TextPresenter` output. */
  toString(): string {
    return defaultTextPresenter.present(this);
  }

  /** JSON-safe export data with non-finite numbers tagged; uncached min/max totals use fresh per-pool budgets and truncate generated rolls at the limit. */
  toJSON(): EncodedRollData {
    return encodeNumbers(toRollData(this));
  }

  /** Exports as a JSON-safe object (default), JSON, or UTF-8 base64 JSON. Uncached min/max totals use fresh per-pool budgets and truncate generated rolls at the limit. */
  export(format?: "object"): EncodedRollData;
  export(format: "json" | "base64"): string;
  export(format: ExportFormat): EncodedRollData | string;
  export(format: ExportFormat = "object"): EncodedRollData | string {
    return encode(toRollData(this), format);
  }

  #totalIn(mode: "min" | "max"): number {
    return roundTotal(
      this.#settings.evaluate(this.expression, mode, this.#data).value,
    );
  }
}
