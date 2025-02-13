import { DieActionValueError } from '../../src/exceptions/index.ts';

describe('DieActionValueError', () => {
  test('outputs `die` in message', () => {
    expect(() => {
      throw new DieActionValueError('d6');
    }).toThrow('Die "d6" must have more than 1 possible value to do this action');

    expect(() => {
      throw new DieActionValueError('foo');
    }).toThrow('Die "foo" must have more than 1 possible value to do this action');

    expect(() => {
      throw new DieActionValueError({});
    }).toThrow(`Die "${{}.toString()}" must have more than 1 possible value to do this action`);

    expect(() => {
      throw new DieActionValueError();
    }).toThrow('Die "undefined" must have more than 1 possible value to do this action');
  });

  test('outputs `action` in message', () => {
    expect(() => {
      throw new DieActionValueError('d6', 'explode');
    }).toThrow('Die "d6" must have more than 1 possible value to explode');

    expect(() => {
      throw new DieActionValueError('d10', 'penetrate');
    }).toThrow('Die "d10" must have more than 1 possible value to penetrate');
  });

  test('still throws correct error if no `captureStackTrace', () => {
    Error.captureStackTrace = undefined;
    expect(() => {
      throw new DieActionValueError('d6');
    }).toThrow(DieActionValueError);
  });
});
