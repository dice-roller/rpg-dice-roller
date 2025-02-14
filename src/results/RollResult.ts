import { isNumeric } from '../utilities/math';
import getModifierFlags from '../modifiers/modifier-flags';
import { SingleResult } from "../types/Interfaces/Results/SingleResult";
import { ResultValue } from "../types/Interfaces/Results/ResultValue";
import { ModelType } from "../types/Enums/ModelType";

/**
 * A `RollResult` represents the value and applicable modifiers for a single die roll
 *
 * ::: tip
 * You will probably not need to create your own `RollResult` instances, unless you're importing
 * rolls, but `RollResult` objects will be returned when rolling dice.
 * :::
 */
class RollResult implements SingleResult {
  readonly #initialValue: number;

  #calculationValue: number|null = null;
  #modifiers: Set<string> = new Set();
  #useInTotal: boolean = true;
  #value!: number|null;

  /**
   * Create a `RollResult` instance.
   *
   * `value` can be a number, or an object containing a list of different values.
   * This allows you to specify the `initialValue`, `value` and `calculationValue` with different
   * values.
   *
   * @example <caption>Numerical value</caption>
   * const result = new RollResult(4);
   *
   * @example <caption>Object value</caption>
   * // must provide either `value` or `initialValue`
   * // `calculationValue` is optional.
   * const result = new RollResult({
   *   value: 6,
   *   initialValue: 4,
   *   calculationValue: 8,
   * });
   *
   * @example <caption>With modifiers</caption>
   * const result = new RollResult(4, ['explode', 'critical-success']);
   *
   * @param {number|{value: number, initialValue: number, calculationValue: number}} value The value
   * rolled
   * @param {number} [value.value] The value with modifiers applied
   * @param {number} [value.initialValue] The initial, unmodified value rolled
   * @param {number} [value.calculationValue] The value used in calculations
   * @param {string[]|Set<string>} [modifiers=[]] List of modifier names that affect this roll
   * @param {boolean} [useInTotal=true] Whether to include the roll value when calculating totals
   *
   * @throws {TypeError} Result value, calculation value, or modifiers are invalid
   */
  constructor(value: number|ResultValue, modifiers: string[]|Set<string> = [], useInTotal: boolean = true) {
    if (isNumeric(value)) {
      this.#initialValue = Number(value);

      this.modifiers = modifiers || [];
      this.useInTotal = useInTotal;
    } else if (value && (typeof value === 'object') && !Array.isArray(value)) {
      // ensure that we have a valid value
      const initialVal = isNumeric(value.initialValue) ? value.initialValue : value.value;
      if (!isNumeric(initialVal)) {
        throw new TypeError(`Result value is invalid: ${initialVal}`);
      }

      this.#initialValue = Number(initialVal);

      if (
        isNumeric(value.value)
        && (Number(value.value) !== this.#initialValue)
      ) {
        this.value = value.value;
      }

      if (
        isNumeric(value.calculationValue)
        && (parseFloat(`${value.calculationValue}`) !== this.value)
      ) {
        this.calculationValue = value.calculationValue;
      }

      this.modifiers = value.modifiers || modifiers || [];
      this.useInTotal = (typeof value.useInTotal === 'boolean') ? value.useInTotal : (useInTotal || false);
    } else if (value === Infinity) {
      throw new RangeError('Result value must be a finite number');
    } else {
      throw new TypeError(`Result value is invalid: ${value}`);
    }
  }

  /**
   * The value to use in calculations.
   * This may be changed by modifiers.
   *
   * @returns {number}
   */
  get calculationValue(): number {
    return isNumeric(this.#calculationValue)
      ? parseFloat(`${this.#calculationValue}`)
      : this.value;
  }

  /**
   * Set the value to use in calculations.
   *
   * @param {number} value
   *
   * @throws {TypeError} value is invalid
   */
  set calculationValue(value: number) {
    const isValNumeric = isNumeric(value);
    if (value === Infinity) {
      throw new RangeError('Result calculation value must be a finite number');
    }
    if (value && !isValNumeric) {
      throw new TypeError(`Result calculation value is invalid: ${value}`);
    }

    this.#calculationValue = isValNumeric ? parseFloat(`${value}`) : null;
  }

  /**
   * The initial roll value before any modifiers.
   *
   * Not used for calculations and is just for reference.
   * You probably want `value` instead.
   *
   * @see {@link RollResult#value}
   *
   * @returns {number}
   */
  get initialValue(): number {
    return this.#initialValue;
  }

  /**
   * The visual flags for the modifiers that affect the roll.
   *
   * @see {@link RollResult#modifiers}
   *
   * @returns {string}
   */
  get modifierFlags(): string {
    return getModifierFlags(...this.modifiers);
  }

  /**
   * The names of modifiers that affect the roll.
   *
   * @returns {Set<string>}
   */
  get modifiers(): Set<string> {
    return this.#modifiers;
  }

  /**
   * Set the modifier names that affect the roll.
   *
   * @example
   * rollResult.modifiers = ['explode', 're-roll'];
   *
   * @param {string[]|Set<string>} value
   *
   * @throws {TypeError} modifiers must be a Set or array of modifier names
   */
  set modifiers(value: Set<string>|string[]) {
    if ((Array.isArray(value) || (value instanceof Set)) && [...value].every((item) => typeof item === 'string')) {
      this.#modifiers = new Set([...value]);

      return;
    }

    if (!value && (value !== 0)) {
      // clear the modifiers
      this.#modifiers = new Set();

      return;
    }

    throw new TypeError(`modifiers must be a Set or array of modifier names: ${value}`);
  }

  /**
   * Whether to use the value in total calculations or not.
   *
   * @returns {boolean}
   */
  get useInTotal(): boolean {
    return this.#useInTotal;
  }

  /**
   * Set whether to use the value in total calculations or not.
   *
   * @param {boolean} value
   */
  set useInTotal(value: boolean) {
    this.#useInTotal = !!value;
  }

  /**
   * Value of the roll after modifiers have been applied.
   *
   * @returns {number}
   */
  get value(): number {
    return isNumeric(this.#value)
      ? this.#value as number
      : this.#initialValue;
  }

  /**
   * Set the roll value.
   *
   * @param {number} value
   *
   * @throws {RangeError} value must be finite
   * @throws {TypeError} value is invalid
   */
  set value(value: number) {
    if (value === Infinity) {
      throw new RangeError('Result value must be a finite number');
    }
    if (!isNumeric(value)) {
      throw new TypeError(`Result value is invalid: ${value}`);
    }

    this.#value = Number(value);
  }

  /**
   * Return an object for JSON serialising.
   *
   * This is called automatically when JSON encoding the object.
   *
   * @returns {{
   *  calculationValue: number,
   *  modifierFlags: string,
   *  modifiers: string[],
   *  type: string,
   *  initialValue: number,
   *  useInTotal: boolean,
   *  value: number
   * }}
   */
  toJSON(): object {
    const {
      calculationValue, initialValue, modifierFlags, modifiers, useInTotal, value,
    } = this;

    return {
      calculationValue,
      initialValue,
      modifierFlags,
      modifiers: [...modifiers],
      type: ModelType.Result,
      useInTotal,
      value,
    };
  }

  /**
   * Return the String representation of the object.
   *
   * This is called automatically when casting the object to a string.
   *
   * @returns {string}
   */
  toString(): string {
    return `${this.value}${this.modifierFlags}`;
  }
}

export default RollResult;
