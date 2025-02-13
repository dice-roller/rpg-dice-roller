import { DataFormatError } from '../../src/exceptions/index.ts';

describe('DataFormatError', () => {
  test('throws correct message', () => {
    expect(() => {
      throw new DataFormatError('foo');
    }).toThrow('Invalid data format: foo');

    expect(() => {
      throw new DataFormatError({});
    }).toThrow(`Invalid data format: ${{}.toString()}`);

    expect(() => {
      throw new DataFormatError();
    }).toThrow('Invalid data format: undefined');

    expect(() => {
      throw new DataFormatError(null);
    }).toThrow('Invalid data format: null');
  });

  test('still throws correct error if no `captureStackTrace', () => {
    Error.captureStackTrace = undefined;
    expect(() => {
      throw new DataFormatError('foo');
    }).toThrow(DataFormatError);
  });
});
