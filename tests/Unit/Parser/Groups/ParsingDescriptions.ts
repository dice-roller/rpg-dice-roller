import Parser from "../../../../src/parser/Parser";
import RollGroup from "../../../../src/RollGroup";
import { Dice } from "../../../../src/types/Interfaces/Dice";
import { FudgeDice, PercentileDice, StandardDice } from "../../../../src/dice";
import Description from "../../../../src/Description";
import { DescriptionType } from "../../../../src/types/Enums/DescriptionType";

describe('Parsing Roll Groups Descriptions', () => {
  describe('Single', () => {
    test('{3d6} // fire', () => {
      const comment = 'fire';
      const parsed = Parser.parse(`{3d6} // ${comment}`);

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const group = parsed[0] as RollGroup;

      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.expressions).toHaveLength(1);
      expect(group.expressions[0]).toHaveLength(1);

      const expression = group.expressions[0]?.[0] as Dice;
      expect(expression).toBeInstanceOf(StandardDice);
      expect(expression.sides).toBe(6);
      expect(expression.qty).toBe(3);
      expect(expression.modifiers).toEqual(new Map());

      expect(group.description).toBeInstanceOf(Description);
      expect(group.description?.text).toEqual(comment);
      expect(group.description?.type).toEqual(DescriptionType.Inline);
    });

    test('{3d6} # this is a comment', () => {
      const comment = 'this is a comment';
      const parsed = Parser.parse(`{3d6} # ${comment}`);

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const group = parsed[0] as RollGroup;

      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.expressions).toHaveLength(1);
      expect(group.expressions[0]).toHaveLength(1);

      const expression = group.expressions[0]?.[0] as Dice;
      expect(expression).toBeInstanceOf(StandardDice);
      expect(expression.sides).toBe(6);
      expect(expression.qty).toBe(3);
      expect(expression.modifiers).toEqual(new Map());

      expect(group.description).toBeInstanceOf(Description);
      expect(group.description?.text).toEqual(comment);
      expect(group.description?.type).toEqual(DescriptionType.Inline);
    });
  });

  describe('multi-line', () => {
    test('{4dF} /* This is a multi-line comment */', () => {
      const comment = 'This is a multi-line comment';
      const parsed = Parser.parse(`{4dF} /* ${comment} */`);

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const group = parsed[0] as RollGroup;

      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.expressions).toHaveLength(1);
      expect(group.expressions[0]).toHaveLength(1);

      const expression = group.expressions[0]?.[0] as Dice;
      expect(expression).toBeInstanceOf(FudgeDice);
      expect(expression.sides).toEqual('F.2');
      expect(expression.qty).toBe(4);
      expect(expression.modifiers).toEqual(new Map());

      expect(group.description).toBeInstanceOf(Description);
      expect(group.description?.text).toEqual(comment);
      expect(group.description?.type).toEqual(DescriptionType.MultiLine);
    });

    test('{12d%} [ A comment with a \n line break ]', () => {
      const comment = 'A comment with a \n line break';
      const parsed = Parser.parse(`{12d%} /* ${comment} */`);

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const group = parsed[0] as RollGroup;

      expect(group.expressions).toBeInstanceOf(Array);
      expect(group.expressions).toHaveLength(1);
      expect(group.expressions[0]).toHaveLength(1);

      const expression = group.expressions[0]?.[0] as Dice;
      expect(expression).toBeInstanceOf(PercentileDice);
      expect(expression.sides).toBe('%');
      expect(expression.qty).toBe(12);
      expect(expression.modifiers).toEqual(new Map());

      expect(group.description).toBeInstanceOf(Description);
      expect(group.description?.text).toEqual(comment);
      expect(group.description?.type).toEqual(DescriptionType.MultiLine);
    });
  });
});
