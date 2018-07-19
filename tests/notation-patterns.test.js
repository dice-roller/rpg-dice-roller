/*global beforeEach, describe, DiceRoller, expect, jasmine, it */
;(() => {
  'use strict';

  describe('notation patterns', () => {
    const strings = {
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
      fudge: 'F(?:\\.([12]))?',
      /**
       * Matches a number comparison (ie. <=4, =5, >3, !=1)
       *
       * @type {string}
       */
      get numberComparison() {
        return '(' + this.comparisonOperators + ')([0-9]+)';
      },
      /**
       * Matches exploding/penetrating dice notation
       *
       * @type {string}
       */
      explode: '(!{1,2}p?)',
      /**
       * Matches a dice (ie. 2d6, d10, d%, dF, dF.2)
       *
       * @returns {string}
       */
      get dice() {
        return '([1-9][0-9]*)?d([1-9][0-9]*|%|' + this.fudge + ')';
      },
      /**
       * Matches a dice, optional exploding/penetrating notation and roll comparison
       *
       * @type {string}
       */
      get diceFull() {
        return this.dice + this.explode + '?(?:' + this.numberComparison + ')?';
      },
      /**
       * Matches the addition to a dice (ie. +4, -10, *2, -L)
       *
       * @type {string}
       */
      get addition() {
        return '(' + this.arithmeticOperator + ')([1-9]+0?(?![0-9]*d)|H|L)';
      },
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
      get notation() {
        return '(' + this.arithmeticOperator + ')?' + this.diceFull + '((?:' + this.addition + ')*)';
      },
    };

    describe('get notation patterns', () => {
      Object.keys(strings).forEach(name => {
        it(`should return the notation pattern for "${name}"`, () => {
          const pattern = DiceRoll.notationPatterns.get(name);

          expect(pattern + '').toEqual(`/${strings[name]}/`);
        });

        it(`should return the notation pattern with flags for "${name}"`, () => {
          const pattern = DiceRoll.notationPatterns.get(name, 'g');

          expect(pattern + '').toEqual(`/${strings[name]}/g`);
        });

        it(`should return the notation pattern matching whole string for "${name}"`, () => {
          const pattern = DiceRoll.notationPatterns.get(name, null, true);

          expect(pattern + '').toEqual(`/^${strings[name]}$/`);
        });

        it(`should return the notation pattern with flags and matching whole string for "${name}"`, () => {
          const pattern = DiceRoll.notationPatterns.get(name, 'g', true);

          expect(pattern.toString()).toEqual(`/^${strings[name]}$/g`);
        });
      });
    });

    describe('invalid patterns', () => {
      it('should throw error if pattern name is empty', () => {
        expect(() => {
          DiceRoll.notationPatterns.get();
        }).toThrowError(/DiceRoller: Notation pattern name not defined/);

        expect(() => {
          DiceRoll.notationPatterns.get(null);
        }).toThrowError(/DiceRoller: Notation pattern name not defined/);

        expect(() => {
          DiceRoll.notationPatterns.get(undefined);
        }).toThrowError(/DiceRoller: Notation pattern name not defined/);

        expect(() => {
          DiceRoll.notationPatterns.get(false);
        }).toThrowError(/DiceRoller: Notation pattern name not defined/);

        expect(() => {
          DiceRoll.notationPatterns.get(0);
        }).toThrowError(/DiceRoller: Notation pattern name not defined/);
      });

      it('should throw error if pattern name is invalid', () => {
        expect(() => {
          DiceRoll.notationPatterns.get('foo');
        }).toThrowError(/DiceRoller: Notation pattern name not found/);

        expect(() => {
          DiceRoll.notationPatterns.get([]);
        }).toThrowError(/DiceRoller: Notation pattern name not found/);

        expect(() => {
          DiceRoll.notationPatterns.get(['notation']);
        }).toThrowError(/DiceRoller: Notation pattern name not found/);

        expect(() => {
          DiceRoll.notationPatterns.get(1);
        }).toThrowError(/DiceRoller: Notation pattern name not found/);
      });
    });
  });
})();
