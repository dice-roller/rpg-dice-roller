/*global beforeEach, describe, DiceRoll, DiceRoller, expect, jasmine, it */
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
    // TODO - more intricate roll validation
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

    it('should throw error if import data is invalid', function(){
      // importing invalid JSON
      expect(function(){ DiceRoll.import('foo', DiceRoll.exportFormats.JSON); }).toThrowError(/Cannot import DiceRoll as JSON:/);

      // importing invalid base64
      expect(function(){ DiceRoll.import('foo', DiceRoll.exportFormats.BASE_64); }).toThrowError(/Cannot import DiceRoll as base64:/);

      // importing valid base64 encoded invalid data (Not JSON)
      expect(function(){ DiceRoll.import(btoa('foo'), DiceRoll.exportFormats.BASE_64); }).toThrowError(/Cannot import DiceRoll as JSON:/);

      // TODO - pass in valid JSON that DOESN'T create a valid DiceRoll object
    });
  });
}());
