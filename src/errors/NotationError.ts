import { DiceRollerError } from "./DiceRollerError.js";

/**
 * Location of a syntax error within the notation.
 */
export interface NotationErrorLocation {
  /** Offset in the notation (0-based). */
  readonly offset: number;
  /** Line in the notation (1-based). */
  readonly line: number;
  /** Column in the notation (1-based). */
  readonly column: number;
}

/**
 * Thrown when the notation is syntactically invalid.
 */
export class NotationError extends DiceRollerError {
  constructor(
    message: string,
    readonly notation: string,
    readonly location?: NotationErrorLocation,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}
