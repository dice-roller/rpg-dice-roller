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
 * Thrown when the notation is syntactically invalid. Empty or non-string notation instead raises a
 * `ValidationError`. Parser syntax errors retain the original notation, the start location, and the
 * underlying syntax error as `cause`; a manually constructed error may omit location and cause.
 */
export class NotationError extends DiceRollerError {
  /**
   * @param message the error message
   * @param notation the original notation
   * @param location the optional start of the syntax error
   * @param options optional native error options, including `cause`
   */
  constructor(
    message: string,
    readonly notation: string,
    readonly location?: NotationErrorLocation,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}
