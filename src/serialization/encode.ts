import type { Roll } from "../Roll.js";
import type { RollHistory } from "../RollHistory.js";
import { DATA_VERSION } from "./formats.js";
import type {
  Encoded,
  EncodedNumber,
  ExportData,
  ExportFormat,
  HistoryData,
  RollData,
} from "./formats.js";

/** The export data for a roll (its stored totals included). */
export function toRollData(roll: Roll<unknown>): RollData {
  return {
    type: "roll",
    version: DATA_VERSION,
    notation: roll.notation,
    result: roll.result,
    total: roll.total,
    minTotal: roll.minTotal,
    maxTotal: roll.maxTotal,
    averageTotal: roll.averageTotal,
  };
}

/** The export data for a roll history. */
export function toHistoryData(history: RollHistory): HistoryData {
  return {
    type: "history",
    version: DATA_VERSION,
    rolls: history.rolls.map(toRollData),
    total: history.total,
  };
}

/** A number as an `EncodedNumber`: non-finite numbers are tagged. */
export function encodeNumber(value: number): EncodedNumber {
  if (Number.isFinite(value)) {
    return value;
  }

  if (Number.isNaN(value)) {
    return { $number: "NaN" };
  }

  return { $number: value > 0 ? "Infinity" : "-Infinity" };
}

/**
 * Copies the data with every non-finite number tagged, so it's JSON-safe.
 *
 * Object properties that are `undefined` are left out; array elements are retained (and become
 * `null` if subsequently JSON-stringified). This is intended for plain export data.
 */
export function encodeNumbers<T>(data: T): Encoded<T> {
  return encodeValue(data) as Encoded<T>;
}

function encodeValue(value: unknown): unknown {
  if (typeof value === "number") {
    return encodeNumber(value);
  }

  if (Array.isArray(value)) {
    return value.map(encodeValue);
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, property]) => property !== undefined)
        .map(([key, property]) => [key, encodeValue(property)]),
    );
  }

  return value;
}

/** Encodes a string as UTF-8, then base64. */
export function toBase64(text: string): string {
  // Convert to UTF-8 so that non-ascii characters are encoded correctly.
  const bytes = new TextEncoder().encode(text);
  let binary = "";

  // Process in chunks to avoid JavaScript engines' function-call argument limits.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }

  return btoa(binary);
}

/**
 * Encodes export data in the format. Non-finite numbers are tagged in every format (see
 * `EncodedNumber`), so they survive the round trip.
 *
 * - `object`: the JSON-safe data
 * - `json`: `JSON.stringify()` of that data
 * - `base64`: the JSON, UTF-8 encoded then base64 encoded
 *
 * The default format is `json`.
 */
export function encode<D extends ExportData>(
  data: D,
  format: "object",
): Encoded<D>;
export function encode(data: ExportData, format?: "json" | "base64"): string;
export function encode<D extends ExportData>(
  data: D,
  format?: ExportFormat,
): Encoded<D> | string;
export function encode(
  data: ExportData,
  format: ExportFormat = "json",
): Encoded<ExportData> | string {
  const encoded = encodeNumbers(data);

  switch (format) {
    case "object":
      return encoded;
    case "json":
      return JSON.stringify(encoded);
    case "base64":
      return toBase64(JSON.stringify(encoded));
  }
}
