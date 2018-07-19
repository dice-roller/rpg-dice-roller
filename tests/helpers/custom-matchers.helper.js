/*global beforeEach, console, DiceRoller, jasmine */
beforeEach(() => {
  'use strict';

  const customMatchers = {
    toBeWithinRange(util, customEqualityTesters){
      return {
        compare(actual, expected){
          const result = {};

          if ((actual < expected.min) || (actual > expected.max)) {
            result.pass = false;
            result.message = `Expected ${actual} to be within range: ${expected.min} - ${expected.max}`;
          } else {
            result.pass = true;
            result.message = `Expected ${actual} NOT to be within range: ${expected.min} - ${expected.max}`;
          }

          return result;
        }
      };
    },
    toHaveValuesWithinRange(util, customEqualityTesters){
      return {
        compare(actual, expected){
          let result = {pass: true},
              i;

          if (!Array.isArray(actual)) {
            result.pass = false;
            result.message = `Expected ${actual} to be an Array`;
          } else {
            for (i = 0; i < actual.length; i++) {
              if ((actual[i] < expected.min) || (actual[i] > expected.max)) {
                result.pass = false;
                result.message = `Expected ${actual[i]} to be within range: ${expected.min} - ${expected.max}`;

                // end loop
                i = actual.length;
              }
            }
          }

          return result;
        }
      };
    },
    toArraySumEqualTo(util, customEqualityTesters){
      return {
        compare(actual, expected){
          const sum = utils.reduceArray(actual);
          let result = {};

          if (sum !== expected) {
            result.pass = false;
            result.message = `Expected Array sum ${sum} to equal ${expected}`;
          } else {
            result.pass = true;
            result.message = `Expected Array sum ${sum} NOT to equal ${expected}`;
          }

          return result;
        }
      };
    },
    toHaveRolls(util, customEqualityTesters){
      return {
        compare(actual, expected){
          const rolls = actual.rolls,
                rollsReq = expected ? expected.rolls : null;
          let result = {
                pass: true,
                message: `Expected "${actual}" Not to have rolls`,
              },
              rollI;

          if (!rolls.length) {
            result.pass = false;
            result.message = `Expected "${actual}" to have rolls`;
          } else if (rollsReq && (rollsReq.length !== rolls.length)) {
            result.pass = false;
            result.message = `Expected "${actual}" to have ${rollsReq.length} rolls`;
          } else {
            // loop through each roll and ensure that it has rolls (multiples for exploded)
            for (rollI = 0; rollI < rolls.length; rollI++) {
              if (!rolls[rollI].length) {
                result.pass = false;
                result.message = `Expected "${actual}" roll index "${rollI}" to have roll values`;
              } else if (rollsReq && rollsReq[rollI] && (rollsReq[rollI] !== '*') && (rollsReq[rollI] !== rolls[rollI].length)) {
                // roll length doesn't match expected (Ignore *, which means unlimited)
                result.pass = false;
                result.message = `Expected "${actual}" index "${rollI}" (${rolls[rollI].length}) to have ${rollsReq[rollI]} roll values`;
              }

              if (!result.pass) {
                // end the loop
                rollI = rolls.length;
              }
            }
          }

          return result;
        }
      };
    },
    toHaveSuccesses(util, customEqualityTesters){
      return {
        compare(actual, expected){
          const successCount = actual.successes;
          let result = {
                pass: true,
                message: `Expected "${actual}" Not to have ${(expected ? expected + ' ' : '')}success${(!expected || (expected > 1) ? 'es' : '')}`,
              };

          if((expected === null) || (typeof expected === 'undefined')){
            // expected not defined so expecting an unspecified amount of successes, at least 1
            if(!successCount){
              result.pass = false;
              result.message = `Expected "${actual}" to have at least 1 success`;
            }
          }else if(expected !== successCount){
            // number of successes doesn't match expected
            result.pass = false;
            result.message = `Expected "${actual}" to have ${expected} success${(!expected || (expected > 1) ? 'es' : '')}`;
          }

          return result;
        }
      };
    },
    toExplode(util, customEqualityTesters){
      return {
        compare(actual, expected){
          let result = {
                pass: true,
                message: `Expected "${actual}" NOT to explode`,
              },
              rollI,
              max = expected.max || null,
              min = expected.min || null;
          const rollList = Array.isArray(actual) ? actual : [actual],
                comparePoint = expected.comparePoint || {operator: '=', value: max},
                penetrating = !!expected.penetrate;

          if (!max || !min) {
            result.pass = false;
            result.message = 'Expected explode argument to provide max and min';
          } else {
            for (rollI = 0; rollI < rollList.length; rollI++) {
              const value = rollList[rollI];

              if (penetrating && (rollI === 1)) {
                // we need to compensate for the -1 on consecutive rolls when penetrating
                max--;
                min--;

                // ensure that the compare point value is not greater than the new max
                if(comparePoint.value > max){
                  comparePoint.value = max;
                }
              }

              if (value > max) {
                // rolled over max
                result.pass = false;
                result.message = `Expected ${value} to be less than or equal to max (${max})`;
              } else if (value < min) {
                // rolled under min
                result.pass = false;
                result.message = `Expected ${value} to be greater than or equal to min (${min})`;
              } else {
                const didExplode = rollList.length > (rollI + 1);
                let shouldExplode = false;

                switch (comparePoint.operator) {
                  case '=':
                  case '==':
                    shouldExplode = value === comparePoint.value;
                    break;
                  case '<':
                    shouldExplode = value < comparePoint.value;
                    break;
                  case '>':
                    shouldExplode = value > comparePoint.value;
                    break;
                  case '<=':
                    shouldExplode = value <= comparePoint.value;
                    break;
                  case '>=':
                    shouldExplode = value >= comparePoint.value;
                    break;
                  case '!':
                  case '!=':
                    shouldExplode = value !== comparePoint.value;
                    break;
                }

                if (shouldExplode && !didExplode) {
                  // met comparison, but didn't explode
                  result.pass = false;
                  result.message = `Expected ${value} to explode at ${comparePoint.operator} ${comparePoint.value}`;
                } else if (!shouldExplode && didExplode) {
                  // didn't meet comparison, but exploded
                  result.pass = false;
                  result.message = `Expected ${value} to NOT explode at ${comparePoint.operator} ${comparePoint.value}`;
                }
              }

              if (!result.pass) {
                // end the loop
                rollI = rollList.length;
              }
            }
          }

          return result;
        }
      };
    },
    toMatchParsedNotation(util, customEqualityTesters){
      return {
        compare(actual, expected){
          const toMatch = `${expected.notation}: ${expected.rolls}${expected.total !== undefined ? ' = ' + expected.total : ''}`;
          let result = {};

          if ('' + actual !== toMatch) {
            result.pass = false;
            result.message = `Expected "${actual}" to match parsed notation "${toMatch}"`;
          } else {
            result.pass = true;
            result.message = `Expected "${actual}" NOT to match parsed notation "${toMatch}"`;
          }

          return result;
        }
      };
    },
    toHaveLogLength(util, customEqualityTesters){
      return {
        compare(actual, expected){
          const logLength = actual.log.length;
          let result = {};

          if (typeof expected !== 'number') {
            // no length specified - just check if it has a length
            if (!logLength) {
              // no length
              result.pass = false;
              result.message = 'Expected log to have a length';
            } else {
              // no length
              result.pass = true;
              result.message = 'Expected log to NOT have a length';
            }
          } else if (logLength === expected) {
            result.pass = true;
            result.message = `Expected log length ${logLength} NOT to be ${expected}`;
          } else {
            result.pass = false;
            result.message = `Expected log length ${logLength} to be ${expected}`;
          }

          return result;
        }
      };
    },
    toBeDiceRoll(util, customEqualityTesters){
      return {
        compare(actual, expected){
          const roll = actual,
                total = roll.total;
          let result = {
                pass: true,
                message: `Expected "${actual}" to NOT be a Dice Roll`,
              },
              resultT;

          // check value is within allowed range
          resultT = customMatchers.toBeWithinRange().compare(total, {
            min: expected.totalRange.min,
            max: expected.totalRange.max
          });
          if (!resultT.pass) {
            result = resultT;
          }

          // check the rolls list is correct
          resultT = customMatchers.toHaveRolls().compare(roll, {rolls: expected.rolls});
          if (!resultT.pass) {
            result = resultT;
          }

          resultT = customMatchers.toHaveValuesWithinRange().compare(roll.rolls[0], {
            min: expected.dieRange.min,
            max: expected.dieRange.max
          });
          if (!resultT.pass) {
            result = resultT;
          }

          resultT = customMatchers.toArraySumEqualTo().compare(roll.rolls, total);
          if (!resultT.pass) {
            result = resultT;
          }

          // check the output string
          resultT = customMatchers.toMatchParsedNotation().compare(roll, {
            notation: expected.notation,
            rolls: `[${roll.rolls[0].join(',')}]`,
            total: total
          });
          if (!resultT.pass) {
            result = resultT;
          }

          return result;
        }
      };
    },
    toBeJson(){
      return {
        compare(actual){
          let result = {};

          result.pass = utils.isJSON(actual);

          if(result.pass){
            result.message = `Expected "${actual}" to NOT be valid JSON`;
          }else{
            result.message = `Expected "${actual}" to be valid JSON`;
          }

          return result;
        }
      };
    },
    toBeBase64(){
      return {
        compare(actual){
          let result = {};

          result.pass = utils.isBase64Encoded(actual);

          if(result.pass){
            result.message = `Expected "${actual}" to NOT be base64 encoded`;
          }else{
            result.message = `Expected "${actual}" to be base64 encoded`;
          }

          return result;
        }
      };
    },
    toWorkAsUtility(){
      return {
        compare(methodName, args, response){
          let result = {};

          result.pass = diceUtils[methodName](...args) === response;

          if(result.pass){
            result.message = `Expected "${methodName}(${args.join(',')})" to NOT equal ${response}`;
          }else{
            result.message = `Expected "${methodName}(${args.join(',')})" to equal ${response}`;
          }

          return result;
        }
      };
    }
  };

  // add matchers globally
  jasmine.addMatchers(customMatchers);

  window.utils = {
    /**
     * Reduces an array to a single value
     *
     * @param obj
     * @returns {*}
     */
    reduceArray(obj){
      if(Array.isArray(obj)){
        return obj.reduce((a, b) => utils.reduceArray(a) + utils.reduceArray(b), 0);
      }else{
        return obj;
      }
    },
    getMin(obj){
      return Math.min(...obj);
    },
    getMax(obj){
      return Math.max(...obj);
    },
    isJSON(obj){
      if(!obj){
        return false;
      }

      try{
        JSON.parse(obj);
      }catch(e){
        return false;
      }

      return true;
    },
    isBase64Encoded(obj){
      try{
        return obj && (btoa(atob(obj)) === obj);
      }catch(e){
        return false;
      }
    }
  };
});
