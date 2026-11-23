import { rollDie, validateFaceValue } from "../dice/die-utils.js";
import { EvaluationError } from "../errors/EvaluationError.js";
import type { RollContext } from "./RollContext.js";
import {
  createDrawDieRequest,
  type EvaluationDrawRequest,
} from "./EvaluationDrawRequest.js";

/** Drives an evaluation generator synchronously, supplying each requested die face. */
export class SyncEvaluationDriver {
  evaluate<T>(
    evaluation: Generator<EvaluationDrawRequest, T, number>,
    ctx: RollContext,
  ): T {
    let step = evaluation.next();

    while (!step.done) {
      step = evaluation.next(this.draw(step.value, ctx));
    }

    return step.value;
  }

  private draw(event: EvaluationDrawRequest, ctx: RollContext): number {
    if (!ctx.drawDie || ctx.mode !== "random") {
      return rollDie(event.die, ctx);
    }

    if (ctx.drawDie.drawMode !== "sync") {
      throw new EvaluationError(
        "An asynchronous drawDie source requires the asynchronous evaluation driver",
      );
    }

    const request = createDrawDieRequest(event);
    let face: unknown;

    try {
      face = ctx.drawDie.callback(request);
    } catch (cause) {
      throw new EvaluationError(
        `External draw callback failed for die "${request.notation}"`,
        { cause },
      );
    }

    if (isPromiseLike(face)) {
      void Promise.resolve(face).catch(() => undefined);
      throw new EvaluationError(
        `drawDie callback returned a Promise in sync mode for die "${request.notation}"`,
      );
    }

    validateFaceValue(event.die, face);

    return face as number;
  }
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    typeof (value as { then?: unknown }).then === "function"
  );
}
