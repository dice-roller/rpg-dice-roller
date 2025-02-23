import DataFormatError from "../../../src/exceptions/DataFormatError";

describe('DataFormatError', () => {
  test('throws correct message', () => {
    expect(() => {
      throw new DataFormatError('foo');
    }).toThrow('Invalid data format: foo');

    expect(() => {
      throw new DataFormatError({});
    }).toThrow(`Invalid data format: [object Object]`);

    expect(() => {
      // @ts-expect-error testing missing argument
      throw new DataFormatError();
    }).toThrow('Invalid data format: undefined');

    expect(() => {
      throw new DataFormatError(null);
    }).toThrow('Invalid data format: null');
  });

  test('still throws correct error if no `captureStackTrace', () => {
    // @ts-expect-error testing missing capture stack trace functionality
    Error.captureStackTrace = undefined;
    expect(() => {
      throw new DataFormatError('foo');
    }).toThrow(DataFormatError);
  });
});
