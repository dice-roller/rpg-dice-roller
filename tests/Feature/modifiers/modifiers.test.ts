import { StandardDice } from '../../../src/dice';
import DiceRoll from '../../../src/DiceRoll';
import {
  DropModifier,
  ExplodeModifier,
  KeepModifier,
  ReRollModifier,
  UniqueModifier,
} from '../../../src/modifiers';
import RollResult from '../../../src/results/RollResult';
import { ResultCollection } from "../../../src/types/Interfaces/Results/ResultCollection";

describe('Modifiers', () => {
  test('does not duplicate drop modifier', () => {
    const notation = '3d6kh2dl1';
    const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
      .mockImplementationOnce(() => new RollResult(1))
      .mockImplementationOnce(() => new RollResult(4))
      .mockImplementationOnce(() => new RollResult(6));
    const roll = new DiceRoll(notation).rolls[0] as ResultCollection;
    const results = roll.rolls;

    expect(results).toBeInstanceOf(Array);
    expect(results).toHaveLength(3);

    expect(results[0]?.value).toBe(1);
    expect(results[0]?.useInTotal).toBe(false);
    expect(results[0]?.modifiers.size).toBe(1);
    expect([...results[0]?.modifiers ?? []][0]).toEqual('drop');

    expect(results[1]?.value).toBe(4);
    expect(results[1]?.useInTotal).toBe(true);
    expect(results[1]?.modifiers.size).toBe(0);

    expect(results[2]?.value).toBe(6);
    expect(results[2]?.useInTotal).toBe(true);
    expect(results[2]?.modifiers.size).toBe(0);

    // remove the spy
    spy.mockRestore();
  });

  test('drop and keep together does not drop too many', () => {
    const notation = '3d6kh2dl1';
    const spy = jest.spyOn(StandardDice.prototype, 'rollOnce')
      .mockImplementationOnce(() => new RollResult(5))
      .mockImplementationOnce(() => new RollResult(6))
      .mockImplementationOnce(() => new RollResult(5));
    const roll = new DiceRoll(notation).rolls[0] as ResultCollection;
    const results = roll.rolls;

    expect(results).toHaveLength(3);

    expect(results[0]?.value).toBe(5);
    expect(results[0]?.useInTotal).toBe(false);
    expect(results[0]?.modifiers.size).toBe(1);
    expect([...results[0]?.modifiers ?? []][0]).toEqual('drop');

    expect(results[1]?.value).toBe(6);
    expect(results[1]?.useInTotal).toBe(true);
    expect(results[1]?.modifiers.size).toBe(0);

    expect(results[2]?.value).toBe(5);
    expect(results[2]?.useInTotal).toBe(true);
    expect(results[2]?.modifiers.size).toBe(0);

    // remove the spy
    spy.mockRestore();
  });

  describe('Modifier orders', () => {
    const setOpenLegendOrder = () => {
      KeepModifier.order = 3;
      DropModifier.order = 4;
      ExplodeModifier.order = 5;
      ReRollModifier.order = 6;
      UniqueModifier.order = 7;
    };

    const resetOrder = () => {
      KeepModifier.order = 6;
      DropModifier.order = 7;
      ExplodeModifier.order = 3;
      ReRollModifier.order = 4;
      UniqueModifier.order = 5;
    };

    beforeEach(() => {
      resetOrder();
    });

    test('can set modifier orders from function', () => {
      setOpenLegendOrder();

      expect(KeepModifier.order).toBe(3);
      expect(DropModifier.order).toBe(4);
      expect(ExplodeModifier.order).toBe(5);
      expect(ReRollModifier.order).toBe(6);
      expect(UniqueModifier.order).toBe(7);
    });

    test('can reset modifier orders from function', () => {
      resetOrder();

      expect(KeepModifier.order).toBe(6);
      expect(DropModifier.order).toBe(7);
      expect(ExplodeModifier.order).toBe(3);
      expect(ReRollModifier.order).toBe(4);
      expect(UniqueModifier.order).toBe(5);
    });

    describe('changing execution order', () => {
      const notation = '8d4kh4!';

      beforeEach(() => {
        jest.spyOn(StandardDice.prototype, 'rollOnce')
          .mockImplementationOnce(() => new RollResult(3))
          .mockImplementationOnce(() => new RollResult(4))
          .mockImplementationOnce(() => new RollResult(2))
          .mockImplementationOnce(() => new RollResult(3))
          .mockImplementationOnce(() => new RollResult(2))
          .mockImplementationOnce(() => new RollResult(3))
          .mockImplementationOnce(() => new RollResult(3))
          .mockImplementationOnce(() => new RollResult(3))
          .mockImplementationOnce(() => new RollResult(2));
      });

      test('default order executes explode before keep', () => {
        const roll = new DiceRoll(notation);

        expect(roll.total).toBe(13);
        expect(roll.rolls).toHaveLength(1);

        const { rolls } = roll.rolls[0] as ResultCollection;
        expect(rolls).toHaveLength(9);

        expect(rolls[0]?.calculationValue).toBe(3);
        expect(rolls[0]?.value).toBe(3);
        expect(rolls[0]?.useInTotal).toBe(false);
        expect(rolls[0]?.modifiers).toEqual(new Set(['drop']));

        expect(rolls[1]?.calculationValue).toBe(4);
        expect(rolls[1]?.value).toBe(4);
        expect(rolls[1]?.useInTotal).toBe(true);
        expect(rolls[1]?.modifiers).toEqual(new Set(['explode']));

        expect(rolls[2]?.calculationValue).toBe(2);
        expect(rolls[2]?.value).toBe(2);
        expect(rolls[2]?.useInTotal).toBe(false);
        expect(rolls[2]?.modifiers).toEqual(new Set(['drop']));

        expect(rolls[3]?.calculationValue).toBe(2);
        expect(rolls[3]?.value).toBe(2);
        expect(rolls[3]?.useInTotal).toBe(false);
        expect(rolls[3]?.modifiers).toEqual(new Set(['drop']));

        expect(rolls[4]?.calculationValue).toBe(3);
        expect(rolls[4]?.value).toBe(3);
        expect(rolls[4]?.useInTotal).toBe(false);
        expect(rolls[4]?.modifiers).toEqual(new Set(['drop']));

        expect(rolls[5]?.calculationValue).toBe(2);
        expect(rolls[5]?.value).toBe(2);
        expect(rolls[5]?.useInTotal).toBe(false);
        expect(rolls[5]?.modifiers).toEqual(new Set(['drop']));

        expect(rolls[6]?.calculationValue).toBe(3);
        expect(rolls[6]?.value).toBe(3);
        expect(rolls[6]?.useInTotal).toBe(true);
        expect(rolls[6]?.modifiers).toEqual(new Set());

        expect(rolls[7]?.calculationValue).toBe(3);
        expect(rolls[7]?.value).toBe(3);
        expect(rolls[7]?.useInTotal).toBe(true);
        expect(rolls[7]?.modifiers).toEqual(new Set());

        expect(rolls[8]?.calculationValue).toBe(3);
        expect(rolls[8]?.value).toBe(3);
        expect(rolls[8]?.useInTotal).toBe(true);
        expect(rolls[8]?.modifiers).toEqual(new Set());
      });

      test('can change order so keep executes before explode', () => {
        setOpenLegendOrder();

        const roll = new DiceRoll(notation);

        expect(roll.total).toBe(15);
        expect(roll.rolls).toHaveLength(1);

        const { rolls } = roll.rolls[0] as ResultCollection;
        expect(rolls).toHaveLength(9);

        expect(rolls[0]?.calculationValue).toBe(3);
        expect(rolls[0]?.value).toBe(3);
        expect(rolls[0]?.useInTotal).toBe(false);
        expect(rolls[0]?.modifiers).toEqual(new Set(['drop']));

        expect(rolls[1]?.calculationValue).toBe(4);
        expect(rolls[1]?.value).toBe(4);
        expect(rolls[1]?.useInTotal).toBe(true);
        expect(rolls[1]?.modifiers).toEqual(new Set(['explode']));

        expect(rolls[2]?.calculationValue).toBe(2);
        expect(rolls[2]?.value).toBe(2);
        expect(rolls[2]?.useInTotal).toBe(true);
        expect(rolls[2]?.modifiers).toEqual(new Set());

        expect(rolls[3]?.calculationValue).toBe(2);
        expect(rolls[3]?.value).toBe(2);
        expect(rolls[3]?.useInTotal).toBe(false);
        expect(rolls[3]?.modifiers).toEqual(new Set(['drop']));

        expect(rolls[4]?.calculationValue).toBe(3);
        expect(rolls[4]?.value).toBe(3);
        expect(rolls[4]?.useInTotal).toBe(false);
        expect(rolls[4]?.modifiers).toEqual(new Set(['drop']));

        expect(rolls[5]?.calculationValue).toBe(2);
        expect(rolls[5]?.value).toBe(2);
        expect(rolls[5]?.useInTotal).toBe(false);
        expect(rolls[5]?.modifiers).toEqual(new Set(['drop']));

        expect(rolls[6]?.calculationValue).toBe(3);
        expect(rolls[6]?.value).toBe(3);
        expect(rolls[6]?.useInTotal).toBe(true);
        expect(rolls[6]?.modifiers).toEqual(new Set());

        expect(rolls[7]?.calculationValue).toBe(3);
        expect(rolls[7]?.value).toBe(3);
        expect(rolls[7]?.useInTotal).toBe(true);
        expect(rolls[7]?.modifiers).toEqual(new Set());

        expect(rolls[8]?.calculationValue).toBe(3);
        expect(rolls[8]?.value).toBe(3);
        expect(rolls[8]?.useInTotal).toBe(true);
        expect(rolls[8]?.modifiers).toEqual(new Set());
      });
    });
  });
});
