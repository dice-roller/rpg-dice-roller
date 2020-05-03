import math from 'mathjs-expression-parser';
import DiceRoll from '../src/DiceRoll';
import Parser from '../src/parser/Parser';
import StandardDice from '../src/dice/StandardDice';
import RollResults from '../src/results/RollResults';
import RollResult from '../src/results/RollResult';
import { exportFormats } from '../src/utilities/utils';
import NotationError from '../src/exceptions/NotationError';
import RequiredArgumentError from '../src/exceptions/RequiredArgumentErrorError';
import DataFormatError from '../src/exceptions/DataFormatError';

describe('DiceRoll', () => {
  describe('Initialisation', () => {
    test('model structure', () => {
      const diceRoll = new DiceRoll('4d10');

      expect(diceRoll).toBeInstanceOf(DiceRoll);
      expect(diceRoll).toEqual(expect.objectContaining({
        notation: '4d10',
        output: expect.any(String),
        rolls: expect.any(Array),
        total: expect.any(Number),
        export: expect.any(Function),
        hasRolls: expect.any(Function),
        roll: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
      }));
    });
  });

  describe('Notation', () => {
    test('cannot be changed', () => {
      const diceRoll = new DiceRoll('4d10');

      expect(() => {
        diceRoll.notation = 'Foo';
      }).toThrow(TypeError);
    });

    test('can be string', () => {
      const diceRoll = new DiceRoll('5d10+4d7');

      expect(diceRoll.notation).toBe('5d10+4d7');
    });

    test('can be object with notation property', () => {
      const diceRoll = new DiceRoll({ notation: '3d%*(4+2)dF' });

      expect(diceRoll.notation).toBe('3d%*(4+2)dF');
    });

    test('throws error if invalid type', () => {
      expect(() => {
        new DiceRoll(['4d10']);
      }).toThrow(NotationError);

      expect(() => {
        new DiceRoll({ notation: [] });
      }).toThrow(NotationError);

      expect(() => {
        new DiceRoll({ notation: {} });
      }).toThrow(NotationError);
    });

    test('is required', () => {
      expect(() => {
        new DiceRoll();
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new DiceRoll(false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new DiceRoll(null);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new DiceRoll(undefined);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new DiceRoll({});
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new DiceRoll({ notation: null });
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new DiceRoll({ notation: false });
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new DiceRoll({ notation: undefined });
      }).toThrow(RequiredArgumentError);

      expect(() => {
        new DiceRoll({ notation: 0 });
      }).toThrow(RequiredArgumentError);
    });

    test('cannot change value', () => {
      const diceRoll = new DiceRoll('4d8');

      expect(() => {
        diceRoll.notation = 'Foo';
      }).toThrow(TypeError);
    });
  });

  describe('Parsing', () => {
    test('constructor calls parser with notation', () => {
      const spy = jest.spyOn(Parser, 'parse');
      const notation = '4d10*7d5';

      // initialise with string notation
      new DiceRoll(notation);
      expect(spy).toHaveBeenCalledWith(notation);
      expect(spy).toHaveBeenCalledTimes(1);

      // initialise with object notation
      new DiceRoll({ notation });
      expect(spy).toHaveBeenCalledWith(notation);
      expect(spy).toHaveBeenCalledTimes(2);

      // remove the spy
      spy.mockRestore();
    });
  });

  describe('Roll', () => {
    test('constructor rolls notation', () => {
      const spy = jest.spyOn(DiceRoll.prototype, 'roll');

      // initialise with string notation
      new DiceRoll('4d8');
      expect(spy).toHaveBeenCalledTimes(1);

      // initialise with string notation
      new DiceRoll({ notation: '4d8' });
      expect(spy).toHaveBeenCalledTimes(2);

      // remove the spy
      spy.mockRestore();
    });

    test('roll calls dice roll', () => {
      const spy = jest.spyOn(StandardDice.prototype, 'roll');

      // initialise with string notation
      new DiceRoll('4d8*(5+2d10)');
      expect(spy).toHaveBeenCalledTimes(2); // once for each dice notation

      // reset the mock
      spy.mockReset();

      // initialise with object notation
      new DiceRoll({ notation: '(2*3)d6!p/4+10d%dh2-5d3' });
      expect(spy).toHaveBeenCalledTimes(3); // once for each dice notation

      // remove the spy
      spy.mockRestore();
    });

    test('roll returns results', () => {
      const diceRoll = new DiceRoll('4d8*(5+2d10)');
      const results = diceRoll.roll();

      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveLength(2);

      expect(results[0]).toBeInstanceOf(RollResults);
      expect(results[1]).toBeInstanceOf(RollResults);
    });

    test('stores correct results', () => {
      const diceRoll = new DiceRoll('4d8*(5+2d10)');

      // mock the roll values
      const roll1 = new RollResults([6, 2, 5, 8]);
      const roll2 = new RollResults([3, 9]);
      jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => roll1)
        .mockImplementationOnce(() => roll2);

      const results = diceRoll.roll();

      expect(results).toEqual([roll1, roll2]);

      jest.restoreAllMocks();
    });

    describe('Define rolls in constructor', () => {
      test('can define rolls in constructor notation object', () => {
        const rolls = [
          new RollResults([2, 8, 5, 4]),
          new RollResults([8]),
        ];
        const diceRoll = new DiceRoll({
          notation: '3d%*(4+2)dF',
          rolls,
        });

        expect(diceRoll.rolls).toEqual(rolls);
      });

      test('can be array of RollResult objects', () => {
        const rolls = [
          [
            new RollResult(2),
            new RollResult(8),
            new RollResult(5),
            new RollResult(4),
          ],
          [
            new RollResult(8),
          ],
        ];
        const diceRoll = new DiceRoll({
          notation: '3d%*(4+2)dF',
          rolls,
        });

        expect(diceRoll.rolls).toEqual([
          new RollResults(rolls[0]),
          new RollResults(rolls[1]),
        ]);
      });

      test('can be array of numbers', () => {
        const rolls = [
          [2, 8, 5, 4],
          [8],
        ];
        const diceRoll = new DiceRoll({
          notation: '3d%*(4+2)dF',
          rolls,
        });

        expect(diceRoll.rolls).toEqual([
          new RollResults(rolls[0]),
          new RollResults(rolls[1]),
        ]);
      });

      test('can be array of plain objects', () => {
        const rolls = [
          {
            rolls: [2, 8, 5, 4],
          },
          {
            rolls: [8],
          },
        ];
        const diceRoll = new DiceRoll({
          notation: '3d%*(4+2)dF',
          rolls,
        });

        expect(diceRoll.rolls).toEqual([
          new RollResults(rolls[0].rolls),
          new RollResults(rolls[1].rolls),
        ]);
      });

      test('can be empty', () => {
        const spy = jest.spyOn(StandardDice.prototype, 'roll');

        new DiceRoll({
          notation: '6d6',
          rolls: [],
        });

        expect(spy).toHaveBeenCalledTimes(1);

        // remove the spy
        spy.mockRestore();
      });

      test('must be array', () => {
        expect(() => {
          new DiceRoll({
            notation: '3d6',
            rolls: 'foo',
          });
        }).toThrow(TypeError);

        expect(() => {
          new DiceRoll({
            notation: '3d6',
            rolls: {},
          });
        }).toThrow(TypeError);

        expect(() => {
          new DiceRoll({
            notation: '3d6',
            rolls: true,
          });
        }).toThrow(TypeError);
      });

      test('does not roll if rolls passed to constructor', () => {
        const spy = jest.spyOn(StandardDice.prototype, 'roll');

        // initialise with object notation
        new DiceRoll({
          notation: '6d6',
          rolls: [
            [2, 3, 1, 6, 4, 5],
          ],
        });
        expect(spy).not.toHaveBeenCalled();

        // remove the spy
        spy.mockRestore();
      });
    });
  });

  describe('Rolls', () => {
    test('is list of rolls', () => {
      const diceRoll = new DiceRoll('4d8');
      const rolls = diceRoll.roll();

      expect(diceRoll.rolls).toBe(rolls);
    });

    test('cannot change value', () => {
      const diceRoll = new DiceRoll('4d8');

      expect(() => {
        diceRoll.rolls = [new RollResults([7])];
      }).toThrow(TypeError);
    });
  });

  describe('Has Rolls', () => {
    test('returns true if rolls exist', () => {
      const diceRoll = new DiceRoll('4d8');

      expect(diceRoll.hasRolls()).toBe(true);
    });

    test('returns false if rolls do not exist', () => {
      const diceRoll = new DiceRoll('4+8');

      expect(diceRoll.hasRolls()).toBe(false);
    });
  });

  describe('Total', () => {
    test('calls RollResults value', () => {
      const spy = jest.spyOn(RollResults.prototype, 'value', 'get');
      const diceRoll = new DiceRoll('4d8');

      // call the total getter
      expect(diceRoll.total).toBeGreaterThanOrEqual(1);

      expect(spy).toHaveBeenCalledTimes(1);

      // remove the spy
      spy.mockRestore();
    });

    test('calls math.eval', () => {
      // mock the roll values
      jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => new RollResults([6, 2, 5, 8]))
        .mockImplementationOnce(() => new RollResults([3, 9]));

      const diceRoll = new DiceRoll('4d8*(5+2d10)');
      const spy = jest.spyOn(math, 'eval');

      expect(diceRoll.total).toBe(357);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('21*(5+12)');

      // remove the spy
      spy.mockRestore();
      jest.restoreAllMocks();
    });

    test('equal to total roll values', () => {
      // mock the roll values
      const roll = new RollResults([6, 2, 5, 8]);
      jest.spyOn(StandardDice.prototype, 'roll').mockImplementation(() => roll);

      const diceRoll = new DiceRoll('4d8');

      // assert that the total matches
      expect(diceRoll.total).toBe(21);

      jest.restoreAllMocks();
    });

    test('equal to rolls with equation', () => {
      // mock the roll values
      const roll1 = new RollResults([3, 2, 7, 5]);
      const roll2 = new RollResults([5, 2, 4, 2, 1, 6, 5]);
      jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementationOnce(() => roll1)
        .mockImplementationOnce(() => roll2);

      const diceRoll = new DiceRoll('4d8/(5+2)d6');
      const spy = jest.spyOn(math, 'eval');

      // assert that the total matches
      expect(diceRoll.total).toBeCloseTo(0.68);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('17/25');

      jest.restoreAllMocks();
    });

    test('equal to rolls with modifiers', () => {
      // mock the roll values
      jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => new RollResult(6))
        .mockImplementationOnce(() => new RollResult(2))
        .mockImplementationOnce(() => new RollResult(5))
        .mockImplementationOnce(() => new RollResult(8))
        .mockImplementationOnce(() => new RollResult(3))
        .mockImplementationOnce(() => new RollResult(9));

      const diceRoll = new DiceRoll('4d8dl2*(5+2d10kh1)');
      const spy = jest.spyOn(math, 'eval');

      // assert that the total matches
      expect(diceRoll.total).toBe(196);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('14*(5+9)');

      jest.restoreAllMocks();
    });

    test('returns 0 if no rolls', () => {
      const diceRoll = new DiceRoll('4+8');

      expect(diceRoll.total).toBe(0);
    });

    test('cannot change value', () => {
      const diceRoll = new DiceRoll('4d8');

      expect(() => {
        diceRoll.total = 57;
      }).toThrow(TypeError);
    });
  });

  describe('Output', () => {
    test('returns notation and rolls as a string', () => {
      // mock the roll values
      jest.spyOn(StandardDice.prototype, 'roll')
        .mockImplementation(() => new RollResults([6, 2, 5, 8]));

      const notation = '4d8';
      const diceRoll = new DiceRoll(notation);

      expect(diceRoll.output).toEqual(`${notation}: [6, 2, 5, 8] = 21`);

      jest.restoreAllMocks();
    });

    test('calls RollResults toString', () => {
      // mock the roll values
      jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => new RollResult(6))
        .mockImplementationOnce(() => new RollResult(2))
        .mockImplementationOnce(() => new RollResult(5))
        .mockImplementationOnce(() => new RollResult(8))
        .mockImplementationOnce(() => new RollResult(3))
        .mockImplementationOnce(() => new RollResult(9));

      const notation = '4d8dl2*(5+2d10kh1)';
      const diceRoll = new DiceRoll(notation);
      const spy = jest.spyOn(RollResults.prototype, 'toString');

      expect(diceRoll.output).toEqual(`${notation}: [6, 2d, 5d, 8]*(5+[3d, 9]) = 196`);
      expect(spy).toHaveBeenCalledTimes(2);

      jest.restoreAllMocks();
    });

    test('returns success / failure count as total', () => {
      // mock the roll values
      jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => new RollResult(6))
        .mockImplementationOnce(() => new RollResult(2))
        .mockImplementationOnce(() => new RollResult(5))
        .mockImplementationOnce(() => new RollResult(8));

      const notation = '4d6>5f<=2';
      const diceRoller = new DiceRoll(notation);

      expect(diceRoller.output).toEqual(`${notation}: [6*, 2_, 5, 8*] = 1`);

      jest.restoreAllMocks();
    });

    test('Handles success / failure with normal rolls', () => {
      // mock the roll values
      jest.spyOn(StandardDice.prototype, 'rollOnce')
        .mockImplementationOnce(() => new RollResult(6))
        .mockImplementationOnce(() => new RollResult(2))
        .mockImplementationOnce(() => new RollResult(5))
        .mockImplementationOnce(() => new RollResult(8))
        .mockImplementationOnce(() => new RollResult(3))
        .mockImplementationOnce(() => new RollResult(5));

      const notation = '4d6>5f<=2+2d6';
      const diceRoller = new DiceRoll(notation);

      expect(diceRoller.output).toEqual(`${notation}: [6*, 2_, 5, 8*]+[3, 5] = 9`);

      jest.restoreAllMocks();
    });

    test('show message if no rolls', () => {
      const diceRoll = new DiceRoll('4+8');

      expect(diceRoll.output).toBe('4+8: No dice rolled');
    });

    describe('toJSON', () => {
      test('JSON output is correct', () => {
        const diceRoll = new DiceRoll('4d8');

        // json encode, to get the encoded string, then decode so we can compare the object
        // this allows us to check that the output is correct, but ignoring the order of the
        // returned properties
        expect(JSON.parse(JSON.stringify(diceRoll))).toEqual({
          notation: diceRoll.notation,
          output: diceRoll.output,
          rolls: JSON.parse(JSON.stringify(diceRoll.rolls)),
          total: diceRoll.total,
          type: 'dice-roll',
        });
      });
    });

    describe('toString', () => {
      test('toString uses output', () => {
        const diceRoll = new DiceRoll('4d8');
        const spy = jest.spyOn(diceRoll, 'output', 'get');

        // cast to a string and check the output
        expect(diceRoll.toString()).toEqual(diceRoll.output);

        expect(spy).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Export', () => {
    let notation; let diceRoll; let
      rolls;

    beforeEach(() => {
      notation = '4d8+6d10';

      rolls = [
        new RollResults([
          7, 4, 3, 6,
        ]),
        new RollResults([
          8, 4, 2, 1, 6, 10,
        ]),
      ];

      diceRoll = new DiceRoll(notation, rolls);
    });

    test('can export to valid JSON', () => {
      const exported = diceRoll.export(exportFormats.JSON);

      expect(exported).toEqual(JSON.stringify(diceRoll));
    });

    test('can export to valid base64', () => {
      const exported = diceRoll.export(exportFormats.BASE_64);

      // check that it's valid base64 being decoding, re-encoding, and comparing the values
      expect(btoa(atob(exported))).toEqual(exported);
      // assert that the base64 encoded string is a JSON object of the dice roll
      expect(atob(exported)).toEqual(JSON.stringify(diceRoll));
    });

    test('can export to plain object', () => {
      const exported = diceRoll.export(exportFormats.OBJECT);

      expect(exported).toBeInstanceOf(Object);
      expect(exported).toEqual(JSON.parse(JSON.stringify(diceRoll)));
    });

    test('default export to JSON', () => {
      const exported = diceRoll.export();

      expect(exported).toEqual(JSON.stringify(diceRoll));
    });

    test('Invalid export format throws error', () => {
      expect(() => {
        diceRoll.export('foo');
      }).toThrow(TypeError);
    });
  });

  describe('Import', () => {
    let diceRoll;

    beforeEach(() => {
      diceRoll = new DiceRoll('4d6/7+2d10dl1');
    });

    test('requires data', () => {
      expect(() => {
        DiceRoll.import();
      }).toThrow(RequiredArgumentError);

      expect(() => {
        DiceRoll.import(false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        DiceRoll.import(null);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        DiceRoll.import(undefined);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        DiceRoll.import(0);
      }).toThrow(RequiredArgumentError);
    });

    test('can import JSON encoded string', () => {
      const exported = diceRoll.export(exportFormats.JSON);
      const importedRoll = DiceRoll.import(exported);

      expect(importedRoll).toBeInstanceOf(DiceRoll);
      expect(importedRoll.export(exportFormats.JSON)).toEqual(exported);
    });

    test('can import base64 encoded object', () => {
      const exported = diceRoll.export(exportFormats.BASE_64);
      const importedRoll = DiceRoll.import(exported);

      expect(importedRoll).toBeInstanceOf(DiceRoll);
      expect(importedRoll.export(exportFormats.BASE_64)).toEqual(exported);
    });

    test('can import plain object', () => {
      const exported = diceRoll.export(exportFormats.OBJECT);
      const importedRoll = DiceRoll.import(exported);

      expect(importedRoll).toBeInstanceOf(DiceRoll);
      expect(importedRoll.export(exportFormats.OBJECT)).toEqual(exported);
    });

    test('importing a DiceRoll object returns itself', () => {
      expect(DiceRoll.import(diceRoll)).toBe(diceRoll);
    });

    test('invalid format throws error', () => {
      expect(() => {
        DiceRoll.import('foo');
      }).toThrow(DataFormatError);

      expect(() => {
        DiceRoll.import(true);
      }).toThrow(DataFormatError);

      expect(() => {
        DiceRoll.import(1);
      }).toThrow(DataFormatError);
    });
  });
});
