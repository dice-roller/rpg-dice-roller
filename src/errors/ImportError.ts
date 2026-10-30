import { DiceRollerError } from "./DiceRollerError.js";

/**
 * Thrown when imported data is malformed, or in an unknown format or version.
 */
export class ImportError extends DiceRollerError {}
