import { DiceRollerError } from "./DiceRollerError.js";

/**
 * Thrown by skeleton methods whose logic has not been implemented yet.
 */
export class NotImplementedError extends DiceRollerError {
  constructor(feature: string) {
    super(`${feature} is not implemented yet`);
  }
}
