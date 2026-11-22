import type {
  DieResult,
  ExpressionResult,
  ScoredItem,
} from "../results/types.js";

/**
 * - `object`: plain JSON-safe data (`EncodedRollData` / `EncodedHistoryData`)
 * - `json`: that data as a JSON string
 * - `base64`: that JSON string, base64-encoded (UTF-8)
 */
export const EXPORT_FORMATS = ["object", "json", "base64"] as const;
/** A supported export format. */
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

/** The version of the export data, for future migrations. */
export const DATA_VERSION = 1;

/**
 * A roll, with its result tree and totals.
 *
 * The expression is `result.node`. Text output isn't stored; call `present()` after importing.
 * Numbers can be non-finite (`1/0` is `Infinity`); `EncodedRollData` is the JSON-safe export.
 */
export interface RollData {
  readonly type: "roll";
  readonly version: typeof DATA_VERSION;
  readonly notation: string;
  readonly result: ExpressionResult;
  readonly total: number;
  readonly minTotal: number;
  readonly maxTotal: number;
  readonly averageTotal: number;
}

/** A roll history. */
export interface HistoryData {
  readonly type: "history";
  readonly version: typeof DATA_VERSION;
  readonly rolls: readonly RollData[];
  /** Can be `NaN`, e.g. for a history of `1/0` and `-1/0`. */
  readonly total: number;
}

/** A finished die result. A number sets all three values and includes the die in the total. */
export type ConciseDieResult =
  | number
  | (Pick<DieResult, "value"> & Partial<Omit<DieResult, "type" | "value">>);

/** Overrides for a group's finished members, indexed by their position in the notation. */
export interface ConciseGroupResult {
  /** A permutation of member indexes in the order they should appear in the result. */
  readonly order?: readonly number[];
  /** Scoring fields keyed by the member's original index. */
  readonly members?: Readonly<Record<number, Partial<ScoredItem>>>;
}

/** Hand-written, evaluated results that can be expanded into a roll snapshot. */
export interface ConciseRollData {
  readonly type?: never;
  readonly notation: string;
  /** One array per visited pool, with the parent before any pools in its parameters. */
  readonly rolls: readonly (readonly ConciseDieResult[])[];
  /** Overrides keyed by the group's zero-based encounter index. */
  readonly groups?: Readonly<Record<number, ConciseGroupResult>>;
}

/** Anything that can be exported / imported. */
export type ExportData = RollData | HistoryData;

/** The numbers JSON can't represent, by their tag. */
export const NON_FINITE_NUMBERS = {
  Infinity: Number.POSITIVE_INFINITY,
  "-Infinity": Number.NEGATIVE_INFINITY,
  NaN: Number.NaN,
} as const;
/** The tag names used for non-finite numbers. */
export type NonFiniteNumber = keyof typeof NON_FINITE_NUMBERS;

/**
 * A number in exported data: a finite number as it is, otherwise a tag, e.g.
 * `{ "$number": "Infinity" }`, so it survives JSON (which would turn it into `null`).
 */
export type EncodedNumber = number | { readonly $number: NonFiniteNumber };

/** The data with every number (except literal ones, like `version`) as an `EncodedNumber`. */
export type Encoded<T> = T extends number
  ? number extends T
    ? EncodedNumber
    : T
  : T extends readonly (infer U)[]
    ? readonly Encoded<U>[]
    : T extends object
      ? { readonly [K in keyof T]: Encoded<T[K]> }
      : T;

/**
 * An exported roll: JSON-safe, with non-finite numbers tagged.
 *
 * Plain `RollData` with only finite numbers is valid encoded data too.
 */
export type EncodedRollData = Encoded<RollData>;

/** An exported roll history: JSON-safe, with non-finite numbers tagged. */
export type EncodedHistoryData = Encoded<HistoryData>;

/** Anything that has been exported. */
export type EncodedExportData = EncodedRollData | EncodedHistoryData;
