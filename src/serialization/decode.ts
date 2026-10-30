import { NotImplementedError } from "../errors/NotImplementedError.js";
import type { ExportData } from "./formats.js";

/**
 * Decodes imported data: an object, a JSON string, or a base64-encoded JSON string.
 *
 * Dice need no restoring: pools refer to their die by factory name (`DieNode`), and the stored
 * results already contain the dice values.
 *
 * @throws {ImportError} the data is malformed, or has an unknown `type` or `version`
 */
export function decode(_input: string | ExportData): ExportData {
  throw new NotImplementedError("decode()");
}
