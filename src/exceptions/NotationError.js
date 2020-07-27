/**
 * An error thrown when the notation is invalid
 */
class NotationError extends Error {
  /**
   * Create a NotationError
   *
   * @param {string} notation The invalid notation
   */
  constructor(notation) {
    super(`Notation "${notation}" is invalid`);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotationError);
    }

    this.name = 'NotationError';

    this.notation = notation;
  }
}

export default NotationError;
