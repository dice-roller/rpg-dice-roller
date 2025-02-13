import { Dice } from "../types/Interfaces/Dice";

/**
 * An error thrown when an invalid die action (e.g. Exploding on a d1) occurs
 */
class DieActionValueError extends Error {
  readonly action: string|null;
  readonly die: Dice;

  /**
   * Create a `DieActionValueError`
   *
   * @param {StandardDice} die The die the action was on
   * @param {string|null} [action=null] The invalid action
   */
  constructor(die: Dice, action: string|null = null) {
    super(`Die "${die}" must have more than 1 possible value to ${action || 'do this action'}`);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DieActionValueError);
    }

    this.name = 'DieActionValueError';
    this.action = action;
    this.die = die;
  }
}

export default DieActionValueError;
