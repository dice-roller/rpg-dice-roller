import Parser from "../../../src/parser/Parser";
import { Dice } from "../../../src/types/Interfaces/Dice";
import { FudgeDice, PercentileDice, StandardDice } from "../../../src/dice";
import * as parser from "../../../src/parser/grammars/grammar";

describe('Parsing Basic Dice', () => {
  test('returns correct response for `d6`', () => {
    const parsed = Parser.parse('d6');

    expect(parsed).toBeInstanceOf(Array);
    expect(parsed).toHaveLength(1);

    const item = parsed[0] as Dice;
    expect(item).toBeInstanceOf(StandardDice);
    expect(item.sides).toBe(6);
    expect(item.qty).toBe(1);
    expect(item.modifiers).toEqual(new Map());
  });

  test('returns correct response for `5d10`', () => {
    const parsed = Parser.parse('5d10');

    expect(parsed).toBeInstanceOf(Array);
    expect(parsed).toHaveLength(1);

    const item = parsed[0] as Dice;
    expect(item).toBeInstanceOf(StandardDice);
    expect(item.sides).toBe(10);
    expect(item.qty).toBe(5);
    expect(item.modifiers).toEqual(new Map());
  });

  test('returns correct response for `4d20`', () => {
    const parsed = Parser.parse('4d20');

    expect(parsed).toBeInstanceOf(Array);
    expect(parsed).toHaveLength(1);

    const item = parsed[0] as Dice;
    expect(item).toBeInstanceOf(StandardDice);
    expect(item.sides).toBe(20);
    expect(item.qty).toBe(4);
    expect(item.modifiers).toEqual(new Map());
  });

  test('returns correct response for `2d%`', () => {
    const parsed = Parser.parse('2d%');

    expect(parsed).toBeInstanceOf(Array);
    expect(parsed).toHaveLength(1);

    const item = parsed[0] as Dice;
    expect(item).toBeInstanceOf(PercentileDice);
    expect(item.sides).toBe('%');
    expect(item.qty).toBe(2);
    expect(item.modifiers).toEqual(new Map());
  });

  test('returns correct response for `4dF`', () => {
    const parsed = Parser.parse('4dF');

    expect(parsed).toBeInstanceOf(Array);
    expect(parsed).toHaveLength(1);

    const item = parsed[0] as Dice;
    expect(item).toBeInstanceOf(FudgeDice);
    expect(item.sides).toBe('F.2');
    expect(item.qty).toBe(4);
    expect(item.modifiers).toEqual(new Map());
  });

  test('returns correct response for `dF.2`', () => {
    const parsed = Parser.parse('dF.2');

    expect(parsed).toBeInstanceOf(Array);
    expect(parsed).toHaveLength(1);

    const item = parsed[0] as Dice;
    expect(item).toBeInstanceOf(FudgeDice);
    expect(item.sides).toBe('F.2');
    expect(item.qty).toBe(1);
    expect(item.modifiers).toEqual(new Map());
  });

  test('returns correct response for `10dF.1`', () => {
    const parsed = Parser.parse('10dF.1');

    expect(parsed).toBeInstanceOf(Array);
    expect(parsed).toHaveLength(1);

    const item = parsed[0] as Dice;
    expect(item).toBeInstanceOf(FudgeDice);
    expect(item.sides).toBe('F.1');
    expect(item.qty).toBe(10);
    expect(item.modifiers).toEqual(new Map());
  });

  test('throws error for invalid Fudge die sides', () => {
    expect(() => {
      Parser.parse('dF.3');
    }).toThrow(parser.PeggySyntaxError);

    expect(() => {
      Parser.parse('dF.4');
    }).toThrow(parser.PeggySyntaxError);

    expect(() => {
      Parser.parse('dF.0');
    }).toThrow(parser.PeggySyntaxError);

    expect(() => {
      Parser.parse('dF.67');
    }).toThrow(parser.PeggySyntaxError);

    expect(() => {
      Parser.parse('dF.foo');
    }).toThrow(parser.PeggySyntaxError);
  });

  test('sides cannot start with 0', () => {
    expect(() => {
      Parser.parse('d0');
    }).toThrow(parser.PeggySyntaxError);

    expect(() => {
      Parser.parse('d01');
    }).toThrow(parser.PeggySyntaxError);
  });

  test('qty cannot start with 0', () => {
    expect(() => {
      Parser.parse('0d6');
    }).toThrow(parser.PeggySyntaxError);

    expect(() => {
      Parser.parse('01d6');
    }).toThrow(parser.PeggySyntaxError);
  });
});
