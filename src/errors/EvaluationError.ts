import { DiceRollerError } from "./DiceRollerError.js";

/**
 * Thrown when an expression cannot be evaluated (e.g. a maths operation without a real result).
 */
export class EvaluationError extends DiceRollerError {}
