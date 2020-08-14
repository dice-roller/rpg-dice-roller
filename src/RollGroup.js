import { RequiredArgumentError } from './exceptions/index.js';
import Modifier from './modifiers/Modifier.js';
import ResultGroup from './results/ResultGroup.js';
import StandardDice from './dice/StandardDice.js';

const modifiersSymbol = Symbol('modifiers');
const expressionsSymbol = Symbol('expressions');

/**
 * A `RollGroup` is a group of one or more "sub-rolls".
 *
 * A sub-roll is just simple roll notation (e.g. `4d6`, `2d10*3`, `5/10d20`)
 *
 * @example <caption>`{4d6+4, 5*2d%}k1`</caption>
 * const expressions = [
 *   [
 *     new StandardDice(6, 4),
 *     '+',
 *     4,
 *   ],
 *   [
 *     5,
 *     '*',
 *     new PercentileDice(2),
 *   ],
 * ];
 *
 * const modifiers = [
 *   new KeepModifier(),
 * ];
 *
 * const group = new RollGroup(expressions, modifiers);
 *
 * @since 5.0.0
 */
class RollGroup {
  /**
   * Create a `RollGroup` instance.
   *
   * @param {Array.<Array.<StandardDice|string|number>>} [expressions=[]] List of sub-rolls
   * @param {Map<string, Modifier>|Modifier[]|{}|null} [modifiers=[]] The modifiers that affect the
   * group
   */
  constructor(expressions = [], modifiers = []) {
    this.expressions = expressions;
    this.modifiers = modifiers;
  }

  /**
   * The sub-roll expressions in the group.
   *
   * @returns {Array.<Array.<StandardDice|string|number>>}
   */
  get expressions() {
    return [...(this[expressionsSymbol] || [])];
  }

  /**
   * Set the sub-roll expressions in the group.
   *
   * @param {Array.<Array.<StandardDice|string|number>>} expressions
   *
   * @throws {TypeError} Expressions must be an array of arrays
   * @throws {TypeError} Sub expressions cannot be empty
   * @throws {TypeError} Sub expression items must be Dice, numbers, or strings
   */
  set expressions(expressions) {
    if (!expressions) {
      throw new RequiredArgumentError('expressions');
    }

    if (!Array.isArray(expressions)) {
      throw new TypeError(`expressions must be an array: ${expressions}`);
    }

    // loop through each expression and add it to the list
    this[expressionsSymbol] = [];
    expressions.forEach((expression) => {
      if (!expression || !Array.isArray(expression)) {
        throw new TypeError(`Expressions must be an array of arrays: ${expressions}`);
      }

      if (expression.length === 0) {
        throw new TypeError(`Sub expressions cannot be empty: ${expressions}`);
      }

      if (!expression.every((value) => (value instanceof StandardDice) || (typeof value === 'string') || (typeof value === 'number'))) {
        throw new TypeError('Sub expression items must be Dice, numbers, or strings');
      }

      this[expressionsSymbol].push(expression);
    });
  }

  /**
   * The modifiers that affect the object.
   *
   * @returns {Map<string, Modifier>|null}
   */
  get modifiers() {
    if (this[modifiersSymbol]) {
      // ensure modifiers are ordered correctly
      return new Map([...this[modifiersSymbol]].sort((a, b) => a[1].order - b[1].order));
    }

    return null;
  }

  /**
   * Set the modifiers that affect this group.
   *
   * @param {Map<string, Modifier>|Modifier[]|{}|null} value
   *
   * @throws {TypeError} Modifiers should be a Map, array of Modifiers, or an Object
   */
  set modifiers(value) {
    let modifiers;
    if (value instanceof Map) {
      modifiers = value;
    } else if (Array.isArray(value)) {
      // loop through and get the modifier name of each item and use it as the map key
      modifiers = new Map(value.map((modifier) => [modifier.name, modifier]));
    } else if (typeof value === 'object') {
      modifiers = new Map(Object.entries(value));
    } else {
      throw new TypeError('modifiers should be a Map, array, or an Object containing Modifiers');
    }

    if (
      modifiers.size
      && [...modifiers.entries()].some((entry) => !(entry[1] instanceof Modifier))
    ) {
      throw new TypeError('modifiers must only contain Modifier instances');
    }

    this[modifiersSymbol] = modifiers;
  }

  /**
   * The group notation. e.g. `{4d6, 2d10+3}k1`.
   *
   * @returns {string}
   */
  get notation() {
    let notation = this.expressions
      .map((expression) => expression.reduce((acc, e) => acc + e, ''))
      .join(', ');

    notation = `{${notation}}`;

    if (this.modifiers && this.modifiers.size) {
      notation += [...this.modifiers.values()].reduce((acc, modifier) => acc + modifier.notation, '');
    }

    return notation;
  }

  /**
   * Run the sub-roll expressions for the group.
   *
   * @example <caption>`{4d6+4/1d6, 3*2d10}k1`</caption>
   * ResultGroup {
   *   results: [
   *     // sub-roll 1 - 4d6+4/1d6
   *     ResultGroup {
   *       results: [
   *         RollResults {
   *           rolls: [
   *             RollResult {
   *               value: 2
   *             },
   *             RollResult {
   *               value: 5
   *             },
   *             RollResult {
   *               value: 4
   *             },
   *             RollResult {
   *               value: 1
   *             }
   *           ]
   *         },
   *         '+',
   *         4,
   *         '/',
   *         RollResults {
   *           rolls: [
   *             RollResult {
   *               value: 4
   *             }
   *           ]
   *         }
   *       ]
   *     },
   *     // sub-roll 2 - 3*2d10
   *     ResultGroup {
   *       results: [
   *         3,
   *         '*',
   *         RollResults {
   *           rolls: [
   *             RollResults {
   *               4
   *             },
   *             RollResults {
   *               9
   *             }
   *           ]
   *         }
   *       ]
   *     }
   *   ]
   * }
   *
   * @returns {ResultGroup} The results of the sub-rolls
   */
  roll() {
    // loop through each sub-roll expression and roll it
    // adding the results to a single RollResults object
    const rollResults = new ResultGroup(this.expressions.map((subRoll) => {
      const result = subRoll
        .map((expression) => {
          if (expression instanceof StandardDice) {
            // roll the object and return the value
            return expression.roll();
          }

          return expression;
        });

      return new ResultGroup(result);
    }));

    // flag it as roll group results
    rollResults.isRollGroup = true;

    // loop through each modifier and carry out its actions
    (this.modifiers || []).forEach((modifier) => {
      modifier.run(rollResults, this);
    });

    return rollResults;
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{
   *  notation: string,
   *  modifiers: (Map<string, Modifier>|null),
   *  type: string,
   *  expressions: Array.<Array.<StandardDice|string|number>>
   * }}
   */
  toJSON() {
    const { modifiers, notation, expressions } = this;

    return {
      expressions,
      modifiers,
      notation,
      type: 'group',
    };
  }

  /**
   * Return the String representation of the object.
   *
   * This is called automatically when casting the object to a string.
   *
   * @see {@link RollGroup#notation}
   *
   * @returns {string}
   */
  toString() {
    return this.notation;
  }
}

export default RollGroup;
