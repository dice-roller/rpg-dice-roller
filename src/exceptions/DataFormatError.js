class DataFormatError extends Error {
  constructor(data) {
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
