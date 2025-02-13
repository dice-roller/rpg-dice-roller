import { RequiredArgumentError } from '../exceptions';
import { isNumeric, isSafeNumber } from '../utilities/math.js';
import { generator } from '../NumberGenerator/Generator.js';
import HasDescription from '../traits/HasDescription.js';
import RollResult from '../results/RollResult.js';
import RollResults from '../results/RollResults.js';
import Description from "../Description";
import { Dice } from "../types/Interfaces/Dice";
import { ModifierCollection } from "../types/Types/ModifierCollection";
import { ModelType } from "../types/Enums/ModelType";
import { Modifier } from "../types/Interfaces/Modifier";
import ModifierClass from '../modifiers/Modifier.js';

/**
 * Represents a standard numerical die.
 */
class StandardDice extends HasDescription implements Dice {
  readonly #max: number;
  readonly #min: number = 1;
  #modifiers: ModifierCollection | null = null;
  readonly #sides: number;
  readonly #qty: number;

  /**
   * Create a `StandardDice` instance.
   *
   * @param {number} sides The number of sides the die has (.e.g `6`)
   * @param {number} [qty=1] The number of dice to roll (e.g. `4`)
   * @param {Map<string, Modifier>|Modifier[]|{}|null} [modifiers] The modifiers that affect the die
   * @param {number|null} [min=1] The minimum possible roll value
   * @param {number|null} [max=null] The maximum possible roll value. Defaults to number of `sides`
   * @param {Description|string|null} [description=null] The roll description.
   *
   * @throws {RequiredArgumentError} sides is required
   * @throws {TypeError} qty must be a positive integer, and modifiers must be valid
   */
  constructor(
    sides: number,
    qty: number = 1,
    modifiers: ModifierCollection | null = null,
    min: number | null | undefined = 1,
    max: number | null | undefined = null,
    description: Description | string | null = null,
  ) {
    super(description);

    if (!sides && (sides !== 0)) {
      throw new RequiredArgumentError('sides');
    } else if (sides === Infinity) {
      throw new RangeError('numerical sides must be finite number');
    } else if (isNumeric(sides)) {
      if ((sides < 1) || !isSafeNumber(sides)) {
        throw new RangeError('numerical sides must be a positive finite number');
      }
    } else if (typeof sides !== 'string') {
      throw new TypeError('non-numerical sides must be a string');
    }

    if (!isNumeric(qty)) {
      throw new TypeError('qty must be a positive finite integer');
    } else if ((qty < 1) || (qty > 999)) {
      throw new RangeError('qty must be between 1 and 999');
    }

    let minVal = min;
    if ((minVal === null) || (minVal === undefined)) {
      minVal = 1;
    } else if (!isNumeric(minVal)) {
      throw new TypeError('min must a finite number');
    } else if (!isSafeNumber(minVal)) {
      throw new RangeError('min must a finite number');
    }

    if (max && !isNumeric(max)) {
      throw new TypeError('max must a finite number');
    } else if (max && !isSafeNumber(max)) {
      throw new RangeError('max must a finite number');
    }

    this.#qty = parseInt(`${qty}`, 10);
    this.#sides = sides;

    if (modifiers) {
      this.modifiers = modifiers;
    }

    this.#min = parseInt(minVal.toString(), 10);

    this.#max = max ? parseInt(`${max}`, 10) : sides;
  }

  /**
   * The average value that the die can roll (Excluding modifiers).
   *
   * @returns {number}
   */
  get average(): number {
    return (this.min + this.max) / 2;
  }

