/*global beforeEach, describe, DiceRoller, expect, jasmine, it */
;(function(){
  'use strict';

  describe('notation patterns', function(){
    var strings = {
      /**
       * Matches a basic arithmetic operator
       *
       * @type {string}
       */
      arithmeticOperator: '[+\\-*\\/]',
      /**
       * Matches a basic comparison operator
       *
       * @type {string}
       */
      comparisonOperators: '[<>!]?={1,3}|[<>]',
      /**
       * Matches the numbers for a 'fudge' die (ie. F, F.2)
       *
       * @type {string}
       */
      fudge:    'F(?:\\.([12]))?'
    };

    /**
     * Matches a number comparison (ie. <=4, =5, >3, !=1)
     *
     * @type {string}
     */
    strings.numberComparison = '(' + strings.comparisonOperators + ')([0-9]+)';

    /**
     * Matches exploding/penetrating dice notation
     *
     * @type {string}
     */
    strings.explode   = '(!{1,2}p?)';

    /**
     * Matches a dice (ie. 2d6, d10, d%, dF, dF.2)
     *
     * @type {string}
     */
    strings.dice      = '([1-9][0-9]*)?d([1-9][0-9]*|%|' + strings.fudge + ')';

    /**
     * Matches a dice, optional exploding/penetrating notation and roll comparison
     *
     * @type {string}
     */
    strings.diceFull  = strings.dice + strings.explode + '?(?:' + strings.numberComparison + ')?';

    /**
     * Matches the addition to a dice (ie. +4, -10, *2, -L)
     *
     * @type {string}
     */
    strings.addition  = '(' + strings.arithmeticOperator + ')([1-9]+0?(?![0-9]*d)|H|L)';

    /**
     * Matches a standard dice notation. i.e;
     * 3d10-2
     * 4d20-L
     * 2d7/4
     * 3d8*2
     * 2d3+4-1
     * 2d10-H*1d6/2
     *
     * @type {string}
     */
    strings.notation  = '(' + strings.arithmeticOperator + ')?' + strings.diceFull + '((?:' + strings.addition + ')*)';


    describe('get notation patterns', function(){
      Object.keys(strings).forEach(function(name){
        it('should return the notation pattern for "' + name + '"', function(){
          var pattern = DiceRoller.notationPatterns.get(name);

          expect(pattern.toString()).toEqual('/' + strings[name] + '/');
        });

        it('should return the notation pattern with flags for "' + name + '"', function(){
          var pattern = DiceRoller.notationPatterns.get(name, 'g');

          expect(pattern.toString()).toEqual('/' + strings[name] + '/g');
        });

        it('should return the notation pattern matching whole string for "' + name + '"', function(){
          var pattern = DiceRoller.notationPatterns.get(name, null, true);

          expect(pattern.toString()).toEqual('/^' + strings[name] + '$/');
        });

        it('should return the notation pattern with flags and matching whole string for "' + name + '"', function(){
          var pattern = DiceRoller.notationPatterns.get(name, 'g', true);

          expect(pattern.toString()).toEqual('/^' + strings[name] + '$/g');
        });
      });
    });

    describe('invalid patterns', function(){
      it('should throw error if pattern name is empty', function(){
        expect(function(){
          DiceRoller.notationPatterns.get();
        }).toThrowError(/DiceRoller: Notation pattern name not defined/);

        expect(function(){
          DiceRoller.notationPatterns.get(null);
        }).toThrowError(/DiceRoller: Notation pattern name not defined/);

        expect(function(){
          DiceRoller.notationPatterns.get(undefined);
        }).toThrowError(/DiceRoller: Notation pattern name not defined/);

        expect(function(){
          DiceRoller.notationPatterns.get(false);
        }).toThrowError(/DiceRoller: Notation pattern name not defined/);

        expect(function(){
          DiceRoller.notationPatterns.get(0);
        }).toThrowError(/DiceRoller: Notation pattern name not defined/);
      });

      it('should throw error if pattern name is invalid', function(){
        expect(function(){
          DiceRoller.notationPatterns.get('foo');
        }).toThrowError(/DiceRoller: Notation pattern name not found/);

        expect(function(){
          DiceRoller.notationPatterns.get([]);
        }).toThrowError(/DiceRoller: Notation pattern name not found/);

        expect(function(){
          DiceRoller.notationPatterns.get(['notation']);
        }).toThrowError(/DiceRoller: Notation pattern name not found/);

        expect(function(){
          DiceRoller.notationPatterns.get(1);
        }).toThrowError(/DiceRoller: Notation pattern name not found/);
      });
    });
  });
}());
