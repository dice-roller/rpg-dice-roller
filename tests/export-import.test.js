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
      expect(function(){ DiceRoll.import(); }).toThrowError('DiceRoll: No data to import');

      expect(function(){ DiceRoll.import(''); }).toThrowError('DiceRoll: No data to import');

      expect(function(){ DiceRoll.import(null); }).toThrowError('DiceRoll: No data to import');
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

  describe('export roll log', function(){
    var notations = [
          '2d6+2',
          '8d10-L',
          'dF',
          'd%'
        ],
        diceRoller;

    beforeEach(function(){
      diceRoller = new DiceRoller();

      notations.forEach(function(notation){
        diceRoller.roll(notation);
      });
    });

    it('should export as JSON', function(){
      var exported = diceRoller.export(DiceRoller.exportFormats.JSON);

      expect(exported).toBeJson();
    });

    it('should export as base64', function(){
      var exported = diceRoller.export(DiceRoller.exportFormats.BASE_64),
          jsonExported = diceRoller.export(DiceRoller.exportFormats.JSON);

      expect(exported).toBeBase64();

      // compare to json export
      expect(exported).toEqual(btoa(jsonExported));
      expect(atob(exported)).toEqual(jsonExported);
    });

    it('should default export format to JSON', function(){
      var exported = diceRoller.export(),
          jsonExported = diceRoller.export(DiceRoller.exportFormats.JSON);

      expect(exported).toBeJson();

      expect(exported).toEqual(jsonExported);
    });

    it('should throw error for invalid export formats', function(){
      expect(function(){ diceRoller.export('foo'); }).toThrowError('DiceRoller: Unrecognised export format specified: foo');
    });
  });

  describe('import roll log', function(){
    var importData, notations, imported;

    beforeEach(function(){
      importData = {
        log: [
          {
            notation: '1d6',
            rolls: [
              [4]
            ]
          },
          {
            notation: '8d10-L',
            rolls: [
              [2,2,3,7,10,4,1,4]
            ]
          },
          {
            notation: 'dF',
            rolls: [
              [-1]
            ]
          },
          {
            notation: '2d3!',
            rolls: [
              [2,3,2]
            ]
          },
          {
            notation: '1d4!!',
            rolls: [
              [4,3]
            ]
          },
          {
            notation: '1d10!p',
            rolls: [
              [10,6]
            ]
          },
          {
            notation: '2d3!!p',
            rolls: [
              [3,2,0,3,2,1]
            ]
          }
        ]
      };

      notations = [
        '1d6: [4] = 4',
        '8d10-L: [2,2,3,7,10,4,1,4]-L = 32',
        'dF: [-1] = -1',
        '2d3!: [2,3!,2] = 7',
        '1d4!!: [7!!] = 7',
        '1d10!p: [10!p,6] = 16',
        '2d3!!p: [5!!p,6!!p] = 11'
      ];
    });

    it('should import full data from JSON', function(){
      imported = DiceRoller.import(JSON.stringify(importData));

      expect(imported).toEqual(jasmine.any(DiceRoller));

      expect(imported).toHaveLogLength(importData.log.length);

      expect(imported.getNotation()).toEqual(notations.join('; '));
    });

    it('should import full data from Base64', function(){
      imported = DiceRoller.import(btoa(JSON.stringify(importData)));

      expect(imported).toEqual(jasmine.any(DiceRoller));

      expect(imported).toHaveLogLength(importData.log.length);

      expect(imported.getNotation()).toEqual(notations.join('; '));
    });

    it('should import from Object', function(){
      imported = DiceRoller.import(importData);

      expect(imported).toEqual(jasmine.any(DiceRoller));

      expect(imported).toHaveLogLength(importData.log.length);

      expect(imported.getNotation()).toEqual(notations.join('; '));
    });

    it('should import from Object with DiceRolls', function(){
      // import, but convert all log entries to a DiceRoll object first
      imported = DiceRoller.import({
        log: importData.log.map(function(roll){
          return DiceRoll.import(roll);
        })
      });

      expect(imported).toEqual(jasmine.any(DiceRoller));

      expect(imported).toHaveLogLength(importData.log.length);

      expect(imported.getNotation()).toEqual(notations.join('; '));
    });

    describe('empty rolls', function(){
      it('should import with empty roll array', function(){
        imported = DiceRoller.import({log: []});

        expect(imported).toEqual(jasmine.any(DiceRoller));

        expect(imported).toHaveLogLength(0);

        expect(imported.getNotation()).toEqual('');
      });

      it('should import with falsey rolls', function(){
        imported = DiceRoller.import({log: null});

        expect(imported).toEqual(jasmine.any(DiceRoller));

        expect(imported).toHaveLogLength(0);

        expect(imported.getNotation()).toEqual('');
      });
    });

    it('should import with no roll array', function(){
      imported = DiceRoller.import({});

      expect(imported).toEqual(jasmine.any(DiceRoller));

      expect(imported).toHaveLogLength(0);

      expect(imported.getNotation()).toEqual('');
    });

    it('should throw error if no import data', function(){
      expect(function(){ DiceRoller.import(); }).toThrowError('DiceRoller: No data to import');

      expect(function(){ DiceRoller.import(''); }).toThrowError('DiceRoller: No data to import');

      expect(function(){ DiceRoller.import(null); }).toThrowError('DiceRoller: No data to import');
    });

    it('should throw error if import data is invalid', function(){
      // importing invalid format (String)
      expect(function(){ DiceRoller.import('foo'); }).toThrowError(/Unrecognised import format for data/);

      // importing valid base64 encoded but invalid data (Not JSON)
      expect(function(){ DiceRoller.import(btoa('foo')); }).toThrowError(/Unrecognised import format for data/);

      // importing valid Object but invalid log
      expect(function(){ DiceRoller.import(JSON.stringify({log: 'foo'})); }).toThrowError(/Roll log must be an Array/);
      expect(function(){ DiceRoller.import({log: true}); }).toThrowError(/Roll log must be an Array/);

      expect(function(){ DiceRoller.import({log: ['foo']}); }).toThrowError(/Unrecognised import format for data/);
    });

    it('should import to existing roll log', function(){
      var rolls = [
            {
              log: [
                {
                  notation: '1d6',
                  rolls: [
                    [3]
                  ]
                },
                {
                  notation: '10d5-H',
                  rolls: [
                    [1,4,3,3,2,5,3,1,5,2]
                  ]
                },
                {
                  notation: '4d6*2',
                  rolls: [
                    [6,2,1,4]
                  ]
                }
              ],
              notations: '1d6: [3] = 3; 10d5-H: [1,4,3,3,2,5,3,1,5,2]-H = 24; 4d6*2: [6,2,1,4]*2 = 26'
            },
            {
              log: [
                {
                  notation: '2d10',
                  rolls: [
                    [2,7]
                  ]
                },
                {
                  notation: '5d6',
                  rolls: [
                    [4,3,6,3,1]
                  ]
                }
              ],
              notations: '2d10: [2,7] = 9; 5d6: [4,3,6,3,1] = 17'
            },
            {
              log: [
                {
                  notation: '2dF',
                  rolls: [
                    [1,0]
                  ]
                },
                {
                  notation: '2d%-L',
                  rolls: [
                    [23,65]
                  ]
                }
              ],
              notations: '2dF: [1,0] = 1; 2d%-L: [23,65]-L = 65'
            }
          ],
          crntNotation = notations.join('; '),
          crntLogLength = importData.log.length;

      // start by importing some rolls using the static `DiceRoller.import()` method
      imported = DiceRoller.import(importData);

      // now that we have a DiceRoller object with rolls, import some more rolls
      rolls.forEach(function(roll){
        // add the current roll notations to the string
        crntNotation += '; ' + roll.notations;
        crntLogLength += roll.log.length;

        // import the roll
        imported.import({log: roll.log});

        expect(imported).toEqual(jasmine.any(DiceRoller));

        // check the roll log length
        expect(imported).toHaveLogLength(crntLogLength);

        // compare the notation
        expect(imported.getNotation()).toEqual(crntNotation);
      });
    });
  });
}());
