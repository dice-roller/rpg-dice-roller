/*global beforeEach, describe, expect, jasmine, it */
;(() => {
  'use strict';

  // require the dice-roller library
  const { DiceParser } = require('../lib/umd/bundle.js');

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
       * Matches a number comparison (ie. <=4, =5, >3, !=1, < 2.6)
       *
       * @type {string}
       */
      get numberComparison() {
        return `(${this.comparisonOperators})(${this.numberDecimal})`;
      },
      /**
       * Matches exploding/penetrating dice notation
       *
       * @type {string}
       */
      explode: '(!{1,2}p?)',
      /**
       * Matches a die (ie. 2d6, d10, d%, dF, dF.2)
       *
       * @returns {string}
       */
      get die() {
        return `([1-9]\\d*)?d([1-9]\\d*|%|${this.fudge})`;
      },
      /**
       * Matches a die, optional exploding/penetrating notation and roll comparison
       *
       * @type {string}
       */
      get dieFull() {
        return `${this.die}${this.explode}?(?:${this.numberComparison})?`;
      },
      /**
       * Matches the operation to a die (ie. +4, -10, *2, -L)
       *
       * @type {string}
       */
      get operation() {
        return `(${this.arithmeticOperator})(${this.numberDecimal}(?!\\d*d)|H|L)`;
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
        return `(${this.arithmeticOperator})?${this.dieFull}((?:${this.operation})*)`;
      },
      numberDecimal: '\\d+(?:\\.\\d+)?',
    };

    describe('get notation patterns', () => {
      Object.keys(strings).forEach(name => {
        it(`should return the notation pattern for "${name}"`, () => {
          const pattern = DiceParser.notationPatterns.get(name);

          expect(pattern + '').toEqual(`/${strings[name]}/`);
        });

        it(`should return the notation pattern with flags for "${name}"`, () => {
          const pattern = DiceParser.notationPatterns.get(name, 'g');

          expect(pattern + '').toEqual(`/${strings[name]}/g`);
        });

        it(`should return the notation pattern matching whole string for "${name}"`, () => {
          const pattern = DiceParser.notationPatterns.get(name, null, true);

          expect(pattern + '').toEqual(`/^${strings[name]}$/`);
        });

        it(`should return the notation pattern with flags and matching whole string for "${name}"`, () => {
          const pattern = DiceParser.notationPatterns.get(name, 'g', true);

          expect(pattern.toString()).toEqual(`/^${strings[name]}$/g`);
        });
      });
    });

    describe('invalid patterns', () => {
      it('should throw error if pattern name is empty', function(){
        expect(() => {
          DiceParser.notationPatterns.get();
        }).toThrowError(/DiceParser: Notation pattern name not defined/);

        expect(() => {
          DiceParser.notationPatterns.get(null);
        }).toThrowError(/DiceParser: Notation pattern name not defined/);

        expect(() => {
          DiceParser.notationPatterns.get(undefined);
        }).toThrowError(/DiceParser: Notation pattern name not defined/);

        expect(() => {
          DiceParser.notationPatterns.get(false);
        }).toThrowError(/DiceParser: Notation pattern name not defined/);

        expect(() => {
          DiceParser.notationPatterns.get(0);
        }).toThrowError(/DiceParser: Notation pattern name not defined/);
      });

      it('should throw error if pattern name is invalid', function(){
        expect(() => {
          DiceParser.notationPatterns.get('foo');
        }).toThrowError(/DiceParser: Notation pattern name not found/);

        expect(() => {
          DiceParser.notationPatterns.get([]);
        }).toThrowError(/DiceParser: Notation pattern name not found/);

        expect(() => {
          DiceParser.notationPatterns.get(['notation']);
        }).toThrowError(/DiceParser: Notation pattern name not found/);

        expect(() => {
          DiceParser.notationPatterns.get(1);
        }).toThrowError(/DiceParser: Notation pattern name not found/);
      });
    });
  });
})();
