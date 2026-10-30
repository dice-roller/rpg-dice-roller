import { NotImplementedError } from "../errors/NotImplementedError.js";
import type { ResultFlag } from "../results/flags.js";
import type {
  BinaryResult,
  DieResult,
  FunctionResult,
  GroupResult,
  NumberResult,
  ParenResult,
  PoolResult,
  UnaryResult,
} from "../results/types.js";
import type { Roll } from "../Roll.js";
import type { RollHistory } from "../RollHistory.js";
import { TreePresenter } from "./TreePresenter.js";

/** The v5 flag symbols, e.g. `[6!, 2, 1d]`. */
export const DEFAULT_FLAG_SYMBOLS: Readonly<Record<ResultFlag, string>> =
  Object.freeze({
    compound: "!",
    explode: "!",
    "critical-failure": "__",
    "critical-success": "**",
    drop: "d",
    max: "v",
    min: "^",
    penetrate: "p",
    "re-roll": "r",
    "re-roll-once": "ro",
    "target-failure": "_",
    "target-success": "*",
    unique: "u",
    "unique-once": "uo",
  });

export interface TextPresenterOptions {
  /** Overrides for the flag symbols. */
  flagSymbols?: Partial<Record<ResultFlag, string>>;
  /** Joins the rolls of a history (default `"; "`). */
  separator?: string;
}

/**
 * Plain text output, matching v5: e.g. `4d6: [3, 5, 2, 6] = 16`, with flag symbols after each die
 * value, totals rounded to 2 decimal places, and history rolls joined with `"; "`.
 */
export class TextPresenter extends TreePresenter<string> {
  readonly flagSymbols: Readonly<Record<ResultFlag, string>>;
  readonly separator: string;

  constructor(options: TextPresenterOptions = {}) {
    super();
    this.flagSymbols = Object.freeze({
      ...DEFAULT_FLAG_SYMBOLS,
      ...options.flagSymbols,
    });
    this.separator = options.separator ?? "; ";
  }

  /** The symbols for the flags, e.g. `["explode", "drop"]` -> `!d`. */
  protected flags(flags: readonly ResultFlag[]): string {
    return flags.map((flag) => this.flagSymbols[flag]).join("");
  }

  /** The rolls joined with `separator`. */
  protected history(_history: RollHistory): string {
    throw new NotImplementedError("TextPresenter.history()");
  }

  /** `notation: <result> = total`. */
  protected roll(_roll: Roll<unknown>): string {
    throw new NotImplementedError("TextPresenter.roll()");
  }

  protected number(_result: NumberResult): string {
    throw new NotImplementedError("TextPresenter.number()");
  }

  /** `[3, 5, 2, 6]` */
  protected pool(_result: PoolResult): string {
    throw new NotImplementedError("TextPresenter.pool()");
  }

  /** `6!`, `1d` */
  protected die(_result: DieResult, _pool: PoolResult): string {
    throw new NotImplementedError("TextPresenter.die()");
  }

  /** `{[3, 5] + 2, [4]}` */
  protected group(_result: GroupResult): string {
    throw new NotImplementedError("TextPresenter.group()");
  }

  protected binary(_result: BinaryResult): string {
    throw new NotImplementedError("TextPresenter.binary()");
  }

  protected unary(_result: UnaryResult): string {
    throw new NotImplementedError("TextPresenter.unary()");
  }

  protected paren(_result: ParenResult): string {
    throw new NotImplementedError("TextPresenter.paren()");
  }

  protected fn(_result: FunctionResult): string {
    throw new NotImplementedError("TextPresenter.fn()");
  }
}

/** The shared instance used by every `toString()`. */
export const defaultTextPresenter = new TextPresenter();
