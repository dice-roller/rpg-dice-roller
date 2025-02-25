import RequiredArgumentError from "../../../src/exceptions/RequiredArgumentError";

describe('RequiredArgumentError', () => {
  test('outputs argument name in message', () => {
    expect(() => {
      throw new RequiredArgumentError('foo');
    }).toThrow('Missing argument "foo"');

    expect(() => {
      throw new RequiredArgumentError('bar');
    }).toThrow('Missing argument "bar"');
  });

  test('output correct message without argument name', () => {
    expect(() => {
      throw new RequiredArgumentError();
    }).toThrow('Missing argument');

    expect(() => {
      throw new RequiredArgumentError(undefined);
    }).toThrow('Missing argument');

    expect(() => {
      throw new RequiredArgumentError(null);
    }).toThrow('Missing argument');

    expect(() => {
      // @ts-expect-error test boolean false
      throw new RequiredArgumentError(false);
    }).toThrow('Missing argument');
  });

  test('still throws correct error if no `captureStackTrace', () => {
    // @ts-expect-error testing missing capture stack trace functionality
    Error.captureStackTrace = undefined;
    expect(() => {
      throw new RequiredArgumentError('d6');
    }).toThrow(RequiredArgumentError);
  });
});
