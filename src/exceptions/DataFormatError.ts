/**
 * An error thrown when a data format is invalid
 */
class DataFormatError extends Error {
  readonly data: unknown;

  /**
   * Create a `DataFormatError`
   *
   * @param {*} data The invalid data
   */
  constructor(data: unknown) {
    super(`Invalid data format: ${data}`);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DataFormatError);
    }

    this.name = 'ImportError';
    this.data = data;
  }
}

export default DataFormatError;
