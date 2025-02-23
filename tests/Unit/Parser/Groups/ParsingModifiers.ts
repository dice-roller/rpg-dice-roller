import Parser from "../../../../src/parser/Parser";
import RollGroup from "../../../../src/RollGroup";
import { FudgeDice, PercentileDice, StandardDice } from "../../../../src/dice";
import { DropModifier, KeepModifier, SortingModifier } from "../../../../src/modifiers";
import { PeggySyntaxError } from "../../../../src/parser/grammars/grammar";

describe('Parsing Roll Group Modifiers', () => {
  describe('Drop', () => {
    test('drop lowest for `{19d23}d1`', () => {
      const notation = '{19d23}d1';
      const parsed = Parser.parse(notation);

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const group = parsed[0] as RollGroup;

      expect(group).toBeInstanceOf(RollGroup);
      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.expressions).toHaveLength(1);
      expect(group.expressions[0]).toHaveLength(1);
      expect(group.expressions[0]?.[0]).toEqual(new StandardDice(23, 19, []));

      expect(group.modifiers).toBeInstanceOf(Map);
      expect(group.modifiers.size).toBe(1);
      expect(group.modifiers.has('drop-l')).toBe(true);

      const mod = group.modifiers.get('drop-l') as DropModifier;
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

      const group = parsed[0] as RollGroup;

      expect(group).toBeInstanceOf(RollGroup);
      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.expressions).toHaveLength(2);

      expect(group.expressions[0]).toHaveLength(1);
      expect(group.expressions[0]?.[0]).toEqual(new StandardDice(23, 19, []));

      expect(group.expressions[1]).toHaveLength(3);
      expect(group.expressions[1]?.[0]).toEqual(new StandardDice(10, 4, []));
      expect(group.expressions[1]?.[1]).toEqual('+');
      expect(group.expressions[1]?.[2]).toBe(3);

      expect(group.modifiers).toBeInstanceOf(Map);
      expect(group.modifiers.size).toBe(1);
      expect(group.modifiers.has('drop-l')).toBe(true);

      const mod = group.modifiers.get('drop-l') as DropModifier;
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

      const group = parsed[0] as RollGroup;

      expect(group).toBeInstanceOf(RollGroup);

      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.expressions).toHaveLength(1);
      expect(group.expressions[0]).toHaveLength(1);
      expect(group.expressions[0]?.[0]).toEqual(new StandardDice(10, 4, []));

      expect(group.modifiers).toBeInstanceOf(Map);
      expect(group.modifiers.size).toBe(1);
      expect(group.modifiers.has('drop-l')).toBe(true);

      const mod = group.modifiers.get('drop-l') as DropModifier;
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

      const group = parsed[0] as RollGroup;

      expect(group).toBeInstanceOf(RollGroup);

      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.expressions).toHaveLength(2);

      expect(group.expressions[0]).toHaveLength(3);
      expect(group.expressions[0]?.[0]).toEqual(new StandardDice(10, 4, []));
      expect(group.expressions[0]?.[1]).toEqual('/');
      expect(group.expressions[0]?.[2]).toBe(4);

      expect(group.expressions[1]).toHaveLength(1);
      expect(group.expressions[1]?.[0]).toEqual(new FudgeDice(1, 2, []));

      expect(group.modifiers).toBeInstanceOf(Map);
      expect(group.modifiers.size).toBe(1);
      expect(group.modifiers.has('drop-l')).toBe(true);

      const mod = group.modifiers.get('drop-l') as DropModifier;
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

      const group = parsed[0] as RollGroup;

      expect(group).toBeInstanceOf(RollGroup);

      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.expressions).toHaveLength(1);
      expect(group.expressions[0]).toHaveLength(1);
      expect(group.expressions[0]?.[0]).toEqual(new PercentileDice(7, []));

      expect(group.modifiers).toBeInstanceOf(Map);
      expect(group.modifiers.size).toBe(1);
      expect(group.modifiers.has('drop-l')).toBe(true);

      const mod = group.modifiers.get('drop-l') as DropModifier;
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

      const group = parsed[0] as RollGroup;

      expect(group).toBeInstanceOf(RollGroup);

      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.expressions).toHaveLength(3);

      expect(group.expressions[0]).toHaveLength(1);
      expect(group.expressions[0]?.[0]).toEqual(new PercentileDice(7, []));

      expect(group.expressions[1]).toHaveLength(3);
      expect(group.expressions[1]?.[0]).toBe(4);
      expect(group.expressions[1]?.[1]).toEqual('*');
      expect(group.expressions[1]?.[2]).toEqual(new StandardDice(6, 2, []));

      expect(group.expressions[2]).toHaveLength(3);
      expect(group.expressions[2]?.[0]).toEqual(new StandardDice(10, 7, []));
      expect(group.expressions[2]?.[1]).toEqual('-');
      expect(group.expressions[2]?.[2]).toBe(2);

      expect(group.modifiers).toBeInstanceOf(Map);
      expect(group.modifiers.size).toBe(1);
      expect(group.modifiers.has('drop-l')).toBe(true);

      const mod = group.modifiers.get('drop-l') as DropModifier;
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

      const group = parsed[0] as RollGroup;

      expect(group).toBeInstanceOf(RollGroup);

      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.expressions).toHaveLength(1);
      expect(group.expressions[0]).toHaveLength(1);
      expect(group.expressions[0]?.[0]).toEqual(new StandardDice(6, 4, []));

      expect(group.modifiers).toBeInstanceOf(Map);
      expect(group.modifiers.size).toBe(1);
      expect(group.modifiers.has('drop-h')).toBe(true);

      const mod = group.modifiers.get('drop-h') as DropModifier;
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

      const group = parsed[0] as RollGroup;

      expect(group).toBeInstanceOf(RollGroup);

      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.expressions).toHaveLength(2);

      expect(group.expressions[0]).toHaveLength(3);
      expect(group.expressions[0]?.[0]).toBe(3);
      expect(group.expressions[0]?.[1]).toEqual('+');
      expect(group.expressions[0]?.[2]).toEqual(new StandardDice(6, 4, []));

      expect(group.expressions[1]).toHaveLength(3);
      expect(group.expressions[1]?.[0]).toEqual(new StandardDice(2, 5, []));
      expect(group.expressions[1]?.[1]).toEqual('*');
      expect(group.expressions[1]?.[2]).toEqual(new StandardDice(3, 6, []));

      expect(group.modifiers).toBeInstanceOf(Map);
      expect(group.modifiers.size).toBe(1);
      expect(group.modifiers.has('drop-h')).toBe(true);

      const mod = group.modifiers.get('drop-h') as DropModifier;
      expect(mod).toBeInstanceOf(DropModifier);
      expect(mod.end).toEqual('h');
      expect(mod.qty).toBe(2);

      expect(group.notation).toEqual(notation);
    });

    test('throws error without qty', () => {
      expect(() => {
        Parser.parse('{12dF.1}d');
      }).toThrow(PeggySyntaxError);

      expect(() => {
        Parser.parse('{6d6}dl');
      }).toThrow(PeggySyntaxError);

      expect(() => {
        Parser.parse('{12dF.1, 4d10}d');
      }).toThrow(PeggySyntaxError);

      expect(() => {
        Parser.parse('{6d6, 2d10}dl');
      }).toThrow(PeggySyntaxError);
    });
  });

  describe('Keep', () => {
    test('keep highest for `{19d23}k1`', () => {
      const notation = '{19d23}k1';
      const parsed = Parser.parse(notation);

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const group = parsed[0] as RollGroup;

      expect(group).toBeInstanceOf(RollGroup);

      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.expressions).toHaveLength(1);
      expect(group.expressions[0]).toHaveLength(1);
      expect(group.expressions[0]?.[0]).toEqual(new StandardDice(23, 19, []));

      expect(group.modifiers).toBeInstanceOf(Map);
      expect(group.modifiers.size).toBe(1);
      expect(group.modifiers.has('keep-h')).toBe(true);

      const mod = group.modifiers.get('keep-h') as KeepModifier;
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

      const group = parsed[0] as RollGroup;

      expect(group).toBeInstanceOf(RollGroup);

      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.expressions).toHaveLength(2);

      expect(group.expressions[0]).toHaveLength(1);
      expect(group.expressions[0]?.[0]).toEqual(new StandardDice(23, 19, []));

      expect(group.expressions[1]).toHaveLength(3);
      expect(group.expressions[1]?.[0]).toEqual(new StandardDice(10, 4, []));
      expect(group.expressions[1]?.[1]).toEqual('+');
      expect(group.expressions[1]?.[2]).toBe(3);

      expect(group.modifiers).toBeInstanceOf(Map);
      expect(group.modifiers.size).toBe(1);
      expect(group.modifiers.has('keep-h')).toBe(true);

      const mod = group.modifiers.get('keep-h') as KeepModifier;
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

      const group = parsed[0] as RollGroup;

      expect(group).toBeInstanceOf(RollGroup);

      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.expressions).toHaveLength(1);
      expect(group.expressions[0]).toHaveLength(1);
      expect(group.expressions[0]?.[0]).toEqual(new StandardDice(10, 4, []));

      expect(group.modifiers).toBeInstanceOf(Map);
      expect(group.modifiers.size).toBe(1);
      expect(group.modifiers.has('keep-l')).toBe(true);

      const mod = group.modifiers.get('keep-l') as KeepModifier;
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

      const group = parsed[0] as RollGroup;

      expect(group).toBeInstanceOf(RollGroup);

      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.expressions).toHaveLength(2);

      expect(group.expressions[0]).toHaveLength(3);
      expect(group.expressions[0]?.[0]).toEqual(new StandardDice(10, 4, []));
      expect(group.expressions[0]?.[1]).toEqual('/');
      expect(group.expressions[0]?.[2]).toBe(4);

      expect(group.expressions[1]).toHaveLength(1);
      expect(group.expressions[1]?.[0]).toEqual(new FudgeDice(1, 2, []));

      expect(group.modifiers).toBeInstanceOf(Map);
      expect(group.modifiers.size).toBe(1);
      expect(group.modifiers.has('keep-l')).toBe(true);

      const mod = group.modifiers.get('keep-l') as KeepModifier;
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

      const group = parsed[0] as RollGroup;

      expect(group).toBeInstanceOf(RollGroup);

      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.expressions).toHaveLength(1);
      expect(group.expressions[0]).toHaveLength(1);
      expect(group.expressions[0]?.[0]).toEqual(new PercentileDice(7, []));

      expect(group.modifiers).toBeInstanceOf(Map);
      expect(group.modifiers.size).toBe(1);
      expect(group.modifiers.has('keep-h')).toBe(true);

      const mod = group.modifiers.get('keep-h') as KeepModifier;
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

      const group = parsed[0] as RollGroup;

      expect(group).toBeInstanceOf(RollGroup);

      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.expressions).toHaveLength(3);

      expect(group.expressions[0]).toHaveLength(1);
      expect(group.expressions[0]?.[0]).toEqual(new PercentileDice(7, []));

      expect(group.expressions[1]).toHaveLength(3);
      expect(group.expressions[1]?.[0]).toBe(4);
      expect(group.expressions[1]?.[1]).toEqual('*');
      expect(group.expressions[1]?.[2]).toEqual(new StandardDice(6, 2, []));

      expect(group.expressions[2]).toHaveLength(3);
      expect(group.expressions[2]?.[0]).toEqual(new StandardDice(10, 7, []));
      expect(group.expressions[2]?.[1]).toEqual('-');
      expect(group.expressions[2]?.[2]).toBe(2);

      expect(group.modifiers).toBeInstanceOf(Map);
      expect(group.modifiers.size).toBe(1);
      expect(group.modifiers.has('keep-h')).toBe(true);

      const mod = group.modifiers.get('keep-h') as KeepModifier;
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

      const group = parsed[0] as RollGroup;

      expect(group).toBeInstanceOf(RollGroup);

      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.expressions).toHaveLength(1);
      expect(group.expressions[0]).toHaveLength(1);
      expect(group.expressions[0]?.[0]).toEqual(new StandardDice(6, 4, []));

      expect(group.modifiers).toBeInstanceOf(Map);
      expect(group.modifiers.size).toBe(1);
      expect(group.modifiers.has('keep-h')).toBe(true);

      const mod = group.modifiers.get('keep-h') as KeepModifier;
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

      const group = parsed[0] as RollGroup;

      expect(group).toBeInstanceOf(RollGroup);

      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.expressions).toHaveLength(2);

      expect(group.expressions[0]).toHaveLength(3);
      expect(group.expressions[0]?.[0]).toBe(3);
      expect(group.expressions[0]?.[1]).toEqual('+');
      expect(group.expressions[0]?.[2]).toEqual(new StandardDice(6, 4, []));

      expect(group.expressions[1]).toHaveLength(3);
      expect(group.expressions[1]?.[0]).toEqual(new StandardDice(2, 5, []));
      expect(group.expressions[1]?.[1]).toEqual('*');
      expect(group.expressions[1]?.[2]).toEqual(new StandardDice(3, 6, []));

      expect(group.modifiers).toBeInstanceOf(Map);
      expect(group.modifiers.size).toBe(1);
      expect(group.modifiers.has('keep-h')).toBe(true);

      const mod = group.modifiers.get('keep-h') as KeepModifier;
      expect(mod).toBeInstanceOf(KeepModifier);
      expect(mod.end).toEqual('h');
      expect(mod.qty).toBe(2);

      expect(group.notation).toEqual(notation);
    });

    test('throws error without qty', () => {
      expect(() => {
        Parser.parse('{12dF.1}k');
      }).toThrow(PeggySyntaxError);

      expect(() => {
        Parser.parse('{6d6}kl');
      }).toThrow(PeggySyntaxError);

      expect(() => {
        Parser.parse('{12dF.1, 4d10}k');
      }).toThrow(PeggySyntaxError);

      expect(() => {
        Parser.parse('{6d6, 2d10}kh');
      }).toThrow(PeggySyntaxError);
    });
  });

  describe('Sort', () => {
    describe('single die', () => {
      test('sort for `{4d6}s`', () => {
        const notation = '{4d6}s';
        const parsed = Parser.parse(notation);

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);

        const group = parsed[0] as RollGroup;

        expect(group).toBeInstanceOf(RollGroup);

        expect(group.expressions).toBeInstanceOf(Array);
        expect(group.expressions).toHaveLength(1);
        expect(group.expressions[0]).toHaveLength(1);
        expect(group.expressions[0]?.[0]).toEqual(new StandardDice(6, 4, []));

        expect(group.modifiers).toBeInstanceOf(Map);
        expect(group.modifiers.size).toBe(1);
        expect(group.modifiers.has('sorting')).toBe(true);

        const mod = group.modifiers.get('sorting') as SortingModifier;
        expect(mod).toBeInstanceOf(SortingModifier);
        expect(mod.direction).toEqual('a');

        expect(group.notation).toEqual('{4d6}sa');
      });

      test('sort for `{10d%}sa`', () => {
        const notation = '{10d%}sa';
        const parsed = Parser.parse(notation);

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);

        const group = parsed[0] as RollGroup;

        expect(group).toBeInstanceOf(RollGroup);

        expect(group.expressions).toBeInstanceOf(Array);
        expect(group.expressions).toHaveLength(1);
        expect(group.expressions[0]).toHaveLength(1);
        expect(group.expressions[0]?.[0]).toEqual(new PercentileDice(10, []));

        expect(group.modifiers).toBeInstanceOf(Map);
        expect(group.modifiers.size).toBe(1);
        expect(group.modifiers.has('sorting')).toBe(true);

        const mod = group.modifiers.get('sorting') as SortingModifier;
        expect(mod).toBeInstanceOf(SortingModifier);
        expect(mod.direction).toEqual('a');

        expect(group.notation).toEqual(notation);
      });

      test('sort for `{4dF.2}sd`', () => {
        const notation = '{4dF.2}sd';
        const parsed = Parser.parse(notation);

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);

        const group = parsed[0] as RollGroup;

        expect(group).toBeInstanceOf(RollGroup);

        expect(group.expressions).toBeInstanceOf(Array);
        expect(group.expressions).toHaveLength(1);
        expect(group.expressions[0]).toHaveLength(1);
        expect(group.expressions[0]?.[0]).toEqual(new FudgeDice(2, 4, []));

        expect(group.modifiers).toBeInstanceOf(Map);
        expect(group.modifiers.size).toBe(1);
        expect(group.modifiers.has('sorting')).toBe(true);

        const mod = group.modifiers.get('sorting') as SortingModifier;
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

        const group = parsed[0] as RollGroup;

        expect(group).toBeInstanceOf(RollGroup);

        expect(group.expressions).toBeInstanceOf(Array);
        expect(group.expressions).toHaveLength(2);

        expect(group.expressions[0]).toHaveLength(1);
        expect(group.expressions[0]?.[0]).toEqual(new StandardDice(6, 4, []));

        expect(group.expressions[1]).toHaveLength(1);
        expect(group.expressions[1]?.[0]).toEqual(new StandardDice(10, 2, []));

        expect(group.modifiers).toBeInstanceOf(Map);
        expect(group.modifiers.size).toBe(1);
        expect(group.modifiers.has('sorting')).toBe(true);

        const mod = group.modifiers.get('sorting') as SortingModifier;
        expect(mod).toBeInstanceOf(SortingModifier);
        expect(mod.direction).toEqual('a');

        expect(group.notation).toEqual('{4d6, 2d10}sa');
      });

      test('sort for `{10d%, 1d20+5}sa`', () => {
        const notation = '{10d%, 1d20+5}sa';
        const parsed = Parser.parse(notation);

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);

        const group = parsed[0] as RollGroup;

        expect(group).toBeInstanceOf(RollGroup);

        expect(group.expressions).toBeInstanceOf(Array);
        expect(group.expressions).toHaveLength(2);

        expect(group.expressions[0]).toHaveLength(1);
        expect(group.expressions[0]?.[0]).toEqual(new PercentileDice(10, []));

        expect(group.expressions[1]).toHaveLength(3);
        expect(group.expressions[1]?.[0]).toEqual(new StandardDice(20, 1, []));
        expect(group.expressions[1]?.[1]).toEqual('+');
        expect(group.expressions[1]?.[2]).toBe(5);

        expect(group.modifiers).toBeInstanceOf(Map);
        expect(group.modifiers.size).toBe(1);
        expect(group.modifiers.has('sorting')).toBe(true);

        const mod = group.modifiers.get('sorting') as SortingModifier;
        expect(mod).toBeInstanceOf(SortingModifier);
        expect(mod.direction).toEqual('a');

        expect(group.notation).toEqual(notation);
      });

      test('sort for `{4dF.2*5, 10+3d6}sd`', () => {
        const notation = '{4dF.2*5, 10+3d6}sd';
        const parsed = Parser.parse(notation);

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);

        const group = parsed[0] as RollGroup;

        expect(group).toBeInstanceOf(RollGroup);

        expect(group.expressions).toBeInstanceOf(Array);
        expect(group.expressions).toHaveLength(2);

        expect(group.expressions[0]).toHaveLength(3);
        expect(group.expressions[0]?.[0]).toEqual(new FudgeDice(2, 4, []));
        expect(group.expressions[0]?.[1]).toEqual('*');
        expect(group.expressions[0]?.[2]).toBe(5);

        expect(group.expressions[1]).toHaveLength(3);
        expect(group.expressions[1]?.[0]).toBe(10);
        expect(group.expressions[1]?.[1]).toEqual('+');
        expect(group.expressions[1]?.[2]).toEqual(new StandardDice(6, 3, []));

        expect(group.modifiers).toBeInstanceOf(Map);
        expect(group.modifiers.size).toBe(1);
        expect(group.modifiers.has('sorting')).toBe(true);

        const mod = group.modifiers.get('sorting') as SortingModifier;
        expect(mod).toBeInstanceOf(SortingModifier);
        expect(mod.direction).toEqual('d');

        expect(group.notation).toEqual(notation);
      });
    });
  });
});
