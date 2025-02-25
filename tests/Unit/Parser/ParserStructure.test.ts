import Parser from "../../../src/parser/Parser";
import { RequiredArgumentError } from "../../../src/exceptions";
import StandardDice from "../../../src/dice/StandardDice";
import RollGroup from "../../../src/RollGroup";

describe('Parser Structure', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      expect(Parser).toEqual(expect.objectContaining({
        parse: expect.any(Function),
      }));
    });
  });

  describe('notation', () => {
    test('requires notation', () => {
      expect(() => {
        // @ts-expect-error testing missing argument
        Parser.parse();
      }).toThrow(RequiredArgumentError);

      expect(() => {
        // @ts-expect-error testing invalid value
        Parser.parse(false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        // @ts-expect-error testing invalid value
        Parser.parse(null);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        // @ts-expect-error testing invalid value
        Parser.parse(undefined);
      }).toThrow(RequiredArgumentError);
    });

    test('notation must be string', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        Parser.parse({ notation: '2d10' });
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        Parser.parse(['4d6']);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        Parser.parse(true);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        Parser.parse(124);
      }).toThrow(TypeError);
    });
  });

  describe('Output', () => {
    test('returns ParserResult', () => {
      const result = Parser.parse('2d6+7');

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(3);
      expect(
        result.every((item) => {
          if (item instanceof StandardDice) {
            return true;
          }

          if (item instanceof RollGroup) {
            return true;
          }

          return ['string', 'number'].includes(typeof item);
        })
      )
        .toBe(true);
    });
  });
});
