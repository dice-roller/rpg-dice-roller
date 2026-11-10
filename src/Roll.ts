import type { DescriptionNode, ExpressionNode } from "./ast/nodes.js";
import { nodeToNotation } from "./ast/notation.js";
import { ImportError } from "./errors/ImportError.js";
import { averageResult } from "./evaluator/average.js";
import type { Presenter } from "./presenters/Presenter.js";
import { defaultTextPresenter } from "./presenters/TextPresenter.js";
import type { ExpressionResult } from "./results/types.js";
import { RollSettings } from "./RollSettings.js";
import type { RollOptions } from "./RollSettings.js";
import { decode } from "./serialization/decode.js";
import { encode, encodeNumbers, toRollData } from "./serialization/encode.js";
import type {
  EncodedRollData,
  ExportFormat,
  RollData,
} from "./serialization/formats.js";

/** Rounds a total to 2 decimal places, as in v5. */
const roundTotal = (value: number): number => parseFloat(value.toFixed(2));

/** The first description in the expression tree. */
function findDescription(node: ExpressionNode): DescriptionNode | undefined {
  switch (node.type) {
    case "number":
      return undefined;
    case "pool":
      return node.description;
    case "group":
      return node.description ?? firstDescription(node.expressions);
    case "binary":
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

/**
 * One evaluated notation: the result tree and its totals.
 *
 * Can be used on its own, or through a `Roller`, which adds rolls made by `roll()` to its history.
 *
 * `total` is calculated straight away; `minTotal` / `maxTotal` evaluate the expression again in
 * `min` / `max` mode on first access, and are cached (or taken from the data on import). The
 * readonly properties do not make the result tree or shared settings deeply immutable.
 *
 * @example
 * const roll = new Roll("4d6kh3");   // rolls straight away
 * roll.total;                        // e.g. 14
 * `${roll}`;                         // e.g. "4d6kh3: [3d, 5, 6, 3] = 14"
 *
 * new Roll("4d6", { engine: engines.MersenneTwister19937.seed(42) });
 *
 * @typeParam T the output type of the configured presenter
 */
export class Roll<T = string> {
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
  readonly #settings: RollSettings<T>;

  /**
   * Parses (if a string) and rolls the input. `RollData` is restored as it is, without rolling or
   * validating: its result and totals are used, and `reroll()` rolls its expression. Use
   * `Roll.import()` / `Roll.fromJSON()` for exported data, which validate it.
   *
   * @param input the notation or expression to roll, or data to restore without validation
   * @param options how to roll; `RollSettings` are used as they are, so they can be shared
   * @throws {ValidationError | NotationError} the notation is invalid
   */
  constructor(
    input: string | ExpressionNode | RollData,
    options?: RollOptions<T> | RollSettings<T>,
  ) {
    this.#settings = RollSettings.from(options);

    if (typeof input === "object" && input.type === "roll") {
      // the expression, rather than the notation, so builder rolls (whose notation may be
      // display-only) can be re-rolled
      this.#input = input.result.node;
      this.notation = input.notation;
      this.result = input.result;
      this.total = input.total;
      this.#minTotal = input.minTotal;
      this.#maxTotal = input.maxTotal;
      this.#averageTotal = input.averageTotal;
    } else {
      this.#input = input;
      this.notation = typeof input === "string" ? input : nodeToNotation(input);
      const expression =
        typeof input === "string" ? this.#settings.parse(input) : input;

      this.result = this.#settings.evaluate(expression);
      this.total = roundTotal(this.result.value);
    }
  }

  /**
   * Creates a roll from exported data (e.g. from `toJSON()`), without rolling.
   *
   * The options are used by `reroll()`. Pools refer to their die by factory name, so re-rolling
   * uses the die registered under that name in these settings.
   *
   * @throws {ImportError} the data is invalid, or is a history
   */
  static fromJSON<T = string>(
    data: EncodedRollData,
    options?: RollOptions<T> | RollSettings<T>,
  ): Roll<T> {
    return Roll.import(data, options);
  }

  /**
   * Imports an exported roll (an object, JSON or base64), without rolling.
   *
   * @throws {ImportError} the data is invalid, or is a history
   */
  static import<T = string>(
    data: string | EncodedRollData,
    options?: RollOptions<T> | RollSettings<T>,
  ): Roll<T> {
    const decoded = decode(data);

    if (decoded.type !== "roll") {
      throw new ImportError(
        "Expected a roll, but got a history; use Roller.import()",
      );
    }

    return new Roll<T>(decoded, options);
  }

  /** The AST that was evaluated. */
  get expression(): ExpressionNode {
    return this.result.node;
  }

  /** The first description in the notation. */
  get description(): DescriptionNode | undefined {
    return findDescription(this.expression);
  }

  /** Total with each die at its minimum, rounded to 2 decimal places; not necessarily an expression minimum (e.g. `-d6`). */
  get minTotal(): number {
    return (this.#minTotal ??= this.#totalIn("min"));
  }

  /** Total with each die at its maximum, rounded to 2 decimal places; not necessarily an expression maximum (e.g. `-d6`). */
  get maxTotal(): number {
    return (this.#maxTotal ??= this.#totalIn("max"));
  }

  /**
   * The expression evaluated with each pool's quantity times its die's average.
   * Uses the stored die snapshots without rolling again or rounding intermediate averages.
   *
   * Rolls containing modifiers retain the midpoint of `minTotal` and `maxTotal` for now.
   * This is not a statistical mean for modifiers, non-linear maths or random die parameters.
   */
  get averageTotal(): number {
    return (this.#averageTotal ??=
      averageResult(this.result) ?? (this.minTotal + this.maxTotal) / 2);
  }

  /** Rolls the original input again with the same settings; restored rolls use their stored expression. Does not add to a history. */
  reroll(): Roll<T> {
    return new Roll<T>(this.#input, this.#settings);
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

  /** JSON-safe export data with non-finite numbers tagged; evaluates uncached min/max totals. */
  toJSON(): EncodedRollData {
    return encodeNumbers(toRollData(this));
  }

  /** Exports as JSON (default), a JSON-safe object, or UTF-8 base64 JSON. Evaluates uncached min/max totals. */
  export(format: "object"): EncodedRollData;
  export(format?: "json" | "base64"): string;
  export(format: ExportFormat): EncodedRollData | string;
  export(format: ExportFormat = "json"): EncodedRollData | string {
    return encode(toRollData(this), format);
  }

  #totalIn(mode: "min" | "max"): number {
    return roundTotal(this.#settings.evaluate(this.expression, mode).value);
  }
}
