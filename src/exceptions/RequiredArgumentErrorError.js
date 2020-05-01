class RequiredArgumentError extends Error {
  constructor(argumentName = null) {
    super(`Missing argument${argumentName ? ` "${argumentName}"` : ''}`);

    this.argumentName = argumentName;
  }
}

export default RequiredArgumentError;
