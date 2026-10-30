import { NotImplementedError } from "../errors/NotImplementedError.js";
import type { Roll } from "../Roll.js";
import type { RollHistory } from "../RollHistory.js";
import type {
  ExportData,
  ExportFormat,
  HistoryData,
  RollData,
} from "./formats.js";

/** The export data for a roll (its stored totals included). */
export function toRollData(_roll: Roll<unknown>): RollData {
  throw new NotImplementedError("toRollData()");
}

/** The export data for a roll history. */
export function toHistoryData(_history: RollHistory): HistoryData {
  throw new NotImplementedError("toHistoryData()");
}

/**
 * Encodes export data in the format.
 *
 * - `object`: returns the data as-is
 * - `json`: `JSON.stringify(data)`
 * - `base64`: the JSON, UTF-8 encoded then base64 encoded (`btoa`)
 */
export function encode<D extends ExportData>(data: D, format: "object"): D;
export function encode(data: ExportData, format?: "json" | "base64"): string;
export function encode<D extends ExportData>(
  data: D,
  format?: ExportFormat,
): D | string;
export function encode(
  _data: ExportData,
  _format: ExportFormat = "json",
): ExportData | string {
  throw new NotImplementedError("encode()");
}
