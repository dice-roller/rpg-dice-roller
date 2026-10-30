import type {
  BinaryResult,
  DieResult,
  ExpressionResult,
  FunctionResult,
  GroupResult,
  NumberResult,
  ParenResult,
  PoolResult,
  UnaryResult,
} from "../results/types.js";
import type { Roll } from "../Roll.js";
import type { RollHistory } from "../RollHistory.js";
import type { Presentable } from "./Presentable.js";
import { isRoll, isRollHistory } from "./Presentable.js";
import type { Presenter } from "./Presenter.js";

/**
 * A presenter with a hook per result type.
 *
 * `present()` dispatches a history to `history()`, a roll to `roll()`, and a result node to its
 * hook (via `visit()`). Hooks call `visit()` for child results, and `pool()` calls `die()` for
 * each roll.
 *
 * @typeParam T the output type
 */
export abstract class TreePresenter<T> implements Presenter<T> {
  present(target: Presentable): T {
    if (isRollHistory(target)) {
      return this.history(target);
    }

    if (isRoll(target)) {
      return this.roll(target);
    }

    return this.visit(target);
  }

  /** Presents a result node with the hook for its type. */
  protected visit(result: ExpressionResult): T {
    switch (result.type) {
      case "number":
        return this.number(result);
      case "pool":
        return this.pool(result);
      case "group":
        return this.group(result);
      case "binary":
        return this.binary(result);
      case "unary":
        return this.unary(result);
      case "paren":
        return this.paren(result);
      case "function":
        return this.fn(result);
    }
  }

  protected abstract history(history: RollHistory): T;
  /** Usually wraps `this.visit(roll.result)`. */
  protected abstract roll(roll: Roll<unknown>): T;
  protected abstract number(result: NumberResult): T;
  protected abstract pool(result: PoolResult): T;
  protected abstract die(result: DieResult, pool: PoolResult): T;
  protected abstract group(result: GroupResult): T;
  protected abstract binary(result: BinaryResult): T;
  protected abstract unary(result: UnaryResult): T;
  protected abstract paren(result: ParenResult): T;
  protected abstract fn(result: FunctionResult): T;
}
