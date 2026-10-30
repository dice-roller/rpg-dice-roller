import { FudgeDice, PercentileDice, StandardDice } from '../../src/dice/index.js';
import { DropModifier, KeepModifier, SortingModifier } from '../../src/modifiers/index.js';
import { SyntaxError } from '../../src/parser/grammars/grammar.js';
import Parser from '../../src/parser/Parser.js';
import RollGroup from '../../src/RollGroup.js';
import Description from '../../src/Description.js';

describe('Parsing', () => {
  describe('Roll groups', () => {
    describe('Basic', () => {
      let dice;

      beforeEach(() => {
        dice = [
          new StandardDice(6, 1, []),
          new StandardDice(4, 1, []),
          new StandardDice(10, 2, []),
        ];
      });

      test('can parse`{1d6}`', () => {
        const notation = '{1d6}';
        const parsed = Parser.parse(notation);

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);

        const group = parsed[0];

        expect(group).toBeInstanceOf(RollGroup);

        expect(group.expressions).toBeInstanceOf(Array);
        expect(group.expressions).toHaveLength(1);
        expect(group.expressions[0]).toHaveLength(1);
        expect(group.expressions[0][0]).toEqual(dice[0]);

        expect(group.modifiers).toEqual(new Map());
        expect(group.notation).toEqual(notation);
      });

      test('can parse `{1d6+1d4}`', () => {
        const notation = '{1d6+1d4}';
        const parsed = Parser.parse(notation);

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);

        const group = parsed[0];

        expect(group).toBeInstanceOf(RollGroup);

        expect(group.expressions).toBeInstanceOf(Array);
        expect(group.expressions).toHaveLength(1);
        expect(group.expressions[0]).toHaveLength(3);
        expect(group.expressions[0][0]).toEqual(dice[0]);
        expect(group.expressions[0][1]).toEqual('+');
        expect(group.expressions[0][2]).toEqual(dice[1]);

        expect(group.modifiers).toEqual(new Map());
        expect(group.notation).toEqual(notation);
      });

      test('can parse `{1d6, 1d4}`', () => {
        const notation = '{1d6, 1d4}';
        const parsed = Parser.parse(notation);

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);

        const group = parsed[0];

        expect(group).toBeInstanceOf(RollGroup);

        expect(group.expressions).toBeInstanceOf(Array);
        expect(group.expressions).toHaveLength(2);
        expect(group.expressions[0]).toHaveLength(1);
        expect(group.expressions[0][0]).toEqual(dice[0]);
        expect(group.expressions[1]).toHaveLength(1);
        expect(group.expressions[1][0]).toEqual(dice[1]);

        expect(group.modifiers).toEqual(new Map());
        expect(group.notation).toEqual(notation);
      });

      test('can parse `{1d6+4, 1d4/2d10}`', () => {
        const notation = '{1d6+4, 1d4/2d10}';
        const parsed = Parser.parse(notation);

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);

        const group = parsed[0];

        expect(parsed[0]).toBeInstanceOf(RollGroup);

        expect(group.expressions).toBeInstanceOf(Array);
        expect(group.expressions).toHaveLength(2);

        expect(group.expressions[0]).toHaveLength(3);
        expect(group.expressions[0][0]).toEqual(dice[0]);
        expect(group.expressions[0][1]).toEqual('+');
        expect(group.expressions[0][2]).toBe(4);

        expect(group.expressions[1]).toHaveLength(3);
        expect(group.expressions[1][0]).toEqual(dice[1]);
        expect(group.expressions[1][1]).toEqual('/');
        expect(group.expressions[1][2]).toEqual(dice[2]);

        expect(group.modifiers).toEqual(new Map());
        expect(group.notation).toEqual(notation);
      });

      test('can parse `{1}`', () => {
        const notation = '{1}';
        const parsed = Parser.parse(notation);

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);

        const group = parsed[0];

        expect(group).toBeInstanceOf(RollGroup);

        expect(group.expressions).toBeInstanceOf(Array);
        expect(group.expressions).toHaveLength(1);
        expect(group.expressions[0]).toHaveLength(1);
        expect(group.expressions[0][0]).toBe(1);

        expect(group.modifiers).toEqual(new Map());
        expect(group.notation).toEqual(notation);
      });

      test('throws error on empty group', () => {
        expect(() => {
          Parser.parse('{}');
        }).toThrow(SyntaxError);
      });
    });

    describe('modifiers', () => {
      describe('Drop', () => {
        test('drop lowest for `{19d23}d1`', () => {
          const notation = '{19d23}d1';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          const group = parsed[0];

          expect(group).toBeInstanceOf(RollGroup);

          expect(group.expressions).toBeInstanceOf(Array);
          expect(group.expressions).toHaveLength(1);
          expect(group.expressions[0]).toHaveLength(1);
          expect(group.expressions[0][0]).toEqual(new StandardDice(23, 19, []));

          expect(group.modifiers).toBeInstanceOf(Map);
          expect(group.modifiers.size).toBe(1);
          expect(group.modifiers.has('drop-l')).toBe(true);

          const mod = group.modifiers.get('drop-l');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.end).toEqual('l');
          expect(mod.qty).toBe(1);

          expect(group.notation).toEqual('{19d23}dl1');
        });

        test('drop lowest for `{19d23, 4d10+3}d1`', () => {
          const notation = '{19d23, 4d10+3}d1';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          const group = parsed[0];

          expect(group).toBeInstanceOf(RollGroup);

          expect(group.expressions).toBeInstanceOf(Array);
          expect(group.expressions).toHaveLength(2);

          expect(group.expressions[0]).toHaveLength(1);
          expect(group.expressions[0][0]).toEqual(new StandardDice(23, 19, []));

          expect(group.expressions[1]).toHaveLength(3);
          expect(group.expressions[1][0]).toEqual(new StandardDice(10, 4, []));
          expect(group.expressions[1][1]).toEqual('+');
          expect(group.expressions[1][2]).toBe(3);

          expect(group.modifiers).toBeInstanceOf(Map);
          expect(group.modifiers.size).toBe(1);
          expect(group.modifiers.has('drop-l')).toBe(true);

          const mod = group.modifiers.get('drop-l');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.end).toEqual('l');
          expect(mod.qty).toBe(1);

          expect(group.notation).toEqual('{19d23, 4d10+3}dl1');
        });

        test('drop lowest for `{4d10}dl1`', () => {
          const notation = '{4d10}dl1';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          const group = parsed[0];

          expect(group).toBeInstanceOf(RollGroup);

          expect(group.expressions).toBeInstanceOf(Array);
          expect(group.expressions).toHaveLength(1);
          expect(group.expressions[0]).toHaveLength(1);
          expect(group.expressions[0][0]).toEqual(new StandardDice(10, 4, []));

          expect(group.modifiers).toBeInstanceOf(Map);
          expect(group.modifiers.size).toBe(1);
          expect(group.modifiers.has('drop-l')).toBe(true);

          const mod = group.modifiers.get('drop-l');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.end).toEqual('l');
          expect(mod.qty).toBe(1);

          expect(group.notation).toEqual(notation);
        });

        test('drop lowest for `{4d10/4, 2dF.1}dl1`', () => {
          const notation = '{4d10/4, 2dF.1}dl1';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          const group = parsed[0];

          expect(group).toBeInstanceOf(RollGroup);

          expect(group.expressions).toBeInstanceOf(Array);
          expect(group.expressions).toHaveLength(2);

          expect(group.expressions[0]).toHaveLength(3);
          expect(group.expressions[0][0]).toEqual(new StandardDice(10, 4, []));
          expect(group.expressions[0][1]).toEqual('/');
          expect(group.expressions[0][2]).toBe(4);

          expect(group.expressions[1]).toHaveLength(1);
          expect(group.expressions[1][0]).toEqual(new FudgeDice(1, 2, []));

          expect(group.modifiers).toBeInstanceOf(Map);
          expect(group.modifiers.size).toBe(1);
          expect(group.modifiers.has('drop-l')).toBe(true);

          const mod = group.modifiers.get('drop-l');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.end).toEqual('l');
          expect(mod.qty).toBe(1);

          expect(group.notation).toEqual(notation);
        });

        test('drop lowest for `{7d%}d3`', () => {
          const notation = '{7d%}d3';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          const group = parsed[0];

          expect(group).toBeInstanceOf(RollGroup);

          expect(group.expressions).toBeInstanceOf(Array);
          expect(group.expressions).toHaveLength(1);
          expect(group.expressions[0]).toHaveLength(1);
          expect(group.expressions[0][0]).toEqual(new PercentileDice(7, []));

          expect(group.modifiers).toBeInstanceOf(Map);
          expect(group.modifiers.size).toBe(1);
          expect(group.modifiers.has('drop-l')).toBe(true);

          const mod = group.modifiers.get('drop-l');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.end).toEqual('l');
          expect(mod.qty).toBe(3);

          expect(group.notation).toEqual('{7d%}dl3');
        });

        test('drop lowest for `{7d%, 4*2d6, 7d10-2}d3`', () => {
          const notation = '{7d%, 4*2d6, 7d10-2}d3';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          const group = parsed[0];

          expect(group).toBeInstanceOf(RollGroup);

          expect(group.expressions).toBeInstanceOf(Array);
          expect(group.expressions).toHaveLength(3);

          expect(group.expressions[0]).toHaveLength(1);
          expect(group.expressions[0][0]).toEqual(new PercentileDice(7, []));

          expect(group.expressions[1]).toHaveLength(3);
          expect(group.expressions[1][0]).toBe(4);
          expect(group.expressions[1][1]).toEqual('*');
          expect(group.expressions[1][2]).toEqual(new StandardDice(6, 2, []));

          expect(group.expressions[2]).toHaveLength(3);
          expect(group.expressions[2][0]).toEqual(new StandardDice(10, 7, []));
          expect(group.expressions[2][1]).toEqual('-');
          expect(group.expressions[2][2]).toBe(2);

          expect(group.modifiers).toBeInstanceOf(Map);
          expect(group.modifiers.size).toBe(1);
          expect(group.modifiers.has('drop-l')).toBe(true);

          const mod = group.modifiers.get('drop-l');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.end).toEqual('l');
          expect(mod.qty).toBe(3);

          expect(group.notation).toEqual('{7d%, 4*2d6, 7d10-2}dl3');
        });

        test('drop highest for `{4d6}dh2`', () => {
          const notation = '{4d6}dh2';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          const group = parsed[0];

          expect(group).toBeInstanceOf(RollGroup);

          expect(group.expressions).toBeInstanceOf(Array);
          expect(group.expressions).toHaveLength(1);
          expect(group.expressions[0]).toHaveLength(1);
          expect(group.expressions[0][0]).toEqual(new StandardDice(6, 4, []));

          expect(group.modifiers).toBeInstanceOf(Map);
          expect(group.modifiers.size).toBe(1);
          expect(group.modifiers.has('drop-h')).toBe(true);

          const mod = group.modifiers.get('drop-h');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.end).toEqual('h');
          expect(mod.qty).toBe(2);

          expect(group.notation).toEqual(notation);
        });

        test('drop highest for `{3+4d6, 5d2*6d3}dh2`', () => {
          const notation = '{3+4d6, 5d2*6d3}dh2';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          const group = parsed[0];

          expect(group).toBeInstanceOf(RollGroup);

          expect(group.expressions).toBeInstanceOf(Array);
          expect(group.expressions).toHaveLength(2);

          expect(group.expressions[0]).toHaveLength(3);
          expect(group.expressions[0][0]).toBe(3);
          expect(group.expressions[0][1]).toEqual('+');
          expect(group.expressions[0][2]).toEqual(new StandardDice(6, 4, []));

          expect(group.expressions[1]).toHaveLength(3);
          expect(group.expressions[1][0]).toEqual(new StandardDice(2, 5, []));
          expect(group.expressions[1][1]).toEqual('*');
          expect(group.expressions[1][2]).toEqual(new StandardDice(3, 6, []));

          expect(group.modifiers).toBeInstanceOf(Map);
          expect(group.modifiers.size).toBe(1);
          expect(group.modifiers.has('drop-h')).toBe(true);

          const mod = group.modifiers.get('drop-h');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.end).toEqual('h');
          expect(mod.qty).toBe(2);

          expect(group.notation).toEqual(notation);
        });

        test('throws error without qty', () => {
          expect(() => {
            Parser.parse('{12dF.1}d');
          }).toThrow(SyntaxError);

          expect(() => {
            Parser.parse('{6d6}dl');
          }).toThrow(SyntaxError);

          expect(() => {
            Parser.parse('{12dF.1, 4d10}d');
          }).toThrow(SyntaxError);

          expect(() => {
            Parser.parse('{6d6, 2d10}dl');
          }).toThrow(SyntaxError);
        });
      });

      describe('Keep', () => {
        test('keep highest for `{19d23}k1`', () => {
          const notation = '{19d23}k1';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          const group = parsed[0];

          expect(group).toBeInstanceOf(RollGroup);

          expect(group.expressions).toBeInstanceOf(Array);
          expect(group.expressions).toHaveLength(1);
          expect(group.expressions[0]).toHaveLength(1);
          expect(group.expressions[0][0]).toEqual(new StandardDice(23, 19, []));

          expect(group.modifiers).toBeInstanceOf(Map);
          expect(group.modifiers.size).toBe(1);
          expect(group.modifiers.has('keep-h')).toBe(true);

          const mod = group.modifiers.get('keep-h');
          expect(mod).toBeInstanceOf(KeepModifier);
          expect(mod.end).toEqual('h');
          expect(mod.qty).toBe(1);

          expect(group.notation).toEqual('{19d23}kh1');
        });

        test('keep highest for `{19d23, 4d10+3}k1`', () => {
          const notation = '{19d23, 4d10+3}k1';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          const group = parsed[0];

          expect(group).toBeInstanceOf(RollGroup);

          expect(group.expressions).toBeInstanceOf(Array);
          expect(group.expressions).toHaveLength(2);

          expect(group.expressions[0]).toHaveLength(1);
          expect(group.expressions[0][0]).toEqual(new StandardDice(23, 19, []));

          expect(group.expressions[1]).toHaveLength(3);
          expect(group.expressions[1][0]).toEqual(new StandardDice(10, 4, []));
          expect(group.expressions[1][1]).toEqual('+');
          expect(group.expressions[1][2]).toBe(3);

          expect(group.modifiers).toBeInstanceOf(Map);
          expect(group.modifiers.size).toBe(1);
          expect(group.modifiers.has('keep-h')).toBe(true);

          const mod = group.modifiers.get('keep-h');
          expect(mod).toBeInstanceOf(KeepModifier);
          expect(mod.end).toEqual('h');
          expect(mod.qty).toBe(1);

          expect(group.notation).toEqual('{19d23, 4d10+3}kh1');
        });

        test('keep lowest for `{4d10}kl1`', () => {
          const notation = '{4d10}kl1';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          const group = parsed[0];

          expect(group).toBeInstanceOf(RollGroup);

          expect(group.expressions).toBeInstanceOf(Array);
          expect(group.expressions).toHaveLength(1);
          expect(group.expressions[0]).toHaveLength(1);
          expect(group.expressions[0][0]).toEqual(new StandardDice(10, 4, []));

          expect(group.modifiers).toBeInstanceOf(Map);
          expect(group.modifiers.size).toBe(1);
          expect(group.modifiers.has('keep-l')).toBe(true);

          const mod = group.modifiers.get('keep-l');
          expect(mod).toBeInstanceOf(KeepModifier);
          expect(mod.end).toEqual('l');
          expect(mod.qty).toBe(1);

          expect(group.notation).toEqual(notation);
        });

        test('keep lowest for `{4d10/4, 2dF.1}kl1`', () => {
          const notation = '{4d10/4, 2dF.1}kl1';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          const group = parsed[0];

          expect(group).toBeInstanceOf(RollGroup);

          expect(group.expressions).toBeInstanceOf(Array);
          expect(group.expressions).toHaveLength(2);

          expect(group.expressions[0]).toHaveLength(3);
          expect(group.expressions[0][0]).toEqual(new StandardDice(10, 4, []));
          expect(group.expressions[0][1]).toEqual('/');
          expect(group.expressions[0][2]).toBe(4);

          expect(group.expressions[1]).toHaveLength(1);
          expect(group.expressions[1][0]).toEqual(new FudgeDice(1, 2, []));

          expect(group.modifiers).toBeInstanceOf(Map);
          expect(group.modifiers.size).toBe(1);
          expect(group.modifiers.has('keep-l')).toBe(true);

          const mod = group.modifiers.get('keep-l');
          expect(mod).toBeInstanceOf(KeepModifier);
          expect(mod.end).toEqual('l');
          expect(mod.qty).toBe(1);

          expect(group.notation).toEqual(notation);
        });

        test('keep highest for `{7d%}k3`', () => {
          const notation = '{7d%}k3';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          const group = parsed[0];

          expect(group).toBeInstanceOf(RollGroup);

          expect(group.expressions).toBeInstanceOf(Array);
          expect(group.expressions).toHaveLength(1);
          expect(group.expressions[0]).toHaveLength(1);
          expect(group.expressions[0][0]).toEqual(new PercentileDice(7, []));

          expect(group.modifiers).toBeInstanceOf(Map);
          expect(group.modifiers.size).toBe(1);
          expect(group.modifiers.has('keep-h')).toBe(true);

          const mod = group.modifiers.get('keep-h');
          expect(mod).toBeInstanceOf(KeepModifier);
          expect(mod.end).toEqual('h');
          expect(mod.qty).toBe(3);

          expect(group.notation).toEqual('{7d%}kh3');
        });

        test('keep highest for `{7d%, 4*2d6, 7d10-2}k3`', () => {
          const notation = '{7d%, 4*2d6, 7d10-2}k3';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          const group = parsed[0];

          expect(group).toBeInstanceOf(RollGroup);

          expect(group.expressions).toBeInstanceOf(Array);
          expect(group.expressions).toHaveLength(3);

          expect(group.expressions[0]).toHaveLength(1);
          expect(group.expressions[0][0]).toEqual(new PercentileDice(7, []));

          expect(group.expressions[1]).toHaveLength(3);
          expect(group.expressions[1][0]).toBe(4);
          expect(group.expressions[1][1]).toEqual('*');
          expect(group.expressions[1][2]).toEqual(new StandardDice(6, 2, []));

          expect(group.expressions[2]).toHaveLength(3);
          expect(group.expressions[2][0]).toEqual(new StandardDice(10, 7, []));
          expect(group.expressions[2][1]).toEqual('-');
          expect(group.expressions[2][2]).toBe(2);

          expect(group.modifiers).toBeInstanceOf(Map);
          expect(group.modifiers.size).toBe(1);
          expect(group.modifiers.has('keep-h')).toBe(true);

          const mod = group.modifiers.get('keep-h');
          expect(mod).toBeInstanceOf(KeepModifier);
          expect(mod.end).toEqual('h');
          expect(mod.qty).toBe(3);

          expect(group.notation).toEqual('{7d%, 4*2d6, 7d10-2}kh3');
        });

        test('keep highest for `{4d6}kh2`', () => {
          const notation = '{4d6}kh2';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          const group = parsed[0];

          expect(group).toBeInstanceOf(RollGroup);

          expect(group.expressions).toBeInstanceOf(Array);
          expect(group.expressions).toHaveLength(1);
          expect(group.expressions[0]).toHaveLength(1);
          expect(group.expressions[0][0]).toEqual(new StandardDice(6, 4, []));

          expect(group.modifiers).toBeInstanceOf(Map);
          expect(group.modifiers.size).toBe(1);
          expect(group.modifiers.has('keep-h')).toBe(true);

          const mod = group.modifiers.get('keep-h');
          expect(mod).toBeInstanceOf(KeepModifier);
          expect(mod.end).toEqual('h');
          expect(mod.qty).toBe(2);

          expect(group.notation).toEqual(notation);
        });

        test('keep highest for `{3+4d6, 5d2*6d3}kh2`', () => {
          const notation = '{3+4d6, 5d2*6d3}kh2';
          const parsed = Parser.parse(notation);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          const group = parsed[0];

          expect(group).toBeInstanceOf(RollGroup);

          expect(group.expressions).toBeInstanceOf(Array);
          expect(group.expressions).toHaveLength(2);

          expect(group.expressions[0]).toHaveLength(3);
          expect(group.expressions[0][0]).toBe(3);
          expect(group.expressions[0][1]).toEqual('+');
          expect(group.expressions[0][2]).toEqual(new StandardDice(6, 4, []));

          expect(group.expressions[1]).toHaveLength(3);
          expect(group.expressions[1][0]).toEqual(new StandardDice(2, 5, []));
          expect(group.expressions[1][1]).toEqual('*');
          expect(group.expressions[1][2]).toEqual(new StandardDice(3, 6, []));

          expect(group.modifiers).toBeInstanceOf(Map);
          expect(group.modifiers.size).toBe(1);
          expect(group.modifiers.has('keep-h')).toBe(true);

          const mod = group.modifiers.get('keep-h');
          expect(mod).toBeInstanceOf(KeepModifier);
          expect(mod.end).toEqual('h');
          expect(mod.qty).toBe(2);

          expect(group.notation).toEqual(notation);
        });

        test('throws error without qty', () => {
          expect(() => {
            Parser.parse('{12dF.1}k');
          }).toThrow(SyntaxError);

          expect(() => {
            Parser.parse('{6d6}kl');
          }).toThrow(SyntaxError);

          expect(() => {
            Parser.parse('{12dF.1, 4d10}k');
          }).toThrow(SyntaxError);

          expect(() => {
            Parser.parse('{6d6, 2d10}kh');
          }).toThrow(SyntaxError);
        });
      });

      describe('Sort', () => {
        describe('single die', () => {
          test('sort for `{4d6}s`', () => {
            const notation = '{4d6}s';
            const parsed = Parser.parse(notation);

            expect(parsed).toBeInstanceOf(Array);
            expect(parsed).toHaveLength(1);

            const group = parsed[0];

            expect(group).toBeInstanceOf(RollGroup);

            expect(group.expressions).toBeInstanceOf(Array);
            expect(group.expressions).toHaveLength(1);
            expect(group.expressions[0]).toHaveLength(1);
            expect(group.expressions[0][0]).toEqual(new StandardDice(6, 4, []));

            expect(group.modifiers).toBeInstanceOf(Map);
            expect(group.modifiers.size).toBe(1);
            expect(group.modifiers.has('sorting')).toBe(true);

            const mod = group.modifiers.get('sorting');
            expect(mod).toBeInstanceOf(SortingModifier);
            expect(mod.direction).toEqual('a');

            expect(group.notation).toEqual('{4d6}sa');
          });

          test('sort for `{10d%}sa`', () => {
            const notation = '{10d%}sa';
            const parsed = Parser.parse(notation);

            expect(parsed).toBeInstanceOf(Array);
            expect(parsed).toHaveLength(1);

            const group = parsed[0];

            expect(group).toBeInstanceOf(RollGroup);

            expect(group.expressions).toBeInstanceOf(Array);
            expect(group.expressions).toHaveLength(1);
            expect(group.expressions[0]).toHaveLength(1);
            expect(group.expressions[0][0]).toEqual(new PercentileDice(10, []));

            expect(group.modifiers).toBeInstanceOf(Map);
            expect(group.modifiers.size).toBe(1);
            expect(group.modifiers.has('sorting')).toBe(true);

            const mod = group.modifiers.get('sorting');
            expect(mod).toBeInstanceOf(SortingModifier);
            expect(mod.direction).toEqual('a');

            expect(group.notation).toEqual(notation);
          });

          test('sort for `{4dF.2}sd`', () => {
            const notation = '{4dF.2}sd';
            const parsed = Parser.parse(notation);

            expect(parsed).toBeInstanceOf(Array);
            expect(parsed).toHaveLength(1);

            const group = parsed[0];

            expect(group).toBeInstanceOf(RollGroup);

            expect(group.expressions).toBeInstanceOf(Array);
            expect(group.expressions).toHaveLength(1);
            expect(group.expressions[0]).toHaveLength(1);
            expect(group.expressions[0][0]).toEqual(new FudgeDice(2, 4, []));

            expect(group.modifiers).toBeInstanceOf(Map);
            expect(group.modifiers.size).toBe(1);
            expect(group.modifiers.has('sorting')).toBe(true);

            const mod = group.modifiers.get('sorting');
            expect(mod).toBeInstanceOf(SortingModifier);
            expect(mod.direction).toEqual('d');

            expect(group.notation).toEqual(notation);
          });
        });

        describe('multiple die', () => {
          test('sort for `{4d6, 2d10}s`', () => {
            const notation = '{4d6, 2d10}s';
            const parsed = Parser.parse(notation);

            expect(parsed).toBeInstanceOf(Array);
            expect(parsed).toHaveLength(1);

            const group = parsed[0];

            expect(group).toBeInstanceOf(RollGroup);

            expect(group.expressions).toBeInstanceOf(Array);
            expect(group.expressions).toHaveLength(2);

            expect(group.expressions[0]).toHaveLength(1);
            expect(group.expressions[0][0]).toEqual(new StandardDice(6, 4, []));

            expect(group.expressions[1]).toHaveLength(1);
            expect(group.expressions[1][0]).toEqual(new StandardDice(10, 2, []));

            expect(group.modifiers).toBeInstanceOf(Map);
            expect(group.modifiers.size).toBe(1);
            expect(group.modifiers.has('sorting')).toBe(true);

            const mod = group.modifiers.get('sorting');
            expect(mod).toBeInstanceOf(SortingModifier);
            expect(mod.direction).toEqual('a');

            expect(group.notation).toEqual('{4d6, 2d10}sa');
          });

          test('sort for `{10d%, 1d20+5}sa`', () => {
            const notation = '{10d%, 1d20+5}sa';
            const parsed = Parser.parse(notation);

            expect(parsed).toBeInstanceOf(Array);
            expect(parsed).toHaveLength(1);

            const group = parsed[0];

            expect(group).toBeInstanceOf(RollGroup);

            expect(group.expressions).toBeInstanceOf(Array);
            expect(group.expressions).toHaveLength(2);

            expect(group.expressions[0]).toHaveLength(1);
            expect(group.expressions[0][0]).toEqual(new PercentileDice(10, []));

            expect(group.expressions[1]).toHaveLength(3);
            expect(group.expressions[1][0]).toEqual(new StandardDice(20, 1, []));
            expect(group.expressions[1][1]).toEqual('+');
            expect(group.expressions[1][2]).toBe(5);

            expect(group.modifiers).toBeInstanceOf(Map);
            expect(group.modifiers.size).toBe(1);
            expect(group.modifiers.has('sorting')).toBe(true);

            const mod = group.modifiers.get('sorting');
            expect(mod).toBeInstanceOf(SortingModifier);
            expect(mod.direction).toEqual('a');

            expect(group.notation).toEqual(notation);
          });

          test('sort for `{4dF.2*5, 10+3d6}sd`', () => {
            const notation = '{4dF.2*5, 10+3d6}sd';
            const parsed = Parser.parse(notation);

            expect(parsed).toBeInstanceOf(Array);
            expect(parsed).toHaveLength(1);

            const group = parsed[0];

            expect(group).toBeInstanceOf(RollGroup);

            expect(group.expressions).toBeInstanceOf(Array);
            expect(group.expressions).toHaveLength(2);

            expect(group.expressions[0]).toHaveLength(3);
            expect(group.expressions[0][0]).toEqual(new FudgeDice(2, 4, []));
            expect(group.expressions[0][1]).toEqual('*');
            expect(group.expressions[0][2]).toBe(5);

            expect(group.expressions[1]).toHaveLength(3);
            expect(group.expressions[1][0]).toBe(10);
            expect(group.expressions[1][1]).toEqual('+');
            expect(group.expressions[1][2]).toEqual(new StandardDice(6, 3, []));

            expect(group.modifiers).toBeInstanceOf(Map);
            expect(group.modifiers.size).toBe(1);
            expect(group.modifiers.has('sorting')).toBe(true);

            const mod = group.modifiers.get('sorting');
            expect(mod).toBeInstanceOf(SortingModifier);
            expect(mod.direction).toEqual('d');

            expect(group.notation).toEqual(notation);
          });
        });
      });
    });

    describe('Descriptions', () => {
      describe('Single', () => {
        test('{3d6} // fire', () => {
          const comment = 'fire';
          const parsed = Parser.parse(`{3d6} // ${comment}`);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          const group = parsed[0];

          expect(group.expressions).toBeInstanceOf(Array);
          expect(group.expressions).toHaveLength(1);
          expect(group.expressions[0]).toHaveLength(1);

          const expression = group.expressions[0][0];
          expect(expression).toBeInstanceOf(StandardDice);
          expect(expression.sides).toBe(6);
          expect(expression.qty).toBe(3);
          expect(expression.modifiers).toEqual(new Map());

          expect(group.description).toBeInstanceOf(Description);
          expect(group.description.text).toEqual(comment);
          expect(group.description.type).toEqual(Description.types.INLINE);
        });

        test('{3d6} # this is a comment', () => {
          const comment = 'this is a comment';
          const parsed = Parser.parse(`{3d6} # ${comment}`);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          const group = parsed[0];

          expect(group.expressions).toBeInstanceOf(Array);
          expect(group.expressions).toHaveLength(1);
          expect(group.expressions[0]).toHaveLength(1);

          const expression = group.expressions[0][0];
          expect(expression).toBeInstanceOf(StandardDice);
          expect(expression.sides).toBe(6);
          expect(expression.qty).toBe(3);
          expect(expression.modifiers).toEqual(new Map());

          expect(group.description).toBeInstanceOf(Description);
          expect(group.description.text).toEqual(comment);
          expect(group.description.type).toEqual(Description.types.INLINE);
        });
      });

      describe('multi-line', () => {
        test('{4dF} /* This is a multi-line comment */', () => {
          const comment = 'This is a multi-line comment';
          const parsed = Parser.parse(`{4dF} /* ${comment} */`);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          const group = parsed[0];

          expect(group.expressions).toBeInstanceOf(Array);
          expect(group.expressions).toHaveLength(1);
          expect(group.expressions[0]).toHaveLength(1);

          const expression = group.expressions[0][0];
          expect(expression).toBeInstanceOf(FudgeDice);
          expect(expression.sides).toEqual('F.2');
          expect(expression.qty).toBe(4);
          expect(expression.modifiers).toEqual(new Map());

          expect(group.description).toBeInstanceOf(Description);
          expect(group.description.text).toEqual(comment);
          expect(group.description.type).toEqual(Description.types.MULTILINE);
        });

        test('{12d%} [ A comment with a \n line break ]', () => {
          const comment = 'A comment with a \n line break';
          const parsed = Parser.parse(`{12d%} /* ${comment} */`);

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);

          const group = parsed[0];

          expect(group.expressions).toBeInstanceOf(Array);
          expect(group.expressions).toHaveLength(1);
          expect(group.expressions[0]).toHaveLength(1);

          const expression = group.expressions[0][0];
          expect(expression).toBeInstanceOf(PercentileDice);
          expect(expression.sides).toBe('%');
          expect(expression.qty).toBe(12);
          expect(expression.modifiers).toEqual(new Map());

          expect(group.description).toBeInstanceOf(Description);
          expect(group.description.text).toEqual(comment);
          expect(group.description.type).toEqual(Description.types.MULTILINE);
        });
      });
    });
  });
});
