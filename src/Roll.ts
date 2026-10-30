import type { DescriptionNode, ExpressionNode } from "./ast/nodes.js";
import { nodeToNotation } from "./ast/notation.js";
import { ImportError } from "./errors/ImportError.js";
import type { Presenter } from "./presenters/Presenter.js";
import { defaultTextPresenter } from "./presenters/TextPresenter.js";
import type { ExpressionResult } from "./results/types.js";
import { RollSettings } from "./RollSettings.js";
import type { RollOptions } from "./RollSettings.js";
import { decode } from "./serialization/decode.js";
import { encode, toRollData } from "./serialization/encode.js";
import type { ExportFormat, RollData } from "./serialization/formats.js";

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
 * Can be used on its own, or through a `Roller`, which adds every roll to its history.
 *
 * Immutable. `total` is calculated straight away; `minTotal` / `maxTotal` evaluate the expression
 * again in `min` / `max` mode on first access, and are cached (or taken from the data on import).
 *
 * @example
 * const roll = new Roll("4d6kh3");   // rolls straight away
 * roll.total;                        // e.g. 14
 * `${roll}`;                         // e.g. "4d6kh3: [3d, 5, 6, 3] = 14"
 *
 * new Roll("4d6", { engine: engines.MersenneTwister19937.seed(42) });
 */
export class Roll<T = string> {
  /** The original notation (or the notation of an AST input). */
  readonly notation: string;
  readonly result: ExpressionResult;
  /** The total, rounded to 2 decimal places. */
  readonly total: number;

  #minTotal: number | undefined;
  #maxTotal: number | undefined;
  readonly #input: string | ExpressionNode;
  readonly #settings: RollSettings<T>;

  /**
   * Parses (if a string) and rolls the input. Exported `RollData` is restored as it is, without
   * rolling: its result and totals are used, and `reroll()` rolls its notation.
   *
   * @param options how to roll; `RollSettings` are used as they are, so they can be shared
   * @throws {ValidationError | NotationError} the notation is invalid
   */
  constructor(
    input: string | ExpressionNode | RollData,
    options?: RollOptions<T> | RollSettings<T>,
  ) {
    this.#settings = RollSettings.from(options);

    if (typeof input === "object" && input.type === "roll") {
      this.#input = input.notation;
      this.notation = input.notation;
      this.result = input.result;
      this.total = input.total;
      this.#minTotal = input.minTotal;
      this.#maxTotal = input.maxTotal;
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
   * Creates a roll from exported data, without rolling.
   *
   * The options are used by `reroll()`. Pools refer to their die by factory name, so re-rolling
   * uses the die registered under that name in these settings.
   */
  static fromJSON<T = string>(
    data: RollData,
    options?: RollOptions<T> | RollSettings<T>,
  ): Roll<T> {
    return new Roll<T>(data, options);
  }

  /**
   * Imports an exported roll (an object, JSON or base64), without rolling.
   *
   * @throws {ImportError} the data is invalid, or is a history
   */
  static import<T = string>(
    data: string | RollData,
    options?: RollOptions<T> | RollSettings<T>,
  ): Roll<T> {
    const decoded = decode(data);

    if (decoded.type !== "roll") {
      throw new ImportError(
        "Expected a roll, but got a history; use Roller.import()",
      );
    }

    return Roll.fromJSON(decoded, options);
  }

  /** The AST that was evaluated. */
  get expression(): ExpressionNode {
    return this.result.node;
  }

  /** The first description in the notation. */
  get description(): DescriptionNode | undefined {
    return findDescription(this.expression);
  }

  /** The lowest possible total. */
  get minTotal(): number {
    return (this.#minTotal ??= this.#totalIn("min"));
  }

  /** The highest possible total. */
  get maxTotal(): number {
    return (this.#maxTotal ??= this.#totalIn("max"));
  }

  /**
   * The midpoint of `minTotal` and `maxTotal`, as in v5.
   *
   * This is not the statistical mean for notations like `4d6kh3` or exploding dice.
   */
  get averageTotal(): number {
    return (this.minTotal + this.maxTotal) / 2;
  }

  /** Rolls the same notation again, with the same settings, as a new roll. */
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

  toJSON(): RollData {
    return toRollData(this);
  }

  export(format: "object"): RollData;
  export(format?: "json" | "base64"): string;
  export(format: ExportFormat = "json"): RollData | string {
    return encode(this.toJSON(), format);
  }

  #totalIn(mode: "min" | "max"): number {
    return roundTotal(this.#settings.evaluate(this.expression, mode).value);
  }
}
