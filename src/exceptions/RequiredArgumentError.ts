/**
 * An error thrown when a required argument is missing
 */
class RequiredArgumentError extends Error {
  readonly argumentName: string|null;

  /**
   * Create a `RequiredArgumentError`
   *
   * @param {string|null} [argumentName=null] The argument name
   */
  constructor(argumentName: string|null = null) {
    super(`Missing argument${argumentName ? ` "${argumentName}"` : ''}`);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RequiredArgumentError);
    }

    this.argumentName = argumentName;
  }
}

export default RequiredArgumentError;
