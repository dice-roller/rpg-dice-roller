import type { ExpressionResult } from "../results/types.js";

/**
 * - `object`: plain JSON-safe data (`RollData` / `HistoryData`)
 * - `json`: that data as a JSON string
 * - `base64`: that JSON string, base64-encoded (UTF-8)
 */
export const EXPORT_FORMATS = ["object", "json", "base64"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

/** The version of the export data, for future migrations. */
export const DATA_VERSION = 1;

/**
 * An exported roll.
 *
 * The expression is `result.node`. Text output isn't stored; call `present()` after importing.
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

/** An exported roll history. */
export interface HistoryData {
  readonly type: "history";
  readonly version: typeof DATA_VERSION;
  readonly rolls: readonly RollData[];
  readonly total: number;
}

/** Anything that can be exported / imported. */
export type ExportData = RollData | HistoryData;
