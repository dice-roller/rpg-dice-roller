import Parser from '../../src/parser/Parser';
import { FudgeDice, PercentileDice, StandardDice } from '../../src/Dice';
import CriticalFailureModifier from '../../src/modifiers/CriticalFailureModifier';
import CriticalSuccessModifier from '../../src/modifiers/CriticalSuccessModifier';
import DropModifier from '../../src/modifiers/DropModifier';
import ExplodeModifier from '../../src/modifiers/ExplodeModifier';
import ReRollModifier from '../../src/modifiers/ReRollModifier';
import KeepModifier from '../../src/modifiers/KeepModifier';
import parser from '../../src/parser/grammars/grammar';
import SortingModifier from '../../src/modifiers/SortingModifier';
import TargetModifier from '../../src/modifiers/TargetModifier';
import RequiredArgumentError from '../../src/exceptions/RequiredArgumentErrorError';

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
        expect(parsed[0]).toEqual(expect.objectContaining({
          modifiers: new Map(),
          notation: 'd6',
          sides: 6,
          qty: 1,
        }));
      });

      test('returns correct response for `5d10`', () => {
        const parsed = Parser.parse('5d10');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0]).toEqual(expect.objectContaining({
          modifiers: new Map(),
          notation: '5d10',
          sides: 10,
          qty: 5,
        }));
      });

      test('returns correct response for `4d20`', () => {
        const parsed = Parser.parse('4d20');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0]).toEqual(expect.objectContaining({
          modifiers: new Map(),
          notation: '4d20',
          sides: 20,
          qty: 4,
        }));
      });

      test('returns correct response for `2d%`', () => {
        const parsed = Parser.parse('2d%');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(PercentileDice);
        expect(parsed[0]).toEqual(expect.objectContaining({
          modifiers: new Map(),
          notation: '2d%',
          sides: '%',
          qty: 2,
        }));
      });

      test('returns correct response for `4dF`', () => {
        const parsed = Parser.parse('4dF');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(FudgeDice);
        expect(parsed[0]).toEqual(expect.objectContaining({
          modifiers: new Map(),
          notation: '4dF',
          sides: 'F.2',
          qty: 4,
        }));
      });

      test('returns correct response for `dF.2`', () => {
        const parsed = Parser.parse('dF.2');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(FudgeDice);
        expect(parsed[0]).toEqual(expect.objectContaining({
          modifiers: new Map(),
          notation: 'dF.2',
          sides: 'F.2',
          qty: 1,
        }));
      });

      test('returns correct response for `10dF.1`', () => {
        const parsed = Parser.parse('10dF.1');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(FudgeDice);
        expect(parsed[0]).toEqual(expect.objectContaining({
          modifiers: new Map(),
          notation: '10dF.1',
          sides: 'F.1',
          qty: 10,
        }));
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

          expect(parsed[0].notation).toEqual('1d8');
          expect(parsed[0].sides).toEqual(8);
          expect(parsed[0].qty).toEqual(1);

          expect(parsed[0].modifiers.has('CriticalFailureModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('CriticalFailureModifier');
          expect(mod).toBeInstanceOf(CriticalFailureModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'cf<4',
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

          expect(parsed[0].notation).toEqual('3dF.1');
          expect(parsed[0].sides).toEqual('F.1');
          expect(parsed[0].qty).toEqual(3);

          expect(parsed[0].modifiers.has('CriticalFailureModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('CriticalFailureModifier');
          expect(mod).toBeInstanceOf(CriticalFailureModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'cf>8',
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

          expect(parsed[0].notation).toEqual('8d45');
          expect(parsed[0].sides).toEqual(45);
          expect(parsed[0].qty).toEqual(8);

          expect(parsed[0].modifiers.has('CriticalSuccessModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('CriticalSuccessModifier');
          expect(mod).toBeInstanceOf(CriticalSuccessModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'cs=12',
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

          expect(parsed[0].notation).toEqual('36d152');
          expect(parsed[0].sides).toEqual(152);
          expect(parsed[0].qty).toEqual(36);

          expect(parsed[0].modifiers.has('CriticalSuccessModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('CriticalSuccessModifier');
          expect(mod).toBeInstanceOf(CriticalSuccessModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'cs!=45',
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

          expect(parsed[0].notation).toEqual('19d23');
          expect(parsed[0].sides).toEqual(23);
          expect(parsed[0].qty).toEqual(19);

          expect(parsed[0].modifiers.has('DropModifier-l')).toBe(true);

          const mod = parsed[0].modifiers.get('DropModifier-l');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'd1',
            end: 'l',
            qty: 1,
          }));
        });

        test('drop lowest for `4d10dl1`', () => {
          const parsed = Parser.parse('4d10dl1');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].notation).toEqual('4d10');
          expect(parsed[0].sides).toEqual(10);
          expect(parsed[0].qty).toEqual(4);

          expect(parsed[0].modifiers.has('DropModifier-l')).toBe(true);

          const mod = parsed[0].modifiers.get('DropModifier-l');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'dl1',
            end: 'l',
            qty: 1,
          }));
        });

        test('drop lowest for `7d%d3`', () => {
          const parsed = Parser.parse('7d%d3');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(PercentileDice);

          expect(parsed[0].notation).toEqual('7d%');
          expect(parsed[0].sides).toEqual('%');
          expect(parsed[0].qty).toEqual(7);

          expect(parsed[0].modifiers.has('DropModifier-l')).toBe(true);

          const mod = parsed[0].modifiers.get('DropModifier-l');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'd3',
            end: 'l',
            qty: 3,
          }));
        });

        test('drop highest for `4d6dh2`', () => {
          const parsed = Parser.parse('4d6dh2');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].notation).toEqual('4d6');
          expect(parsed[0].sides).toEqual(6);
          expect(parsed[0].qty).toEqual(4);

          expect(parsed[0].modifiers.has('DropModifier-h')).toBe(true);

          const mod = parsed[0].modifiers.get('DropModifier-h');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'dh2',
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

          expect(parsed[0].notation).toEqual('d6');
          expect(parsed[0].sides).toEqual(6);
          expect(parsed[0].qty).toEqual(1);

          expect(parsed[0].modifiers.has('ExplodeModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('ExplodeModifier');
          expect(mod).toBeInstanceOf(ExplodeModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: '!',
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

          expect(parsed[0].notation).toEqual('2d7');
          expect(parsed[0].sides).toEqual(7);
          expect(parsed[0].qty).toEqual(2);

          expect(parsed[0].modifiers.has('ExplodeModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('ExplodeModifier');
          expect(mod).toBeInstanceOf(ExplodeModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: '!!',
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

          expect(parsed[0].notation).toEqual('5d%');
          expect(parsed[0].sides).toEqual('%');
          expect(parsed[0].qty).toEqual(5);

          expect(parsed[0].modifiers.has('ExplodeModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('ExplodeModifier');
          expect(mod).toBeInstanceOf(ExplodeModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: '!p',
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

          expect(parsed[0].notation).toEqual('1dF');
          expect(parsed[0].sides).toEqual('F.2');
          expect(parsed[0].qty).toEqual(1);

          expect(parsed[0].modifiers.has('ExplodeModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('ExplodeModifier');
          expect(mod).toBeInstanceOf(ExplodeModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: '!!p',
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

          expect(parsed[0].notation).toEqual('4dF.2');
          expect(parsed[0].sides).toEqual('F.2');
          expect(parsed[0].qty).toEqual(4);

          expect(parsed[0].modifiers.has('ExplodeModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('ExplodeModifier');
          expect(mod).toBeInstanceOf(ExplodeModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: '!>=0',
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

          expect(parsed[0].notation).toEqual('dF.1');
          expect(parsed[0].sides).toEqual('F.1');
          expect(parsed[0].qty).toEqual(1);

          expect(parsed[0].modifiers.has('ExplodeModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('ExplodeModifier');
          expect(mod).toBeInstanceOf(ExplodeModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: '!!<=1',
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

          expect(parsed[0].notation).toEqual('360d%');
          expect(parsed[0].sides).toEqual('%');
          expect(parsed[0].qty).toEqual(360);

          expect(parsed[0].modifiers.has('ExplodeModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('ExplodeModifier');
          expect(mod).toBeInstanceOf(ExplodeModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: '!!p<50',
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

          expect(parsed[0].notation).toEqual('d40601');
          expect(parsed[0].sides).toEqual(40601);
          expect(parsed[0].qty).toEqual(1);

          expect(parsed[0].modifiers.has('KeepModifier-h')).toBe(true);

          const mod = parsed[0].modifiers.get('KeepModifier-h');
          expect(mod).toBeInstanceOf(KeepModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'k1',
            end: 'h',
            qty: 1,
          }));
        });

        test('keep highest for `23017d2kh1`', () => {
          const parsed = Parser.parse('23017d2kh1');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].notation).toEqual('23017d2');
          expect(parsed[0].sides).toEqual(2);
          expect(parsed[0].qty).toEqual(23017);

          expect(parsed[0].modifiers.has('KeepModifier-h')).toBe(true);

          const mod = parsed[0].modifiers.get('KeepModifier-h');
          expect(mod).toBeInstanceOf(KeepModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'kh1',
            end: 'h',
            qty: 1,
          }));
        });

        test('keep highest for `5dFk4`', () => {
          const parsed = Parser.parse('5dFk4');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].notation).toEqual('5dF');
          expect(parsed[0].sides).toEqual('F.2');
          expect(parsed[0].qty).toEqual(5);

          expect(parsed[0].modifiers.has('KeepModifier-h')).toBe(true);

          const mod = parsed[0].modifiers.get('KeepModifier-h');
          expect(mod).toBeInstanceOf(KeepModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'k4',
            end: 'h',
            qty: 4,
          }));
        });

        test('keep lowest for `10d%kl3`', () => {
          const parsed = Parser.parse('10d%kl3');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].notation).toEqual('10d%');
          expect(parsed[0].sides).toEqual('%');
          expect(parsed[0].qty).toEqual(10);

          expect(parsed[0].modifiers.has('KeepModifier-l')).toBe(true);

          const mod = parsed[0].modifiers.get('KeepModifier-l');
          expect(mod).toBeInstanceOf(KeepModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'kl3',
            end: 'l',
            qty: 3,
          }));
        });
      });

      describe('Re-roll', () => {
        test('re-roll for `5d10r`', () => {
          const parsed = Parser.parse('5d10r');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].notation).toEqual('5d10');
          expect(parsed[0].sides).toEqual(10);
          expect(parsed[0].qty).toEqual(5);

          expect(parsed[0].modifiers.has('ReRollModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('ReRollModifier');
          expect(mod).toBeInstanceOf(ReRollModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'r',
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

          expect(parsed[0].notation).toEqual('12dF');
          expect(parsed[0].sides).toEqual('F.2');
          expect(parsed[0].qty).toEqual(12);

          expect(parsed[0].modifiers.has('ReRollModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('ReRollModifier');
          expect(mod).toBeInstanceOf(ReRollModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'r',
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

          expect(parsed[0].notation).toEqual('2d%');
          expect(parsed[0].sides).toEqual('%');
          expect(parsed[0].qty).toEqual(2);

          expect(parsed[0].modifiers.has('ReRollModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('ReRollModifier');
          expect(mod).toBeInstanceOf(ReRollModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'r>80',
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

          expect(parsed[0].notation).toEqual('35dF.1');
          expect(parsed[0].sides).toEqual('F.1');
          expect(parsed[0].qty).toEqual(35);

          expect(parsed[0].modifiers.has('ReRollModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('ReRollModifier');
          expect(mod).toBeInstanceOf(ReRollModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'ro',
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

          expect(parsed[0].notation).toEqual('d64');
          expect(parsed[0].sides).toEqual(64);
          expect(parsed[0].qty).toEqual(1);

          expect(parsed[0].modifiers.has('ReRollModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('ReRollModifier');
          expect(mod).toBeInstanceOf(ReRollModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'ro<=35',
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

          expect(parsed[0].notation).toEqual('10d5');
          expect(parsed[0].sides).toEqual(5);
          expect(parsed[0].qty).toEqual(10);

          expect(parsed[0].modifiers.has('SortingModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('SortingModifier');
          expect(mod).toBeInstanceOf(SortingModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 's',
            direction: 'a',
          }));
        });

        test('sort ascending for 23dF.1sa', () => {
          const parsed = Parser.parse('23dF.1sa');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(FudgeDice);

          expect(parsed[0].notation).toEqual('23dF.1');
          expect(parsed[0].sides).toEqual('F.1');
          expect(parsed[0].qty).toEqual(23);

          expect(parsed[0].modifiers.has('SortingModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('SortingModifier');
          expect(mod).toBeInstanceOf(SortingModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'sa',
            direction: 'a',
          }));
        });

        test('sort descending for 14d%sd', () => {
          const parsed = Parser.parse('14d%sd');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(PercentileDice);

          expect(parsed[0].notation).toEqual('14d%');
          expect(parsed[0].sides).toEqual('%');
          expect(parsed[0].qty).toEqual(14);

          expect(parsed[0].modifiers.has('SortingModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('SortingModifier');
          expect(mod).toBeInstanceOf(SortingModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'sd',
            direction: 'd',
          }));
        });
      });

      describe('Target', () => {
        describe('Success', () => {
          test('success for `8d45=21`', () => {
            const parsed = Parser.parse('8d45=21');

            expect(parsed).toBeInstanceOf(Array);
            expect(parsed).toHaveLength(1);
            expect(parsed[0]).toBeInstanceOf(StandardDice);

            expect(parsed[0].notation).toEqual('8d45');
            expect(parsed[0].sides).toEqual(45);
            expect(parsed[0].qty).toEqual(8);

            expect(parsed[0].modifiers.has('TargetModifier')).toBe(true);

            const mod = parsed[0].modifiers.get('TargetModifier');
            expect(mod).toBeInstanceOf(TargetModifier);
            expect(mod.toJSON()).toEqual(expect.objectContaining({
              notation: '=21',
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
            expect(parsed[0]).toBeInstanceOf(StandardDice);

            expect(parsed[0].notation).toEqual('dF');
            expect(parsed[0].sides).toEqual('F.2');
            expect(parsed[0].qty).toEqual(1);

            expect(parsed[0].modifiers.has('TargetModifier')).toBe(true);

            const mod = parsed[0].modifiers.get('TargetModifier');
            expect(mod).toBeInstanceOf(TargetModifier);
            expect(mod.toJSON()).toEqual(expect.objectContaining({
              notation: '>=0',
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

            expect(parsed[0].notation).toEqual('4d%');
            expect(parsed[0].sides).toEqual('%');
            expect(parsed[0].qty).toEqual(4);

            expect(parsed[0].modifiers.has('TargetModifier')).toBe(true);

            const mod = parsed[0].modifiers.get('TargetModifier');
            expect(mod).toBeInstanceOf(TargetModifier);
            expect(mod.toJSON()).toEqual(expect.objectContaining({
              notation: '>50f<40',
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

            expect(parsed[0].notation).toEqual('450dF.1');
            expect(parsed[0].sides).toEqual('F.1');
            expect(parsed[0].qty).toEqual(450);

            expect(parsed[0].modifiers.has('TargetModifier')).toBe(true);

            const mod = parsed[0].modifiers.get('TargetModifier');
            expect(mod).toBeInstanceOf(TargetModifier);
            expect(mod.toJSON()).toEqual(expect.objectContaining({
              notation: '>0f!=1',
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

      describe('Multiple modifiers', () => {
        test('use success and explode together `6d10>=8!>=9`', () => {
          const parsed = Parser.parse('6d10>=8!>=9');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].notation).toEqual('6d10');
          expect(parsed[0].sides).toEqual(10);
          expect(parsed[0].qty).toEqual(6);

          expect(parsed[0].modifiers.has('TargetModifier')).toBe(true);

          let mod = parsed[0].modifiers.get('TargetModifier');
          expect(mod).toBeInstanceOf(TargetModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: '>=8',
            successComparePoint: expect.objectContaining({
              operator: '>=',
              value: 8,
            }),
            failureComparePoint: null,
          }));

          expect(parsed[0].modifiers.has('ExplodeModifier')).toBe(true);

          mod = parsed[0].modifiers.get('ExplodeModifier');
          expect(mod).toBeInstanceOf(ExplodeModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: '!>=9',
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

          expect(parsed[0].notation).toEqual('6d10');
          expect(parsed[0].sides).toEqual(10);
          expect(parsed[0].qty).toEqual(6);

          expect(parsed[0].modifiers.has('TargetModifier')).toBe(true);

          let mod = parsed[0].modifiers.get('TargetModifier');
          expect(mod).toBeInstanceOf(TargetModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: '>=8',
            successComparePoint: expect.objectContaining({
              operator: '>=',
              value: 8,
            }),
            failureComparePoint: null,
          }));

          expect(parsed[0].modifiers.has('ExplodeModifier')).toBe(true);

          mod = parsed[0].modifiers.get('ExplodeModifier');
          expect(mod).toBeInstanceOf(ExplodeModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: '!>=9',
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

          expect(parsed[0].notation).toEqual('10d8');
          expect(parsed[0].sides).toEqual(8);
          expect(parsed[0].qty).toEqual(10);

          expect(parsed[0].modifiers.has('DropModifier-h')).toBe(true);

          let mod = parsed[0].modifiers.get('DropModifier-h');
          expect(mod).toBeInstanceOf(DropModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'dh2',
            end: 'h',
            qty: 2,
          }));

          expect(parsed[0].modifiers.has('KeepModifier-l')).toBe(true);

          mod = parsed[0].modifiers.get('KeepModifier-l');
          expect(mod).toBeInstanceOf(KeepModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'kl3',
            end: 'l',
            qty: 3,
          }));

          expect(parsed[0].modifiers.has('ReRollModifier')).toBe(true);

          mod = parsed[0].modifiers.get('ReRollModifier');
          expect(mod).toBeInstanceOf(ReRollModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: 'r!=5',
            once: false,
            comparePoint: expect.objectContaining({
              operator: '!=',
              value: 5,
            }),
          }));
        });

        test('multiple of the same operator just keeps the last one', () => {
          const parsed = Parser.parse('42d2!=6!!>4!p<5');

          expect(parsed).toBeInstanceOf(Array);
          expect(parsed).toHaveLength(1);
          expect(parsed[0]).toBeInstanceOf(StandardDice);

          expect(parsed[0].notation).toEqual('42d2');
          expect(parsed[0].sides).toEqual(2);
          expect(parsed[0].qty).toEqual(42);

          expect(parsed[0].modifiers.has('ExplodeModifier')).toBe(true);

          const mod = parsed[0].modifiers.get('ExplodeModifier');
          expect(mod).toBeInstanceOf(ExplodeModifier);
          expect(mod.toJSON()).toEqual(expect.objectContaining({
            notation: '!p<5',
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
        expect(parsed[0]).toEqual(expect.objectContaining({
          notation: '(4*6)d6',
          sides: 6,
          qty: 24,
        }));
      });

      test('can parse `3d(5/2)`', () => {
        const parsed = Parser.parse('3d(5/2)');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0]).toEqual(expect.objectContaining({
          notation: '3d(5/2)',
          sides: 2.5,
          qty: 3,
        }));
      });

      test('can parse `(5^2*4)d(7%4)`', () => {
        const parsed = Parser.parse('(5^2*4)d(7%4)');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0]).toEqual(expect.objectContaining({
          notation: '(5^2*4)d(7%4)',
          sides: 3,
          qty: 100,
        }));
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
          expect(parsed[1]).toEqual(expect.objectContaining({
            notation: '4d6',
            sides: 6,
            qty: 4,
          }));

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
          expect(parsed[1]).toEqual(expect.objectContaining({
            notation: '4d6',
            sides: 6,
            qty: 4,
          }));

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
        expect(parsed[0]).toEqual(expect.objectContaining({
          notation: '6d10',
          sides: 10,
          qty: 6,
        }));

        expect(parsed[1]).toEqual('*');

        expect(parsed[2]).toBeInstanceOf(FudgeDice);
        expect(parsed[2]).toEqual(expect.objectContaining({
          notation: '4dF.1',
          sides: 'F.1',
          qty: 4,
        }));
      });

      test('can parse `(10d7/2d3)*4`', () => {
        const parsed = Parser.parse('(10d7/2d%)*4');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(7);

        expect(parsed[0]).toEqual('(');

        expect(parsed[1]).toBeInstanceOf(StandardDice);
        expect(parsed[1]).toEqual(expect.objectContaining({
          notation: '10d7',
          sides: 7,
          qty: 10,
        }));

        expect(parsed[2]).toEqual('/');

        expect(parsed[3]).toBeInstanceOf(PercentileDice);
        expect(parsed[3]).toEqual(expect.objectContaining({
          notation: '2d%',
          sides: '%',
          qty: 2,
        }));

        expect(parsed[4]).toEqual(')');
        expect(parsed[5]).toEqual('*');
        expect(parsed[6]).toBe(4);
      });

      test('can parse `d%%(45*2)', () => {
        const parsed = Parser.parse('d%%(45*2)');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(7);

        expect(parsed[0]).toBeInstanceOf(PercentileDice);
        expect(parsed[0]).toEqual(expect.objectContaining({
          notation: 'd%',
          sides: '%',
          qty: 1,
        }));

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
        expect(parsed[3]).toEqual(expect.objectContaining({
          notation: '3dF',
          sides: 'F.2',
          qty: 3,
        }));

        expect(parsed[4]).toEqual(')');
        expect(parsed[5]).toEqual('*');
        expect(parsed[6]).toBe(6.7);
        expect(parsed[7]).toEqual('-');
        expect(parsed[8]).toEqual('(');

        expect(parsed[9]).toBeInstanceOf(StandardDice);
        expect(parsed[9]).toEqual(expect.objectContaining({
          notation: '10d45',
          sides: 45,
          qty: 10,
        }));

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
        expect(parsed[1]).toEqual(expect.objectContaining({
          notation: '(4*2)d10',
          sides: 10,
          qty: 8,
        }));

        expect(parsed[2]).toEqual('/');
        expect(parsed[3]).toBe(4);
        expect(parsed[4]).toEqual(')');
        expect(parsed[5]).toEqual('^');
        expect(parsed[6]).toBe(5);
        expect(parsed[7]).toEqual('*');
        expect(parsed[8]).toEqual('(');

        expect(parsed[9]).toBeInstanceOf(PercentileDice);
        expect(parsed[9]).toEqual(expect.objectContaining({
          notation: 'd%',
          sides: '%',
          qty: 1,
        }));

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
        expect(parsed[3]).toEqual(expect.objectContaining({
          notation: '4d10',
          sides: 10,
          qty: 4,
        }));

        expect(parsed[4]).toEqual('/');
        expect(parsed[5]).toBe(3.4);
        expect(parsed[6]).toEqual(')');
      });

      test('can parse `4d10!!p/(23*d12r)`', () => {
        const parsed = Parser.parse('4d10!!p/(23*d12r)');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(7);

        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0]).toEqual(expect.objectContaining({
          notation: '4d10',
          sides: 10,
          qty: 4,
        }));

        expect(parsed[0].modifiers.has('ExplodeModifier')).toBe(true);

        let mod = parsed[0].modifiers.get('ExplodeModifier');
        expect(mod).toBeInstanceOf(ExplodeModifier);
        expect(mod.toJSON()).toEqual(expect.objectContaining({
          notation: '!!p',
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
        expect(parsed[5]).toEqual(expect.objectContaining({
          notation: 'd12',
          sides: 12,
          qty: 1,
        }));

        expect(parsed[5].modifiers.has('ReRollModifier')).toBe(true);

        mod = parsed[5].modifiers.get('ReRollModifier');
        expect(mod).toBeInstanceOf(ReRollModifier);
        expect(mod.toJSON()).toEqual(expect.objectContaining({
          notation: 'r',
          once: false,
          comparePoint: expect.objectContaining({
            operator: '=',
            value: 1,
          }),
        }));
      });
    });

    describe('Roll high', () => {
      test('can roll with a stupidly high qty', () => {
        const parsed = Parser.parse('9999999999d6');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0]).toEqual(expect.objectContaining({
          notation: '9999999999d6',
          sides: 6,
          qty: 9999999999,
        }));
      });

      test('can roll with a stupidly high sides', () => {
        const parsed = Parser.parse('d9999999999');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0]).toEqual(expect.objectContaining({
          notation: 'd9999999999',
          sides: 9999999999,
          qty: 1,
        }));
      });

      test('can roll with a stupidly high everything', () => {
        const parsed = Parser.parse('9999999999d9999999999');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0]).toEqual(expect.objectContaining({
          notation: '9999999999d9999999999',
          sides: 9999999999,
          qty: 9999999999,
        }));
      });
    });

    describe('Negative numbers', () => {
      test('roll `1d20+-5`', () => {
        const parsed = Parser.parse('1d20+-5');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(3);

        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0]).toEqual(expect.objectContaining({
          notation: '1d20',
          sides: 20,
          qty: 1,
        }));

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
        expect(parsed[2]).toEqual(expect.objectContaining({
          notation: '1d20',
          sides: 20,
          qty: 1,
        }));
      });

      test('can parse `(-2+5)d(6+-4)`', () => {
        const parsed = Parser.parse('(-2+5)d(6+-4)');

        expect(parsed).toBeInstanceOf(Array);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBeInstanceOf(StandardDice);
        expect(parsed[0]).toEqual(expect.objectContaining({
          notation: '(-2+5)d(6+-4)',
          sides: 2,
          qty: 3,
        }));
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
  });
});
