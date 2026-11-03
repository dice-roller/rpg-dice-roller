/**
 * Base class for the library's custom errors. Native errors and errors from user-supplied code may
 * also propagate. The name is set from the concrete constructor; `options.cause` is passed to Error.
 */
export class DiceRollerError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}
