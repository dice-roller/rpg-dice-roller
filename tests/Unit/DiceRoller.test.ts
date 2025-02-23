import { DataFormatError, NotationError, RequiredArgumentError } from '../../src/exceptions';
import DiceRoll from '../../src/DiceRoll';
import DiceRoller from '../../src/DiceRoller';
import { ExportFormat } from '../../src/types/Enums/ExportFormat';
import { DiceRollerJsonOutput } from "../../src/types/Interfaces/Json/DiceRollerJsonOutput";
import { ResultCollectionJsonOutput } from "../../src/types/Interfaces/Json/ResultCollectionJsonOutput";
import { SingleResultJsonOutput } from "../../src/types/Interfaces/Json/SingleResultJsonOutput";
import { ModelType } from "../../src/types/Enums/ModelType";

describe('DiceRoller', () => {
  let roller: DiceRoller;

  beforeEach(() => {
    roller = new DiceRoller();
  });

  describe('Initialisation', () => {
    test('model structure', () => {
      expect(roller).toBeInstanceOf(DiceRoller);
      expect(roller).toEqual(expect.objectContaining({
        log: [],
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
      expect(spy).toHaveBeenCalledWith(data);

      // remove the spy
      spy.mockRestore();
    });
  });

  describe('Rolling', () => {
    test('rolling single notation returns DiceRoll object', () => {
      const roll = roller.roll('4d6+5d8') as DiceRoll;

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('4d6+5d8');
    });

    test('rolling multiple notations returns array of DiceRoll objects', () => {
      const notations = ['4d6+5d8', '2d10*4', '5/6d6'];
      const rolls = roller.roll(...notations) as DiceRoll[];

      expect(rolls).toBeInstanceOf(Array);
      expect(rolls).toHaveLength(notations.length);

      expect(rolls[0]).toBeInstanceOf(DiceRoll);
      expect(rolls[0]?.notation).toEqual(notations[0]);

      expect(rolls[1]).toBeInstanceOf(DiceRoll);
      expect(rolls[1]?.notation).toEqual(notations[1]);

      expect(rolls[2]).toBeInstanceOf(DiceRoll);
      expect(rolls[2]?.notation).toEqual(notations[2]);
    });

    test('no notation throws error', () => {
      expect(() => {
        roller.roll();
      }).toThrow(RequiredArgumentError);

      expect(() => {
        // @ts-expect-error testing invalid value
        roller.roll(false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        // @ts-expect-error testing invalid value
        roller.roll(null);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        // @ts-expect-error testing invalid value
        roller.roll(undefined);
      }).toThrow(RequiredArgumentError);
    });

    test('notation must be string', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        roller.roll({});
      }).toThrow(RequiredArgumentError);

      expect(() => {
        // @ts-expect-error testing invalid value
        roller.roll([]);
      }).toThrow(NotationError);

      expect(() => {
        // @ts-expect-error testing invalid value
        roller.roll(true);
      }).toThrow(NotationError);

      expect(() => {
        // @ts-expect-error testing invalid value
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
      rolls.push(...roller.roll('2d8', '5d10dl2', '3d6!') as DiceRoll[]);

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
        // @ts-expect-error testing invalid value
        roller.log = [];
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        roller.log = {};
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        roller.log = 'foo';
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        roller.log = false;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        roller.log = null;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        roller.log = undefined;
      }).toThrow(TypeError);
    });
  });

  describe('Total', () => {
    test('is 0 before rolling', () => {
      expect(roller.total).toBe(0);
    });

    test('to be total of roll', () => {
      const roll = roller.roll('4d10*2d4') as DiceRoll;

      expect(roller.total).toBe(roll.total);
    });

    test('to be total of rolls', () => {
      const rolls = roller.roll('4d10*2d4', '2d10', '4d6') as DiceRoll[];

      expect(rolls).toBeInstanceOf(Array);
      expect(rolls).toHaveLength(3);

      const rollTotal = (rolls[0] as DiceRoll).total
        + (rolls[1] as DiceRoll).total
        + (rolls[2] as DiceRoll).total;

      expect(roller.total).toBe(rollTotal);
    });

    test('is 0 after log cleared', () => {
      const roll = roller.roll('4d10*2d4') as DiceRoll;

      expect(roller.total).toBe(roll.total);

      roller.clearLog();

      expect(roller.total).toBe(0);
    });
  });

  describe('toJSON', () => {
    test('output is correct', () => {
      roller.roll('4d6', '2d10!', '5d8*2d10');

      expect(JSON.parse(JSON.stringify(roller))).toEqual({
        log: JSON.parse(JSON.stringify(roller.log)),
        output: roller.toString(),
        total: roller.total,
        type: ModelType.DiceRoller,
      });
    });
  });

  describe('toString', () => {
    test('is empty string before rolling', () => {
      expect(roller.toString()).toEqual('');
    });

    test('returns semi-colon separated list of rolls', () => {
      const rolls = roller.roll('4d10*2d4', '2d10', '4d6') as DiceRoll[];
      const expectedOutput = rolls.map((roll) => roll.toString()).join('; ');

      expect(roller.toString()).toEqual(expectedOutput);
    });

    test('is empty string after log cleared', () => {
      const roll = roller.roll('4d10*2d4');

      expect(roller.toString()).toEqual(roll.toString());

      roller.clearLog();

      expect(roller.toString()).toEqual('');
    });
  });

  describe('Export', () => {
    test('can export to valid JSON', () => {
      const exported = roller.export(ExportFormat.Json);

      expect(exported).toEqual(JSON.stringify(roller));
    });

    test('can export to valid base64', () => {
      const exported = roller.export(ExportFormat.Base64) as string;

      // check that it's valid base64 being decoding, re-encoding, and comparing the values
      expect(btoa(atob(exported))).toEqual(exported);
      // assert that the base64 encoded string is a JSON object of the dice roll
      expect(atob(exported)).toEqual(JSON.stringify(roller));
    });

    test('can export to plain object', () => {
      const exported = roller.export(ExportFormat.Object);

      expect(exported).toBeInstanceOf(Object);
      expect(exported).toEqual(JSON.parse(JSON.stringify(roller)));
    });

    test('default export to JSON', () => {
      const exported = roller.export();

      expect(exported).toEqual(JSON.stringify(roller));
    });

    test('Invalid export format throws error', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        roller.export('foo');
      }).toThrow(TypeError);
    });

    test('Exports modifiers', () => {
      roller.clearLog();
      roller.roll('2d6dl1');

      const exported = roller.export(ExportFormat.Object) as DiceRollerJsonOutput;
      const rolls = (exported.log[0]?.rolls?.[0] as ResultCollectionJsonOutput).rolls;

      expect(rolls).toBeInstanceOf(Array);
      expect(rolls).toHaveLength(2);
      expect(rolls.some((roll) => (roll as SingleResultJsonOutput).modifiers.includes('drop')));
    });
  });

  describe('import', () => {
    describe('static', () => {
      test('calls prototype import', () => {
        const spy = jest.spyOn(DiceRoller.prototype, 'import');
        const exportedRoller = roller.export();

        DiceRoller.import(exportedRoller);

        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(exportedRoller);

        // remove the spy
        spy.mockRestore();
      });

      test('returns DiceRoller object', () => {
        expect(DiceRoller.import(roller.export())).toBeInstanceOf(DiceRoller);
      });
    });

    describe('prototype', () => {
      let importRoller: DiceRoller;
      let notations: string[];

      beforeEach(() => {
        notations = [
          '4d6dl1', '10d5-3d4!',
        ];

        importRoller = new DiceRoller();
        importRoller.roll(...notations);
      });

      test('data is required', () => {
        expect(() => {
          // @ts-expect-error testing invalid value
          roller.import();
        }).toThrow(RequiredArgumentError);
      });

      test('can import JSON', () => {
        const data = importRoller.export(ExportFormat.Json);

        roller.import(data);

        expect(roller.export(ExportFormat.Json)).toEqual(data);
      });

      test('can import base64', () => {
        const data = importRoller.export(ExportFormat.Base64);

        roller.import(data);

        expect(roller.export(ExportFormat.Base64)).toEqual(data);
      });

      test('can import plain object', () => {
        const data = importRoller.export(ExportFormat.Object);

        roller.import(data);

        expect(roller.export(ExportFormat.Object)).toEqual(data);
      });

      test('can import data array of logs', () => {
        const data = importRoller.export(ExportFormat.Object) as DiceRollerJsonOutput;

        roller.import(data.log);

        expect(roller.export(ExportFormat.Object)).toEqual(data);
      });

      test('returns roll log', () => {
        const data = importRoller.export(ExportFormat.Json);
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
          // @ts-expect-error testing invalid value
          roller.import(true);
        }).toThrow(DataFormatError);

        expect(() => {
          // @ts-expect-error testing invalid value
          roller.import(1);
        }).toThrow(DataFormatError);
      });

      test('invalid log throws error', () => {
        expect(() => {
          // @ts-expect-error testing invalid value
          roller.import({ log: 'foo' });
        }).toThrow(TypeError);
      });
    });
  });

  describe('Output', () => {
    test('output uses toString', () => {
      const spy = jest.spyOn(roller, 'toString');

      // cast to a string and check the output
      expect(roller.output).toEqual(roller.toString());

      expect(spy).toHaveBeenCalledTimes(2);

      // remove the spy
      spy.mockRestore();
    });

    test('returns roll toString', () => {
      const roll = roller.roll('4d10*2d4');

      expect(roller.output).toEqual(roll.toString());
    });
  });
});
