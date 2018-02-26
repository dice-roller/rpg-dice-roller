/*global beforeEach, describe, DiceRoll, DiceRoller, expect, jasmine, it, utils */
;(function(){
  'use strict';

  describe('export dice roll', function(){
    var notation = '2d6+2',
        diceRoll = new DiceRoll(notation);

    it('should export as JSON', function(){
      var exported = diceRoll.export(DiceRoll.exportFormats.JSON);

      expect(exported).toBeJson();
    });

    it('should default export format to JSON', function(){
      var exported = diceRoll.export(),
          jsonExported = diceRoll.export(DiceRoll.exportFormats.JSON);

      expect(exported).toBeJson();

      expect(exported).toEqual(jsonExported);
    });

    it('should export as base64', function(){
      var exported = diceRoll.export(DiceRoll.exportFormats.BASE_64),
          jsonExported = diceRoll.export(DiceRoll.exportFormats.JSON);

      expect(exported).toBeBase64();

      // compare to json export
      expect(exported).toEqual(btoa(jsonExported));
      expect(atob(exported)).toEqual(jsonExported);
    });

    it('should throw error for invalid export formats', function(){
      expect(function(){ diceRoll.export('foo'); }).toThrowError('Unrecognised export format specified: foo');
    });

    // TODO - verify validity of exports (Should this just be done during import testing?)
  });

  describe('import dice roll', function(){
    it('should import from JSON', function(){
      var notation = '1d6',
          rollVal = 4,
          imported = DiceRoll.import(
            JSON.stringify({
              notation: notation,
              rolls: [
                [rollVal]
              ]
            }),
            DiceRoll.exportFormats.JSON
          );

      // check if response is a DiceRoll object
      expect(imported).toEqual(jasmine.any(DiceRoll));

      expect(imported).toBeDiceRoll({
        dieRange: {
          min: rollVal,
          max: rollVal
        },
        notation: notation,
        rolls: [1],
        totalRange: {
          min: rollVal,
          max: rollVal
        }
      });
    });

    it('should import from base64', function(){
      var notation = '1d6',
          rollVal = 4,
          imported = DiceRoll.import(
            btoa(JSON.stringify({
              notation: notation,
              rolls: [
                [rollVal]
              ]
            })),
            DiceRoll.exportFormats.BASE_64
          );

      // check if response if a DiceRoll object
      expect(imported).toEqual(jasmine.any(DiceRoll));

      expect(imported).toBeDiceRoll({
        dieRange: {
          min: rollVal,
          max: rollVal
        },
        notation: notation,
        rolls: [1],
        totalRange: {
          min: rollVal,
          max: rollVal
        }
      });
    });

    describe('exploding, compounding, and penetrating', function(){
      it('should import compounding dice', function(){
        var notation = '1d6!!>3',
          rollVals = [4,6,1],
          total = utils.reduceArray(rollVals),
          imported = DiceRoll.import(
            JSON.stringify({
              notation: notation,
              rolls: [
                rollVals
              ]
            }),
            DiceRoll.exportFormats.JSON
          );

        // check value is within allowed range
        expect(imported.getTotal()).toEqual(total);

        // check the rolls list is correct
        expect(imported).toHaveRolls({rolls: [rollVals.length]});
        expect(imported.rolls).toArraySumEqualTo(total);

        // check the output string (Compounds if over 1, so any total of 2 or more means that it must have compounded)
        expect(imported).toMatchParsedNotation({notation: notation, rolls: '[' + total + '!!]', total: total});
      });

      it('should import exploding dice', function(){
        var notation = '1d2!',
            rollVals = [2,2,1],
            total = utils.reduceArray(rollVals),
            imported = DiceRoll.import(
              JSON.stringify({
                notation: notation,
                rolls: [
                  rollVals
                ]
              }),
              DiceRoll.exportFormats.JSON
            );

        // check if response is a DiceRoll object
        expect(imported).toEqual(jasmine.any(DiceRoll));

        // check value is within allowed range
        expect(imported.getTotal()).toEqual(total);

        // check the rolls list is correct
        expect(imported).toHaveRolls({rolls: [rollVals.length]});
        expect(imported.rolls).toArraySumEqualTo(total);

        expect(imported.rolls[0]).toExplode({min: 1, max: 2});

        // check the output string
        expect(imported).toMatchParsedNotation({notation: notation, rolls: '[' + imported.rolls[0].join('!,') + ']', total: total});
      });

      it('should import penetrating dice', function(){
        var notation = '1d2!p',
            rollVals = [2,1,1,0],
            total = utils.reduceArray(rollVals),
            imported = DiceRoll.import(
              JSON.stringify({
                notation: notation,
                rolls: [
                  rollVals
                ]
              }),
              DiceRoll.exportFormats.JSON
            );

        // check value is within allowed range
        expect(imported.getTotal()).toEqual(total);

        // check the rolls list is correct
        expect(imported).toHaveRolls({rolls: [rollVals.length]});
        expect(imported.rolls).toArraySumEqualTo(total);

        expect(imported.rolls[0]).toExplode({min: 1, max: 2, penetrate: true});

        // check the output string
        expect(imported).toMatchParsedNotation({notation: notation, rolls: '[' + imported.rolls[0].join('!p,') + ']', total: total});
      });
    });

    it('should import with empty rolls', function(){
      var notation = '1d6',
          imported = DiceRoll.import(
            JSON.stringify({
              notation: notation
            }),
            DiceRoll.exportFormats.JSON
          );

      // check if response is a DiceRoll object
      expect(imported).toEqual(jasmine.any(DiceRoll));

      // check value is within allowed range
      expect(imported.getTotal()).toEqual(0);

      // check the rolls list is correct
      expect(imported.rolls.length).toEqual(0);

      // check the output string
      expect(imported).toMatchParsedNotation({notation: notation, rolls: 'No dice rolled'});
    });

    it('should throw error if no import data', function(){
      expect(function(){ DiceRoll.import(); }).toThrowError('No data to import');

      expect(function(){ DiceRoll.import(''); }).toThrowError('No data to import');

      expect(function(){ DiceRoll.import(null); }).toThrowError('No data to import');
    });

    it('should throw error for invalid import formats', function(){
      expect(function(){ DiceRoll.import('foo'); }).toThrowError('Unrecognised import format specified: undefined');

      expect(function(){ DiceRoll.import('foo', null); }).toThrowError('Unrecognised import format specified: null');

      expect(function(){ DiceRoll.import('foo', 'bar'); }).toThrowError('Unrecognised import format specified: bar');
    });

    it('should throw an error if import data is not correctly formatted', function(){
      // importing invalid JSON
      expect(function(){ DiceRoll.import('foo', DiceRoll.exportFormats.JSON); }).toThrowError(/Cannot import DiceRoll as JSON/);

      // importing invalid base64
      expect(function(){ DiceRoll.import('foo', DiceRoll.exportFormats.BASE_64); }).toThrowError(/Cannot import DiceRoll as base64/);

      // importing valid base64 encoded invalid data (Not JSON)
      expect(function(){ DiceRoll.import(btoa('foo'), DiceRoll.exportFormats.BASE_64); }).toThrowError(/Cannot import DiceRoll as JSON/);
    });

    it('should throw error if import data is invalid', function(){
      // importing valid JSON but missing notation
      expect(function(){ DiceRoll.import(JSON.stringify({foo: 'bar'}), DiceRoll.exportFormats.JSON); }).toThrowError(/Object has no notation/);

      // importing valid JSON but invalid rolls
      expect(function(){ DiceRoll.import(JSON.stringify({notation: '1d6', rolls: 23}), DiceRoll.exportFormats.JSON); }).toThrowError(/Rolls must be an Array/);
      // rolls array must be 2 dimensional
      expect(function(){ DiceRoll.import(JSON.stringify({notation: '1d6', rolls: [23, 4]}), DiceRoll.exportFormats.JSON); }).toThrowError(/Rolls are invalid at index/);
      // rolls must all be numeric
      expect(function(){ DiceRoll.import(JSON.stringify({notation: '1d6', rolls: [[23], [4], ['foo']]}), DiceRoll.exportFormats.JSON); }).toThrowError(/Rolls are invalid at index/);
    });

    it('should import from exported data', function(){
      var notation = '2d6+2',
          // roll the dice
          diceRoll = new DiceRoll(notation),
          // export the roll and re-import as a new roll for each format type
          importedRolls = [
            DiceRoll.import(
              diceRoll.export(DiceRoll.exportFormats.JSON),
              DiceRoll.exportFormats.JSON
            ),
            DiceRoll.import(
              diceRoll.export(DiceRoll.exportFormats.BASE_64),
              DiceRoll.exportFormats.BASE_64
            )
          ];

      // loop through each imported dice roll and validate it
      importedRolls.forEach(function(diceRoll){
        var total = diceRoll.getTotal();

        // check if response is a DiceRoll object
        expect(diceRoll).toEqual(jasmine.any(DiceRoll));

        // check value is within allowed range
        expect(total).toBeWithinRange({min: 4, max: 14});

        // check the rolls list is correct
        expect(diceRoll).toHaveRolls({rolls: [2]});
        expect(diceRoll.rolls).toArraySumEqualTo(total-2);

        // check the output string
        expect(diceRoll).toMatchParsedNotation({notation: notation, rolls: '[' + diceRoll.rolls[0].join(',') + ']+2', total: total});
      });
    });
  });
}());
