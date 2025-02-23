import { Dice } from "../../../../src/types/Interfaces/Dice";
import { StandardDice } from "../../../../src/dice";
import Parser from "../../../../src/parser/Parser";
import RollGroup from "../../../../src/RollGroup";
import { PeggySyntaxError } from "../../../../src/parser/grammars/grammar";

describe('Parsing Roll Groups Basic', () => {
  let dice: Dice[];

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

    const group = parsed[0] as RollGroup;

    expect(group).toBeInstanceOf(RollGroup);
    expect(group.expressions).toBeInstanceOf(Array);
    expect(group.expressions).toHaveLength(1);
    expect(group.expressions[0]).toHaveLength(1);
    expect(group.expressions[0]?.[0]).toEqual(dice[0]);

    expect(group.modifiers).toEqual(new Map());
    expect(group.notation).toEqual(notation);
  });

  test('can parse `{1d6+1d4}`', () => {
    const notation = '{1d6+1d4}';
    const parsed = Parser.parse(notation);

    expect(parsed).toBeInstanceOf(Array);
    expect(parsed).toHaveLength(1);

    const group = parsed[0] as RollGroup;

    expect(group).toBeInstanceOf(RollGroup);
    expect(group.expressions).toBeInstanceOf(Array);
    expect(group.expressions).toHaveLength(1);
    expect(group.expressions[0]).toHaveLength(3);
    expect(group.expressions[0]?.[0]).toEqual(dice[0]);
    expect(group.expressions[0]?.[1]).toEqual('+');
    expect(group.expressions[0]?.[2]).toEqual(dice[1]);

    expect(group.modifiers).toEqual(new Map());
    expect(group.notation).toEqual(notation);
  });

  test('can parse `{1d6, 1d4}`', () => {
    const notation = '{1d6, 1d4}';
    const parsed = Parser.parse(notation);

    expect(parsed).toBeInstanceOf(Array);
    expect(parsed).toHaveLength(1);

    const group = parsed[0] as RollGroup;

    expect(group).toBeInstanceOf(RollGroup);
    expect(group.expressions).toBeInstanceOf(Array);
    expect(group.expressions).toHaveLength(2);
    expect(group.expressions[0]).toHaveLength(1);
    expect(group.expressions[0]?.[0]).toEqual(dice[0]);
    expect(group.expressions[1]).toHaveLength(1);
    expect(group.expressions[1]?.[0]).toEqual(dice[1]);

    expect(group.modifiers).toEqual(new Map());
    expect(group.notation).toEqual(notation);
  });

  test('can parse `{1d6+4, 1d4/2d10}`', () => {
    const notation = '{1d6+4, 1d4/2d10}';
    const parsed = Parser.parse(notation);

    expect(parsed).toBeInstanceOf(Array);
    expect(parsed).toHaveLength(1);

    const group = parsed[0] as RollGroup;

    expect(parsed[0]).toBeInstanceOf(RollGroup);

    expect(group.expressions).toBeInstanceOf(Array);
    expect(group.expressions).toHaveLength(2);

    expect(group.expressions[0]).toHaveLength(3);
    expect(group.expressions[0]?.[0]).toEqual(dice[0]);
    expect(group.expressions[0]?.[1]).toEqual('+');
    expect(group.expressions[0]?.[2]).toBe(4);

    expect(group.expressions[1]).toHaveLength(3);
    expect(group.expressions[1]?.[0]).toEqual(dice[1]);
    expect(group.expressions[1]?.[1]).toEqual('/');
    expect(group.expressions[1]?.[2]).toEqual(dice[2]);

    expect(group.modifiers).toEqual(new Map());
    expect(group.notation).toEqual(notation);
  });

  test('can parse `{1}`', () => {
    const notation = '{1}';
    const parsed = Parser.parse(notation);

    expect(parsed).toBeInstanceOf(Array);
    expect(parsed).toHaveLength(1);

    const group = parsed[0] as RollGroup;

    expect(group).toBeInstanceOf(RollGroup);
    expect(group.expressions).toBeInstanceOf(Array);
    expect(group.expressions).toHaveLength(1);
    expect(group.expressions[0]).toHaveLength(1);
    expect(group.expressions[0]?.[0]).toBe(1);

    expect(group.modifiers).toEqual(new Map());
    expect(group.notation).toEqual(notation);
  });

  test('throws error on empty group', () => {
    expect(() => {
      Parser.parse('{}');
    }).toThrow(PeggySyntaxError);
  });
});
