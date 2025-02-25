import { FudgeDice, PercentileDice, StandardDice } from '../../../src/dice';
import {
  ExplodeModifier,
  ReRollModifier,
} from '../../../src/modifiers';
import * as parser from '../../../src/parser/grammars/grammar';
import Parser from '../../../src/parser/Parser';
import Description from '../../../src/Description';
import { Dice } from "../../../src/types/Interfaces/Dice";
import { ComparisonOperator } from "../../../src/types/Enums/ComparisonOperator";
import RollResults from "../../../src/results/RollResults";
import { Modifier } from "../../../src/types/Interfaces/Modifiers/Modifier";
import { DescriptionType } from "../../../src/types/Enums/DescriptionType";

describe('Parsing', () => {
  describe('Calculating qty and sides', () => {
    test('can parse `(4*6)d6`', () => {
      const parsed = Parser.parse('(4*6)d6');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const result = parsed[0] as Dice;
      expect(result).toBeInstanceOf(StandardDice);
      expect(result.sides).toBe(6);
      expect(result.qty).toBe(24);
      expect(result.modifiers).toEqual(new Map());
    });

    test('can parse `3d(5/2)`', () => {
      const parsed = Parser.parse('3d(5/2)');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const result = parsed[0] as Dice;
      expect(result).toBeInstanceOf(StandardDice);
      expect(result.sides).toBe(2.5);
      expect(result.qty).toBe(3);
      expect(result.modifiers).toEqual(new Map());
    });

    test('can parse `(5^2*4)d(7%4)`', () => {
      const parsed = Parser.parse('(5^2*4)d(7%4)');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const result = parsed[0] as Dice;
      expect(result).toBeInstanceOf(StandardDice);
      expect(result.sides).toBe(3);
      expect(result.qty).toBe(100);
      expect(result.modifiers).toEqual(new Map());
    });
  });

  describe('Functions', () => {
    // loop through and test all the single argument functions
    ['abs', 'ceil', 'cos', 'exp', 'floor', 'log', 'round', 'sign', 'sin', 'sqrt', 'tan'].forEach((name) => {
      test(`can parse \`${name}(4d6/3)\``, () => {
        const parsed = Parser.parse(`${name}(4d6/3)`);

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(5);

        expect(parsed[0]).toEqual(`${name}(`);

        const result = parsed[1] as Dice;
        expect(result).toBeInstanceOf(StandardDice);
        expect(result.sides).toBe(6);
        expect(result.qty).toBe(4);
        expect(result.modifiers).toEqual(new Map());

        expect(parsed[2]).toEqual('/');
        expect(parsed[3]).toBe(3);
        expect(parsed[4]).toEqual(')');
      });

      test('passing multiple arguments throws error', () => {
        expect(() => {
          Parser.parse(`${name}(4d6/3, 45)`);
        }).toThrow(parser.PeggySyntaxError);
      });
    });

    // loop through all the double argument functions
    ['pow', 'max', 'min'].forEach((name) => {
      test(`can parse \`${name}(4d6, 7)\``, () => {
        const parsed = Parser.parse(`${name}(4d6, 7)`);

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(5);

        expect(parsed[0]).toEqual(`${name}(`);

        const result = parsed[1] as Dice;
        expect(result).toBeInstanceOf(StandardDice);
        expect(result.sides).toBe(6);
        expect(result.qty).toBe(4);
        expect(result.modifiers).toEqual(new Map());

        expect(parsed[2]).toEqual(',');
        expect(parsed[3]).toBe(7);
        expect(parsed[4]).toEqual(')');
      });

      test('passing single argument throws error', () => {
        expect(() => {
          Parser.parse(`${name}(4d6/3)`);
        }).toThrow(parser.PeggySyntaxError);
      });
    });
  });

  describe('Multiple dice', () => {
    test('can parse `6d10*4dF.1`', () => {
      const parsed = Parser.parse('6d10*4dF.1');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(3);

      let result = parsed[0] as Dice;
      expect(result).toBeInstanceOf(StandardDice);
      expect(result.sides).toBe(10);
      expect(result.qty).toBe(6);
      expect(result.modifiers).toEqual(new Map());

      expect(parsed[1]).toEqual('*');

      result = parsed[2] as Dice;
      expect(result).toBeInstanceOf(FudgeDice);
      expect(result.sides).toBe('F.1');
      expect(result.qty).toBe(4);
      expect(result.modifiers).toEqual(new Map());
    });

    test('can parse `(10d7/2d3)*4`', () => {
      const parsed = Parser.parse('(10d7/2d%)*4');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(7);

      expect(parsed[0]).toEqual('(');

      let result = parsed[1] as Dice;
      expect(result).toBeInstanceOf(StandardDice);
      expect(result.sides).toBe(7);
      expect(result.qty).toBe(10);
      expect(result.modifiers).toEqual(new Map());

      expect(parsed[2]).toEqual('/');

      result = parsed[3] as Dice;
      expect(result).toBeInstanceOf(PercentileDice);
      expect(result.sides).toBe('%');
      expect(result.qty).toBe(2);
      expect(result.modifiers).toEqual(new Map());

      expect(parsed[4]).toEqual(')');
      expect(parsed[5]).toEqual('*');
      expect(parsed[6]).toBe(4);
    });

    test('can parse `d%%(45*2)', () => {
      const parsed = Parser.parse('d%%(45*2)');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(7);

      const result = parsed[0] as Dice;
      expect(result).toBeInstanceOf(PercentileDice);
      expect(result.sides).toBe('%');
      expect(result.qty).toBe(1);
      expect(result.modifiers).toEqual(new Map());

      expect(parsed[1]).toEqual('%');
      expect(parsed[2]).toEqual('(');
      expect(parsed[3]).toBe(45);
      expect(parsed[4]).toEqual('*');
      expect(parsed[5]).toBe(2);
      expect(parsed[6]).toEqual(')');
    });

    test('can parse `(4.56^3dF)*6.7-(10d45/(2*3))', () => {
      const parsed = Parser.parse('(4.56^3dF)*6.7-(10d45/(2*3))');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(17);

      expect(parsed[0]).toEqual('(');
      expect(parsed[1]).toBe(4.56);
      expect(parsed[2]).toEqual('^');

      let result = parsed[3] as Dice;
      expect(result).toBeInstanceOf(FudgeDice);
      expect(result.sides).toBe('F.2');
      expect(result.qty).toBe(3);
      expect(result.modifiers).toEqual(new Map());

      expect(parsed[4]).toEqual(')');
      expect(parsed[5]).toEqual('*');
      expect(parsed[6]).toBe(6.7);
      expect(parsed[7]).toEqual('-');
      expect(parsed[8]).toEqual('(');

      result = parsed[9] as Dice;
      expect(result).toBeInstanceOf(StandardDice);
      expect(result.sides).toBe(45);
      expect(result.qty).toBe(10);
      expect(result.modifiers).toEqual(new Map());

      expect(parsed[10]).toEqual('/');
      expect(parsed[11]).toEqual('(');
      expect(parsed[12]).toBe(2);
      expect(parsed[13]).toEqual('*');
      expect(parsed[14]).toBe(3);
      expect(parsed[15]).toEqual(')');
      expect(parsed[16]).toEqual(')');
    });

    test('can parse `((4*2)d10/4)^5*(d10)`', () => {
      const parsed = Parser.parse('((4*2)d10/4)^5*(d%-2)');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(13);

      expect(parsed[0]).toEqual('(');

      let result = parsed[1] as Dice;
      expect(result).toBeInstanceOf(StandardDice);
      expect(result.sides).toBe(10);
      expect(result.qty).toBe(8);
      expect(result.modifiers).toEqual(new Map());

      expect(parsed[2]).toEqual('/');
      expect(parsed[3]).toBe(4);
      expect(parsed[4]).toEqual(')');
      expect(parsed[5]).toEqual('^');
      expect(parsed[6]).toBe(5);
      expect(parsed[7]).toEqual('*');
      expect(parsed[8]).toEqual('(');

      result = parsed[9] as Dice;
      expect(result).toBeInstanceOf(PercentileDice);
      expect(result.sides).toBe('%');
      expect(result.qty).toBe(1);
      expect(result.modifiers).toEqual(new Map());

      expect(parsed[10]).toEqual('-');
      expect(parsed[11]).toBe(2);
      expect(parsed[12]).toEqual(')');
    });

    test('can parse `2*floor(4d10/3.4)`', () => {
      const parsed = Parser.parse('2*floor(4d10/3.4)');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(7);

      expect(parsed[0]).toBe(2);
      expect(parsed[1]).toEqual('*');
      expect(parsed[2]).toEqual('floor(');

      const result = parsed[3] as Dice;
      expect(result).toBeInstanceOf(StandardDice);
      expect(result.sides).toBe(10);
      expect(result.qty).toBe(4);
      expect(result.modifiers).toEqual(new Map());

      expect(parsed[4]).toEqual('/');
      expect(parsed[5]).toBe(3.4);
      expect(parsed[6]).toEqual(')');
    });

    test('can parse `4d10!!p/(23*d12r)`', () => {
      const parsed = Parser.parse('4d10!!p/(23*d12r)');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(7);

      let result = parsed[0] as Dice;
      expect(result).toBeInstanceOf(StandardDice);
      expect(result.sides).toBe(10);
      expect(result.qty).toBe(4);
      expect(result.modifiers?.has('explode')).toBe(true);

      let mod = result.modifiers?.get('explode') as Modifier;
      mod.run(new RollResults(), result);

      expect(mod).toBeInstanceOf(ExplodeModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        comparePoint: expect.objectContaining({
          operator: ComparisonOperator.Equal,
          value: 10,
        }),
        compound: true,
        penetrate: true,
      }));

      expect(parsed[1]).toEqual('/');
      expect(parsed[2]).toEqual('(');
      expect(parsed[3]).toBe(23);
      expect(parsed[4]).toEqual('*');

      result = parsed[5] as Dice;
      expect(result).toBeInstanceOf(StandardDice);
      expect(result.sides).toBe(12);
      expect(result.qty).toBe(1);
      expect(result.modifiers?.has('re-roll')).toBe(true);

      mod = result.modifiers?.get('re-roll') as Modifier;
      mod.run(new RollResults(), result);
      //mod.useDefaultsIfNeeded(parsed[0]);

      expect(mod).toBeInstanceOf(ReRollModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        once: false,
        comparePoint: expect.objectContaining({
          operator: ComparisonOperator.Equal,
          value: 1,
        }),
      }));

      expect(parsed[6]).toEqual(')');
    });
  });

  describe('Roll high', () => {
    test('can roll with a qty of 999', () => {
      const parsed = Parser.parse('999d6');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const result = parsed[0] as Dice;
      expect(result).toBeInstanceOf(StandardDice);
      expect(result.sides).toBe(6);
      expect(result.qty).toBe(999);
      expect(result.modifiers).toEqual(new Map());
    });

    test('can roll with a stupidly high sides', () => {
      const parsed = Parser.parse('d9999999999');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const result = parsed[0] as Dice;
      expect(result).toBeInstanceOf(StandardDice);
      expect(result.sides).toBe(9999999999);
      expect(result.qty).toBe(1);
      expect(result.modifiers).toEqual(new Map());
    });

    test('can roll with a qty of 999 and stupidly high sides', () => {
      const parsed = Parser.parse('999d9999999999');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const result = parsed[0] as Dice;
      expect(result).toBeInstanceOf(StandardDice);
      expect(result.sides).toBe(9999999999);
      expect(result.qty).toBe(999);
      expect(result.modifiers).toEqual(new Map());
    });
  });

  describe('Negative numbers', () => {
    test('roll `1d20+-5`', () => {
      const parsed = Parser.parse('1d20+-5');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(3);

      const result = parsed[0] as Dice;
      expect(result).toBeInstanceOf(StandardDice);
      expect(result.sides).toBe(20);
      expect(result.qty).toBe(1);
      expect(result.modifiers).toEqual(new Map());

      expect(parsed[1]).toEqual('+');
      expect(parsed[2]).toBe(-5);
    });

    test('roll `-12*1d20`', () => {
      const parsed = Parser.parse('-12*1d20');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(3);

      expect(parsed[0]).toBe(-12);
      expect(parsed[1]).toEqual('*');

      const result = parsed[2] as Dice;
      expect(result).toBeInstanceOf(StandardDice);
      expect(result.sides).toBe(20);
      expect(result.qty).toBe(1);
      expect(result.modifiers).toEqual(new Map());
    });

    test('can parse `(-2+5)d(6+-4)`', () => {
      const parsed = Parser.parse('(-2+5)d(6+-4)');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const result = parsed[0] as Dice;
      expect(result).toBeInstanceOf(StandardDice);
      expect(result.sides).toBe(2);
      expect(result.qty).toBe(3);
      expect(result.modifiers).toEqual(new Map());
    });

    test('throws error when using negative values for die quantity', () => {
      expect(() => {
        Parser.parse('-4d6');
      }).toThrow(parser.PeggySyntaxError);
    });

    test('throws error when using negative values for die sides', () => {
      expect(() => {
        Parser.parse('4d-6');
      }).toThrow(parser.PeggySyntaxError);
    });
  });

  describe('Decimals', () => {
    test('roll `1d20+1.45', () => {
      const parsed = Parser.parse('1d20+1.45');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(3);

      const result = parsed[0] as Dice;
      expect(result).toBeInstanceOf(StandardDice);
      expect(result.sides).toBe(20);
      expect(result.qty).toBe(1);
      expect(result.modifiers).toEqual(new Map());

      expect(parsed[1]).toEqual('+');
      expect(parsed[2]).toBe(1.45);
    });

    test('roll `1d20*0.20', () => {
      const parsed = Parser.parse('1d20*0.20');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(3);

      const result = parsed[0] as Dice;
      expect(result).toBeInstanceOf(StandardDice);
      expect(result.sides).toBe(20);
      expect(result.qty).toBe(1);
      expect(result.modifiers).toEqual(new Map());

      expect(parsed[1]).toEqual('*');
      expect(parsed[2]).toBe(0.20);
    });

    test('roll `1d20/6.02', () => {
      const parsed = Parser.parse('1d20/6.02');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(3);

      const result = parsed[0] as Dice;
      expect(result).toBeInstanceOf(StandardDice);
      expect(result.sides).toBe(20);
      expect(result.qty).toBe(1);
      expect(result.modifiers).toEqual(new Map());

      expect(parsed[1]).toEqual('/');
      expect(parsed[2]).toBe(6.02);
    });

    test('roll `1d20+0', () => {
      const parsed = Parser.parse('1d20+0');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(3);

      const result = parsed[0] as Dice;
      expect(result).toBeInstanceOf(StandardDice);
      expect(result.sides).toBe(20);
      expect(result.qty).toBe(1);
      expect(result.modifiers).toEqual(new Map());

      expect(parsed[1]).toEqual('+');
      expect(parsed[2]).toBe(0);
    });
  });

  describe('Descriptions', () => {
    describe('Single', () => {
      test('3d6 // fire', () => {
        const parsed = Parser.parse('3d6 // fire');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);

        const result = parsed[0] as Dice;
        expect(result).toBeInstanceOf(StandardDice);
        expect(result.sides).toBe(6);
        expect(result.qty).toBe(3);
        expect(result.modifiers).toEqual(new Map());

        expect(result.description).toBeInstanceOf(Description);
        expect(result.description?.text).toEqual('fire');
        expect(result.description?.type).toEqual(DescriptionType.Inline);
      });

      test('3d6 # this is a comment', () => {
        const parsed = Parser.parse('3d6 # this is a comment');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);

        const result = parsed[0] as Dice;
        expect(result).toBeInstanceOf(StandardDice);
        expect(result.sides).toBe(6);
        expect(result.qty).toBe(3);
        expect(result.modifiers).toEqual(new Map());

        expect(result.description).toBeInstanceOf(Description);
        expect(result.description?.text).toEqual('this is a comment');
        expect(result.description?.type).toEqual(DescriptionType.Inline);
      });
    });

    describe('multi-line', () => {
      test('4dF /* This is a multi-line comment */', () => {
        const comment = 'This is a multi-line comment';
        const parsed = Parser.parse(`4dF /* ${comment} */`);

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);

        const result = parsed[0] as Dice;
        expect(result).toBeInstanceOf(FudgeDice);
        expect(result.sides).toEqual('F.2');
        expect(result.qty).toBe(4);
        expect(result.modifiers).toEqual(new Map());

        expect(result.description).toBeInstanceOf(Description);
        expect(result.description?.text).toEqual(comment);
        expect(result.description?.type).toEqual(DescriptionType.MultiLine);
      });

      test('12d% [ A comment with a \n line break ]', () => {
        const comment = 'A comment with a \n line break';
        const parsed = Parser.parse(`12d% /* ${comment} */`);

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);

        const result = parsed[0] as Dice;
        expect(result).toBeInstanceOf(PercentileDice);
        expect(result.sides).toBe('%');
        expect(result.qty).toBe(12);
        expect(result.modifiers).toEqual(new Map());

        expect(result.description).toBeInstanceOf(Description);
        expect(result.description?.text).toEqual(comment);
        expect(result.description?.type).toEqual(DescriptionType.MultiLine);
      });
    });
  });
});
