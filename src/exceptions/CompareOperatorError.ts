/**
 * An error thrown when a comparison operator is invalid
 */
class CompareOperatorError extends TypeError {
  readonly operator: unknown;

  /**
   * Create a `CompareOperatorError`
   *
   * @param {*} operator The invalid operator
   */
  constructor(operator: unknown) {
    super(`Operator "${operator}" is invalid`);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (TypeError.captureStackTrace) {
      TypeError.captureStackTrace(this, CompareOperatorError);
    }

    this.name = 'CompareOperatorError';
    this.operator = operator;
  }
}

export default CompareOperatorError;
