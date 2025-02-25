import CompareOperatorError from "../../../src/exceptions/CompareOperatorError";

describe('CompareOperatorError', () => {
  test('throws correct message', () => {
    expect(() => {
      throw new CompareOperatorError('foo');
    }).toThrow('Operator "foo" is invalid');

    expect(() => {
      throw new CompareOperatorError({});
    }).toThrow(`Operator "[object Object]" is invalid`);

    expect(() => {
      // @ts-expect-error testing missing argument
      throw new CompareOperatorError();
    }).toThrow('Operator "undefined" is invalid');

    expect(() => {
      throw new CompareOperatorError(null);
    }).toThrow('Operator "null" is invalid');
  });

  test('still throws correct error if no `captureStackTrace', () => {
    // @ts-expect-error testing missing capture stack trace functionality
    TypeError.captureStackTrace = undefined;
    expect(() => {
      throw new CompareOperatorError('foo');
    }).toThrow(CompareOperatorError);
  });
});
