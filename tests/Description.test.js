import Description from '../src/Description.ts';

describe('Description', () => {
  let description;
  let text;

  beforeEach(() => {
    text = 'A description';

    description = new Description(text, Description.types.INLINE);
  });

  describe('Initialisation', () => {
    test('model structure', () => {
      expect(description).toBeInstanceOf(Description);

      expect(description.text).toEqual(text);
      expect(description.type).toEqual(Description.types.INLINE);
      expect(description.toJSON).toBeInstanceOf(Function);
      expect(description.toString).toBeInstanceOf(Function);
    });
  });

  describe('text', () => {
    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(Description.prototype, 'text', 'set');
      text = 'This ia a description';

      new Description(text);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(text);

      // remove the spy
      spy.mockRestore();
    });

    test('can be changed', () => {
      expect(description.text).toEqual(text);

      description.text = 'foo';
      expect(description.text).toEqual('foo');

      description.text = 'baz bar';
      expect(description.text).toEqual('baz bar');
    });

    test('non-string values get cast to string', () => {
      description.text = 0;
      expect(description.text).toBe('0');

      description.text = 156;
      expect(description.text).toBe('156');

      description.text = 4.3;
      expect(description.text).toBe('4.3');
    });

    test('throws error if type is invalid', () => {
      expect(() => {
        new Description({ foo: 'bar' });
      }).toThrow(TypeError);

      expect(() => {
        new Description(['bar']);
      }).toThrow(TypeError);

      expect(() => {
        new Description(null);
      }).toThrow(TypeError);

      expect(() => {
        new Description(undefined);
      }).toThrow(TypeError);

      expect(() => {
        new Description(false);
      }).toThrow(TypeError);
    });
  });

  describe('type', () => {
    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(Description.prototype, 'type', 'set');

      new Description(text, Description.types.MULTILINE);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(Description.types.MULTILINE);

      // remove the spy
      spy.mockRestore();
    });

    test('can be changed', () => {
      expect(description.type).toEqual(Description.types.INLINE);

      description.type = Description.types.MULTILINE;
      expect(description.type).toEqual(Description.types.MULTILINE);

      description.type = Description.types.INLINE;
      expect(description.type).toEqual(Description.types.INLINE);
    });

    test('throws error if type is invalid', () => {
      expect(() => {
        description.type = { foo: 'bar' };
      }).toThrow(TypeError);

      expect(() => {
        description.type = ['bar'];
      }).toThrow(TypeError);

      expect(() => {
        description.type = null;
      }).toThrow(TypeError);

      expect(() => {
        description.type = undefined;
      }).toThrow(TypeError);

      expect(() => {
        description.type = false;
      }).toThrow(TypeError);

      expect(() => {
        description.type = 0;
      }).toThrow(TypeError);

      expect(() => {
        description.type = 65874;
      }).toThrow(TypeError);
    });

    test('throws error if value is invalid', () => {
      expect(() => {
        new Description(text, 'foo');
      }).toThrow(RangeError);

      expect(() => {
        new Description(text, '9785');
      }).toThrow(RangeError);
    });
  });

  describe('Output', () => {
    describe(Description.types.INLINE, () => {
      test('JSON output is correct', () => {
        expect(JSON.parse(JSON.stringify(description))).toEqual({
          text,
          type: Description.types.INLINE,
        });
      });

      test('String output is correct', () => {
        expect(description.toString()).toEqual(`# ${text}`);
      });
    });

    describe(Description.types.MULTILINE, () => {
      test('JSON output is correct', () => {
        const type = Description.types.MULTILINE;
        description.type = type;

        expect(JSON.parse(JSON.stringify(description))).toEqual({ text, type });
      });

      test('String output is correct', () => {
        description.type = Description.types.MULTILINE;

        expect(description.toString()).toEqual(`[${text}]`);
      });
    });
  });
});
