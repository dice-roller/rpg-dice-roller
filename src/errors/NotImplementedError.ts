import { DiceRollerError } from "./DiceRollerError.js";

/**
 * Error for an unimplemented feature. Its message appends ` is not implemented yet` to the feature
 * name. This class is not exported by the public errors namespace.
 */
export class NotImplementedError extends DiceRollerError {
  constructor(feature: string) {
    super(`${feature} is not implemented yet`);
  }
}
