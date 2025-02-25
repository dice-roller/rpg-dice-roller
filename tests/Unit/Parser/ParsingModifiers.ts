import Parser from "../../../src/parser/Parser";
import { Dice } from "../../../src/types/Interfaces/Dice";
import { FudgeDice, PercentileDice, StandardDice } from "../../../src/dice";
import { Modifier } from "../../../src/types/Interfaces/Modifiers/Modifier";
import {
  CriticalFailureModifier,
  CriticalSuccessModifier,
  DropModifier,
  ExplodeModifier,
  KeepModifier, MaxModifier, MinModifier, ReRollModifier, SortingModifier, TargetModifier, UniqueModifier
} from "../../../src/modifiers";
import { ComparisonOperator } from "../../../src/types/Enums/ComparisonOperator";
import * as parser from "../../../src/parser/grammars/grammar";
import RollResults from "../../../src/results/RollResults";
import minModifier from "../../../src/modifiers/MinModifier";
import { ModelType } from "../../../src/types/Enums/ModelType";

describe('Parsing Modifiers', () => {
  describe('Critical failure', () => {
    test('failure for `1d8cf<4`', () => {
      const parsed = Parser.parse('1d8cf<4');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(8);
      expect(item.qty).toEqual(1);
      expect(item.modifiers?.has('critical-failure')).toBe(true);

      const mod = item.modifiers?.get('critical-failure') as Modifier;
      expect(mod).toBeInstanceOf(CriticalFailureModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        comparePoint: expect.objectContaining({
          operator: ComparisonOperator.LessThan,
          value: 4,
        }),
      }));
    });

    test('failure for `3dF.1cf>8`', () => {
      const parsed = Parser.parse('3dF.1cf>8');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(FudgeDice);
      expect(item.sides).toEqual('F.1');
      expect(item.qty).toEqual(3);
      expect(item.modifiers?.has('critical-failure')).toBe(true);

      const mod = item.modifiers?.get('critical-failure') as Modifier;
      expect(mod).toBeInstanceOf(CriticalFailureModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        comparePoint: expect.objectContaining({
          operator: ComparisonOperator.GreaterThan,
          value: 8,
        }),
      }));
    });
  });

  describe('Critical success', () => {
    test('success for `8d45cs=12`', () => {
      const parsed = Parser.parse('8d45cs=12');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(45);
      expect(item.qty).toEqual(8);
      expect(item.modifiers?.has('critical-success')).toBe(true);

      const mod = item.modifiers?.get('critical-success') as Modifier;
      expect(mod).toBeInstanceOf(CriticalSuccessModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        comparePoint: expect.objectContaining({
          operator: '=',
          value: 12,
        }),
      }));
    });

    test('success for `36d152cs!=45`', () => {
      const parsed = Parser.parse('36d152cs!=45');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(152);
      expect(item.qty).toEqual(36);
      expect(item.modifiers?.has('critical-success')).toBe(true);

      const mod = item.modifiers?.get('critical-success') as Modifier;
      expect(mod).toBeInstanceOf(CriticalSuccessModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        comparePoint: expect.objectContaining({
          operator: '!=',
          value: 45,
        }),
      }));
    });

    test('success for `3d50cs<>365`', () => {
      const parsed = Parser.parse('3d50cs<>365');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(50);
      expect(item.qty).toEqual(3);
      expect(item.modifiers?.has('critical-success')).toBe(true);

      const mod = item.modifiers?.get('critical-success') as Modifier;
      expect(mod).toBeInstanceOf(CriticalSuccessModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        comparePoint: expect.objectContaining({
          operator: '<>',
          value: 365,
        }),
      }));
    });
  });

  describe('Drop', () => {
    test('drop lowest for `19d23d1`', () => {
      const parsed = Parser.parse('19d23d1');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(23);
      expect(item.qty).toEqual(19);
      expect(item.modifiers?.has('drop-l')).toBe(true);

      const mod = item.modifiers?.get('drop-l') as Modifier;
      expect(mod).toBeInstanceOf(DropModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        end: 'l',
        qty: 1,
      }));
    });

    test('drop lowest for `4d10dl1`', () => {
      const parsed = Parser.parse('4d10dl1');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(10);
      expect(item.qty).toEqual(4);
      expect(item.modifiers?.has('drop-l')).toBe(true);

      const mod = item.modifiers?.get('drop-l') as Modifier;
      expect(mod).toBeInstanceOf(DropModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        end: 'l',
        qty: 1,
      }));
    });

    test('drop lowest for `7d%d3`', () => {
      const parsed = Parser.parse('7d%d3');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(PercentileDice);
      expect(item.sides).toEqual('%');
      expect(item.qty).toEqual(7);
      expect(item.modifiers?.has('drop-l')).toBe(true);

      const mod = item.modifiers?.get('drop-l') as Modifier;
      expect(mod).toBeInstanceOf(DropModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        end: 'l',
        qty: 3,
      }));
    });

    test('drop highest for `4d6dh2`', () => {
      const parsed = Parser.parse('4d6dh2');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(6);
      expect(item.qty).toEqual(4);
      expect(item.modifiers?.has('drop-h')).toBe(true);

      const mod = item.modifiers?.get('drop-h') as Modifier;
      expect(mod).toBeInstanceOf(DropModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        end: 'h',
        qty: 2,
      }));
    });

    test('throws error without qty', () => {
      expect(() => {
        Parser.parse('12dF.1d');
      }).toThrow(parser.PeggySyntaxError);

      expect(() => {
        Parser.parse('6d6dl');
      }).toThrow(parser.PeggySyntaxError);
    });
  });

  describe('Explode', () => {
    test('explode `d6!`', () => {
      const parsed = Parser.parse('d6!');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(6);
      expect(item.qty).toEqual(1);
      expect(item.modifiers?.has('explode')).toBe(true);

      const mod = item.modifiers?.get('explode') as Modifier;
      expect(mod).toBeInstanceOf(ExplodeModifier);

      mod.run(new RollResults(), parsed[0] as Dice);

      expect(mod.toJSON()).toEqual(expect.objectContaining({
        comparePoint: expect.objectContaining({
          operator: '=',
          value: 6,
        }),
        compound: false,
        penetrate: false,
      }));
    });

    test('compound `2d7!!`', () => {
      const parsed = Parser.parse('2d7!!');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(7);
      expect(item.qty).toEqual(2);
      expect(item.modifiers?.has('explode')).toBe(true);

      const mod = item.modifiers?.get('explode') as Modifier;
      expect(mod).toBeInstanceOf(ExplodeModifier);

      mod.run(new RollResults(), parsed[0] as Dice);

      expect(mod.toJSON()).toEqual(expect.objectContaining({
        comparePoint: expect.objectContaining({
          operator: '=',
          value: 7,
        }),
        compound: true,
        penetrate: false,
      }));
    });

    test('penetrate `5d%!p`', () => {
      const parsed = Parser.parse('5d%!p');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(PercentileDice);
      expect(item.sides).toEqual('%');
      expect(item.qty).toEqual(5);
      expect(item.modifiers?.has('explode')).toBe(true);

      const mod = item.modifiers?.get('explode') as Modifier;
      expect(mod).toBeInstanceOf(ExplodeModifier);

      mod.run(new RollResults(), parsed[0] as Dice);

      expect(mod.toJSON()).toEqual(expect.objectContaining({
        comparePoint: expect.objectContaining({
          operator: '=',
          value: 100,
        }),
        compound: false,
        penetrate: true,
      }));
    });

    test('compound penetrate `1dF!!p`', () => {
      const parsed = Parser.parse('1dF!!p');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(FudgeDice);
      expect(item.sides).toEqual('F.2');
      expect(item.qty).toEqual(1);
      expect(item.modifiers?.has('explode')).toBe(true);

      const mod = item.modifiers?.get('explode') as Modifier;
      expect(mod).toBeInstanceOf(ExplodeModifier);

      mod.run(new RollResults(), parsed[0] as Dice);

      expect(mod.toJSON()).toEqual(expect.objectContaining({
        comparePoint: expect.objectContaining({
          operator: '=',
          value: 1,
        }),
        compound: true,
        penetrate: true,
      }));
    });

    test('can explode with  compare point `4dF.2!>=0', () => {
      const parsed = Parser.parse('4dF.2!>=0');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(FudgeDice);
      expect(item.sides).toEqual('F.2');
      expect(item.qty).toEqual(4);
      expect(item.modifiers?.has('explode')).toBe(true);

      const mod = item.modifiers?.get('explode') as Modifier;
      expect(mod).toBeInstanceOf(ExplodeModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        comparePoint: expect.objectContaining({
          operator: '>=',
          value: 0,
        }),
        compound: false,
        penetrate: false,
      }));
    });

    test('can explode with  compare point `dF.1!!<=1', () => {
      const parsed = Parser.parse('dF.1!!<=1');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(FudgeDice);
      expect(item.sides).toEqual('F.1');
      expect(item.qty).toEqual(1);
      expect(item.modifiers?.has('explode')).toBe(true);

      const mod = item.modifiers?.get('explode') as Modifier;
      expect(mod).toBeInstanceOf(ExplodeModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        comparePoint: expect.objectContaining({
          operator: '<=',
          value: 1,
        }),
        compound: true,
        penetrate: false,
      }));
    });

    test('can explode with  compare point `4d%!<>45', () => {
      const parsed = Parser.parse('4d%!<>45');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual('%');
      expect(item.qty).toEqual(4);
      expect(item.modifiers?.has('explode')).toBe(true);

      const mod = item.modifiers?.get('explode') as Modifier;
      expect(mod).toBeInstanceOf(ExplodeModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        comparePoint: expect.objectContaining({
          operator: '<>',
          value: 45,
        }),
        compound: false,
        penetrate: false,
      }));
    });

    test('can explode with  compare point `360d%!!p<50', () => {
      const parsed = Parser.parse('360d%!!p<50');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(PercentileDice);
      expect(item.sides).toEqual('%');
      expect(item.qty).toEqual(360);
      expect(item.modifiers?.has('explode')).toBe(true);

      const mod = item.modifiers?.get('explode') as Modifier;
      expect(mod).toBeInstanceOf(ExplodeModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        comparePoint: expect.objectContaining({
          operator: '<',
          value: 50,
        }),
        compound: true,
        penetrate: true,
      }));
    });
  });

  describe('Keep', () => {
    test('keep highest for `d40601k1`', () => {
      const parsed = Parser.parse('d40601k1');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(40601);
      expect(item.qty).toEqual(1);
      expect(item.modifiers?.has('keep-h')).toBe(true);

      const mod = item.modifiers?.get('keep-h') as KeepModifier;
      expect(mod).toBeInstanceOf(KeepModifier);
      expect(mod.end).toBe('h');
      expect(mod.qty).toBe(1);
    });

    test('keep highest for `897d2kh1`', () => {
      const parsed = Parser.parse('897d2kh1');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(2);
      expect(item.qty).toEqual(897);
      expect(item.modifiers?.has('keep-h')).toBe(true);

      const mod = item.modifiers?.get('keep-h') as KeepModifier;
      expect(mod).toBeInstanceOf(KeepModifier);
      expect(mod.end).toBe('h');
      expect(mod.qty).toBe(1);
    });

    test('keep highest for `5dFk4`', () => {
      const parsed = Parser.parse('5dFk4');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual('F.2');
      expect(item.qty).toEqual(5);
      expect(item.modifiers?.has('keep-h')).toBe(true);

      const mod = item.modifiers?.get('keep-h') as KeepModifier;
      expect(mod).toBeInstanceOf(KeepModifier);
      expect(mod.end).toBe('h');
      expect(mod.qty).toBe(4);
    });

    test('keep lowest for `10d%kl3`', () => {
      const parsed = Parser.parse('10d%kl3');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual('%');
      expect(item.qty).toEqual(10);
      expect(item.modifiers?.has('keep-l')).toBe(true);

      const mod = item.modifiers?.get('keep-l') as KeepModifier;
      expect(mod).toBeInstanceOf(KeepModifier);
      expect(mod.end).toBe('l');
      expect(mod.qty).toBe(3);
    });
  });

  describe('Max', () => {
    test('max for `2d6max3`', () => {
      const parsed = Parser.parse('2d6max3');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(6);
      expect(item.qty).toEqual(2);
      expect(item.modifiers?.has('max')).toBe(true);

      const mod = item.modifiers?.get('max') as MaxModifier;
      expect(mod).toBeInstanceOf(MaxModifier);
      expect(mod.max).toBe(3);
    });

    test('max for `4d20max-12`', () => {
      const parsed = Parser.parse('4d20max-12');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(20);
      expect(item.qty).toEqual(4);
      expect(item.modifiers?.has('max')).toBe(true);

      const mod = item.modifiers?.get('max') as MaxModifier;
      expect(mod).toBeInstanceOf(MaxModifier);
      expect(mod.max).toBe(-12);
    });

    test('max for `6d%max50.45`', () => {
      const parsed = Parser.parse('6d%max50.45');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual('%');
      expect(item.qty).toEqual(6);
      expect(item.modifiers?.has('max')).toBe(true);

      const mod = item.modifiers?.get('max') as MaxModifier;
      expect(mod).toBeInstanceOf(MaxModifier);
      expect(mod.max).toBe(50.45);
    });

    test('throws error if no max value', () => {
      expect(() => {
        Parser.parse('d6max');
      }).toThrow(parser.PeggySyntaxError);
    });

    test('throws error if invalid max value', () => {
      expect(() => {
        Parser.parse('d6maxfoo');
      }).toThrow(parser.PeggySyntaxError);

      expect(() => {
        Parser.parse('d6maxd6');
      }).toThrow(parser.PeggySyntaxError);
    });
  });

  describe('Min', () => {
    test('min for `2d6min3`', () => {
      const parsed = Parser.parse('2d6min3');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(6);
      expect(item.qty).toEqual(2);
      expect(item.modifiers?.has('min')).toBe(true);

      const mod = item.modifiers?.get('min') as MinModifier;
      expect(mod).toBeInstanceOf(MinModifier);
      expect(mod.min).toBe(3);
    });

    test('min for `4d20min-12`', () => {
      const parsed = Parser.parse('4d20min-12');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(20);
      expect(item.qty).toEqual(4);
      expect(item.modifiers?.has('min')).toBe(true);

      const mod = item.modifiers?.get('min') as MinModifier;
      expect(mod).toBeInstanceOf(MinModifier);
      expect(mod.min).toBe(-12);
    });

    test('min for `6d%min50.45`', () => {
      const parsed = Parser.parse('6d%min50.45');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual('%');
      expect(item.qty).toEqual(6);
      expect(item.modifiers?.has('min')).toBe(true);

      const mod = item.modifiers?.get('min') as MinModifier;
      expect(mod).toBeInstanceOf(MinModifier);
      expect(mod.min).toBe(50.45);
    });

    test('throws error if no min value', () => {
      expect(() => {
        Parser.parse('d6min');
      }).toThrow(parser.PeggySyntaxError);
    });

    test('throws error if invalid min value', () => {
      expect(() => {
        Parser.parse('d6minfoo');
      }).toThrow(parser.PeggySyntaxError);

      expect(() => {
        Parser.parse('d6mind6');
      }).toThrow(parser.PeggySyntaxError);
    });
  });

  describe('Re-roll', () => {
    test('re-roll for `5d10r`', () => {
      const parsed = Parser.parse('5d10r');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(10);
      expect(item.qty).toEqual(5);
      expect(item.modifiers?.has('re-roll')).toBe(true);

      const mod = item.modifiers?.get('re-roll') as Modifier;
      expect(mod).toBeInstanceOf(ReRollModifier);

      mod.run(new RollResults(), parsed[0] as Dice);

      expect(mod.toJSON()).toEqual(expect.objectContaining({
        once: false,
        comparePoint: expect.objectContaining({
          operator: '=',
          value: 1,
        }),
      }));
    });

    test('re-roll for `12dFr`', () => {
      const parsed = Parser.parse('12dFr');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(FudgeDice);
      expect(item.sides).toEqual('F.2');
      expect(item.qty).toEqual(12);
      expect(item.modifiers?.has('re-roll')).toBe(true);

      const mod = item.modifiers?.get('re-roll') as Modifier;
      expect(mod).toBeInstanceOf(ReRollModifier);

      mod.run(new RollResults(), parsed[0] as Dice);

      expect(mod.toJSON()).toEqual(expect.objectContaining({
        once: false,
        comparePoint: expect.objectContaining({
          operator: '=',
          value: -1,
        }),
      }));
    });

    test('accepts compare point', () => {
      const parsed = Parser.parse('2d%r>80');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual('%');
      expect(item.qty).toEqual(2);
      expect(item.modifiers?.has('re-roll')).toBe(true);

      const mod = item.modifiers?.get('re-roll') as Modifier;
      expect(mod).toBeInstanceOf(ReRollModifier);

      mod.run(new RollResults(), parsed[0] as Dice);

      expect(mod.toJSON()).toEqual(expect.objectContaining({
        once: false,
        comparePoint: expect.objectContaining({
          operator: '>',
          value: 80,
        }),
      }));
    });

    test('re-roll once for `35dF.1ro`', () => {
      const parsed = Parser.parse('35dF.1ro');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(FudgeDice);
      expect(item.sides).toEqual('F.1');
      expect(item.qty).toEqual(35);
      expect(item.modifiers?.has('re-roll')).toBe(true);

      const mod = item.modifiers?.get('re-roll') as Modifier;
      expect(mod).toBeInstanceOf(ReRollModifier);

      mod.run(new RollResults(), parsed[0] as Dice);

      expect(mod.toJSON()).toEqual(expect.objectContaining({
        once: true,
        comparePoint: expect.objectContaining({
          operator: '=',
          value: -1,
        }),
      }));
    });

    test('re-roll once for `d64ro<=35`', () => {
      const parsed = Parser.parse('d64ro<=35');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(64);
      expect(item.qty).toEqual(1);
      expect(item.modifiers?.has('re-roll')).toBe(true);

      const mod = item.modifiers?.get('re-roll') as Modifier;
      expect(mod).toBeInstanceOf(ReRollModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        once: true,
        comparePoint: expect.objectContaining({
          operator: '<=',
          value: 35,
        }),
      }));
    });
  });

  describe('Sorting', () => {
    test('sort ascending for 10d5s', () => {
      const parsed = Parser.parse('10d5s');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(5);
      expect(item.qty).toEqual(10);
      expect(item.modifiers?.has('sorting')).toBe(true);

      const mod = item.modifiers?.get('sorting') as SortingModifier;
      expect(mod).toBeInstanceOf(SortingModifier);
      expect(mod.direction).toBe('a');
    });

    test('sort ascending for 23dF.1sa', () => {
      const parsed = Parser.parse('23dF.1sa');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(FudgeDice);
      expect(item.sides).toEqual('F.1');
      expect(item.qty).toEqual(23);
      expect(item.modifiers?.has('sorting')).toBe(true);

      const mod = item.modifiers?.get('sorting') as SortingModifier;
      expect(mod).toBeInstanceOf(SortingModifier);
      expect(mod.direction).toBe('a');
    });

    test('sort descending for 14d%sd', () => {
      const parsed = Parser.parse('14d%sd');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(PercentileDice);
      expect(item.sides).toEqual('%');
      expect(item.qty).toEqual(14);
      expect(item.modifiers?.has('sorting')).toBe(true);

      const mod = item.modifiers?.get('sorting') as SortingModifier;
      expect(mod).toBeInstanceOf(SortingModifier);
      expect(mod.direction).toBe('d');
    });
  });

  describe('Target', () => {
    describe('Success', () => {
      test('success for `8d45=21`', () => {
        const parsed = Parser.parse('8d45=21');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);

        const item = parsed[0] as Dice;
        expect(item).toBeInstanceOf(StandardDice);
        expect(item.sides).toEqual(45);
        expect(item.qty).toEqual(8);
        expect(item.modifiers?.has('target')).toBe(true);

        const mod = item.modifiers?.get('target') as Modifier;
        expect(mod).toBeInstanceOf(TargetModifier);
        expect(mod.toJSON()).toEqual(expect.objectContaining({
          successComparePoint: expect.objectContaining({
            operator: '=',
            value: 21,
          }),
          failureComparePoint: null,
        }));
      });

      test('success for `dF>=0`', () => {
        const parsed = Parser.parse('dF>=0');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);

        const item = parsed[0] as Dice;
        expect(item).toBeInstanceOf(StandardDice);
        expect(item.sides).toEqual('F.2');
        expect(item.qty).toEqual(1);
        expect(item.modifiers?.has('target')).toBe(true);

        const mod = item.modifiers?.get('target') as Modifier;
        expect(mod).toBeInstanceOf(TargetModifier);
        expect(mod.toJSON()).toEqual(expect.objectContaining({
          successComparePoint: expect.objectContaining({
            operator: '>=',
            value: 0,
          }),
          failureComparePoint: null,
        }));
      });
    });

    describe('Failure', () => {
      test('failure for `4d%>50f<40`', () => {
        const parsed = Parser.parse('4d%>50f<40');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);

        const item = parsed[0] as Dice;
        expect(item).toBeInstanceOf(StandardDice);
        expect(item.sides).toEqual('%');
        expect(item.qty).toEqual(4);
        expect(item.modifiers?.has('target')).toBe(true);

        const mod = item.modifiers?.get('target') as Modifier;
        expect(mod).toBeInstanceOf(TargetModifier);
        expect(mod.toJSON()).toEqual(expect.objectContaining({
          successComparePoint: expect.objectContaining({
            operator: '>',
            value: 50,
          }),
          failureComparePoint: expect.objectContaining({
            operator: '<',
            value: 40,
          }),
        }));
      });

      test('failure for `450dF.1>0f!=1`', () => {
        const parsed = Parser.parse('450dF.1>0f!=1');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);

        const item = parsed[0] as Dice;
        expect(item).toBeInstanceOf(StandardDice);
        expect(item.sides).toEqual('F.1');
        expect(item.qty).toEqual(450);
        expect(item.modifiers?.has('target')).toBe(true);

        const mod = item.modifiers?.get('target') as Modifier;
        expect(mod).toBeInstanceOf(TargetModifier);
        expect(mod.toJSON()).toEqual(expect.objectContaining({
          successComparePoint: expect.objectContaining({
            operator: '>',
            value: 0,
          }),
          failureComparePoint: expect.objectContaining({
            operator: '!=',
            value: 1,
          }),
        }));
      });

      test('failure for `450dF.1>0f<>1`', () => {
        const parsed = Parser.parse('450dF.1>0f<>1');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);

        const item = parsed[0] as Dice;
        expect(item).toBeInstanceOf(StandardDice);
        expect(item.sides).toEqual('F.1');
        expect(item.qty).toEqual(450);
        expect(item.modifiers?.has('target')).toBe(true);

        const mod = item.modifiers?.get('target') as Modifier;
        expect(mod).toBeInstanceOf(TargetModifier);
        expect(mod.toJSON()).toEqual(expect.objectContaining({
          successComparePoint: expect.objectContaining({
            operator: '>',
            value: 0,
          }),
          failureComparePoint: expect.objectContaining({
            operator: '<>',
            value: 1,
          }),
        }));
      });
    });

    test('must proceed a success compare point', () => {
      // can't have failure before success
      expect(() => {
        Parser.parse('2d6f<=3>4');
      }).toThrow(parser.PeggySyntaxError);

      // can't have failure without success
      expect(() => {
        Parser.parse('4d7f!=2');
      }).toThrow(parser.PeggySyntaxError);
    });
  });

  describe('Unique', () => {
    test('Unique re-roll for `5d10u`', () => {
      const parsed = Parser.parse('5d10u');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(10);
      expect(item.qty).toEqual(5);
      expect(item.modifiers?.has('unique')).toBe(true);

      const mod = item.modifiers?.get('unique') as Modifier;
      expect(mod).toBeInstanceOf(UniqueModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        comparePoint: null,
        name: 'unique',
        notation: 'u',
        once: false,
        type: ModelType.Modifier,
      }));
    });

    test('Unique re-roll for `12dFu`', () => {
      const parsed = Parser.parse('12dFu');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(FudgeDice);
      expect(item.sides).toEqual('F.2');
      expect(item.qty).toEqual(12);
      expect(item.modifiers?.has('unique')).toBe(true);

      const mod = item.modifiers?.get('unique') as Modifier;
      expect(mod).toBeInstanceOf(UniqueModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        comparePoint: null,
        name: 'unique',
        notation: 'u',
        once: false,
        type: ModelType.Modifier,
      }));
    });

    test('accepts compare point', () => {
      const parsed = Parser.parse('2d%u>80');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual('%');
      expect(item.qty).toEqual(2);
      expect(item.modifiers?.has('unique')).toBe(true);

      const mod = item.modifiers?.get('unique') as Modifier;
      expect(mod).toBeInstanceOf(UniqueModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        once: false,
        comparePoint: expect.objectContaining({
          operator: '>',
          value: 80,
        }),
      }));
    });

    test('Unique re-roll once for `35dF.1uo`', () => {
      const parsed = Parser.parse('35dF.1uo');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(FudgeDice);
      expect(item.sides).toEqual('F.1');
      expect(item.qty).toEqual(35);
      expect(item.modifiers?.has('unique')).toBe(true);

      const mod = item.modifiers?.get('unique') as Modifier;
      expect(mod).toBeInstanceOf(UniqueModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        comparePoint: null,
        name: 'unique',
        notation: 'uo',
        once: true,
        type: ModelType.Modifier,
      }));
    });

    test('Unique re-roll once for `d64uo<=35`', () => {
      const parsed = Parser.parse('d64uo<=35');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(64);
      expect(item.qty).toEqual(1);
      expect(item.modifiers?.has('unique')).toBe(true);

      const mod = item.modifiers?.get('unique') as Modifier;
      expect(mod).toBeInstanceOf(UniqueModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        once: true,
        comparePoint: expect.objectContaining({
          operator: '<=',
          value: 35,
        }),
      }));
    });
  });

  describe('Multiple modifiers', () => {
    test('use success and explode together `6d10>=8!>=9`', () => {
      const parsed = Parser.parse('6d10>=8!>=9');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(10);
      expect(item.qty).toEqual(6);
      expect(item.modifiers?.has('target')).toBe(true);

      let mod = item.modifiers?.get('target') as Modifier;
      expect(mod).toBeInstanceOf(TargetModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        successComparePoint: expect.objectContaining({
          operator: '>=',
          value: 8,
        }),
        failureComparePoint: null,
      }));

      expect(item.modifiers?.has('explode')).toBe(true);

      mod = item.modifiers?.get('explode') as Modifier;
      expect(mod).toBeInstanceOf(ExplodeModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        comparePoint: expect.objectContaining({
          operator: '>=',
          value: 9,
        }),
        compound: false,
        penetrate: false,
      }));
    });

    // modifiers opposite way around to test order doesn't matter
    test('use explode and success together `6d10!>=9>=8`', () => {
      const parsed = Parser.parse('6d10!>=9>=8');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(10);
      expect(item.qty).toEqual(6);
      expect(item.modifiers?.has('target')).toBe(true);

      let mod = item.modifiers?.get('target') as Modifier;
      expect(mod).toBeInstanceOf(TargetModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        successComparePoint: expect.objectContaining({
          operator: '>=',
          value: 8,
        }),
        failureComparePoint: null,
      }));

      expect(item.modifiers?.has('explode')).toBe(true);

      mod = item.modifiers?.get('explode') as Modifier;
      expect(mod).toBeInstanceOf(ExplodeModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        comparePoint: expect.objectContaining({
          operator: '>=',
          value: 9,
        }),
        compound: false,
        penetrate: false,
      }));
    });

    test('use drop, keep and re-roll `10d8dh2r!=5kl3', () => {
      const parsed = Parser.parse('10d8dh2r!=5kl3');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(8);
      expect(item.qty).toEqual(10);
      expect(item.modifiers?.has('drop-h')).toBe(true);

      let mod: DropModifier|KeepModifier|ReRollModifier = item.modifiers?.get('drop-h') as DropModifier;
      expect(mod).toBeInstanceOf(DropModifier);
      expect(mod.end).toBe('h');
      expect(mod.qty).toBe(2);

      expect(item.modifiers?.has('keep-l')).toBe(true);

      mod = item.modifiers?.get('keep-l') as KeepModifier;
      expect(mod).toBeInstanceOf(KeepModifier);
      expect(mod.end).toBe('l');
      expect(mod.qty).toBe(3);

      expect(item.modifiers?.has('re-roll')).toBe(true);

      mod = item.modifiers?.get('re-roll') as ReRollModifier;
      expect(mod).toBeInstanceOf(ReRollModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        once: false,
        comparePoint: expect.objectContaining({
          operator: '!=',
          value: 5,
        }),
      }));
    });

    test('use Min followed by Max', () => {
      const parsed = Parser.parse('4d10min3max6');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(10);
      expect(item.qty).toEqual(4);
      expect(item.modifiers?.has('min')).toBe(true);

      let mod: minModifier|MaxModifier = item.modifiers?.get('min') as MinModifier;
      expect(mod).toBeInstanceOf(MinModifier);
      expect(mod.min).toBe(3);

      expect(item.modifiers?.has('max')).toBe(true);

      mod = item.modifiers?.get('max') as MaxModifier;
      expect(mod).toBeInstanceOf(MaxModifier);
      expect(mod.max).toBe(6);
    });

    test('use Max followed by Min', () => {
      const parsed = Parser.parse('4d10max6min3');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(10);
      expect(item.qty).toEqual(4);
      expect(item.modifiers?.has('min')).toBe(true);

      let mod: MinModifier|MaxModifier = item.modifiers?.get('min') as MinModifier;
      expect(mod).toBeInstanceOf(MinModifier);
      expect(mod.min).toBe(3);

      expect(item.modifiers?.has('max')).toBe(true);

      mod = item.modifiers?.get('max') as MaxModifier;
      expect(mod).toBeInstanceOf(MaxModifier);
      expect(mod.max).toBe(6);
    });

    test('multiple of the same operator just keeps the last one', () => {
      const parsed = Parser.parse('42d2!=6!!>4!p<5');

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);

      const item = parsed[0] as Dice;
      expect(item).toBeInstanceOf(StandardDice);
      expect(item.sides).toEqual(2);
      expect(item.qty).toEqual(42);
      expect(item.modifiers?.has('explode')).toBe(true);

      const mod = item.modifiers?.get('explode') as Modifier;
      expect(mod).toBeInstanceOf(ExplodeModifier);
      expect(mod.toJSON()).toEqual(expect.objectContaining({
        comparePoint: expect.objectContaining({
          operator: '<',
          value: 5,
        }),
        compound: false,
        penetrate: true,
      }));
    });
  });
});
