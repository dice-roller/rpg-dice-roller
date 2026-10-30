import { DataFormatError, NotationError, RequiredArgumentError } from '../src/exceptions/index.js';
import DiceRoll from '../src/DiceRoll.js';
import DiceRoller from '../src/DiceRoller.js';
import exportFormats from '../src/utilities/ExportFormats.js';

describe('DiceRoller', () => {
  let roller;

  beforeEach(() => {
    roller = new DiceRoller();
  });

  describe('Initialisation', () => {
    test('model structure', () => {
      expect(roller).toBeInstanceOf(DiceRoller);
      expect(roller).toEqual(expect.objectContaining({
        log: [],
        output: '',
        total: 0,
        clearLog: expect.any(Function),
        export: expect.any(Function),
        import: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
        roll: expect.any(Function),
      }));
    });

    test('passing data in constructor passes it to `import`', () => {
      const spy = jest.spyOn(DiceRoller.prototype, 'import');
      const data = [new DiceRoll('4d6')];
      roller = new DiceRoller(data);

      expect(spy).toHaveBeenCalled();
      expect(spy).toBeCalledWith(data);

      // remove the spy
      spy.mockRestore();
    });
  });

  describe('Rolling', () => {
    test('rolling single notation returns DiceRoll object', () => {
      const roll = roller.roll('4d6+5d8');

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('4d6+5d8');
    });

    test('rolling multiple notations returns array of DiceRoll objects', () => {
      const notations = ['4d6+5d8', '2d10*4', '5/6d6'];
      const rolls = roller.roll(...notations);

      expect(rolls).toBeInstanceOf(Array);
      expect(rolls).toHaveLength(notations.length);

      expect(rolls[0]).toBeInstanceOf(DiceRoll);
      expect(rolls[0].notation).toEqual(notations[0]);

      expect(rolls[1]).toBeInstanceOf(DiceRoll);
      expect(rolls[1].notation).toEqual(notations[1]);

      expect(rolls[2]).toBeInstanceOf(DiceRoll);
      expect(rolls[2].notation).toEqual(notations[2]);
    });

    test('no notation throws error', () => {
      expect(() => {
        roller.roll();
      }).toThrow(RequiredArgumentError);

      expect(() => {
        roller.roll(false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        roller.roll(null);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        roller.roll(undefined);
      }).toThrow(RequiredArgumentError);
    });

    test('notation must be string', () => {
      expect(() => {
        roller.roll({});
      }).toThrow(RequiredArgumentError);

      expect(() => {
        roller.roll([]);
      }).toThrow(NotationError);

      expect(() => {
        roller.roll(true);
      }).toThrow(NotationError);

      expect(() => {
        roller.roll(45);
      }).toThrow(NotationError);
    });
  });

  describe('Log', () => {
    test('is empty array before rolling', () => {
      expect(roller.log).toBeInstanceOf(Array);
      expect(roller.log).toHaveLength(0);
    });

    test('rolls are added to log', () => {
      const rolls = [];

      // roll once
      rolls.push(roller.roll('2d4'));

      expect(roller.log).toHaveLength(1);
      expect(roller.log).toEqual(rolls);

      // roll again
      rolls.push(roller.roll('5d10+7d4'));

      expect(roller.log).toHaveLength(2);
      expect(roller.log).toEqual(rolls);

      // roll several
      rolls.push(...roller.roll('2d8', '5d10dl2', '3d6!'));

      expect(roller.log).toHaveLength(5);
      expect(roller.log).toEqual(rolls);
    });

    test('can clear log', () => {
      // roll once
      roller.roll('2d4');

      expect(roller.log).toHaveLength(1);

      // clear the log
      roller.clearLog();

      // assert still an array, but empty
      expect(roller.log).toBeInstanceOf(Array);
      expect(roller.log).toHaveLength(0);

      // roll several
      roller.roll('2d8', '5d10dl2', '3d6!');

      expect(roller.log).toHaveLength(3);

      // clear the log
      roller.clearLog();

      // assert still an array, but empty
      expect(roller.log).toBeInstanceOf(Array);
      expect(roller.log).toHaveLength(0);
    });

    test('cannot modify log', () => {
      expect(() => {
        roller.log = [];
      }).toThrow(TypeError);

      expect(() => {
        roller.log = {};
      }).toThrow(TypeError);

      expect(() => {
        roller.log = 'foo';
      }).toThrow(TypeError);

      expect(() => {
        roller.log = false;
      }).toThrow(TypeError);

      expect(() => {
        roller.log = null;
      }).toThrow(TypeError);

      expect(() => {
        roller.log = undefined;
      }).toThrow(TypeError);
    });
  });

  describe('Total', () => {
    test('is 0 before rolling', () => {
      expect(roller.total).toBe(0);
    });

    test('to be total of roll', () => {
      const roll = roller.roll('4d10*2d4');

      expect(roller.total).toBe(roll.total);
    });

    test('to be total of rolls', () => {
      const rolls = roller.roll('4d10*2d4', '2d10', '4d6');
      const rollTotal = rolls[0].total + rolls[1].total + rolls[2].total;

      expect(roller.total).toBe(rollTotal);
    });

    test('is 0 after log cleared', () => {
      const roll = roller.roll('4d10*2d4');

      expect(roller.total).toBe(roll.total);

      roller.clearLog();

      expect(roller.total).toBe(0);
    });
  });

  describe('Output', () => {
    test('is empty string before rolling', () => {
      expect(roller.output).toEqual('');
    });

    test('returns roll toString', () => {
      const roll = roller.roll('4d10*2d4');

      expect(roller.output).toEqual(roll.toString());
    });

    test('returns semi-colon separated list of rolls', () => {
      const rolls = roller.roll('4d10*2d4', '2d10', '4d6');
      const expectedOutput = rolls.map((roll) => roll.toString()).join('; ');

      expect(roller.output).toEqual(expectedOutput);
    });

    test('is empty string after log cleared', () => {
      const roll = roller.roll('4d10*2d4');

      expect(roller.output).toEqual(roll.toString());

      roller.clearLog();

      expect(roller.output).toEqual('');
    });

    describe('toJSON', () => {
      test('output is correct', () => {
        roller.roll('4d6', '2d10!', '5d8*2d10');

        expect(JSON.parse(JSON.stringify(roller))).toEqual({
          log: JSON.parse(JSON.stringify(roller.log)),
          output: roller.output,
          total: roller.total,
          type: 'dice-roller',
        });
      });
    });

    describe('toString', () => {
      test('toString uses output', () => {
        const spy = jest.spyOn(roller, 'output', 'get');

        // cast to a string and check the output
        expect(roller.toString()).toEqual(roller.output);

        expect(spy).toHaveBeenCalledTimes(2);

        // remove the spy
        spy.mockRestore();
      });
    });
  });

  describe('Export', () => {
    test('can export to valid JSON', () => {
      const exported = roller.export(exportFormats.JSON);

      expect(exported).toEqual(JSON.stringify(roller));
    });

    test('can export to valid base64', () => {
      const exported = roller.export(exportFormats.BASE_64);

      // check that it's valid base64 being decoding, re-encoding, and comparing the values
      expect(btoa(atob(exported))).toEqual(exported);
      // assert that the base64 encoded string is a JSON object of the dice roll
      expect(atob(exported)).toEqual(JSON.stringify(roller));
    });

    test('can export to plain object', () => {
      const exported = roller.export(exportFormats.OBJECT);

      expect(exported).toBeInstanceOf(Object);
      expect(exported).toEqual(JSON.parse(JSON.stringify(roller)));
    });

    test('default export to JSON', () => {
      const exported = roller.export();

      expect(exported).toEqual(JSON.stringify(roller));
    });

    test('Invalid export format throws error', () => {
      expect(() => {
        roller.export('foo');
      }).toThrow(TypeError);
    });
  });

  describe('import', () => {
    describe('static', () => {
      test('calls prototype import', () => {
        const spy = jest.spyOn(DiceRoller.prototype, 'import');
        const exportedRoller = roller.export();

        DiceRoller.import(exportedRoller);

        expect(spy).toHaveBeenCalled();
        expect(spy).toBeCalledWith(exportedRoller);

        // remove the spy
        spy.mockRestore();
      });

      test('returns DiceRoller object', () => {
        expect(DiceRoller.import(roller.export())).toBeInstanceOf(DiceRoller);
      });
    });

    describe('prototype', () => {
      let importRoller;
      let notations;

      beforeEach(() => {
        notations = [
          '4d6dl1', '10d5-3d4!',
        ];

        importRoller = new DiceRoller();
        importRoller.roll(...notations);
      });

      test('data is required', () => {
        expect(() => {
          roller.import();
        }).toThrow(RequiredArgumentError);
      });

      test('can import JSON', () => {
        const data = importRoller.export(exportFormats.JSON);

        roller.import(data);

        expect(roller.export(exportFormats.JSON)).toEqual(data);
      });

      test('can import base64', () => {
        const data = importRoller.export(exportFormats.BASE_64);

        roller.import(data);

        expect(roller.export(exportFormats.BASE_64)).toEqual(data);
      });

      test('can import plain object', () => {
        const data = importRoller.export(exportFormats.OBJECT);

        roller.import(data);

        expect(roller.export(exportFormats.OBJECT)).toEqual(data);
      });

      test('can import data array of logs', () => {
        const data = importRoller.export(exportFormats.OBJECT);

        roller.import(data.log);

        expect(roller.export(exportFormats.OBJECT)).toEqual(data);
      });

      test('returns roll log', () => {
        const data = importRoller.export(exportFormats.JSON);
        const log = roller.import(data);

        expect(log).toBeInstanceOf(Array);

        const logRaw = JSON.parse(JSON.stringify(log));
        const importRaw = JSON.parse(JSON.stringify(importRoller.log));
        expect(logRaw).toEqual(importRaw);
      });

      test('invalid format throws error', () => {
        expect(() => {
          roller.import('foo');
        }).toThrow(DataFormatError);

        expect(() => {
          roller.import(true);
        }).toThrow(DataFormatError);

        expect(() => {
          roller.import(1);
        }).toThrow(DataFormatError);
      });

      test('invalid log throws error', () => {
        expect(() => {
          roller.import({ log: 'foo' });
        }).toThrow(TypeError);
      });
    });
  });
});
