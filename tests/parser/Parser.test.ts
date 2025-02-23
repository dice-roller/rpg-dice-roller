import { FudgeDice, PercentileDice, StandardDice } from '../../src/dice/index';
import {
  ExplodeModifier,
  ReRollModifier,
} from '../../src/modifiers/index';
import * as parser from '../../src/parser/grammars/grammar';
import Parser from '../../src/parser/Parser';
import Description from '../../src/Description';

describe('Parser', () => {
  describe('Parsing', () => {
    describe('Calculating qty and sides', () => {
      test('can parse `(4*6)d6`', () => {
        const parsed = Parser.parse('(4*6)d6');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0].sides).toBe(6);
        expect(parsed[0].qty).toBe(24);
        expect(parsed[0].modifiers).toEqual(new Map());
      });

      test('can parse `3d(5/2)`', () => {
        const parsed = Parser.parse('3d(5/2)');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0].sides).toBe(2.5);
        expect(parsed[0].qty).toBe(3);
        expect(parsed[0].modifiers).toEqual(new Map());
      });

      test('can parse `(5^2*4)d(7%4)`', () => {
        const parsed = Parser.parse('(5^2*4)d(7%4)');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0].sides).toBe(3);
        expect(parsed[0].qty).toBe(100);
        expect(parsed[0].modifiers).toEqual(new Map());
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

          expect(parsed[1]).toBeInstanceOf(StandardDice);
          expect(parsed[1].sides).toBe(6);
          expect(parsed[1].qty).toBe(4);
          expect(parsed[1].modifiers).toEqual(new Map());

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

          expect(parsed[1]).toBeInstanceOf(StandardDice);
          expect(parsed[1].sides).toBe(6);
          expect(parsed[1].qty).toBe(4);
          expect(parsed[1].modifiers).toEqual(new Map());

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

        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0].sides).toBe(10);
        expect(parsed[0].qty).toBe(6);
        expect(parsed[0].modifiers).toEqual(new Map());

        expect(parsed[1]).toEqual('*');

        expect(parsed[2]).toBeInstanceOf(FudgeDice);
        expect(parsed[2].sides).toBe('F.1');
        expect(parsed[2].qty).toBe(4);
        expect(parsed[2].modifiers).toEqual(new Map());
      });

      test('can parse `(10d7/2d3)*4`', () => {
        const parsed = Parser.parse('(10d7/2d%)*4');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(7);

        expect(parsed[0]).toEqual('(');

        expect(parsed[1]).toBeInstanceOf(StandardDice);
        expect(parsed[1].sides).toBe(7);
        expect(parsed[1].qty).toBe(10);
        expect(parsed[1].modifiers).toEqual(new Map());

        expect(parsed[2]).toEqual('/');

        expect(parsed[3]).toBeInstanceOf(PercentileDice);
        expect(parsed[3].sides).toBe('%');
        expect(parsed[3].qty).toBe(2);
        expect(parsed[3].modifiers).toEqual(new Map());

        expect(parsed[4]).toEqual(')');
        expect(parsed[5]).toEqual('*');
        expect(parsed[6]).toBe(4);
      });

      test('can parse `d%%(45*2)', () => {
        const parsed = Parser.parse('d%%(45*2)');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(7);

        expect(parsed[0]).toBeInstanceOf(PercentileDice);
        expect(parsed[0].sides).toBe('%');
        expect(parsed[0].qty).toBe(1);
        expect(parsed[0].modifiers).toEqual(new Map());

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

        expect(parsed[3]).toBeInstanceOf(FudgeDice);
        expect(parsed[3].sides).toBe('F.2');
        expect(parsed[3].qty).toBe(3);
        expect(parsed[3].modifiers).toEqual(new Map());

        expect(parsed[4]).toEqual(')');
        expect(parsed[5]).toEqual('*');
        expect(parsed[6]).toBe(6.7);
        expect(parsed[7]).toEqual('-');
        expect(parsed[8]).toEqual('(');

        expect(parsed[9]).toBeInstanceOf(StandardDice);
        expect(parsed[9].sides).toBe(45);
        expect(parsed[9].qty).toBe(10);
        expect(parsed[9].modifiers).toEqual(new Map());

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

        expect(parsed[1]).toBeInstanceOf(StandardDice);
        expect(parsed[1].sides).toBe(10);
        expect(parsed[1].qty).toBe(8);
        expect(parsed[1].modifiers).toEqual(new Map());

        expect(parsed[2]).toEqual('/');
        expect(parsed[3]).toBe(4);
        expect(parsed[4]).toEqual(')');
        expect(parsed[5]).toEqual('^');
        expect(parsed[6]).toBe(5);
        expect(parsed[7]).toEqual('*');
        expect(parsed[8]).toEqual('(');

        expect(parsed[9]).toBeInstanceOf(PercentileDice);
        expect(parsed[9].sides).toBe('%');
        expect(parsed[9].qty).toBe(1);
        expect(parsed[9].modifiers).toEqual(new Map());

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

        expect(parsed[3]).toBeInstanceOf(StandardDice);
        expect(parsed[3].sides).toBe(10);
        expect(parsed[3].qty).toBe(4);
        expect(parsed[3].modifiers).toEqual(new Map());

        expect(parsed[4]).toEqual('/');
        expect(parsed[5]).toBe(3.4);
        expect(parsed[6]).toEqual(')');
      });

      test('can parse `4d10!!p/(23*d12r)`', () => {
        const parsed = Parser.parse('4d10!!p/(23*d12r)');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(7);

        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0].sides).toBe(10);
        expect(parsed[0].qty).toBe(4);

        expect(parsed[0].modifiers.has('explode')).toBe(true);

        let mod = parsed[0].modifiers.get('explode');
        expect(mod).toBeInstanceOf(ExplodeModifier);
        mod.useDefaultsIfNeeded(parsed[0]);
        expect(mod.toJSON()).toEqual(expect.objectContaining({
          comparePoint: expect.objectContaining({
            operator: '=',
            value: 10,
          }),
          compound: true,
          penetrate: true,
        }));

        expect(parsed[1]).toEqual('/');
        expect(parsed[2]).toEqual('(');
        expect(parsed[3]).toBe(23);
        expect(parsed[4]).toEqual('*');

        expect(parsed[5]).toBeInstanceOf(StandardDice);
        expect(parsed[5].sides).toBe(12);
        expect(parsed[5].qty).toBe(1);

        expect(parsed[5].modifiers.has('re-roll')).toBe(true);

        mod = parsed[5].modifiers.get('re-roll');
        expect(mod).toBeInstanceOf(ReRollModifier);
        mod.useDefaultsIfNeeded(parsed[0]);
        expect(mod.toJSON()).toEqual(expect.objectContaining({
          once: false,
          comparePoint: expect.objectContaining({
            operator: '=',
            value: 1,
          }),
        }));
      });
    });

    describe('Roll high', () => {
      test('can roll with a qty of 999', () => {
        const parsed = Parser.parse('999d6');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0].sides).toBe(6);
        expect(parsed[0].qty).toBe(999);
        expect(parsed[0].modifiers).toEqual(new Map());
      });

      test('can roll with a stupidly high sides', () => {
        const parsed = Parser.parse('d9999999999');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0].sides).toBe(9999999999);
        expect(parsed[0].qty).toBe(1);
        expect(parsed[0].modifiers).toEqual(new Map());
      });

      test('can roll with a qty of 999 and stupidly high sides', () => {
        const parsed = Parser.parse('999d9999999999');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0].sides).toBe(9999999999);
        expect(parsed[0].qty).toBe(999);
        expect(parsed[0].modifiers).toEqual(new Map());
      });
    });

    describe('Negative numbers', () => {
      test('roll `1d20+-5`', () => {
        const parsed = Parser.parse('1d20+-5');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(3);

        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0].sides).toBe(20);
        expect(parsed[0].qty).toBe(1);
        expect(parsed[0].modifiers).toEqual(new Map());

        expect(parsed[1]).toEqual('+');
        expect(parsed[2]).toBe(-5);
      });

      test('roll `-12*1d20`', () => {
        const parsed = Parser.parse('-12*1d20');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(3);

        expect(parsed[0]).toBe(-12);
        expect(parsed[1]).toEqual('*');

        expect(parsed[2]).toBeInstanceOf(StandardDice);
        expect(parsed[2].sides).toBe(20);
        expect(parsed[2].qty).toBe(1);
        expect(parsed[2].modifiers).toEqual(new Map());
      });

      test('can parse `(-2+5)d(6+-4)`', () => {
        const parsed = Parser.parse('(-2+5)d(6+-4)');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);

        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0].sides).toBe(2);
        expect(parsed[0].qty).toBe(3);
        expect(parsed[0].modifiers).toEqual(new Map());
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

        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0].sides).toBe(20);
        expect(parsed[0].qty).toBe(1);
        expect(parsed[0].modifiers).toEqual(new Map());

        expect(parsed[1]).toEqual('+');
        expect(parsed[2]).toBe(1.45);
      });

      test('roll `1d20*0.20', () => {
        const parsed = Parser.parse('1d20*0.20');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(3);

        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0].sides).toBe(20);
        expect(parsed[0].qty).toBe(1);
        expect(parsed[0].modifiers).toEqual(new Map());

        expect(parsed[1]).toEqual('*');
        expect(parsed[2]).toBe(0.20);
      });

      test('roll `1d20/6.02', () => {
        const parsed = Parser.parse('1d20/6.02');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(3);

        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0].sides).toBe(20);
        expect(parsed[0].qty).toBe(1);
        expect(parsed[0].modifiers).toEqual(new Map());

        expect(parsed[1]).toEqual('/');
        expect(parsed[2]).toBe(6.02);
      });

      test('roll `1d20+0', () => {
        const parsed = Parser.parse('1d20+0');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(3);

        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0].sides).toBe(20);
        expect(parsed[0].qty).toBe(1);
        expect(parsed[0].modifiers).toEqual(new Map());

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

          expect(parsed[0]).toBeInstanceOf(StandardDice);
          expect(parsed[0].sides).toBe(6);
          expect(parsed[0].qty).toBe(3);
          expect(parsed[0].modifiers).toEqual(new Map());

          expect(parsed[0].description).toBeInstanceOf(Description);
          expect(parsed[0].description.text).toEqual('fire');
          expect(parsed[0].description.type).toEqual(Description.types.INLINE);
        });

        test('3d6 # this is a comment', () => {
          const parsed = Parser.parse('3d6 # this is a comment');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          expect(parsed[0]).toBeInstanceOf(StandardDice);
          expect(parsed[0].sides).toBe(6);
          expect(parsed[0].qty).toBe(3);
          expect(parsed[0].modifiers).toEqual(new Map());

          expect(parsed[0].description).toBeInstanceOf(Description);
          expect(parsed[0].description.text).toEqual('this is a comment');
          expect(parsed[0].description.type).toEqual(Description.types.INLINE);
        });
      });

      describe('multi-line', () => {
        test('4dF /* This is a multi-line comment */', () => {
          const comment = 'This is a multi-line comment';
          const parsed = Parser.parse(`4dF /* ${comment} */`);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          expect(parsed[0]).toBeInstanceOf(FudgeDice);
          expect(parsed[0].sides).toEqual('F.2');
          expect(parsed[0].qty).toBe(4);
          expect(parsed[0].modifiers).toEqual(new Map());

          expect(parsed[0].description).toBeInstanceOf(Description);
          expect(parsed[0].description.text).toEqual(comment);
          expect(parsed[0].description.type).toEqual(Description.types.MULTILINE);
        });

        test('12d% [ A comment with a \n line break ]', () => {
          const comment = 'A comment with a \n line break';
          const parsed = Parser.parse(`12d% /* ${comment} */`);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          expect(parsed[0]).toBeInstanceOf(PercentileDice);
          expect(parsed[0].sides).toBe('%');
          expect(parsed[0].qty).toBe(12);
          expect(parsed[0].modifiers).toEqual(new Map());

          expect(parsed[0].description).toBeInstanceOf(Description);
          expect(parsed[0].description.text).toEqual(comment);
          expect(parsed[0].description.type).toEqual(Description.types.MULTILINE);
        });
      });
    });
  });
});
