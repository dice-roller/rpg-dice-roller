/**
 * An error thrown when a required argument is missing
 */
class RequiredArgumentError extends Error {
  /**
   * Create a RequiredArgumentError
   *
   * @param {string|null} [argumentName=null]
   */
  constructor(argumentName = null) {
    super(`Missing argument${argumentName ? ` "${argumentName}"` : ''}`);

    this.argumentName = argumentName;
  }
}

export default RequiredArgumentError;
