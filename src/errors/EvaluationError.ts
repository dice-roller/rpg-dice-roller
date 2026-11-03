import { DiceRollerError } from "./DiceRollerError.js";

/**
 * Thrown when an expression cannot be evaluated (e.g. a maths operation without a real result).
 * For example, `sqrt(-1)` fails, while `1/0` produces `Infinity` rather than this error.
 */
export class EvaluationError extends DiceRollerError {}
