/**
 * Base class for every error thrown by the library.
 */
export class DiceRollerError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}
