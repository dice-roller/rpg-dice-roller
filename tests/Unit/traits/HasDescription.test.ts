import HasDescription from '../../../src/traits/HasDescription';
import Description from '../../../src/Description';
import { DescriptionType } from "../../../src/types/Enums/DescriptionType";

describe('HasDescription', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const model = new HasDescription();

      expect(model).toBeInstanceOf(HasDescription);
      expect(model).toEqual(expect.objectContaining({
        description: null,
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });

    test('Can set `description` in constructor', () => {
      const description = new Description('a description');
      const model = new HasDescription(description);

      expect(model.description).toBe(description);
    });
  });

  describe('Description', () => {
    test('can be `Description` object', () => {
      let description = new Description('my description');
      let model = new HasDescription(description);

      expect(model.description).toBe(description);

      description = new Description('multiline description', DescriptionType.MultiLine);
      model = new HasDescription(description);

      expect(model.description).toBe(description);
    });

    test('can be string', () => {
      const description = 'another description';
      const model = new HasDescription(description);

      expect(model.description).toBeInstanceOf(Description);
      expect(model.description?.text).toBe(description);
      expect(model.description?.type).toBe(DescriptionType.Inline);
    });

    test('can be null', () => {
      const model = new HasDescription(null);

      expect(model.description).toBe(null);
    });

    test('empty values get set to `null`', () => {
      // @ts-expect-error testing empty value
      let model = new HasDescription(false);
      expect(model.description).toBe(null);

      model = new HasDescription(undefined);
      expect(model.description).toBe(null);
    });

    test('invalid values throw error', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        new HasDescription(true);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new HasDescription(0);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new HasDescription(56);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new HasDescription(['a description']);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        new HasDescription({ description: 'foo' });
      }).toThrow(TypeError);
    });

    test('can be changed', () => {
      let description: Description|string = new Description('my description');
      const model = new HasDescription(description);

      expect(model.description).toBe(description);

      description = new Description('Another description', DescriptionType.MultiLine);
      model.description = description;

      expect(model.description).toBe(description);

      description = 'third description';
      model.description = description;

      expect(model.description).toBeInstanceOf(Description);
      expect(model.description?.text).toBe(description);
      expect(model.description?.type).toBe(DescriptionType.Inline);

      model.description = null;

      expect(model.description).toBe(null);
    });
  });

  describe('Output', () => {
    let model: HasDescription;

    describe('With single-line description', () => {
      beforeEach(() => {
        model = new HasDescription(new Description('a description'));
      });

      test('JSON output is correct', () => {
        expect(JSON.parse(JSON.stringify(model))).toEqual({
          description: {
            text: model.description?.text,
            type: model.description?.type,
          },
        });
      });

      test('String output is correct', () => {
        expect(model.toString()).toEqual(`# ${model.description?.text}`);
      });
    });

    describe('With multi-line description', () => {
      beforeEach(() => {
        model = new HasDescription(new Description('a multi-line description', DescriptionType.MultiLine));
      });

      test('JSON output is correct', () => {
        expect(JSON.parse(JSON.stringify(model))).toEqual({
          description: {
            text: model.description?.text,
            type: model.description?.type,
          },
        });
      });

      test('String output is correct', () => {
        expect(model.toString()).toEqual(`[${model.description?.text}]`);
      });
    });

    describe('Without description', () => {
      beforeEach(() => {
        model = new HasDescription();
      });

      test('JSON output is correct', () => {
        expect(JSON.parse(JSON.stringify(model))).toEqual({
          description: null,
        });
      });

      test('String output is correct', () => {
        expect(model.toString()).toEqual('');
      });
    });
  });
});
