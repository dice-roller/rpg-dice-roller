import { rollDie, validateFaceValue } from "../dice/die-utils.js";
import { EvaluationError } from "../errors/EvaluationError.js";
import type { RollContext } from "./RollContext.js";
import {
  createDrawDieRequest,
  type EvaluationDrawRequest,
} from "./EvaluationDrawRequest.js";

/** Drives an evaluation generator asynchronously, awaiting each requested die face. */
export class AsyncEvaluationDriver {
  async evaluate<T>(
    evaluation: Generator<EvaluationDrawRequest, T, number>,
    ctx: RollContext,
  ): Promise<T> {
    let step = evaluation.next();

    while (!step.done) {
      step = evaluation.next(await this.draw(step.value, ctx));
    }

    return step.value;
  }

  private async draw(
    event: EvaluationDrawRequest,
    ctx: RollContext,
  ): Promise<number> {
    if (!ctx.drawDie || ctx.mode !== "random") {
      return rollDie(event.die, ctx);
    }

    if (ctx.drawDie.drawMode !== "async") {
      throw new EvaluationError(
        "A synchronous drawDie source requires the synchronous evaluation driver",
      );
    }

    const request = createDrawDieRequest(event);
    let face: unknown;

    try {
      face = await ctx.drawDie.callback(request);
    } catch (cause) {
      throw new EvaluationError(
        `External draw callback failed for die "${request.notation}"`,
        { cause },
      );
    }

    validateFaceValue(event.die, face);

    return face as number;
  }
}
