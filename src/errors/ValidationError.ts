import { DiceRollerError } from "./DiceRollerError.js";

/**
 * Thrown when an argument or value is invalid (e.g. an empty notation, or a qty out of range).
 */
export class ValidationError extends DiceRollerError {}
