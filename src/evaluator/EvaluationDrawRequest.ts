import { isFacesDie } from "../dice/die-utils.js";
import type { ResolvedDie } from "../dice/types.js";
import type { DrawDieRequest } from "./DrawDieRequest.js";

/** Internal draw event; callback-facing request data is created only for external sources. */
export interface EvaluationDrawRequest {
  readonly die: ResolvedDie;
  readonly factoryName: string;
}

export function createDrawDieRequest(
  event: EvaluationDrawRequest,
): DrawDieRequest {
  const { die, factoryName } = event;

  return {
    notation: die.notation,
    min: die.min,
    max: die.max,
    ...(isFacesDie(die.source) && { faces: [...die.source.faces] }),
    factoryName,
  };
}
