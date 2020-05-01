class DieActionValueError extends Error {
  constructor(die, action = null) {
    super(`Die "${die}" must have more than 1 possible value to ${action || 'do this action'}`);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DieActionValueError);
    }

    this.name = 'DieActionValueError';

    this.action = action;
    this.die = die;
  }
}

export default DieActionValueError;
