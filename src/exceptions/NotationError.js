class NotationError extends Error {
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
