/**
 * Serialization entry point: decode imports; encode exports; convert rolls and histories to data;
 * encode numbers and UTF-8 base64; and access the export formats, version and data types.
 *
 * @module
 */
export { decode } from "./decode.js";
export {
  encode,
  encodeNumber,
  encodeNumbers,
  toBase64,
  toHistoryData,
  toRollData,
} from "./encode.js";
export { DATA_VERSION, EXPORT_FORMATS, NON_FINITE_NUMBERS } from "./formats.js";
export type {
  Encoded,
  EncodedExportData,
  EncodedHistoryData,
  EncodedNumber,
  EncodedRollData,
  ExportData,
  ExportFormat,
  HistoryData,
  NonFiniteNumber,
  RollData,
} from "./formats.js";
