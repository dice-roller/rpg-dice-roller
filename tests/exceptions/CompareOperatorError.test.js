import { CompareOperatorError } from '../../src/exceptions/index.ts';

describe('CompareOperatorError', () => {
  test('throws correct message', () => {
    expect(() => {
      throw new CompareOperatorError('foo');
    }).toThrow('Operator "foo" is invalid');

    expect(() => {
      throw new CompareOperatorError({});
    }).toThrow(`Operator "${{}.toString()}" is invalid`);

    expect(() => {
      throw new CompareOperatorError();
    }).toThrow('Operator "undefined" is invalid');

    expect(() => {
      throw new CompareOperatorError(null);
    }).toThrow('Operator "null" is invalid');
  });

  test('still throws correct error if no `captureStackTrace', () => {
    TypeError.captureStackTrace = undefined;
    expect(() => {
      throw new CompareOperatorError('foo');
    }).toThrow(CompareOperatorError);
  });
});
