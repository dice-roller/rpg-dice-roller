import Description from '../../src/Description';
import { DescriptionType } from '../../src/types/Enums/DescriptionType';

describe('Description', () => {
  let description: Description;
  let text: string;

  beforeEach(() => {
    text = 'A description';

    description = new Description(text, DescriptionType.Inline);
  });

  describe('Initialisation', () => {
    test('model structure', () => {
      expect(description).toBeInstanceOf(Description);

      expect(description.text).toEqual(text);
      expect(description.type).toEqual(DescriptionType.Inline);
      expect(typeof description.toJSON).toBe('function');
      expect(typeof description.toString).toBe('function');
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
      // @ts-expect-error testing numeric values
      description.text = 0;
      expect(description.text).toBe('0');

      // @ts-expect-error testing numeric values
      description.text = 156;
      expect(description.text).toBe('156');

      // @ts-expect-error testing numeric values
      description.text = 4.3;
      expect(description.text).toBe('4.3');
    });

    test('throws error if type is invalid', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        new Description({ foo: 'bar' });
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new Description(['bar']);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new Description(null);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new Description(undefined);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new Description(false);
      }).toThrow(TypeError);
    });
  });

  describe('type', () => {
    test('setting in constructor calls setter', () => {
      const spy = jest.spyOn(Description.prototype, 'type', 'set');

      new Description(text, DescriptionType.MultiLine);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(DescriptionType.MultiLine);

      // remove the spy
      spy.mockRestore();
    });

    test('can be changed', () => {
      expect(description.type).toEqual(DescriptionType.Inline);

      description.type = DescriptionType.MultiLine;
      expect(description.type).toEqual(DescriptionType.MultiLine);

      description.type = DescriptionType.Inline;
      expect(description.type).toEqual(DescriptionType.Inline);
    });

    test('throws error if type is invalid', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        description.type = { foo: 'bar' };
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        description.type = ['bar'];
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        description.type = null;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        description.type = undefined;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        description.type = false;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        description.type = 0;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        description.type = 65874;
      }).toThrow(TypeError);
    });

    test('throws error if value is invalid', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        new Description(text, 'foo');
      }).toThrow(RangeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new Description(text, '9785');
      }).toThrow(RangeError);
    });
  });

  describe('Output', () => {
    describe(DescriptionType.Inline, () => {
      test('JSON output is correct', () => {
        expect(JSON.parse(JSON.stringify(description))).toEqual({
          text,
          type: DescriptionType.Inline,
        });
      });

      test('String output is correct', () => {
        expect(description.toString()).toEqual(`# ${text}`);
      });
    });

    describe(DescriptionType.MultiLine, () => {
      test('JSON output is correct', () => {
        const type = DescriptionType.MultiLine;
        description.type = type;

        expect(JSON.parse(JSON.stringify(description))).toEqual({ text, type });
      });

      test('String output is correct', () => {
        description.type = DescriptionType.MultiLine;

        expect(description.toString()).toEqual(`[${text}]`);
      });
    });
  });
});
