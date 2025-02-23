import NotationError from "../../../src/exceptions/NotationError";

describe('NotationError', () => {
  test('outputs correct message', () => {
    expect(() => {
      throw new NotationError('d6');
    }).toThrow('Notation "d6" is invalid');

    expect(() => {
      throw new NotationError('4d10+2d6');
    }).toThrow('Notation "4d10+2d6" is invalid');
  });

  test('still throws correct error if no `captureStackTrace', () => {
    // @ts-expect-error testing missing capture stack trace functionality
    Error.captureStackTrace = undefined;
    expect(() => {
      throw new NotationError('d6');
    }).toThrow(NotationError);
  });
});
