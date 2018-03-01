/*global beforeEach, describe, DiceRoll, DiceRoller, expect, jasmine, it, utils */
;(function(){
  'use strict';

  describe('export dice roll', function(){
    var notation, diceRoll, exported;

    beforeEach(function(){
      notation = '2d6+2';

      diceRoll = new DiceRoll(notation);
    });

    it('should export as JSON', function(){
      exported = diceRoll.export(DiceRoller.exportFormats.JSON);

      expect(exported).toBeJson();
    });

    it('should default export format to JSON', function(){
      var jsonExported = diceRoll.export(DiceRoller.exportFormats.JSON);

      exported = diceRoll.export();

      expect(exported).toBeJson();

      expect(exported).toEqual(jsonExported);
    });

    it('should export as base64', function(){
      var jsonExported = diceRoll.export(DiceRoller.exportFormats.JSON);

      exported = diceRoll.export(DiceRoller.exportFormats.BASE_64);

      expect(exported).toBeBase64();

      // compare to json export
      expect(exported).toEqual(btoa(jsonExported));
      expect(atob(exported)).toEqual(jsonExported);
    });

    it('should export as Object', function(){
      exported = diceRoll.export(DiceRoller.exportFormats.OBJECT);

      expect(exported).toEqual(jasmine.any(Object));

      // check the rolls list is correct
      expect(exported).toHaveRolls({rolls: [2]});
      expect(exported.rolls).toArraySumEqualTo(diceRoll.getTotal()-2);
    });

    it('should throw error for invalid export formats', function(){
      expect(function(){ diceRoll.export('foo'); }).toThrowError(/Unrecognised export format specified/);

      expect(function(){ diceRoll.export('bar'); }).toThrowError(/Unrecognised export format specified/);
    });
  });

  describe('import dice roll', function(){
    var notation, rollVal, imported;

    beforeEach(function(){
      notation = '1d6';

      rollVal = 4;
    });

    it('should import from JSON', function(){
      imported = DiceRoll.import(
        JSON.stringify({
          notation: notation,
          rolls: [
            [rollVal]
          ]
        })
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
      imported = DiceRoll.import(
        btoa(JSON.stringify({
          notation: notation,
          rolls: [
            [rollVal]
          ]
        }))
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

    it('should import from Object', function(){
      imported = DiceRoll.import(
        {
          notation: notation,
          rolls: [
            [rollVal]
          ]
        }
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

    it('should import from DiceRoll', function(){
      imported = DiceRoll.import(new DiceRoll(notation));

      // check if response is a DiceRoll object
      expect(imported).toEqual(jasmine.any(DiceRoll));

      expect(imported).toBeDiceRoll({
        dieRange: {
          min: 1,
          max: 6
        },
        notation: notation,
        rolls: [1],
        totalRange: {
          min: 1,
          max: 6
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
            })
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
              })
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
              })
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
      imported = DiceRoll.import(
        JSON.stringify({
          notation: notation
        })
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

    it('should throw error if import data is invalid', function(){
      // importing invalid format (String)
      expect(function(){ DiceRoll.import('foo'); }).toThrowError(/Unrecognised import format for data/);

      // importing valid base64 encoded but invalid data (Not JSON)
      expect(function(){ DiceRoll.import(btoa('foo')); }).toThrowError(/Unrecognised import format for data/);

      // importing valid JSON but missing notation
      expect(function(){ DiceRoll.import(JSON.stringify({foo: 'bar'})); }).toThrowError(/Object has no notation/);

      // importing valid JSON but invalid rolls
      expect(function(){ DiceRoll.import(JSON.stringify({notation: '1d6', rolls: 23})); }).toThrowError(/Rolls must be an Array/);
      // rolls array must be 2 dimensional
      expect(function(){ DiceRoll.import(JSON.stringify({notation: '1d6', rolls: [23, 4]})); }).toThrowError(/Rolls are invalid at index/);
      // rolls must all be numerics
      expect(function(){ DiceRoll.import(JSON.stringify({notation: '1d6', rolls: [[23], [4], ['foo']]})); }).toThrowError(/Rolls are invalid at index/);
    });

    it('should import from exported data', function(){
      notation = '2d6+2';
          // roll the dice
      var diceRoll = new DiceRoll(notation),
          // export the roll and re-import as a new roll for each format type
          importedRolls = [
            DiceRoll.import(
              diceRoll.export(DiceRoller.exportFormats.JSON)
            ),
            DiceRoll.import(
              diceRoll.export(DiceRoller.exportFormats.BASE_64)
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
