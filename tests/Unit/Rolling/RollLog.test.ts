import { DataFormatError, NotationError, RequiredArgumentError } from '../../../src/Exceptions';
import DiceRoll from '../../../src/Rolling/DiceRoll';
import RollLog from '../../../src/Rolling/RollLog';
import { ExportFormat } from '../../../src/Types/Enums/ExportFormat';
import { RollLogJsonOutput } from "../../../src/Types/Interfaces/Json/RollLogJsonOutput";
import { ResultCollectionJsonOutput } from "../../../src/Types/Interfaces/Json/ResultCollectionJsonOutput";
import { SingleResultJsonOutput } from "../../../src/Types/Interfaces/Json/SingleResultJsonOutput";
import { ModelType } from "../../../src/Types/Enums/ModelType";

describe('RollLog', () => {
  let rollLog: RollLog;

  beforeEach(() => {
    rollLog = new RollLog();
  });

  describe('Initialisation', () => {
    test('model structure', () => {
      expect(rollLog).toBeInstanceOf(RollLog);
      expect(rollLog).toEqual(expect.objectContaining({
        log: [],
        total: 0,
        clear: expect.any(Function),
        export: expect.any(Function),
        import: expect.any(Function),
        toJSON: expect.any(Function),
        toString: expect.any(Function),
        roll: expect.any(Function),
      }));
    });

    test('passing data in constructor passes it to `import`', () => {
      const spy = jest.spyOn(RollLog.prototype, 'import');
      const data = [new DiceRoll('4d6')];
      rollLog = new RollLog(data);

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(data);

      // remove the spy
      spy.mockRestore();
    });
  });

  describe('Rolling', () => {
    test('rolling single notation returns DiceRoll object', () => {
      const roll = rollLog.roll('4d6+5d8') as DiceRoll;

      expect(roll).toBeInstanceOf(DiceRoll);
      expect(roll.notation).toEqual('4d6+5d8');
    });

    test('rolling multiple notations returns array of DiceRoll objects', () => {
      const notations = ['4d6+5d8', '2d10*4', '5/6d6'];
      const rolls = rollLog.roll(...notations) as DiceRoll[];

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
        rollLog.roll();
      }).toThrow(RequiredArgumentError);

      expect(() => {
        // @ts-expect-error testing invalid value
        rollLog.roll(false);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        // @ts-expect-error testing invalid value
        rollLog.roll(null);
      }).toThrow(RequiredArgumentError);

      expect(() => {
        // @ts-expect-error testing invalid value
        rollLog.roll(undefined);
      }).toThrow(RequiredArgumentError);
    });

    test('notation must be string', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        rollLog.roll({});
      }).toThrow(RequiredArgumentError);

      expect(() => {
        // @ts-expect-error testing invalid value
        rollLog.roll([]);
      }).toThrow(NotationError);

      expect(() => {
        // @ts-expect-error testing invalid value
        rollLog.roll(true);
      }).toThrow(NotationError);

      expect(() => {
        // @ts-expect-error testing invalid value
        rollLog.roll(45);
      }).toThrow(NotationError);
    });
  });

  describe('Log', () => {
    test('is empty array before rolling', () => {
      expect(rollLog.log).toBeInstanceOf(Array);
      expect(rollLog.log).toHaveLength(0);
    });

    test('rolls are added to log', () => {
      const rolls = [];

      // roll once
      rolls.push(rollLog.roll('2d4'));

      expect(rollLog.log).toHaveLength(1);
      expect(rollLog.log).toEqual(rolls);

      // roll again
      rolls.push(rollLog.roll('5d10+7d4'));

      expect(rollLog.log).toHaveLength(2);
      expect(rollLog.log).toEqual(rolls);

      // roll several
      rolls.push(...rollLog.roll('2d8', '5d10dl2', '3d6!') as DiceRoll[]);

      expect(rollLog.log).toHaveLength(5);
      expect(rollLog.log).toEqual(rolls);
    });

    test('can clear log', () => {
      // roll once
      rollLog.roll('2d4');

      expect(rollLog.log).toHaveLength(1);

      // clear the log
      rollLog.clear();

      // assert still an array, but empty
      expect(rollLog.log).toBeInstanceOf(Array);
      expect(rollLog.log).toHaveLength(0);

      // roll several
      rollLog.roll('2d8', '5d10dl2', '3d6!');

      expect(rollLog.log).toHaveLength(3);

      // clear the log
      rollLog.clear();

      // assert still an array, but empty
      expect(rollLog.log).toBeInstanceOf(Array);
      expect(rollLog.log).toHaveLength(0);
    });

    test('cannot modify log', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        rollLog.log = [];
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        rollLog.log = {};
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        rollLog.log = 'foo';
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        rollLog.log = false;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        rollLog.log = null;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        rollLog.log = undefined;
      }).toThrow(TypeError);
    });
  });

  describe('Adding to Log', () => {
    test('Can add to log', () => {
      const rolls = [
        new DiceRoll('4d6'),
        new DiceRoll('2d10*4'),
        new DiceRoll('2/4d7'),
      ];

      rolls.forEach((roll) => {
        rollLog.add(roll)
      });

      expect(rollLog.log).toHaveLength(rolls.length);
      expect(rollLog.log).toEqual(rolls);
    });

    test('Can add multiple at once', () => {
      const rolls = [
        new DiceRoll('2+10d3*3'),
        new DiceRoll('4d20'),
        new DiceRoll('d6'),
      ];

      rollLog.add(...rolls)

      expect(rollLog.log).toHaveLength(rolls.length);
      expect(rollLog.log).toEqual(rolls);
    });

    test('Must be instance of DiceRoll', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        rollLog.add('foo');
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        rollLog.add(23);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        rollLog.add({});
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        rollLog.add(true);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        rollLog.add(false);
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error testing invalid value
        rollLog.add(undefined);
      }).toThrow(TypeError);
    });
  });

  describe('Total', () => {
    test('is 0 before rolling', () => {
      expect(rollLog.total).toBe(0);
    });

    test('to be total of roll', () => {
      const roll = rollLog.roll('4d10*2d4') as DiceRoll;

      expect(rollLog.total).toBe(roll.total);
    });

    test('to be total of rolls', () => {
      const rolls = rollLog.roll('4d10*2d4', '2d10', '4d6') as DiceRoll[];

      expect(rolls).toBeInstanceOf(Array);
      expect(rolls).toHaveLength(3);

      const rollTotal = (rolls[0] as DiceRoll).total
        + (rolls[1] as DiceRoll).total
        + (rolls[2] as DiceRoll).total;

      expect(rollLog.total).toBe(rollTotal);
    });

    test('is 0 after log cleared', () => {
      const roll = rollLog.roll('4d10*2d4') as DiceRoll;

      expect(rollLog.total).toBe(roll.total);

      rollLog.clear();

      expect(rollLog.total).toBe(0);
    });
  });

  describe('toJSON', () => {
    test('output is correct', () => {
      rollLog.roll('4d6', '2d10!', '5d8*2d10');

      expect(JSON.parse(JSON.stringify(rollLog))).toEqual({
        log: JSON.parse(JSON.stringify(rollLog.log)),
        output: rollLog.toString(),
        total: rollLog.total,
        type: ModelType.RollLog,
      });
    });
  });

  describe('toString', () => {
    test('is empty string before rolling', () => {
      expect(rollLog.toString()).toEqual('');
    });

    test('returns semi-colon separated list of rolls', () => {
      const rolls = rollLog.roll('4d10*2d4', '2d10', '4d6') as DiceRoll[];
      const expectedOutput = rolls.map((roll) => roll.toString()).join('; ');

      expect(rollLog.toString()).toEqual(expectedOutput);
    });

    test('is empty string after log cleared', () => {
      const roll = rollLog.roll('4d10*2d4');

      expect(rollLog.toString()).toEqual(roll.toString());

      rollLog.clear();

      expect(rollLog.toString()).toEqual('');
    });
  });

  describe('Export', () => {
    test('can export to valid JSON', () => {
      const exported = rollLog.export(ExportFormat.Json);

      expect(exported).toEqual(JSON.stringify(rollLog));
    });

    test('can export to valid base64', () => {
      const exported = rollLog.export(ExportFormat.Base64) as string;

      // check that it's valid base64 being decoding, re-encoding, and comparing the values
      expect(btoa(atob(exported))).toEqual(exported);
      // assert that the base64 encoded string is a JSON object of the dice roll
      expect(atob(exported)).toEqual(JSON.stringify(rollLog));
    });

    test('can export to plain object', () => {
      const exported = rollLog.export(ExportFormat.Object);

      expect(exported).toBeInstanceOf(Object);
      expect(exported).toEqual(JSON.parse(JSON.stringify(rollLog)));
    });

    test('default export to JSON', () => {
      const exported = rollLog.export();

      expect(exported).toEqual(JSON.stringify(rollLog));
    });

    test('Invalid export format throws error', () => {
      expect(() => {
        // @ts-expect-error testing invalid value
        rollLog.export('foo');
      }).toThrow(TypeError);
    });

    test('Exports modifiers', () => {
      rollLog.clear();
      rollLog.roll('2d6dl1');

      const exported = rollLog.export(ExportFormat.Object) as RollLogJsonOutput;
      const rolls = (exported.log[0]?.rolls?.[0] as ResultCollectionJsonOutput).rolls;

      expect(rolls).toBeInstanceOf(Array);
      expect(rolls).toHaveLength(2);
      expect(rolls.some((roll) => (roll as SingleResultJsonOutput).modifiers.includes('drop')));
    });
  });

  describe('import', () => {
    describe('static', () => {
      test('calls prototype import', () => {
        const spy = jest.spyOn(RollLog.prototype, 'import');
        const exportedRoller = rollLog.export();

        RollLog.import(exportedRoller);

        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(exportedRoller);

        // remove the spy
        spy.mockRestore();
      });

      test('returns RollLog object', () => {
        expect(RollLog.import(rollLog.export())).toBeInstanceOf(RollLog);
      });
    });

    describe('prototype', () => {
      let importRoller: RollLog;
      let notations: string[];

      beforeEach(() => {
        notations = [
          '4d6dl1', '10d5-3d4!',
        ];

        importRoller = new RollLog();
        importRoller.roll(...notations);
      });

      test('data is required', () => {
        expect(() => {
          // @ts-expect-error testing invalid value
          rollLog.import();
        }).toThrow(RequiredArgumentError);
      });

      test('can import JSON', () => {
        const data = importRoller.export(ExportFormat.Json);

        rollLog.import(data);

        expect(rollLog.export(ExportFormat.Json)).toEqual(data);
      });

      test('can import base64', () => {
        const data = importRoller.export(ExportFormat.Base64);

        rollLog.import(data);

        expect(rollLog.export(ExportFormat.Base64)).toEqual(data);
      });

      test('can import plain object', () => {
        const data = importRoller.export(ExportFormat.Object);

        rollLog.import(data);

        expect(rollLog.export(ExportFormat.Object)).toEqual(data);
      });

      test('can import data array of logs', () => {
        const data = importRoller.export(ExportFormat.Object) as RollLogJsonOutput;

        rollLog.import(data.log);

        expect(rollLog.export(ExportFormat.Object)).toEqual(data);
      });

      test('returns roll log', () => {
        const data = importRoller.export(ExportFormat.Json);
        const log = rollLog.import(data);

        expect(log).toBeInstanceOf(Array);

        const logRaw = JSON.parse(JSON.stringify(log));
        const importRaw = JSON.parse(JSON.stringify(importRoller.log));
        expect(logRaw).toEqual(importRaw);
      });

      test('invalid format throws error', () => {
        expect(() => {
          rollLog.import('foo');
        }).toThrow(DataFormatError);

        expect(() => {
          // @ts-expect-error testing invalid value
          rollLog.import(true);
        }).toThrow(DataFormatError);

        expect(() => {
          // @ts-expect-error testing invalid value
          rollLog.import(1);
        }).toThrow(DataFormatError);
      });

      test('invalid log throws error', () => {
        expect(() => {
          // @ts-expect-error testing invalid value
          rollLog.import({ log: 'foo' });
        }).toThrow(TypeError);
      });
    });
  });

  describe('Output', () => {
    test('output uses toString', () => {
      const spy = jest.spyOn(rollLog, 'toString');

      // cast to a string and check the output
      expect(rollLog.output).toEqual(rollLog.toString());

      expect(spy).toHaveBeenCalledTimes(2);

      // remove the spy
      spy.mockRestore();
    });

    test('returns roll toString', () => {
      const roll = rollLog.roll('4d10*2d4');

      expect(rollLog.output).toEqual(roll.toString());
    });
  });

  describe('Iterable', () => {
    test('can use spread operator', () => {
      rollLog.roll('4d10*2d4', '2d10', '4d6');

      expect([...rollLog]).toEqual(rollLog.log);
    });

    test('can use `for...of` loop', () => {
      const log = [];

      rollLog.roll('4d10*2d4', '2d10', '4d6');

      for(const item of rollLog) {
        log.push(item);
      }

      expect(log).toEqual(rollLog.log);
    });
  });
});
