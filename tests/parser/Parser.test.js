import { FudgeDice, PercentileDice, StandardDice } from '../../src/dice/index.js';
import { RequiredArgumentError } from '../../src/exceptions/index.js';
import {
  CriticalFailureModifier,
  CriticalSuccessModifier,
  DropModifier,
  ExplodeModifier,
  KeepModifier,
  MaxModifier,
  MinModifier,
  MultiplyModifier,
  ReRollModifier,
  SortingModifier,
  TargetModifier,
} from '../../src/modifiers/index.js';
import * as parser from '../../src/parser/grammars/grammar.js';
import Parser from '../../src/parser/Parser.js';
import ComparePoint from '../../src/ComparePoint.js';

describe('Parser', () => {
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
        Parser.parse();
      }).toThrow(RequiredArgumentError);

      expect(() => {
        Parser.parse(false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        Parser.parse(null);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        Parser.parse(undefined);
      }).toThrow(RequiredArgumentError);
    });

    test('notation must be string', () => {
      expect(() => {
        Parser.parse({ notation: '2d10' });
      }).toThrow(TypeError);

      expect(() => {
        Parser.parse(['4d6']);
      }).toThrow(TypeError);

      expect(() => {
        Parser.parse(true);
      }).toThrow(TypeError);

      expect(() => {
        Parser.parse(124);
      }).toThrow(TypeError);
    });
  });

  describe('Parsing', () => {
    describe('Basic dice', () => {
      test('returns correct response for `d6`', () => {
        const parsed = Parser.parse('d6');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0].sides).toBe(6);
        expect(parsed[0].qty).toBe(1);
        expect(parsed[0].modifiers).toEqual(new Map());
      });

      test('returns correct response for `5d10`', () => {
        const parsed = Parser.parse('5d10');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0].sides).toBe(10);
        expect(parsed[0].qty).toBe(5);
        expect(parsed[0].modifiers).toEqual(new Map());
      });

      test('returns correct response for `4d20`', () => {
        const parsed = Parser.parse('4d20');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0].sides).toBe(20);
        expect(parsed[0].qty).toBe(4);
        expect(parsed[0].modifiers).toEqual(new Map());
      });

      test('returns correct response for `2d%`', () => {
        const parsed = Parser.parse('2d%');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(PercentileDice);
        expect(parsed[0].sides).toBe('%');
        expect(parsed[0].qty).toBe(2);
        expect(parsed[0].modifiers).toEqual(new Map());
      });

      test('returns correct response for `4dF`', () => {
        const parsed = Parser.parse('4dF');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(FudgeDice);
        expect(parsed[0].sides).toBe('F.2');
        expect(parsed[0].qty).toBe(4);
        expect(parsed[0].modifiers).toEqual(new Map());
      });

      test('returns correct response for `dF.2`', () => {
        const parsed = Parser.parse('dF.2');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(FudgeDice);
        expect(parsed[0].sides).toBe('F.2');
        expect(parsed[0].qty).toBe(1);
        expect(parsed[0].modifiers).toEqual(new Map());
      });

      test('returns correct response for `10dF.1`', () => {
        const parsed = Parser.parse('10dF.1');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(FudgeDice);
        expect(parsed[0].sides).toBe('F.1');
        expect(parsed[0].qty).toBe(10);
        expect(parsed[0].modifiers).toEqual(new Map());
      });

      test('throws error for invalid Fudge die sides', () => {
        expect(() => {
          Parser.parse('dF.3');
        }).toThrow(parser.SyntaxError);

        expect(() => {
          Parser.parse('dF.4');
        }).toThrow(parser.SyntaxError);

        expect(() => {
          Parser.parse('dF.0');
        }).toThrow(parser.SyntaxError);

        expect(() => {
          Parser.parse('dF.67');
        }).toThrow(parser.SyntaxError);

        expect(() => {
          Parser.parse('dF.foo');
        }).toThrow(parser.SyntaxError);
      });

      test('sides cannot start with 0', () => {
        expect(() => {
          Parser.parse('d0');
        }).toThrow(parser.SyntaxError);

        expect(() => {
          Parser.parse('d01');
        }).toThrow(parser.SyntaxError);
      });

      test('qty cannot start with 0', () => {
        expect(() => {
          Parser.parse('0d6');
        }).toThrow(parser.SyntaxError);

        expect(() => {
          Parser.parse('01d6');
        }).toThrow(parser.SyntaxError);
      });
    });

    describe('Modifiers', () => {
      describe('Critical failure', () => {
        test('failure for `1d8cf<4`', () => {
          const parsed = Parser.parse('1d8cf<4');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(8);
          expect(parsed[0].qty).toEqual(1);

          expect(parsed[0].modifiers.has('critical-failure')).toBe(true);

          const mod = parsed[0].modifiers.get('critical-failure');
          expect(mod).toBeInstanceOf(CriticalFailureModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            comparePoint: expect.objectContaining({
              operator: '<',
              value: 4,
            }),
          }));
        });

        test('failure for `3dF.1cf>8`', () => {
          const parsed = Parser.parse('3dF.1cf>8');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(FudgeDice);

          expect(parsed[0].sides).toEqual('F.1');
          expect(parsed[0].qty).toEqual(3);

          expect(parsed[0].modifiers.has('critical-failure')).toBe(true);

          const mod = parsed[0].modifiers.get('critical-failure');
          expect(mod).toBeInstanceOf(CriticalFailureModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            comparePoint: expect.objectContaining({
              operator: '>',
              value: 8,
            }),
          }));
        });

        test('throws error if no compare point', () => {
          expect(() => {
            Parser.parse('d6cf');
          }).toThrow(parser.SyntaxError);
        });
      });

      describe('Critical success', () => {
        test('success for `8d45cs=12`', () => {
          const parsed = Parser.parse('8d45cs=12');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(45);
          expect(parsed[0].qty).toEqual(8);

          expect(parsed[0].modifiers.has('critical-success')).toBe(true);

          const mod = parsed[0].modifiers.get('critical-success');
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
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(152);
          expect(parsed[0].qty).toEqual(36);

          expect(parsed[0].modifiers.has('critical-success')).toBe(true);

          const mod = parsed[0].modifiers.get('critical-success');
          expect(mod).toBeInstanceOf(CriticalSuccessModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            comparePoint: expect.objectContaining({
              operator: '!=',
              value: 45,
            }),
          }));
        });

        test('throws error if no compare point', () => {
          expect(() => {
            Parser.parse('d6cs');
          }).toThrow(parser.SyntaxError);
        });
      });

      describe('Drop', () => {
        test('drop lowest for `19d23d1`', () => {
          const parsed = Parser.parse('19d23d1');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(23);
          expect(parsed[0].qty).toEqual(19);

          expect(parsed[0].modifiers.has('drop-l')).toBe(true);

          const mod = parsed[0].modifiers.get('drop-l');
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
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(10);
          expect(parsed[0].qty).toEqual(4);

          expect(parsed[0].modifiers.has('drop-l')).toBe(true);

          const mod = parsed[0].modifiers.get('drop-l');
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
          expect(parsed[0]).toBeInstanceOf(PercentileDice);

          expect(parsed[0].sides).toEqual('%');
          expect(parsed[0].qty).toEqual(7);

          expect(parsed[0].modifiers.has('drop-l')).toBe(true);

          const mod = parsed[0].modifiers.get('drop-l');
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
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(6);
          expect(parsed[0].qty).toEqual(4);

          expect(parsed[0].modifiers.has('drop-h')).toBe(true);

          const mod = parsed[0].modifiers.get('drop-h');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            end: 'h',
            qty: 2,
          }));
        });

        test('throws error without qty', () => {
          expect(() => {
            Parser.parse('12dF.1d');
          }).toThrow(parser.SyntaxError);

          expect(() => {
            Parser.parse('6d6dl');
          }).toThrow(parser.SyntaxError);
        });
      });

      describe('Explode', () => {
        test('explode `d6!`', () => {
          const parsed = Parser.parse('d6!');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(6);
          expect(parsed[0].qty).toEqual(1);

          expect(parsed[0].modifiers.has('explode')).toBe(true);

          const mod = parsed[0].modifiers.get('explode');
          expect(mod).toBeInstanceOf(ExplodeModifier);
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
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(7);
          expect(parsed[0].qty).toEqual(2);

          expect(parsed[0].modifiers.has('explode')).toBe(true);

          const mod = parsed[0].modifiers.get('explode');
          expect(mod).toBeInstanceOf(ExplodeModifier);
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
          expect(parsed[0]).toBeInstanceOf(PercentileDice);

          expect(parsed[0].sides).toEqual('%');
          expect(parsed[0].qty).toEqual(5);

          expect(parsed[0].modifiers.has('explode')).toBe(true);

          const mod = parsed[0].modifiers.get('explode');
          expect(mod).toBeInstanceOf(ExplodeModifier);
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
          expect(parsed[0]).toBeInstanceOf(FudgeDice);

          expect(parsed[0].sides).toEqual('F.2');
          expect(parsed[0].qty).toEqual(1);

          expect(parsed[0].modifiers.has('explode')).toBe(true);

          const mod = parsed[0].modifiers.get('explode');
          expect(mod).toBeInstanceOf(ExplodeModifier);
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
          expect(parsed[0]).toBeInstanceOf(FudgeDice);

          expect(parsed[0].sides).toEqual('F.2');
          expect(parsed[0].qty).toEqual(4);

          expect(parsed[0].modifiers.has('explode')).toBe(true);

          const mod = parsed[0].modifiers.get('explode');
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
          expect(parsed[0]).toBeInstanceOf(FudgeDice);

          expect(parsed[0].sides).toEqual('F.1');
          expect(parsed[0].qty).toEqual(1);

          expect(parsed[0].modifiers.has('explode')).toBe(true);

          const mod = parsed[0].modifiers.get('explode');
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

        test('can explode with  compare point `360d%!!p<50', () => {
          const parsed = Parser.parse('360d%!!p<50');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(PercentileDice);

          expect(parsed[0].sides).toEqual('%');
          expect(parsed[0].qty).toEqual(360);

          expect(parsed[0].modifiers.has('explode')).toBe(true);

          const mod = parsed[0].modifiers.get('explode');
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
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(40601);
          expect(parsed[0].qty).toEqual(1);

          expect(parsed[0].modifiers.has('keep-h')).toBe(true);

          const mod = parsed[0].modifiers.get('keep-h');
          expect(mod).toBeInstanceOf(KeepModifier);
          expect(mod.end).toBe('h');
          expect(mod.qty).toBe(1);
        });

        test('keep highest for `897d2kh1`', () => {
          const parsed = Parser.parse('897d2kh1');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(2);
          expect(parsed[0].qty).toEqual(897);

          expect(parsed[0].modifiers.has('keep-h')).toBe(true);

          const mod = parsed[0].modifiers.get('keep-h');
          expect(mod).toBeInstanceOf(KeepModifier);
          expect(mod.end).toBe('h');
          expect(mod.qty).toBe(1);
        });

        test('keep highest for `5dFk4`', () => {
          const parsed = Parser.parse('5dFk4');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual('F.2');
          expect(parsed[0].qty).toEqual(5);

          expect(parsed[0].modifiers.has('keep-h')).toBe(true);

          const mod = parsed[0].modifiers.get('keep-h');
          expect(mod).toBeInstanceOf(KeepModifier);
          expect(mod.end).toBe('h');
          expect(mod.qty).toBe(4);
        });

        test('keep lowest for `10d%kl3`', () => {
          const parsed = Parser.parse('10d%kl3');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual('%');
          expect(parsed[0].qty).toEqual(10);

          expect(parsed[0].modifiers.has('keep-l')).toBe(true);

          const mod = parsed[0].modifiers.get('keep-l');
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
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(6);
          expect(parsed[0].qty).toEqual(2);

          expect(parsed[0].modifiers.has('max')).toBe(true);

          const mod = parsed[0].modifiers.get('max');
          expect(mod).toBeInstanceOf(MaxModifier);
          expect(mod.max).toBe(3);
        });

        test('max for `4d20max-12`', () => {
          const parsed = Parser.parse('4d20max-12');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(20);
          expect(parsed[0].qty).toEqual(4);

          expect(parsed[0].modifiers.has('max')).toBe(true);

          const mod = parsed[0].modifiers.get('max');
          expect(mod).toBeInstanceOf(MaxModifier);
          expect(mod.max).toBe(-12);
        });

        test('max for `6d%max50.45`', () => {
          const parsed = Parser.parse('6d%max50.45');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual('%');
          expect(parsed[0].qty).toEqual(6);

          expect(parsed[0].modifiers.has('max')).toBe(true);

          const mod = parsed[0].modifiers.get('max');
          expect(mod).toBeInstanceOf(MaxModifier);
          expect(mod.max).toBe(50.45);
        });

        test('throws error if no max value', () => {
          expect(() => {
            Parser.parse('d6max');
          }).toThrow(parser.SyntaxError);
        });

        test('throws error if invalid max value', () => {
          expect(() => {
            Parser.parse('d6maxfoo');
          }).toThrow(parser.SyntaxError);

          expect(() => {
            Parser.parse('d6maxd6');
          }).toThrow(parser.SyntaxError);
        });
      });

      describe('Min', () => {
        test('min for `2d6min3`', () => {
          const parsed = Parser.parse('2d6min3');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(6);
          expect(parsed[0].qty).toEqual(2);

          expect(parsed[0].modifiers.has('min')).toBe(true);

          const mod = parsed[0].modifiers.get('min');
          expect(mod).toBeInstanceOf(MinModifier);
          expect(mod.min).toBe(3);
        });

        test('min for `4d20min-12`', () => {
          const parsed = Parser.parse('4d20min-12');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(20);
          expect(parsed[0].qty).toEqual(4);

          expect(parsed[0].modifiers.has('min')).toBe(true);

          const mod = parsed[0].modifiers.get('min');
          expect(mod).toBeInstanceOf(MinModifier);
          expect(mod.min).toBe(-12);
        });

        test('min for `6d%min50.45`', () => {
          const parsed = Parser.parse('6d%min50.45');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual('%');
          expect(parsed[0].qty).toEqual(6);

          expect(parsed[0].modifiers.has('min')).toBe(true);

          const mod = parsed[0].modifiers.get('min');
          expect(mod).toBeInstanceOf(MinModifier);
          expect(mod.min).toBe(50.45);
        });

        test('throws error if no min value', () => {
          expect(() => {
            Parser.parse('d6min');
          }).toThrow(parser.SyntaxError);
        });

        test('throws error if invalid min value', () => {
          expect(() => {
            Parser.parse('d6minfoo');
          }).toThrow(parser.SyntaxError);

          expect(() => {
            Parser.parse('d6mind6');
          }).toThrow(parser.SyntaxError);
        });
      });

      describe('Multiply', () => {
        describe('No compare point', () => {
          test('multiply for `3d8mul6`', () => {
            const parsed = Parser.parse('3d8mul6');

            expect(parsed).toBeInstanceOf(Array);
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toBeInstanceOf(StandardDice);

            expect(parsed[0].sides).toEqual(8);
            expect(parsed[0].qty).toEqual(3);

            expect(parsed[0].modifiers.has('multiply')).toBe(true);

            const mod = parsed[0].modifiers.get('multiply');
            expect(mod).toBeInstanceOf(MultiplyModifier);
            expect(mod.factor).toBe(6);
            expect(mod.comparePoint).toBe(undefined);
          });

          test('multiply for `12dF.2mul-3.01`', () => {
            const parsed = Parser.parse('12dF.2mul-3.01');

            expect(parsed).toBeInstanceOf(Array);
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toBeInstanceOf(FudgeDice);

            expect(parsed[0].sides).toEqual('F.2');
            expect(parsed[0].qty).toEqual(12);

            expect(parsed[0].modifiers.has('multiply')).toBe(true);

            const mod = parsed[0].modifiers.get('multiply');
            expect(mod).toBeInstanceOf(MultiplyModifier);
            expect(mod.factor).toBeCloseTo(-3.01);
            expect(mod.comparePoint).toBe(undefined);
          });

          test('multiply for `4d%mul0`', () => {
            const parsed = Parser.parse('4d%mul0');

            expect(parsed).toBeInstanceOf(Array);
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toBeInstanceOf(PercentileDice);

            expect(parsed[0].sides).toEqual('%');
            expect(parsed[0].qty).toEqual(4);

            expect(parsed[0].modifiers.has('multiply')).toBe(true);

            const mod = parsed[0].modifiers.get('multiply');
            expect(mod).toBeInstanceOf(MultiplyModifier);
            expect(mod.factor).toBeCloseTo(0);
            expect(mod.comparePoint).toBe(undefined);
          });
        });

        describe('With compare point', () => {
          test('multiply for `2d10mul2>8`', () => {
            const parsed = Parser.parse('2d10mul2>8');

            expect(parsed).toBeInstanceOf(Array);
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toBeInstanceOf(StandardDice);

            expect(parsed[0].sides).toEqual(10);
            expect(parsed[0].qty).toEqual(2);

            expect(parsed[0].modifiers.has('multiply')).toBe(true);

            const mod = parsed[0].modifiers.get('multiply');
            expect(mod).toBeInstanceOf(MultiplyModifier);
            expect(mod.factor).toBe(2);
            expect(mod.comparePoint).toEqual(new ComparePoint('>', 8));
          });

          test('multiply for `67d%mul897!=4`', () => {
            const parsed = Parser.parse('67d%mul897!=4');

            expect(parsed).toBeInstanceOf(Array);
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toBeInstanceOf(StandardDice);

            expect(parsed[0].sides).toEqual('%');
            expect(parsed[0].qty).toEqual(67);

            expect(parsed[0].modifiers.has('multiply')).toBe(true);

            const mod = parsed[0].modifiers.get('multiply');
            expect(mod).toBeInstanceOf(MultiplyModifier);
            expect(mod.factor).toBe(897);
            expect(mod.comparePoint).toEqual(new ComparePoint('!=', 4));
          });

          test('multiply for `13dF.1mul-4.005<1`', () => {
            const parsed = Parser.parse('13dF.1mul-4.005<1');

            expect(parsed).toBeInstanceOf(Array);
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toBeInstanceOf(StandardDice);

            expect(parsed[0].sides).toEqual('F.1');
            expect(parsed[0].qty).toEqual(13);

            expect(parsed[0].modifiers.has('multiply')).toBe(true);

            const mod = parsed[0].modifiers.get('multiply');
            expect(mod).toBeInstanceOf(MultiplyModifier);
            expect(mod.factor).toBe(-4.005);
            expect(mod.comparePoint).toEqual(new ComparePoint('<', 1));
          });
        });
      });

      describe('Re-roll', () => {
        test('re-roll for `5d10r`', () => {
          const parsed = Parser.parse('5d10r');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(10);
          expect(parsed[0].qty).toEqual(5);

          expect(parsed[0].modifiers.has('re-roll')).toBe(true);

          const mod = parsed[0].modifiers.get('re-roll');
          expect(mod).toBeInstanceOf(ReRollModifier);
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
          expect(parsed[0]).toBeInstanceOf(FudgeDice);

          expect(parsed[0].sides).toEqual('F.2');
          expect(parsed[0].qty).toEqual(12);

          expect(parsed[0].modifiers.has('re-roll')).toBe(true);

          const mod = parsed[0].modifiers.get('re-roll');
          expect(mod).toBeInstanceOf(ReRollModifier);
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
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual('%');
          expect(parsed[0].qty).toEqual(2);

          expect(parsed[0].modifiers.has('re-roll')).toBe(true);

          const mod = parsed[0].modifiers.get('re-roll');
          expect(mod).toBeInstanceOf(ReRollModifier);
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
          expect(parsed[0]).toBeInstanceOf(FudgeDice);

          expect(parsed[0].sides).toEqual('F.1');
          expect(parsed[0].qty).toEqual(35);

          expect(parsed[0].modifiers.has('re-roll')).toBe(true);

          const mod = parsed[0].modifiers.get('re-roll');
          expect(mod).toBeInstanceOf(ReRollModifier);
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
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(64);
          expect(parsed[0].qty).toEqual(1);

          expect(parsed[0].modifiers.has('re-roll')).toBe(true);

          const mod = parsed[0].modifiers.get('re-roll');
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
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(5);
          expect(parsed[0].qty).toEqual(10);

          expect(parsed[0].modifiers.has('sorting')).toBe(true);

          const mod = parsed[0].modifiers.get('sorting');
          expect(mod).toBeInstanceOf(SortingModifier);
          expect(mod.direction).toBe('a');
        });

        test('sort ascending for 23dF.1sa', () => {
          const parsed = Parser.parse('23dF.1sa');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(FudgeDice);

          expect(parsed[0].sides).toEqual('F.1');
          expect(parsed[0].qty).toEqual(23);

          expect(parsed[0].modifiers.has('sorting')).toBe(true);

          const mod = parsed[0].modifiers.get('sorting');
          expect(mod).toBeInstanceOf(SortingModifier);
          expect(mod.direction).toBe('a');
        });

        test('sort descending for 14d%sd', () => {
          const parsed = Parser.parse('14d%sd');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(PercentileDice);

          expect(parsed[0].sides).toEqual('%');
          expect(parsed[0].qty).toEqual(14);

          expect(parsed[0].modifiers.has('sorting')).toBe(true);

          const mod = parsed[0].modifiers.get('sorting');
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
            expect(parsed[0]).toBeInstanceOf(StandardDice);

            expect(parsed[0].sides).toEqual(45);
            expect(parsed[0].qty).toEqual(8);

            expect(parsed[0].modifiers.has('target')).toBe(true);

            const mod = parsed[0].modifiers.get('target');
            expect(mod).toBeInstanceOf(TargetModifier);
            expect(mod.successComparePoint).toEqual(new ComparePoint('=', 21));
            expect(mod.failureComparePoint).toBe(null);
          });

          test('success for `dF>=0`', () => {
            const parsed = Parser.parse('dF>=0');

            expect(parsed).toBeInstanceOf(Array);
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toBeInstanceOf(StandardDice);

            expect(parsed[0].sides).toEqual('F.2');
            expect(parsed[0].qty).toEqual(1);

            expect(parsed[0].modifiers.has('target')).toBe(true);

            const mod = parsed[0].modifiers.get('target');
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
            expect(parsed[0]).toBeInstanceOf(StandardDice);

            expect(parsed[0].sides).toEqual('%');
            expect(parsed[0].qty).toEqual(4);

            expect(parsed[0].modifiers.has('target')).toBe(true);

            const mod = parsed[0].modifiers.get('target');
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
            expect(parsed[0]).toBeInstanceOf(StandardDice);

            expect(parsed[0].sides).toEqual('F.1');
            expect(parsed[0].qty).toEqual(450);

            expect(parsed[0].modifiers.has('target')).toBe(true);

            const mod = parsed[0].modifiers.get('target');
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

          test('must proceed success compare point', () => {
            // can't have failure before success
            expect(() => {
              Parser.parse('2d6f<=3>4');
            }).toThrow(parser.SyntaxError);

            // can't have failure without success
            expect(() => {
              Parser.parse('4d7f!=2');
            }).toThrow(parser.SyntaxError);
          });
        });
      });

      describe('Multiple modifiers', () => {
        test('use success and explode together `6d10>=8!>=9`', () => {
          const parsed = Parser.parse('6d10>=8!>=9');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(10);
          expect(parsed[0].qty).toEqual(6);

          expect(parsed[0].modifiers.has('target')).toBe(true);

          let mod = parsed[0].modifiers.get('target');
          expect(mod).toBeInstanceOf(TargetModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            successComparePoint: expect.objectContaining({
              operator: '>=',
              value: 8,
            }),
            failureComparePoint: null,
          }));

          expect(parsed[0].modifiers.has('explode')).toBe(true);

          mod = parsed[0].modifiers.get('explode');
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
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(10);
          expect(parsed[0].qty).toEqual(6);

          expect(parsed[0].modifiers.has('target')).toBe(true);

          let mod = parsed[0].modifiers.get('target');
          expect(mod).toBeInstanceOf(TargetModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            successComparePoint: expect.objectContaining({
              operator: '>=',
              value: 8,
            }),
            failureComparePoint: null,
          }));

          expect(parsed[0].modifiers.has('explode')).toBe(true);

          mod = parsed[0].modifiers.get('explode');
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
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(8);
          expect(parsed[0].qty).toEqual(10);

          expect(parsed[0].modifiers.has('drop-h')).toBe(true);

          let mod = parsed[0].modifiers.get('drop-h');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.end).toBe('h');
          expect(mod.qty).toBe(2);

          expect(parsed[0].modifiers.has('keep-l')).toBe(true);

          mod = parsed[0].modifiers.get('keep-l');
          expect(mod).toBeInstanceOf(KeepModifier);
          expect(mod.end).toBe('l');
          expect(mod.qty).toBe(3);

          expect(parsed[0].modifiers.has('re-roll')).toBe(true);

          mod = parsed[0].modifiers.get('re-roll');
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
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(10);
          expect(parsed[0].qty).toEqual(4);

          expect(parsed[0].modifiers.has('min')).toBe(true);

          let mod = parsed[0].modifiers.get('min');
          expect(mod).toBeInstanceOf(MinModifier);
          expect(mod.min).toBe(3);

          expect(parsed[0].modifiers.has('max')).toBe(true);

          mod = parsed[0].modifiers.get('max');
          expect(mod).toBeInstanceOf(MaxModifier);
          expect(mod.max).toBe(6);
        });

        test('use Max followed by Min', () => {
          const parsed = Parser.parse('4d10max6min3');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(10);
          expect(parsed[0].qty).toEqual(4);

          expect(parsed[0].modifiers.has('min')).toBe(true);

          let mod = parsed[0].modifiers.get('min');
          expect(mod).toBeInstanceOf(MinModifier);
          expect(mod.min).toBe(3);

          expect(parsed[0].modifiers.has('max')).toBe(true);

          mod = parsed[0].modifiers.get('max');
          expect(mod).toBeInstanceOf(MaxModifier);
          expect(mod.max).toBe(6);
        });

        describe('Target modifier and multiply modifier together', () => {
          test('`3d8>7mul6`', () => {
            const parsed = Parser.parse('3d8>7mul6');

            expect(parsed).toBeInstanceOf(Array);
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toBeInstanceOf(StandardDice);

            expect(parsed[0].sides).toEqual(8);
            expect(parsed[0].qty).toEqual(3);

            expect(parsed[0].modifiers.has('target')).toBe(true);
            let mod = parsed[0].modifiers.get('target');
            expect(mod).toBeInstanceOf(TargetModifier);
            expect(mod.successComparePoint).toEqual(new ComparePoint('>', 7));
            expect(mod.failureComparePoint).toBe(null);

            expect(parsed[0].modifiers.has('multiply')).toBe(true);
            mod = parsed[0].modifiers.get('multiply');
            expect(mod).toBeInstanceOf(MultiplyModifier);
            expect(mod.factor).toBe(6);
            expect(mod.comparePoint).toBe(undefined);
          });

          test('`2d10=10f<=3mul4>8`', () => {
            const parsed = Parser.parse('2d10=10f<=3mul4>8');

            expect(parsed).toBeInstanceOf(Array);
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toBeInstanceOf(StandardDice);

            expect(parsed[0].sides).toEqual(10);
            expect(parsed[0].qty).toEqual(2);

            expect(parsed[0].modifiers.has('target')).toBe(true);
            let mod = parsed[0].modifiers.get('target');
            expect(mod).toBeInstanceOf(TargetModifier);
            expect(mod.successComparePoint).toEqual(new ComparePoint('=', 10));
            expect(mod.failureComparePoint).toEqual(new ComparePoint('<=', 3));

            expect(parsed[0].modifiers.has('multiply')).toBe(true);
            mod = parsed[0].modifiers.get('multiply');
            expect(mod).toBeInstanceOf(MultiplyModifier);
            expect(mod.factor).toBe(4);
            expect(mod.comparePoint).toEqual(new ComparePoint('>', 8));
          });
        });

        test('multiple of the same modifier just keeps the last one', () => {
          const parsed = Parser.parse('42d2!=6!!>4!p<5');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].sides).toEqual(2);
          expect(parsed[0].qty).toEqual(42);

          expect(parsed[0].modifiers.has('explode')).toBe(true);

          const mod = parsed[0].modifiers.get('explode');
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
          }).toThrow(parser.SyntaxError);
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
          }).toThrow(parser.SyntaxError);
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
        }).toThrow(parser.SyntaxError);
      });

      test('throws error when using negative values for die sides', () => {
        expect(() => {
          Parser.parse('4d-6');
        }).toThrow(parser.SyntaxError);
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
  });
});
