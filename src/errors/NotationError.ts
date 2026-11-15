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

  /**
   * Formats a parser error with its source line and a caret pointing to the problem.
   * The normal `message` is unchanged; use this method for a CLI or text interface.
   * Manually constructed errors without a Peggy cause return their message unchanged.
   *
   * @example
   * ```ts
   * try {
   *   roller.parse("4de");
   * } catch (error) {
   *   if (error instanceof NotationError) console.error(error.format());
   * }
   * ```
   */
  format(): string {
    const cause: unknown = this.cause;

    if (
      cause instanceof Error &&
      "format" in cause &&
      typeof cause.format === "function"
    ) {
      // Use the source attached to the cause, including errors from a directly used parser.
      const source: unknown =
        "location" in cause &&
        typeof cause.location === "object" &&
        cause.location !== null &&
        "source" in cause.location
          ? cause.location.source
          : undefined;

      const format = cause.format as (
        sources: { source: unknown; text: string }[],
      ) => string;

      return format.call(cause, [{ source, text: this.notation }]);
    }

    return this.message;
  }
}