  /**
   * The modifiers that affect this die roll.
   *
   * @returns {ModifierCollection|null}
   */
  get modifiers(): ModifierCollection | null {
    if (this.#modifiers) {
      // ensure modifiers are ordered correctly
      return new Map([...this.#modifiers].sort((a, b) => a[1].order - b[1].order));
    }

    return null;
  }

  /**
   * Set the modifiers that affect this roll.
   *
   * @param {Map<string, Modifier>|Modifier[]|{}|null} value
   *
   * @throws {TypeError} Modifiers should be a Map, array of Modifiers, or an Object
   */
  set modifiers(value: ModifierCollection | Modifier[] | object | null) {
    let modifiers;
    if (value instanceof Map) {
      modifiers = value;
    } else if (Array.isArray(value)) {
      // loop through and get the modifier name of each item and use it as the map key
      modifiers = new Map(value.map((modifier: Modifier) => [modifier.name, modifier]));
    } else if (typeof value === 'object') {
      modifiers = new Map(Object.entries(value as { [index: string]: Modifier }));
    } else {
      throw new TypeError('modifiers should be a Map, array, or an Object containing Modifiers');
    }

    if (
      modifiers.size
      && [...modifiers.entries()].some((entry) => !(entry[1] instanceof ModifierClass))
    ) {
      throw new TypeError('modifiers must only contain Modifier instances');
    }

    this.#modifiers = modifiers;
  }

  /**
   * The maximum value that can be rolled on the die, excluding modifiers.
   *
   * @returns {number}
   */
  get max(): number {
    return this.#max;
  }

  /**
   * The minimum value that can be rolled on the die, excluding modifiers.
   *
   * @returns {number}
   */
  get min(): number {
    return this.#min;
  }

  /* eslint-disable class-methods-use-this */
  /**
   * The name of the die.
   *
   * @returns {string} 'standard'
   */
  get name(): string {
    return 'standard';
  }
  /* eslint-enable class-methods-use-this */

  /**
   * The dice notation. e.g. `4d6!`.
   *
   * @returns {string}
   */
  get notation(): string {
    let notation = `${this.qty}d${this.sides}`;

    if (this.modifiers && this.modifiers.size) {
      notation += [...this.modifiers.values()].reduce((acc, modifier) => acc + modifier.notation, '');
    }

    return notation;
  }

  /**
   * The number of dice that should be rolled.
   *
   * @returns {number}
   */
  get qty(): number {
    return this.#qty;
  }

  /**
   * The number of sides the die has.
   *
   * @returns {number}
   */
  get sides(): number | string {
    return this.#sides;
  }

  /**
   * Roll the dice for the specified quantity and apply any modifiers.
   *
   * @returns {RollResults} The result of the roll
   */
  roll(): RollResults {
    // create a result object to hold the rolls
    const rollResult = new RollResults();

    // loop for the quantity and roll the die
    for (let i = 0; i < this.qty; i++) {
      // add the rolls to the list
      rollResult.addRoll(this.rollOnce());
    }

    // loop through each modifier and carry out its actions
    (this.modifiers || []).forEach((modifier: Modifier) => {
      modifier.run(rollResult, this);
    });

    return rollResult;
  }

  /**
   * Roll a single die and return the value.
   *
   * @returns {RollResult} The value rolled
   */
  rollOnce(): RollResult {
    return new RollResult(generator.integer(this.min, this.max));
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{
   *  average: number,
   *  min: number,
   *  max: number,
   *  notation: string,
   *  qty: number,
   *  name: string,
   *  sides: number,
   *  modifiers: (ModifierCollection|null),
   *  type: string
   * }}
   */
  toJSON() {
    const {
      average, max, min, modifiers, name, notation, qty, sides,
    } = this;

    return {
      ...super.toJSON(),
      average,
      max,
      min,
      modifiers,
      name,
      notation,
      qty,
      sides,
      type: ModelType.Dice,
    };
  }

  /**
   * Return the String representation of the object.
   *
   * This is called automatically when casting the object to a string.
   *
   * @see {@link StandardDice#notation}
   *
   * @returns {string}
   */
  toString(): string {
    return `${this.notation}${this.description ? ` ${this.description}` : ''}`;
  }
}

export default StandardDice;
